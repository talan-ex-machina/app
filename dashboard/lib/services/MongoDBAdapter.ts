import { MongoClient, Db } from 'mongodb';
import { DatabaseAdapter } from './DatabaseAdapter';
import { 
  DatabaseMetadata, 
  TableMetadata, 
  ColumnMetadata,
  QueryRequest,
  QueryResponse 
} from '../types/database';

export class MongoDBAdapter extends DatabaseAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.connection.connectionString);
      await this.client.connect();
      this.db = this.client.db(this.connection.database);
      this.connection.status = 'connected';
      this.connection.lastConnected = new Date();
    } catch (error) {
      this.connection.status = 'error';
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.connection.status = 'disconnected';
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) await this.connect();
      await this.client!.db('admin').command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(): Promise<DatabaseMetadata> {
    if (!this.db) await this.connect();

    // Get MongoDB version
    const adminDb = this.client!.db('admin');
    const buildInfo = await adminDb.command({ buildInfo: 1 });
    const version = buildInfo.version;

    const collections = await this.db!.listCollections().toArray();
    
    let totalRecords = 0;
    for (const collection of collections) {
      try {
        const count = await this.db!.collection(collection.name).estimatedDocumentCount();
        totalRecords += count;
      } catch {
        // Skip collections we can't access
        continue;
      }
    }

    // Get collection metadata
    const tableMetadata: TableMetadata[] = [];
    for (const collection of collections.slice(0, 10)) { // Limit to first 10 collections
      try {
        const metadata = await this.getTableMetadata(collection.name);
        tableMetadata.push(metadata);
      } catch (error) {
        console.warn(`Failed to get metadata for collection ${collection.name}:`, error);
      }
    }

    return {
      version,
      totalTables: collections.length,
      totalRecords,
      lastAnalyzed: new Date(),
      tables: tableMetadata,
      relationships: [] // MongoDB doesn't have explicit relationships
    };
  }

  async getTableMetadata(tableName: string): Promise<TableMetadata> {
    if (!this.db) await this.connect();

    const collection = this.db!.collection(tableName);

    // Get document count
    const rowCount = await collection.estimatedDocumentCount();

    // Get sample documents (first 100)
    const sampleDocs = await collection.find().limit(100).toArray();
    
    // Analyze document structure to infer schema
    const fieldMap = new Map<string, Set<string>>();
    const sampleData: Record<string, unknown>[] = [];

    sampleDocs.forEach(doc => {
      const flatDoc = this.flattenDocument(doc);
      sampleData.push(flatDoc);
      
      Object.entries(flatDoc).forEach(([key, value]) => {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, new Set());
        }
        fieldMap.get(key)!.add(typeof value);
      });
    });

    // Build column metadata from inferred schema
    const columns: ColumnMetadata[] = Array.from(fieldMap.entries()).map(([fieldName, types]) => {
      const columnValues = sampleData.map(doc => doc[fieldName]);
      const statistics = this.calculateStatistics(columnValues);
      
      // Determine primary type (most common)
      const typeArray = Array.from(types);
      const primaryType = typeArray.length === 1 ? typeArray[0] : 'mixed';

      return {
        name: fieldName,
        type: primaryType,
        nullable: columnValues.some(v => v === null || v === undefined),
        primaryKey: fieldName === '_id',
        unique: fieldName === '_id',
        dataType: this.mapMongoType(primaryType),
        statistics
      };
    });

    // Build data profile
    const dataProfile = this.buildDataProfile(columns, sampleData);

    // Generate visualization suggestions
    const tableMetadata: TableMetadata = {
      name: tableName,
      type: 'collection',
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
    if (!this.db) await this.connect();

    const startTime = Date.now();
    const collection = this.db!.collection(request.table);

    try {
      // Build MongoDB query
      const mongoQuery = this.buildMongoQuery(request);
      
      // Execute query
      let cursor = collection.find(mongoQuery.filter, mongoQuery.options);
      
      // Apply sorting
      if (request.orderBy && request.orderBy.length > 0) {
        const sort: Record<string, 1 | -1> = {};
        request.orderBy.forEach(order => {
          sort[order.column] = order.direction === 'ASC' ? 1 : -1;
        });
        cursor = cursor.sort(sort);
      }

      // Apply pagination
      if (request.offset) {
        cursor = cursor.skip(request.offset);
      }
      if (request.limit) {
        cursor = cursor.limit(request.limit);
      }

      const docs = await cursor.toArray();
      const executionTime = Date.now() - startTime;

      // Flatten documents for consistent API
      const data = docs.map(doc => this.flattenDocument(doc));

      // Get total count
      let totalCount = data.length;
      if (request.limit) {
        totalCount = await collection.countDocuments(mongoQuery.filter);
      }

      // Infer column types from results
      const columns = this.inferColumnsFromData(data);

      return {
        data,
        totalCount,
        executionTime,
        query: JSON.stringify(mongoQuery),
        metadata: {
          columns,
          visualizationHints: []
        }
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  buildQuery(request: QueryRequest): string {
    // For MongoDB, we return a JSON representation of the query
    const mongoQuery = this.buildMongoQuery(request);
    return JSON.stringify(mongoQuery);
  }

  private buildMongoQuery(request: QueryRequest): { filter: Record<string, unknown>; options: Record<string, unknown> } {
    const filter: Record<string, unknown> = {};
    const options: Record<string, unknown> = {};

    // WHERE clause becomes filter
    if (request.where) {
      Object.assign(filter, request.where);
    }

    // SELECT clause becomes projection
    if (request.select && request.select.length > 0) {
      const projection: Record<string, 1> = {};
      request.select.forEach(field => {
        projection[field] = 1;
      });
      options.projection = projection;
    }

    return { filter, options };
  }

  private flattenDocument(doc: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const flattened: Record<string, unknown> = {};
    
    Object.entries(doc).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this.flattenDocument(value as Record<string, unknown>, newKey));
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  }

  private inferColumnsFromData(data: Record<string, unknown>[]): Array<{ name: string; type: string }> {
    if (data.length === 0) return [];

    const fieldTypes = new Map<string, Set<string>>();
    
    data.forEach(doc => {
      Object.entries(doc).forEach(([key, value]) => {
        if (!fieldTypes.has(key)) {
          fieldTypes.set(key, new Set());
        }
        fieldTypes.get(key)!.add(typeof value);
      });
    });

    return Array.from(fieldTypes.entries()).map(([name, types]) => ({
      name,
      type: types.size === 1 ? Array.from(types)[0] : 'mixed'
    }));
  }

  private mapMongoType(mongoType: string): 'string' | 'number' | 'date' | 'boolean' | 'json' | 'binary' {
    switch (mongoType) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'json';
      case 'string':
      default:
        return 'string';
    }
  }
}
