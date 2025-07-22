'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Table, 
  Eye, 
  BarChart3, 
  ArrowLeft, 
  Database,
  Key,
  Link,
  Zap
} from 'lucide-react';
import { useDatabaseService } from '@/lib/hooks/useDatabaseService';
import { DatabaseConnection, DatabaseMetadata, TableMetadata, VisualizationSuggestion } from '@/lib/types/database';

interface EnhancedDatabaseExplorerProps {
  connection: DatabaseConnection;
  onBack: () => void;
}

export default function EnhancedDatabaseExplorer({ connection, onBack }: EnhancedDatabaseExplorerProps) {
  const { getMetadata, runQuery, getSuggestions, getAggregated } = useDatabaseService();
  
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableMetadata | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[] | null>(null);
  const [suggestions, setSuggestions] = useState<VisualizationSuggestion[]>([]);
  const [selectedVisualization, setSelectedVisualization] = useState<VisualizationSuggestion | null>(null);
  const [visualizationData, setVisualizationData] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'overview' | 'tables' | 'table-detail' | 'indexes' | 'relationships' | 'visualization'>('overview');

  const loadMetadata = async () => {
    setLoading(true);
    const meta = await getMetadata(connection.id);
    if (meta) {
      setMetadata(meta);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMetadata();
  }, [connection.id, getMetadata]);

  const handleTableSelect = async (table: TableMetadata) => {
    setLoading(true);
    setSelectedTable(table);
    
    // Load table data
    const data = await runQuery(connection.id, {
      table: table.name,
      limit: 100
    });
    
    if (data) {
      setTableData(data.data);
    }
    
    // Load suggestions
    const tableSuggestions = await getSuggestions(connection.id, table.name);
    if (tableSuggestions) {
      setSuggestions(tableSuggestions);
    }
    
    setView('table-detail');
    setLoading(false);
  };

  const handleVisualizationSelect = async (suggestion: VisualizationSuggestion) => {
    setLoading(true);
    setSelectedVisualization(suggestion);

    if (selectedTable) {
      const aggregationType = (suggestion.aggregation as 'sum' | 'avg' | 'count' | 'min' | 'max') || 'sum';
      const data = await getAggregated(
        connection.id,
        selectedTable.name,
        suggestion.dimensions,
        suggestion.measures,
        aggregationType
      );

      if (data) {
        setVisualizationData(data.data);
      }
    }

    setView('visualization');
    setLoading(false);
  };

  if (loading && !metadata) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {connection.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {connection.type} • {metadata?.version}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {(['overview', 'tables', 'indexes', 'relationships'] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <DatabaseOverview key="overview" metadata={metadata} />
        )}

        {view === 'tables' && (
          <TablesView 
            key="tables"
            metadata={metadata}
            onTableSelect={handleTableSelect}
          />
        )}

        {view === 'indexes' && (
          <IndexesView 
            key="indexes"
            metadata={metadata}
          />
        )}

        {view === 'relationships' && (
          <RelationshipsView 
            key="relationships"
            metadata={metadata}
          />
        )}

        {view === 'table-detail' && selectedTable && (
          <TableDetailView
            key="table-detail"
            table={selectedTable}
            data={tableData}
            suggestions={suggestions}
            onVisualizationSelect={handleVisualizationSelect}
            onBack={() => setView('tables')}
          />
        )}

        {view === 'visualization' && selectedVisualization && visualizationData && (
          <VisualizationView
            key="visualization"
            suggestion={selectedVisualization}
            data={visualizationData}
            onBack={() => setView('table-detail')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Database Overview Component
function DatabaseOverview({ metadata }: { metadata: DatabaseMetadata | null }) {
  if (!metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Tables</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {metadata.totalTables}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Records</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {metadata.totalRecords.toLocaleString()}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Link className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Relations</span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {metadata.relationships.length}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Indexes</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {metadata.tables.reduce((acc, table) => acc + table.indexes.length, 0)}
          </p>
        </div>
      </div>

      {/* Schema Health */}
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Schema Health Insights
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Tables with Primary Keys</span>
            <span className="font-medium">
              {metadata.tables.filter(t => t.columns.some(c => c.primaryKey)).length}/{metadata.tables.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tables with Indexes</span>
            <span className="font-medium">
              {metadata.tables.filter(t => t.indexes.length > 0).length}/{metadata.tables.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Foreign Key Relationships</span>
            <span className="font-medium">{metadata.relationships.length}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Tables View Component
function TablesView({ metadata, onTableSelect }: { 
  metadata: DatabaseMetadata | null;
  onTableSelect: (table: TableMetadata) => void;
}) {
  if (!metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid gap-4">
        {metadata.tables.map((table) => (
          <motion.div
            key={table.name}
            onClick={() => onTableSelect(table)}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Table className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold">{table.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {table.columns.length} columns • {table.rowCount.toLocaleString()} rows
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Key className="w-4 h-4" />
                  <span>{table.indexes.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{table.suggestedVisualizations.length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Indexes View Component
function IndexesView({ metadata }: { metadata: DatabaseMetadata | null }) {
  if (!metadata) return null;

  const allIndexes = metadata.tables.flatMap(table => 
    table.indexes.map(index => ({ ...index, tableName: table.name }))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid gap-4">
        {allIndexes.map((index, i) => (
          <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Key className={`w-5 h-5 ${index.unique ? 'text-green-600' : 'text-blue-600'}`} />
                <span className="font-semibold">{index.name}</span>
                {index.unique && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">UNIQUE</span>
                )}
              </div>
              <span className="text-sm text-gray-500">{index.tableName}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span>Columns: {index.columns.join(', ')}</span>
              <span className="ml-4">Type: {index.type}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Relationships View Component
function RelationshipsView({ metadata }: { metadata: DatabaseMetadata | null }) {
  if (!metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid gap-4">
        {metadata.relationships.map((rel, i) => (
          <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Link className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">
                  {rel.fromTable}.{rel.fromColumn} → {rel.toTable}.{rel.toColumn}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  {rel.type.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(rel.strength * 100)}% confidence
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Table Detail View Component (simplified for space)
function TableDetailView({ 
  table, 
  data, 
  suggestions, 
  onVisualizationSelect, 
  onBack 
}: {
  table: TableMetadata;
  data: Record<string, unknown>[] | null;
  suggestions: VisualizationSuggestion[];
  onVisualizationSelect: (suggestion: VisualizationSuggestion) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{table.name}</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Back to Tables
        </button>
      </div>

      {/* Table Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <span className="text-sm text-blue-600">Columns</span>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
            {table.columns.length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <span className="text-sm text-green-600">Rows</span>
          <p className="text-xl font-bold text-green-700 dark:text-green-400">
            {table.rowCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <span className="text-sm text-purple-600">Indexes</span>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-400">
            {table.indexes.length}
          </p>
        </div>
      </div>

      {/* Sample Data Preview */}
      {data && data.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Sample Data</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {Object.keys(data[0]).slice(0, 5).map((key) => (
                    <th key={key} className="text-left p-2 text-sm font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).slice(0, 5).map((value, j) => (
                      <td key={j} className="p-2 text-sm">
                        {String(value).slice(0, 50)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visualization Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Recommended Visualizations</h4>
          <div className="grid grid-cols-2 gap-4">
            {suggestions.slice(0, 4).map((suggestion, i) => (
              <motion.div
                key={i}
                onClick={() => onVisualizationSelect(suggestion)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <h5 className="font-medium">{suggestion.type}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {suggestion.description}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Visualization View Component (placeholder)
function VisualizationView({ 
  suggestion, 
  data, 
  onBack 
}: {
  suggestion: VisualizationSuggestion;
  data: Record<string, unknown>[];
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{suggestion.type} Visualization</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Back to Table
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400 mb-4">{suggestion.description}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium">Dimensions:</span>
            <p className="text-sm">{suggestion.dimensions.join(', ')}</p>
          </div>
          <div>
            <span className="text-sm font-medium">Measures:</span>
            <p className="text-sm">{suggestion.measures.join(', ')}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border">
          <p className="text-center text-gray-500">
            Visualization would render here with {data.length} data points
          </p>
        </div>
      </div>
    </motion.div>
  );
}
