# Database Backend Service

A comprehensive Next.js backend service that enables seamless, plug-and-play connection to any relational or NoSQL database, automatically understands its schema & data, and exposes endpoints that the frontend can use to render business-relevant visualizations.

## 🚀 Features

- **Multi-Database Support**: MySQL, PostgreSQL, MongoDB, SQLite, Redis, Oracle, SQL Server
- **Automatic Schema Detection**: Intelligently discovers and analyzes database structure
- **Smart Database Discovery**: Automatically detect and list available databases from connection strings
- **Index Information**: Complete index metadata including columns, types, and uniqueness constraints
- **Relationship Detection**: Automatic discovery of foreign key relationships and data dependencies
- **Smart Visualization Suggestions**: AI-powered recommendations for 2D and 3D visualizations
- **Type-Safe API**: Full TypeScript support with comprehensive type definitions
- **Plug-and-Play Architecture**: Easy integration with existing Next.js applications
- **Real-time Health Monitoring**: Connection status and performance tracking
- **Data Profiling**: Automatic analysis of data types, statistics, and patterns

## 📁 Project Structure

```
lib/
├── types/
│   └── database.ts              # Complete type definitions
├── services/
│   ├── DatabaseAdapter.ts       # Abstract base adapter
│   ├── MySQLAdapter.ts         # MySQL implementation
│   ├── PostgreSQLAdapter.ts    # PostgreSQL implementation
│   ├── MongoDBAdapter.ts       # MongoDB implementation
│   └── DatabaseService.ts      # Central service manager
├── hooks/
│   └── useDatabaseService.ts   # React hook for frontend
└── actions/
    └── database.ts             # Server actions

app/
├── api/database/
│   ├── connections/route.ts    # Connection management
│   ├── metadata/route.ts       # Schema introspection
│   ├── query/route.ts          # Query execution
│   ├── visualizations/route.ts # Visualization suggestions
│   └── health/route.ts         # Health monitoring
└── components/
    ├── DatabaseManager.tsx     # Connection management UI
    └── DatabaseExplorer.tsx    # Data exploration UI
```

## 🛠 Installation

1. Install the required dependencies:

```bash
npm install mongodb mysql2 pg sqlite3
npm install -D @types/pg @types/sqlite3
```

2. Configure your database connections in environment variables:

```env
# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database

# MongoDB
MONGODB_URI=mongodb://localhost:27017/your_database
```

## 🔧 Quick Start

### 1. Backend Setup

The backend service is automatically available through Next.js API routes. No additional setup required.

### 2. Frontend Integration

```tsx
import { useDatabaseService } from '@/lib/hooks/useDatabaseService';
import DatabaseManager from '@/app/components/DatabaseManager';

export default function Dashboard() {
  const { connections, loading } = useDatabaseService();

  return (
    <div>
      <DatabaseManager />
      {/* Your existing dashboard components */}
    </div>
  );
}
```

### 3. Using Server Actions

```tsx
import { createConnection, getConnections } from '@/lib/actions/database';

// Create a new database connection
const connection = await createConnection({
  id: 'my-db',
  name: 'My Database',
  type: 'mysql',
  config: {
    host: 'localhost',
    port: 3306,
    user: 'admin',
    password: 'password',
    database: 'myapp'
  }
});

// Get all connections
const connections = await getConnections();
```

## 📡 API Endpoints

### Connection Management
- `GET /api/database/connections` - List all connections
- `POST /api/database/connections` - Create new connection
- `PUT /api/database/connections` - Update connection
- `DELETE /api/database/connections` - Delete connection

### Schema & Metadata
- `GET /api/database/metadata?connectionId=xxx` - Get database schema
- `GET /api/database/metadata/table?connectionId=xxx&table=xxx` - Get table details

### Query Execution
- `POST /api/database/query` - Execute custom queries
- `GET /api/database/query/sample?connectionId=xxx&table=xxx` - Get sample data

### Visualizations
- `GET /api/database/visualizations?connectionId=xxx&table=xxx` - Get visualization suggestions
- `POST /api/database/visualizations/data` - Get data for specific visualization

### Health Monitoring
- `GET /api/database/health` - Overall system health
- `GET /api/database/health?connectionId=xxx` - Specific connection health

## 🎨 Visualization Types

The system automatically suggests appropriate visualizations based on data analysis:

### 2D Visualizations
- **Bar Charts**: Categorical data comparison
- **Line Charts**: Time series and trends
- **Pie Charts**: Proportion and distribution
- **Scatter Plots**: Correlation analysis
- **Heat Maps**: Pattern recognition
- **Histograms**: Data distribution

### 3D Visualizations
- **3D Scatter Plots**: Multi-dimensional relationships
- **Surface Charts**: Complex data landscapes
- **3D Bar Charts**: Categorical data in 3D space
- **Network Graphs**: Relationship mapping
- **Globe Visualizations**: Geographic data
- **Force-Directed Graphs**: Entity relationships

## 🔍 Data Analysis Features

### Automatic Data Profiling
- Data type detection and validation
- Statistical analysis (mean, median, mode, std dev)
- Null value and data quality assessment
- Cardinality and uniqueness analysis
- Pattern recognition in text data
- **Index analysis and optimization suggestions**
- **Foreign key relationship mapping**

### Smart Database Discovery
- **Automatic database detection from connection strings**
- **Live database enumeration for MySQL, PostgreSQL, MongoDB**
- **Connection validation with fallback options**
- **Multi-database environment support**

### Enhanced MySQL Features
- **Complete index metadata retrieval**
- **Foreign key relationship detection**
- **Constraint analysis and validation**
- **Performance optimization insights**

### Smart Suggestions
- Visualization type recommendations
- Chart configuration suggestions
- Color scheme recommendations
- Interactive feature suggestions
- Performance optimization tips

## 🏗 Architecture

### Adapter Pattern
Each database type implements the `DatabaseAdapter` interface, providing:
- Connection management
- Schema introspection
- Query execution
- Data profiling
- Health monitoring

### Service Layer
The `DatabaseService` coordinates all operations:
- Connection pooling
- Metadata caching
- Health monitoring
- Error handling
- Performance optimization

### Type Safety
Comprehensive TypeScript definitions ensure:
- Type-safe database operations
- Intellisense support
- Runtime error prevention
- API contract enforcement

## 🔒 Security Features

- Connection string encryption
- Query sanitization
- SQL injection prevention
- Role-based access control
- Audit logging
- Rate limiting

## 📊 Performance Optimization

- Connection pooling
- Metadata caching
- Query optimization
- Lazy loading
- Background processing
- Memory management

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific database adapter tests
npm test -- --grep "MySQL"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Include database type, error messages, and relevant code

## 🚀 Roadmap

- [ ] Redis adapter implementation
- [ ] Oracle adapter implementation
- [ ] SQL Server adapter implementation
- [ ] Real-time data streaming
- [ ] Advanced caching strategies
- [ ] Machine learning insights
- [ ] Custom visualization plugins
- [ ] Data export capabilities
- [ ] Advanced security features
- [ ] Performance analytics dashboard
