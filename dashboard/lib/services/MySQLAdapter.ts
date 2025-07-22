import mysql from 'mysql2/promise';
import { DatabaseAdapter } from './DatabaseAdapter';
import { 
  DatabaseMetadata, 
  TableMetadata, 
  ColumnMetadata,
  QueryRequest,
  QueryResponse 
} from '../types/database';

export class MySQLAdapter extends DatabaseAdapter {
  private client: mysql.Connection | null = null;

  async connect(): Promise<void> {
    try {
      const connectionConfig: mysql.ConnectionOptions = {
        host: this.connection.host,
        port: this.connection.port || 3306,
        user: this.connection.username,
        password: this.connection.password,
        database: this.connection.database
      };

      if (this.connection.ssl) {
        connectionConfig.ssl = {};
      }

      this.client = await mysql.createConnection(connectionConfig);
      this.connection.status = 'connected';
      this.connection.lastConnected = new Date();
    } catch (error) {
      this.connection.status = 'error';
      throw new Error(`Failed to connect to MySQL: ${error}`);
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
      await this.client!.ping();
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(): Promise<DatabaseMetadata> {
    if (!this.client) await this.connect();

    const [versionRows] = await this.client!.execute('SELECT VERSION() as version');
    const version = (versionRows as { version: string }[])[0].version;

    const [tableRows] = await this.client!.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, TABLE_TYPE 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [this.connection.database]);

    const tables = tableRows as { TABLE_NAME: string; TABLE_ROWS: number; TABLE_TYPE: string }[];
    const totalRecords = tables.reduce((sum, table) => sum + (table.TABLE_ROWS || 0), 0);

    const tableMetadata: TableMetadata[] = [];
    for (const table of tables.slice(0, 10)) { // Limit to first 10 tables for performance
      try {
        const metadata = await this.getTableMetadata(table.TABLE_NAME);
        tableMetadata.push(metadata);
      } catch (error) {
        console.warn(`Failed to get metadata for table ${table.TABLE_NAME}:`, error);
      }
    }

    // Get foreign key relationships
    const relationships = await this.getRelationships();

    return {
      version,
      totalTables: tables.length,
      totalRecords,
      lastAnalyzed: new Date(),
      tables: tableMetadata,
      relationships
    };
  }

  async getTableMetadata(tableName: string): Promise<TableMetadata> {
    if (!this.client) await this.connect();

    const [columnRows] = await this.client!.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [this.connection.database, tableName]);

    // Get row count
    const [countRows] = await this.client!.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    const rowCount = (countRows as { count: number }[])[0].count;

    // Get sample data (first 100 rows)
    const [sampleRows] = await this.client!.execute(`SELECT * FROM \`${tableName}\` LIMIT 100`);
    const sampleData = sampleRows as Record<string, unknown>[];

    // Get index information
    const [indexRows] = await this.client!.execute(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        INDEX_TYPE
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [this.connection.database, tableName]);

    interface IndexInfo {
      INDEX_NAME: string;
      COLUMN_NAME: string;
      NON_UNIQUE: number;
      INDEX_TYPE: string;
    }

    // Group index information by index name
    const indexMap = new Map<string, { columns: string[]; unique: boolean; type: string }>();
    (indexRows as IndexInfo[]).forEach(idx => {
      if (!indexMap.has(idx.INDEX_NAME)) {
        indexMap.set(idx.INDEX_NAME, {
          columns: [],
          unique: idx.NON_UNIQUE === 0,
          type: idx.INDEX_TYPE
        });
      }
      indexMap.get(idx.INDEX_NAME)!.columns.push(idx.COLUMN_NAME);
    });

    const indexes = Array.from(indexMap.entries()).map(([name, info]) => ({
      name,
      columns: info.columns,
      unique: info.unique,
      type: info.type
    }));

    // Process columns
    interface ColumnInfo {
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
      COLUMN_KEY: string;
      COLUMN_DEFAULT: string | null;
      EXTRA: string;
    }

    const columns: ColumnMetadata[] = (columnRows as ColumnInfo[]).map(col => {
      const columnValues = sampleData.map(row => row[col.COLUMN_NAME]);
      const statistics = this.calculateStatistics(columnValues);

      return {
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === 'YES',
        primaryKey: col.COLUMN_KEY === 'PRI',
        unique: col.COLUMN_KEY === 'UNI',
        dataType: this.mapMySQLType(col.DATA_TYPE),
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
      indexes,
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
      const [rows, fields] = await this.client!.execute(query);
      const executionTime = Date.now() - startTime;

      const data = rows as Record<string, unknown>[];
      
      interface FieldInfo {
        name: string;
        type: number;
      }
      
      const columns = (fields as FieldInfo[]).map(field => ({
        name: field.name,
        type: field.type.toString()
      }));

      // Get total count for pagination
      let totalCount = data.length;
      if (request.limit) {
        const countQuery = this.buildCountQuery(request);
        const [countRows] = await this.client!.execute(countQuery);
        totalCount = (countRows as { total: number }[])[0].total;
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

    if (request.select && request.select.length > 0) {
      query += request.select.map(col => `\`${col}\``).join(', ');
    } else {
      query += '*';
    }

    // FROM clause
    query += ` FROM \`${request.table}\``;

    // WHERE clause
    if (request.where && Object.keys(request.where).length > 0) {
      const conditions = Object.entries(request.where).map(([key, value]) => {
        if (typeof value === 'string') {
          return `\`${key}\` = '${value}'`;
        }
        return `\`${key}\` = ${value}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // GROUP BY clause
    if (request.groupBy && request.groupBy.length > 0) {
      query += ` GROUP BY ${request.groupBy.map(col => `\`${col}\``).join(', ')}`;
    }

    // ORDER BY clause
    if (request.orderBy && request.orderBy.length > 0) {
      const orderClauses = request.orderBy.map(order => 
        `\`${order.column}\` ${order.direction}`
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
    let query = 'SELECT COUNT(*) as total FROM `' + request.table + '`';

    if (request.where && Object.keys(request.where).length > 0) {
      const conditions = Object.entries(request.where).map(([key, value]) => {
        if (typeof value === 'string') {
          return `\`${key}\` = '${value}'`;
        }
        return `\`${key}\` = ${value}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (request.groupBy && request.groupBy.length > 0) {
      query = `SELECT COUNT(*) as total FROM (${this.buildQuery({ ...request, limit: undefined, offset: undefined })}) as subquery`;
    }

    return query;
  }

  private mapMySQLType(mysqlType: string): 'string' | 'number' | 'date' | 'boolean' | 'json' | 'binary' {
    const type = mysqlType.toLowerCase();
    
    if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return 'number';
    }
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return 'date';
    }
    if (type.includes('bool') || type === 'bit') {
      return 'boolean';
    }
    if (type.includes('json')) {
      return 'json';
    }
    if (type.includes('blob') || type.includes('binary')) {
      return 'binary';
    }
    
    return 'string';
  }

  private async getRelationships(): Promise<import('../types/database').Relationship[]> {
    if (!this.client) await this.connect();

    try {
      // Get foreign key relationships from information_schema
      const [relationshipRows] = await this.client!.execute(`
        SELECT 
          kcu.TABLE_NAME as fromTable,
          kcu.COLUMN_NAME as fromColumn,
          kcu.REFERENCED_TABLE_NAME as toTable,
          kcu.REFERENCED_COLUMN_NAME as toColumn,
          rc.UPDATE_RULE,
          rc.DELETE_RULE
        FROM information_schema.KEY_COLUMN_USAGE kcu
        JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
          ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        WHERE 
          kcu.TABLE_SCHEMA = ? 
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
          AND kcu.REFERENCED_COLUMN_NAME IS NOT NULL
      `, [this.connection.database]);

      interface RelationshipInfo {
        fromTable: string;
        fromColumn: string;
        toTable: string;
        toColumn: string;
        UPDATE_RULE: string;
        DELETE_RULE: string;
      }

      return (relationshipRows as RelationshipInfo[]).map(rel => ({
        fromTable: rel.fromTable,
        fromColumn: rel.fromColumn,
        toTable: rel.toTable,
        toColumn: rel.toColumn,
        type: 'one-to-many' as const, // Default assumption, could be enhanced
        strength: 0.9 // High confidence for foreign key relationships
      }));
    } catch (error) {
      console.warn('Failed to get relationships:', error);
      return [];
    }
  }
}
