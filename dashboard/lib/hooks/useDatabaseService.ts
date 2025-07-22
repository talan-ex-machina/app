'use client';

import { useState, useEffect } from 'react';
import { DatabaseConnection, DatabaseMetadata, VisualizationSuggestion, QueryResponse } from '@/lib/types/database';
import {
  createConnection,
  removeDatabaseConnection,
  getDatabaseConnections,
  getDatabaseMetadata,
  executeQuery,
  getVisualizationSuggestions,
  getAggregatedData,
  testDatabaseConnection,
  discoverDatabases,
  refreshAllMetadata
} from '@/lib/actions/database';

export function useDatabaseService() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    setError(null);
    
    const result = await getDatabaseConnections();
    if (result.success) {
      setConnections(result.connections!);
    } else {
      setError(result.error!);
    }
    
    setLoading(false);
  };

  const addConnection = async (connectionData: {
    name: string;
    type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis' | 'oracle' | 'mssql';
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    const result = await createConnection(connectionData);
    if (result.success) {
      await loadConnections(); // force reload to get updated list
      return result.connectionId;
    } else {
      setError(result.error!);
      return null;
    }
  };

  const removeConnection = async (connectionId: string) => {
    setLoading(true);
    setError(null);
    
    const result = await removeDatabaseConnection(connectionId);
    if (result.success) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    } else {
      setError(result.error!);
    }
    
    setLoading(false);
    return result.success;
  };

  const getMetadata = async (connectionId: string): Promise<DatabaseMetadata | null> => {
    setLoading(true);
    setError(null);
    
    const result = await getDatabaseMetadata(connectionId);
    setLoading(false);
    
    if (result.success) {
      return result.metadata!;
    } else {
      setError(result.error!);
      return null;
    }
  };

  const runQuery = async (
    connectionId: string,
    query: {
      table: string;
      select?: string[];
      where?: Record<string, string | number | boolean>;
      groupBy?: string[];
      orderBy?: Array<{ column: string; direction: 'ASC' | 'DESC' }>;
      limit?: number;
      offset?: number;
      aggregation?: {
        type: 'sum' | 'avg' | 'count' | 'min' | 'max';
        column: string;
      };
    }
  ): Promise<QueryResponse | null> => {
    setLoading(true);
    setError(null);
    
    const result = await executeQuery(connectionId, query);
    setLoading(false);
    
    if (result.success) {
      return result.result!;
    } else {
      setError(result.error!);
      return null;
    }
  };

  const getSuggestions = async (connectionId: string, tableName: string): Promise<VisualizationSuggestion[] | null> => {
    setLoading(true);
    setError(null);
    
    const result = await getVisualizationSuggestions(connectionId, tableName);
    setLoading(false);
    
    if (result.success) {
      return result.suggestions!;
    } else {
      setError(result.error!);
      return null;
    }
  };

  const getAggregated = async (
    connectionId: string,
    tableName: string,
    dimensions: string[],
    measures: string[],
    aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
  ): Promise<QueryResponse | null> => {
    setLoading(true);
    setError(null);
    
    const result = await getAggregatedData(connectionId, tableName, dimensions, measures, aggregationType);
    setLoading(false);
    
    if (result.success) {
      return result.result!;
    } else {
      setError(result.error!);
      return null;
    }
  };

  const testConnection = async (connectionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    const result = await testDatabaseConnection(connectionId);
    setLoading(false);
    
    if (result.success) {
      return result.isHealthy!;
    } else {
      setError(result.error!);
      return false;
    }
  };

  const discover = async (connectionString: string): Promise<string[] | null> => {
    setLoading(true);
    setError(null);
    
    const result = await discoverDatabases(connectionString);
    setLoading(false);
    
    if (result.success) {
      return result.databases!;
    } else {
      setError(result.error!);
      return null;
    }
  };

  const refreshMetadata = async () => {
    setLoading(true);
    setError(null);
    
    const result = await refreshAllMetadata();
    if (result.success) {
      await loadConnections(); // force reload to get updated metadata
    } else {
      setError(result.error!);
    }
    
    setLoading(false);
    return result.success;
  };

  return {
    connections,
    loading,
    error,
    addConnection,
    removeConnection,
    getMetadata,
    runQuery,
    getSuggestions,
    getAggregated,
    testConnection,
    discover,
    refreshMetadata,
    reload: loadConnections
  };
}
