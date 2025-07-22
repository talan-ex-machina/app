import { DatabaseConnection, DatabaseMetadata, QueryRequest, QueryResponse } from '../types/database';
import { DatabaseAdapter } from './DatabaseAdapter';
import { MySQLAdapter } from './MySQLAdapter';
import { PostgreSQLAdapter } from './PostgreSQLAdapter';
import { MongoDBAdapter } from './MongoDBAdapter';

export class DatabaseService {
  private connections = new Map<string, DatabaseConnection>();
  private adapters = new Map<string, DatabaseAdapter>();

  async addConnection(connection: Omit<DatabaseConnection, 'id' | 'status'>): Promise<string> {
    const id = this.generateId();
    const fullConnection: DatabaseConnection = {
      ...connection,
      id,
      status: 'disconnected'
    };

    this.connections.set(id, fullConnection);
    
    try {
      const adapter = this.createAdapter(fullConnection);
      await adapter.testConnection();
      
      this.adapters.set(id, adapter);
      fullConnection.status = 'connected';
      
      fullConnection.metadata = await adapter.getMetadata();
      
      return id;
    } catch (error) {
      fullConnection.status = 'error';
      throw new Error(`Failed to add connection: ${error}`);
    }
  }

  async removeConnection(connectionId: string): Promise<void> {
    const adapter = this.adapters.get(connectionId);
    if (adapter) {
      await adapter.disconnect();
      this.adapters.delete(connectionId);
    }
    this.connections.delete(connectionId);
  }

  getConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(connectionId: string): DatabaseConnection | undefined {
    return this.connections.get(connectionId);
  }

  async testConnection(connectionId: string): Promise<boolean> {
    const adapter = this.adapters.get(connectionId);
    if (!adapter) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    return adapter.testConnection();
  }

  async getMetadata(connectionId: string): Promise<DatabaseMetadata> {
    const adapter = this.adapters.get(connectionId);
    if (!adapter) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    
    const metadata = await adapter.getMetadata();
    
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.metadata = metadata;
    }
    
    return metadata;
  }

  async executeQuery(connectionId: string, query: QueryRequest): Promise<QueryResponse> {
    const adapter = this.adapters.get(connectionId);
    if (!adapter) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    
    return adapter.executeQuery(query);
  }

  async getSuggestedVisualizations(connectionId: string, tableName: string) {
    const adapter = this.adapters.get(connectionId);
    if (!adapter) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    
    const tableMetadata = await adapter.getTableMetadata(tableName);
    return tableMetadata.suggestedVisualizations;
  }

  async getAggregatedData(
    connectionId: string, 
    tableName: string, 
    dimensions: string[], 
    measures: string[], 
    aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
  ): Promise<QueryResponse> {
    const query: QueryRequest = {
      connectionId,
      table: tableName,
      select: [...dimensions, ...measures],
      groupBy: dimensions,
      aggregation: measures.length > 0 ? {
        type: aggregationType,
        column: measures[0]
      } : undefined,
      limit: 1000
    };

    return this.executeQuery(connectionId, query);
  }

  private detectDatabaseType(connectionString: string): DatabaseConnection['type'] {
    if (connectionString.startsWith('mysql://')) return 'mysql';
    if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) return 'postgresql';
    if (connectionString.startsWith('mongodb://') || connectionString.startsWith('mongodb+srv://')) return 'mongodb';
    if (connectionString.startsWith('sqlite://')) return 'sqlite';
    if (connectionString.startsWith('redis://')) return 'redis';
    if (connectionString.startsWith('oracle://')) return 'oracle';
    if (connectionString.startsWith('mssql://')) return 'mssql';
    
    throw new Error('Unable to detect database type from connection string');
  }

  private createAdapter(connection: DatabaseConnection): DatabaseAdapter {
    switch (connection.type) {
      case 'mysql':
        return new MySQLAdapter(connection);
      case 'postgresql':
        return new PostgreSQLAdapter(connection);
      case 'mongodb':
        return new MongoDBAdapter(connection);
      default:
        throw new Error(`Unsupported database type: ${connection.type}`);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Discover databases automatically (if supported)
  async discoverDatabases(connectionString: string): Promise<string[]> {
    try {
      const type = this.detectDatabaseType(connectionString);
      
      // Create a temporary connection to discover databases
      const tempConnection: DatabaseConnection = {
        id: 'temp-discovery',
        name: 'Discovery Connection',
        type,
        connectionString,
        status: 'disconnected'
      };

      // Parse connection details from connection string
      const url = new URL(connectionString);
      tempConnection.host = url.hostname;
      tempConnection.port = url.port ? parseInt(url.port) : this.getDefaultPort(type);
      tempConnection.username = url.username;
      tempConnection.password = url.password;
      tempConnection.database = url.pathname.substring(1) || 'information_schema';

      switch (type) {
        case 'mysql':
          return await this.discoverMySQLDatabases(tempConnection);
        case 'postgresql':
          return await this.discoverPostgreSQLDatabases(tempConnection);
        case 'mongodb':
          return await this.discoverMongoDatabases(tempConnection);
        default:
          // For other database types, fallback to extracting from connection string
          const dbName = url.pathname.substring(1);
          return dbName ? [dbName] : ['default'];
      }
    } catch (error) {
      throw new Error(`Failed to discover databases: ${error}`);
    }
  }

  private getDefaultPort(type: DatabaseConnection['type']): number {
    switch (type) {
      case 'mysql': return 3306;
      case 'postgresql': return 5432;
      case 'mongodb': return 27017;
      case 'redis': return 6379;
      case 'oracle': return 1521;
      case 'mssql': return 1433;
      case 'sqlite': return 0; // SQLite doesn't use ports
      default: return 0;
    }
  }

  private async discoverMySQLDatabases(connection: DatabaseConnection): Promise<string[]> {
    try {
      // Use raw MySQL query to get databases
      const mysql = await import('mysql2/promise');
      const client = await mysql.createConnection({
        host: connection.host,
        port: connection.port || 3306,
        user: connection.username,
        password: connection.password
      });
      
      const [rows] = await client.execute(`
        SELECT SCHEMA_NAME 
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
      `);
      
      await client.end();
      
      const databases = (rows as { SCHEMA_NAME: string }[]).map(row => row.SCHEMA_NAME);
      return databases.length > 0 ? databases : [connection.database || 'mysql'];
    } catch (error) {
      console.warn('Failed to discover MySQL databases:', error);
      return [connection.database || 'mysql'];
    }
  }

  private async discoverPostgreSQLDatabases(connection: DatabaseConnection): Promise<string[]> {
    try {
      // Use raw PostgreSQL query to get databases
      const { Client } = await import('pg');
      const client = new Client({
        host: connection.host,
        port: connection.port || 5432,
        user: connection.username,
        password: connection.password,
        database: 'postgres'
      });
      
      await client.connect();
      
      const result = await client.query(`
        SELECT datname 
        FROM pg_database 
        WHERE datistemplate = false 
        AND datname NOT IN ('postgres', 'template0', 'template1')
      `);
      
      await client.end();
      
      const databases = result.rows.map(row => row.datname);
      return databases.length > 0 ? databases : [connection.database || 'postgres'];
    } catch (error) {
      console.warn('Failed to discover PostgreSQL databases:', error);
      return [connection.database || 'postgres'];
    }
  }

  private async discoverMongoDatabases(connection: DatabaseConnection): Promise<string[]> {
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(connection.connectionString);
      
      await client.connect();
      
      const adminDb = client.db('admin');
      const databasesList = await adminDb.admin().listDatabases();
      
      await client.close();
      
      const databases = databasesList.databases
        .filter(db => !['admin', 'local', 'config'].includes(db.name))
        .map(db => db.name);
        
      return databases.length > 0 ? databases : [connection.database || 'test'];
    } catch (error) {
      console.warn('Failed to discover MongoDB databases:', error);
      return [connection.database || 'test'];
    }
  }

  async getConnectionHealth(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { status: 'not_found', message: 'Connection not found' };
    }

    try {
      const adapter = this.adapters.get(connectionId);
      if (!adapter) {
        return { status: 'disconnected', message: 'No adapter found' };
      }

      const isHealthy = await adapter.testConnection();
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Connection is working' : 'Connection test failed',
        lastConnected: connection.lastConnected
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Health check failed: ${error}`,
        lastConnected: connection.lastConnected
      };
    }
  }

  async refreshAllMetadata(): Promise<void> {
    const promises = Array.from(this.adapters.entries()).map(async ([connectionId, adapter]) => {
      try {
        const metadata = await adapter.getMetadata();
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.metadata = metadata;
        }
      } catch (error) {
        console.error(`Failed to refresh metadata for connection ${connectionId}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

// singleton instance
export const databaseService = new DatabaseService();
