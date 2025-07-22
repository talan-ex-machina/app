'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, Eye, BarChart3, Globe, TrendingUp, ArrowLeft, Download, Filter } from 'lucide-react';
import { useDatabaseService } from '@/lib/hooks/useDatabaseService';
import { DatabaseConnection, DatabaseMetadata, TableMetadata, VisualizationSuggestion } from '@/lib/types/database';

interface DatabaseExplorerProps {
  connection: DatabaseConnection;
  onBack: () => void;
}

export default function DatabaseExplorer({ connection, onBack }: DatabaseExplorerProps) {
  const { getMetadata, runQuery, getSuggestions, getAggregated } = useDatabaseService();
  
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableMetadata | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[] | null>(null);
  const [suggestions, setSuggestions] = useState<VisualizationSuggestion[]>([]);
  const [selectedVisualization, setSelectedVisualization] = useState<VisualizationSuggestion | null>(null);
  const [visualizationData, setVisualizationData] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'tables' | 'table-detail' | 'visualization'>('tables');

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    const meta = await getMetadata(connection.id);
    if (meta) {
      setMetadata(meta);
    }
    setLoading(false);
  }, [connection.id, getMetadata]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleTableSelect = async (table: TableMetadata) => {
    setLoading(true);
    setSelectedTable(table);
    
    // Load sample data
    const data = await runQuery(connection.id, {
      table: table.name,
      limit: 100
    });
    
    if (data) {
      setTableData(data.data);
    }

    // Get visualization suggestions
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

  const getVisualizationIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar':
      case 'line':
      case 'scatter':
        return <BarChart3 className="w-5 h-5" />;
      case 'globe':
        return <Globe className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getChartTypeColor = (chartType: string) => {
    switch (chartType) {
      case 'bar': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'line': return 'bg-green-100 text-green-700 border-green-300';
      case 'scatter': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'globe': return 'bg-red-100 text-red-700 border-red-300';
      case 'heatmap': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const renderTableView = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Database Tables</h2>
          <p className="text-gray-400">
            {metadata?.totalTables} tables • {metadata?.totalRecords.toLocaleString()} total records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metadata?.tables.map((table) => (
          <motion.div
            key={table.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 cursor-pointer hover:border-blue-500 transition-all"
            onClick={() => handleTableSelect(table)}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Table className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="font-bold text-white">{table.name}</h3>
                <p className="text-sm text-gray-400 capitalize">{table.type}</p>
              </div>
            </div>

            <div className="text-sm text-gray-300 mb-4">
              <p><strong>Rows:</strong> {table.rowCount.toLocaleString()}</p>
              <p><strong>Columns:</strong> {table.columns.length}</p>
              <p><strong>Suggestions:</strong> {table.suggestedVisualizations.length}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {table.suggestedVisualizations.slice(0, 3).map((suggestion, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded text-xs border ${getChartTypeColor(suggestion.chartType)}`}
                >
                  {suggestion.chartType}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderTableDetail = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('tables')}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedTable?.name}</h2>
            <p className="text-gray-400">
              {selectedTable?.rowCount.toLocaleString()} rows • {selectedTable?.columns.length} columns
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Schema */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Schema</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedTable?.columns.map((column) => (
              <div key={column.name} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <p className="font-medium text-white">{column.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{column.dataType}</p>
                </div>
                <div className="flex space-x-1">
                  {column.primaryKey && (
                    <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs">PK</span>
                  )}
                  {column.nullable && (
                    <span className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-xs">NULL</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Data */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Sample Data</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {selectedTable?.columns.slice(0, 6).map((column) => (
                    <th key={column.name} className="text-left py-2 px-3 text-gray-300 font-medium">
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData?.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750">
                    {selectedTable?.columns.slice(0, 6).map((column) => (
                      <td key={column.name} className="py-2 px-3 text-gray-300">
                        {String(row[column.name] || '-').slice(0, 50)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Visualization Suggestions */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4">Recommended Visualizations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((suggestion, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-blue-500 transition-all"
              onClick={() => handleVisualizationSelect(suggestion)}
            >
              <div className="flex items-center space-x-3 mb-3">
                {getVisualizationIcon(suggestion.chartType)}
                <div>
                  <h4 className="font-bold text-white">{suggestion.title}</h4>
                  <p className={`text-xs px-2 py-1 rounded border ${getChartTypeColor(suggestion.chartType)}`}>
                    {suggestion.chartType} • {suggestion.type}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{suggestion.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </div>
                <Eye className="w-4 h-4 text-blue-400" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVisualization = () => (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('table-detail')}
          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h2 className="text-2xl font-bold text-white">{selectedVisualization?.title}</h2>
          <p className="text-gray-400">{selectedVisualization?.description}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Visualization Ready</h3>
          <p className="text-gray-400 mb-4">
            Data loaded with {visualizationData?.length} records
          </p>
          <p className="text-sm text-gray-500">
            This visualization can be integrated with your 3D dashboard
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-white">{connection.name}</h1>
              <p className="text-gray-400 capitalize">{connection.type} Database</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {!loading && (
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {view === 'tables' && renderTableView()}
              {view === 'table-detail' && renderTableDetail()}
              {view === 'visualization' && renderVisualization()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
