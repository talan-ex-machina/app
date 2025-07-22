// Database connection and schema types
export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis' | 'oracle' | 'mssql';
  connectionString: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  metadata?: DatabaseMetadata;
}

export interface DatabaseMetadata {
  version: string;
  totalTables: number;
  totalRecords: number;
  lastAnalyzed: Date;
  tables: TableMetadata[];
  relationships: Relationship[];
}

export interface TableMetadata {
  name: string;
  type: 'table' | 'view' | 'collection';
  rowCount: number;
  columns: ColumnMetadata[];
  indexes: IndexMetadata[];
  sampleData: Record<string, unknown>[];
  dataProfile: DataProfile;
  suggestedVisualizations: VisualizationSuggestion[];
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: ForeignKeyMetadata;
  unique: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'json' | 'binary';
  statistics: ColumnStatistics;
}

export interface ColumnStatistics {
  distinctCount: number;
  nullCount: number;
  minValue?: string | number | Date;
  maxValue?: string | number | Date;
  avgValue?: number;
  distribution: ValueDistribution[];
  cardinality: 'low' | 'medium' | 'high';
}

export interface ValueDistribution {
  value: string | number | boolean;
  count: number;
  percentage: number;
}

export interface ForeignKeyMetadata {
  referencedTable: string;
  referencedColumn: string;
  constraint: string;
}

export interface IndexMetadata {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  strength: number; // 0-1 indicating relationship confidence
}

export interface DataProfile {
  dimensions: DimensionField[];
  measures: MeasureField[];
  timeFields: TimeField[];
  categoricalFields: CategoricalField[];
  geographicFields: GeographicField[];
}

export interface DimensionField {
  column: string;
  type: 'categorical' | 'ordinal' | 'temporal' | 'geographic';
  cardinality: number;
  examples: string[];
}

export interface MeasureField {
  column: string;
  type: 'continuous' | 'discrete';
  aggregations: string[]; // sum, avg, count, min, max
  distribution: 'normal' | 'skewed' | 'uniform' | 'bimodal';
}

export interface TimeField {
  column: string;
  format: string;
  granularity: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
  range: { min: Date; max: Date };
}

export interface CategoricalField {
  column: string;
  categories: Array<{ value: string; count: number }>;
  hierarchy?: string[];
}

export interface GeographicField {
  column: string;
  type: 'country' | 'state' | 'city' | 'coordinate' | 'postal_code';
  format: string;
  examples: string[];
}

export interface VisualizationSuggestion {
  type: '2d' | '3d';
  chartType: 'bar' | 'line' | 'scatter' | 'heatmap' | 'pie' | 'area' | 'bubble' | 'treemap' | 'sankey' | 'globe' | 'network' | 'surface';
  title: string;
  description: string;
  confidence: number; // 0-1
  dimensions: string[];
  measures: string[];
  filters?: string[];
  aggregation?: string;
  reasoning: string;
}

export interface QueryRequest {
  connectionId: string;
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

export interface QueryResponse {
  data: Record<string, unknown>[];
  totalCount: number;
  executionTime: number;
  query: string;
  metadata: {
    columns: Array<{ name: string; type: string }>;
    visualizationHints: VisualizationSuggestion[];
  };
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
