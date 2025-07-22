'use server';

import { databaseService } from '@/lib/services/DatabaseService';
import { QueryRequest } from '@/lib/types/database';

export async function createConnection(data: {
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis' | 'oracle' | 'mssql';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}) {
  try {
    const connectionString = data.connectionString || 
      `${data.type}://${data.username}:${data.password}@${data.host}:${data.port}/${data.database}`;
    
    const connectionId = await databaseService.addConnection({
      ...data,
      connectionString
    });
    return { success: true, connectionId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function removeDatabaseConnection(connectionId: string) {
  try {
    await databaseService.removeConnection(connectionId);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getDatabaseConnections() {
  try {
    const connections = databaseService.getConnections();
    return { success: true, connections };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getDatabaseMetadata(connectionId: string) {
  try {
    const metadata = await databaseService.getMetadata(connectionId);
    return { success: true, metadata };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function executeQuery(connectionId: string, query: Omit<QueryRequest, 'connectionId'>) {
  try {
    const result = await databaseService.executeQuery(connectionId, {
      ...query,
      connectionId
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getVisualizationSuggestions(connectionId: string, tableName: string) {
  try {
    const suggestions = await databaseService.getSuggestedVisualizations(connectionId, tableName);
    return { success: true, suggestions };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getAggregatedData(
  connectionId: string,
  tableName: string,
  dimensions: string[],
  measures: string[],
  aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
) {
  try {
    const result = await databaseService.getAggregatedData(
      connectionId,
      tableName,
      dimensions,
      measures,
      aggregationType
    );
    return { success: true, result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function testDatabaseConnection(connectionId: string) {
  try {
    const isHealthy = await databaseService.testConnection(connectionId);
    return { success: true, isHealthy };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function discoverDatabases(connectionString: string) {
  try {
    const databases = await databaseService.discoverDatabases(connectionString);
    return { success: true, databases };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function refreshAllMetadata() {
  try {
    await databaseService.refreshAllMetadata();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
