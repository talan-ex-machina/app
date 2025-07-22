'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Activity, BarChart3, Network, Search, Eye } from 'lucide-react';
import { useDatabaseService } from '@/lib/hooks/useDatabaseService';
import { DatabaseConnection } from '@/lib/types/database';
import DatabaseManager from './DatabaseManager';
import DatabaseExplorer from './DatabaseExplorer';

interface DatabaseDashboardProps {
  darkMode?: boolean;
}

export default function DatabaseDashboard({ darkMode = false }: DatabaseDashboardProps) {
  const { connections, reload } = useDatabaseService();
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [view, setView] = useState<'overview' | 'manage' | 'explore' | 'discovery'>('overview');
  const [discoveryResults, setDiscoveryResults] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDatabaseDiscovery = async (connectionString: string) => {
    setIsDiscovering(true);
    try {
      const { discoverDatabases } = await import('@/lib/actions/database');
      const result = await discoverDatabases(connectionString);
      if (result.success) {
        setDiscoveryResults(result.databases || []);
      } else {
        console.error('Discovery failed:', result.error);
        setDiscoveryResults([]);
      }
    } catch (error) {
      console.error('Discovery failed:', error);
      setDiscoveryResults([]);
    } finally {
      setIsDiscovering(false);
    }
  };

  const getConnectionStats = () => {
    const connected = connections.filter(conn => conn.status === 'connected').length;
    const total = connections.length;
    const types = new Set(connections.map(conn => conn.type)).size;
    
    return { connected, total, types };
  };

  const stats = getConnectionStats();

  return (
    <div className={`p-6 space-y-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-600' : 'bg-blue-100'}`}>
            <Database className={`w-8 h-8 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Database Intelligence Hub</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Smart database discovery, analysis, and visualization
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {(['overview', 'discovery', 'manage', 'explore'] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === tab
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Connections</p>
              <p className="text-2xl font-bold text-green-500">{stats.connected}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Databases</p>
              <p className="text-2xl font-bold text-blue-500">{stats.total}</p>
            </div>
            <Database className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Database Types</p>
              <p className="text-2xl font-bold text-purple-500">{stats.types}</p>
            </div>
            <Network className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Visualizations</p>
              <p className="text-2xl font-bold text-orange-500">
                {connections.reduce((acc, conn) => acc + (conn.metadata?.tables.length || 0), 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <DatabaseOverview connections={connections} darkMode={darkMode} />
          </motion.div>
        )}

        {view === 'discovery' && (
          <motion.div
            key="discovery"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <DatabaseDiscovery 
              onDiscover={handleDatabaseDiscovery}
              isDiscovering={isDiscovering}
              results={discoveryResults}
              darkMode={darkMode}
            />
          </motion.div>
        )}

        {view === 'manage' && (
          <motion.div
            key="manage"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <DatabaseManager 
              onConnectionSelect={setSelectedConnection}
            />
          </motion.div>
        )}

        {view === 'explore' && (
          <motion.div
            key="explore"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {selectedConnection ? (
              <DatabaseExplorer
                connection={selectedConnection}
                onBack={() => setSelectedConnection(null)}
              />
            ) : (
              <DatabaseConnectionSelector
                connections={connections}
                onSelect={setSelectedConnection}
                darkMode={darkMode}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Overview Component
function DatabaseOverview({ connections, darkMode }: { connections: DatabaseConnection[], darkMode: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Connections */}
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Recent Connections
        </h3>
        <div className="space-y-3">
          {connections.slice(0, 5).map((connection) => (
            <div key={connection.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${connection.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium">{connection.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{connection.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {connection.metadata?.totalTables || 0} tables
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Types Distribution */}
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Database Types
        </h3>
        <DatabaseTypeChart connections={connections} />
      </div>
    </div>
  );
}

// Database Discovery Component  
function DatabaseDiscovery({ 
  onDiscover, 
  isDiscovering, 
  results, 
  darkMode 
}: { 
  onDiscover: (connectionString: string) => void;
  isDiscovering: boolean;
  results: string[];
  darkMode: boolean;
}) {
  const [connectionString, setConnectionString] = useState('');

  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Search className="w-5 h-5 mr-2" />
        Smart Database Discovery
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Connection String
          </label>
          <input
            type="text"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="mysql://user:password@host:3306/database"
            className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>
        
        <motion.button
          onClick={() => onDiscover(connectionString)}
          disabled={!connectionString || isDiscovering}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Search className="w-4 h-4" />
          <span>{isDiscovering ? 'Discovering...' : 'Discover Databases'}</span>
        </motion.button>

        {results.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Discovered Databases:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {results.map((db, index) => (
                <div key={index} className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  {db}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Connection Selector Component
function DatabaseConnectionSelector({ 
  connections, 
  onSelect, 
  darkMode 
}: { 
  connections: DatabaseConnection[];
  onSelect: (connection: DatabaseConnection) => void;
  darkMode: boolean;
}) {
  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Eye className="w-5 h-5 mr-2" />
        Select Database to Explore
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((connection) => (
          <motion.div
            key={connection.id}
            onClick={() => onSelect(connection)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 hover:border-blue-500' 
                : 'bg-gray-50 border-gray-200 hover:border-blue-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${connection.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">{connection.name}</span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {connection.type} • {connection.metadata?.totalTables || 0} tables
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Simple Database Type Chart
function DatabaseTypeChart({ connections }: { connections: DatabaseConnection[] }) {
  const typeCounts = connections.reduce((acc, conn) => {
    acc[conn.type] = (acc[conn.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];

  return (
    <div className="space-y-3">
      {Object.entries(typeCounts).map(([type, count], index) => (
        <div key={type} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
            <span className="capitalize">{type}</span>
          </div>
          <span className="font-medium">{count}</span>
        </div>
      ))}
    </div>
  );
}
