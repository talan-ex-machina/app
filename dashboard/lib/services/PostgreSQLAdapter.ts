import { Client } from 'pg';
import { DatabaseAdapter } from './DatabaseAdapter';
import { 
  DatabaseMetadata, 
  TableMetadata, 
  ColumnMetadata,
  QueryRequest,
  QueryResponse 
} from '../types/database';

export class PostgreSQLAdapter extends DatabaseAdapter {
  private client: Client | null = null;

  async connect(): Promise<void> {
    try {
      this.client = new Client({
        host: this.connection.host,
        port: this.connection.port || 5432,
        user: this.connection.username,
        password: this.connection.password,
        database: this.connection.database,
        ssl: this.connection.ssl
      });
      await this.client.connect();
      this.connection.status = 'connected';
      this.connection.lastConnected = new Date();
    } catch (error) {
      this.connection.status = 'error';
      throw new Error(`Failed to connect to PostgreSQL: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      this.connection.status = 'disconnected';
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) await this.connect();
      await this.client!.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(): Promise<DatabaseMetadata> {
    if (!this.client) await this.connect();

    // Get database version
    const versionResult = await this.client!.query('SELECT version()');
    const version = versionResult.rows[0].version;

    // Get all tables
    const tablesResult = await this.client!.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows;
    
    // Get total records across all tables
    let totalRecords = 0;
    for (const table of tables) {
      try {
        const countResult = await this.client!.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
        totalRecords += parseInt(countResult.rows[0].count);
      } catch {
        // Skip tables we can't access
      }
    }

    // Get table metadata for each table
    const tableMetadata: TableMetadata[] = [];
    for (const table of tables.slice(0, 10)) { // Limit to first 10 tables for performance
      try {
        const metadata = await this.getTableMetadata(table.table_name);
        tableMetadata.push(metadata);
      } catch (error) {
        console.warn(`Failed to get metadata for table ${table.table_name}:`, error);
      }
    }

    return {
      version,
      totalTables: tables.length,
      totalRecords,
      lastAnalyzed: new Date(),
      tables: tableMetadata,
      relationships: [] // TODO: Implement relationship detection
    };
  }

  async getTableMetadata(tableName: string): Promise<TableMetadata> {
    if (!this.client) await this.connect();

    // Get column information
    const columnsResult = await this.client!.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    // Get primary key information
    const pkResult = await this.client!.query(`
      SELECT column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = 'public' AND table_name = $1
      AND constraint_name IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = $1
        AND constraint_type = 'PRIMARY KEY'
      )
    `, [tableName]);

    const primaryKeys = new Set(pkResult.rows.map(row => row.column_name));

    // Get row count
    const countResult = await this.client!.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    const rowCount = parseInt(countResult.rows[0].count);

    // Get sample data (first 100 rows)
    const sampleResult = await this.client!.query(`SELECT * FROM "${tableName}" LIMIT 100`);
    const sampleData = sampleResult.rows;

    // Process columns
    const columns: ColumnMetadata[] = columnsResult.rows.map(col => {
      const columnValues = sampleData.map(row => row[col.column_name]);
      const statistics = this.calculateStatistics(columnValues);

      return {
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        primaryKey: primaryKeys.has(col.column_name),
        unique: false, // TODO: Check for unique constraints
        dataType: this.mapPostgreSQLType(col.data_type),
        statistics
      };
    });

    // Build data profile
    const dataProfile = this.buildDataProfile(columns, sampleData);

    // Generate visualization suggestions
    const tableMetadata: TableMetadata = {
      name: tableName,
      type: 'table',
      rowCount,
      columns,
      indexes: [], // TODO: Get index information
      sampleData,
      dataProfile,
      suggestedVisualizations: []
    };

    tableMetadata.suggestedVisualizations = this.generateVisualizationSuggestions(tableMetadata);

    return tableMetadata;
  }

  async executeQuery(request: QueryRequest): Promise<QueryResponse> {
    if (!this.client) await this.connect();

    const startTime = Date.now();
    const query = this.buildQuery(request);

    try {
      const result = await this.client!.query(query);
      const executionTime = Date.now() - startTime;

      const data = result.rows;
      const columns = result.fields.map(field => ({
        name: field.name,
        type: field.dataTypeID.toString()
      }));

      // Get total count for pagination
      let totalCount = data.length;
      if (request.limit) {
        const countQuery = this.buildCountQuery(request);
        const countResult = await this.client!.query(countQuery);
        totalCount = parseInt(countResult.rows[0].total);
      }

      return {
        data,
        totalCount,
        executionTime,
        query,
        metadata: {
          columns,
          visualizationHints: [] // TODO: Generate hints based on query results
        }
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  buildQuery(request: QueryRequest): string {
    let query = 'SELECT ';

    // SELECT clause
    if (request.select && request.select.length > 0) {
      query += request.select.map(col => `"${col}"`).join(', ');
    } else {
      query += '*';
    }

    // FROM clause
    query += ` FROM "${request.table}"`;

    // WHERE clause
    if (request.where && Object.keys(request.where).length > 0) {
      const conditions = Object.entries(request.where).map(([key, value]) => {
        if (typeof value === 'string') {
          return `"${key}" = '${value}'`;
        }
        return `"${key}" = ${value}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // GROUP BY clause
    if (request.groupBy && request.groupBy.length > 0) {
      query += ` GROUP BY ${request.groupBy.map(col => `"${col}"`).join(', ')}`;
    }

    // ORDER BY clause
    if (request.orderBy && request.orderBy.length > 0) {
      const orderClauses = request.orderBy.map(order => 
        `"${order.column}" ${order.direction}`
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // LIMIT clause
    if (request.limit) {
      query += ` LIMIT ${request.limit}`;
      if (request.offset) {
        query += ` OFFSET ${request.offset}`;
      }
    }

    return query;
  }

  private buildCountQuery(request: QueryRequest): string {
    let query = 'SELECT COUNT(*) as total FROM "' + request.table + '"';

    if (request.where && Object.keys(request.where).length > 0) {
      const conditions = Object.entries(request.where).map(([key, value]) => {
        if (typeof value === 'string') {
          return `"${key}" = '${value}'`;
        }
        return `"${key}" = ${value}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (request.groupBy && request.groupBy.length > 0) {
      query = `SELECT COUNT(*) as total FROM (${this.buildQuery({ ...request, limit: undefined, offset: undefined })}) as subquery`;
    }

    return query;
  }

  private mapPostgreSQLType(pgType: string): 'string' | 'number' | 'date' | 'boolean' | 'json' | 'binary' {
    const type = pgType.toLowerCase();
    
    if (type.includes('int') || type.includes('decimal') || type.includes('numeric') || 
        type.includes('real') || type.includes('double') || type.includes('float')) {
      return 'number';
    }
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return 'date';
    }
    if (type.includes('bool')) {
      return 'boolean';
    }
    if (type.includes('json') || type.includes('jsonb')) {
      return 'json';
    }
    if (type.includes('bytea') || type.includes('blob')) {
      return 'binary';
    }
    
    return 'string';
  }
}
