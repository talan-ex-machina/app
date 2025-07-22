'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Database, Trash2, TestTube, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useDatabaseService } from '@/lib/hooks/useDatabaseService';
import { DatabaseConnection } from '@/lib/types/database';

interface DatabaseManagerProps {
  onConnectionSelect?: (connection: DatabaseConnection) => void;
}

export default function DatabaseManager({ onConnectionSelect }: DatabaseManagerProps) {
  const {
    connections,
    loading,
    error,
    addConnection,
    removeConnection,
    testConnection,
    refreshMetadata
  } = useDatabaseService();

  const [showAddForm, setShowAddForm] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis' | 'oracle' | 'mssql';
    connectionString: string;
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  }>({
    name: '',
    type: 'postgresql',
    connectionString: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    ssl: false
  });

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const connectionData = {
      ...formData,
      port: formData.port ? parseInt(formData.port) : undefined
    };

    const connectionId = await addConnection(connectionData);
    if (connectionId) {
      setShowAddForm(false);
      setFormData({
        name: '',
        type: 'postgresql',
        connectionString: '',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
        ssl: false
      });
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    setTestingConnection(connectionId);
    await testConnection(connectionId);
    setTestingConnection(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-yellow-500 bg-yellow-50';
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Database Connections</h1>
            <p className="text-gray-400">Manage your database connections and explore your data</p>
          </div>
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refreshMetadata()}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh All</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Connection</span>
            </motion.button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"
          >
            {error}
          </motion.div>
        )}

        {/* Connections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AnimatePresence>
            {connections.map((connection) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${getStatusColor(connection.status)}`}
                onClick={() => onConnectionSelect?.(connection)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Database className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-gray-900">{connection.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{connection.type}</p>
                    </div>
                  </div>
                  {getStatusIcon(connection.status)}
                </div>

                <div className="text-sm text-gray-700 mb-4">
                  <p><strong>Database:</strong> {connection.database || 'N/A'}</p>
                  <p><strong>Host:</strong> {connection.host || 'N/A'}</p>
                  {connection.metadata && (
                    <p><strong>Tables:</strong> {connection.metadata.totalTables}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestConnection(connection.id);
                    }}
                    disabled={testingConnection === connection.id}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    <TestTube className={`w-3 h-3 ${testingConnection === connection.id ? 'animate-pulse' : ''}`} />
                    <span>Test</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(connection.id);
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Connection Form Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-6">Add Database Connection</h2>
                
                <form onSubmit={handleAddConnection} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Connection Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Database Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          type: e.target.value as 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis' | 'oracle' | 'mssql'
                        }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="postgresql">PostgreSQL</option>
                        <option value="mysql">MySQL</option>
                        <option value="mongodb">MongoDB</option>
                        <option value="sqlite">SQLite</option>
                        <option value="redis">Redis</option>
                        <option value="oracle">Oracle</option>
                        <option value="mssql">SQL Server</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Connection String (Optional)</label>
                    <input
                      type="text"
                      value={formData.connectionString}
                      onChange={(e) => setFormData(prev => ({ ...prev, connectionString: e.target.value }))}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="postgresql://user:password@host:port/database"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Host</label>
                      <input
                        type="text"
                        value={formData.host}
                        onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Port</label>
                      <input
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="5432"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Database</label>
                      <input
                        type="text"
                        value={formData.database}
                        onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="database_name"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.ssl}
                          onChange={(e) => setFormData(prev => ({ ...prev, ssl: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">SSL</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Connection'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
