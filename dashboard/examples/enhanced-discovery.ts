// Example: Enhanced Database Discovery
import { databaseService } from '@/lib/services/DatabaseService';

// Discover all databases from a connection string
async function discoverDatabases() {
  try {
    const connectionString = 'mysql://user:password@localhost:3306/myapp';
    
    // Enhanced discovery - now actually connects and lists all databases
    const databases = await databaseService.discoverDatabases(connectionString);
    console.log('Available databases:', databases);
    // Output: ['myapp', 'inventory', 'analytics', 'users']
    
    // Create connections for each discovered database
    for (const dbName of databases) {
      const dbConnectionString = connectionString.replace(/\/[^\/]*$/, `/${dbName}`);
      await databaseService.addConnection({
        name: `${dbName} Database`,
        type: 'mysql',
        connectionString: dbConnectionString,
        host: 'localhost',
        port: 3306,
        database: dbName,
        username: 'user',
        password: 'password'
      });
    }
    
  } catch (error) {
    console.error('Discovery failed:', error);
  }
}

// Example: Enhanced Schema Analysis with Indexes and Relationships
async function analyzeSchema(connectionId: string) {
  try {
    const metadata = await databaseService.getMetadata(connectionId);
    
    console.log('Database Analysis:');
    console.log(`- Version: ${metadata.version}`);
    console.log(`- Tables: ${metadata.totalTables}`);
    console.log(`- Total Records: ${metadata.totalRecords}`);
    console.log(`- Relationships: ${metadata.relationships.length}`);
    
    // Analyze each table
    metadata.tables.forEach(table => {
      console.log(`\nTable: ${table.name}`);
      console.log(`- Rows: ${table.rowCount}`);
      console.log(`- Columns: ${table.columns.length}`);
      console.log(`- Indexes: ${table.indexes.length}`);
      
      // Show index information
      table.indexes.forEach(index => {
        console.log(`  Index: ${index.name} (${index.type})`);
        console.log(`    Columns: ${index.columns.join(', ')}`);
        console.log(`    Unique: ${index.unique}`);
      });
      
      // Show relationships
      const tableRelations = metadata.relationships.filter(
        rel => rel.fromTable === table.name || rel.toTable === table.name
      );
      
      if (tableRelations.length > 0) {
        console.log(`  Relationships:`);
        tableRelations.forEach(rel => {
          console.log(`    ${rel.fromTable}.${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn}`);
          console.log(`    Type: ${rel.type}, Strength: ${rel.strength}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Schema analysis failed:', error);
  }
}

export { discoverDatabases, analyzeSchema };
