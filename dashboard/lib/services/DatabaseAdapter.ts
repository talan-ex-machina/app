import { 
  DatabaseConnection, 
  DatabaseMetadata, 
  TableMetadata, 
  ColumnMetadata, 
  ColumnStatistics,
  DataProfile,
  VisualizationSuggestion,
  QueryRequest,
  QueryResponse
} from '../types/database';

export abstract class DatabaseAdapter {
  protected connection: DatabaseConnection;

  constructor(connection: DatabaseConnection) {
    this.connection = connection;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract getMetadata(): Promise<DatabaseMetadata>;
  abstract getTableMetadata(tableName: string): Promise<TableMetadata>;
  abstract executeQuery(query: QueryRequest): Promise<QueryResponse>;
  abstract buildQuery(request: QueryRequest): string;

  protected analyzeDataType(value: unknown): 'string' | 'number' | 'date' | 'boolean' | 'json' | 'binary' {
    if (value === null || value === undefined) return 'string';
    
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      // Check if it's a date string
      if (!isNaN(Date.parse(value))) return 'date';
      // Check if it's a number string
      if (!isNaN(Number(value))) return 'number';
      // Check if it's JSON
      try {
        JSON.parse(value);
        return 'json';
      } catch {
        return 'string';
      }
    }
    if (typeof value === 'object') return 'json';
    
    return 'string';
  }

  protected calculateStatistics(values: unknown[]): ColumnStatistics {
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    const distinctValues = [...new Set(nonNullValues)];
    
    const stats: ColumnStatistics = {
      distinctCount: distinctValues.length,
      nullCount: values.length - nonNullValues.length,
      cardinality: this.calculateCardinality(distinctValues.length, values.length),
      distribution: []
    };

    // Calculate min/max for numeric and date values
    if (nonNullValues.length > 0) {
      const firstValue = nonNullValues[0];
      if (typeof firstValue === 'number') {
        const numericValues = nonNullValues as number[];
        stats.minValue = Math.min(...numericValues);
        stats.maxValue = Math.max(...numericValues);
        stats.avgValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      } else if (firstValue instanceof Date) {
        const dateValues = nonNullValues as Date[];
        stats.minValue = new Date(Math.min(...dateValues.map(d => d.getTime())));
        stats.maxValue = new Date(Math.max(...dateValues.map(d => d.getTime())));
      }
    }

    // Calculate value distribution (top 10 most common values)
    const valueCount = new Map<string, number>();
    nonNullValues.forEach(value => {
      const key = String(value);
      valueCount.set(key, (valueCount.get(key) || 0) + 1);
    });

    stats.distribution = Array.from(valueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({
        value: this.parseValue(value),
        count,
        percentage: (count / nonNullValues.length) * 100
      }));

    return stats;
  }

  private parseValue(value: string): string | number | boolean {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    return value;
  }

  private calculateCardinality(distinct: number, total: number): 'low' | 'medium' | 'high' {
    const ratio = distinct / total;
    if (ratio < 0.1) return 'low';
    if (ratio < 0.5) return 'medium';
    return 'high';
  }

  protected generateVisualizationSuggestions(table: TableMetadata): VisualizationSuggestion[] {
    const suggestions: VisualizationSuggestion[] = [];
    const { dataProfile } = table;

    // Time series charts
    if (dataProfile.timeFields.length > 0 && dataProfile.measures.length > 0) {
      dataProfile.measures.forEach(measure => {
        suggestions.push({
          type: '2d',
          chartType: 'line',
          title: `${measure.column} over time`,
          description: `Line chart showing ${measure.column} trends over ${dataProfile.timeFields[0].column}`,
          confidence: 0.9,
          dimensions: [dataProfile.timeFields[0].column],
          measures: [measure.column],
          reasoning: 'Time-based data with numeric measures are ideal for line charts'
        });
      });
    }

    // Category-based charts
    if (dataProfile.categoricalFields.length > 0 && dataProfile.measures.length > 0) {
      dataProfile.categoricalFields.forEach(category => {
        if (category.categories.length < 20) { // Avoid too many categories
          dataProfile.measures.forEach(measure => {
            suggestions.push({
              type: '2d',
              chartType: 'bar',
              title: `${measure.column} by ${category.column}`,
              description: `Bar chart comparing ${measure.column} across different ${category.column}`,
              confidence: 0.8,
              dimensions: [category.column],
              measures: [measure.column],
              reasoning: 'Categorical data with numeric measures work well with bar charts'
            });
          });
        }
      });
    }

    // Geographic visualizations
    if (dataProfile.geographicFields.length > 0 && dataProfile.measures.length > 0) {
      dataProfile.geographicFields.forEach(geo => {
        dataProfile.measures.forEach(measure => {
          suggestions.push({
            type: '3d',
            chartType: 'globe',
            title: `${measure.column} by ${geo.column}`,
            description: `3D globe visualization showing ${measure.column} distribution by ${geo.column}`,
            confidence: 0.85,
            dimensions: [geo.column],
            measures: [measure.column],
            reasoning: 'Geographic data is perfect for 3D globe visualizations'
          });
        });
      });
    }

    // Scatter plots for numeric correlations
    const numericMeasures = dataProfile.measures.filter(m => m.type === 'continuous');
    if (numericMeasures.length >= 2) {
      for (let i = 0; i < numericMeasures.length - 1; i++) {
        for (let j = i + 1; j < numericMeasures.length; j++) {
          suggestions.push({
            type: '3d',
            chartType: 'scatter',
            title: `${numericMeasures[i].column} vs ${numericMeasures[j].column}`,
            description: `3D scatter plot exploring correlation between ${numericMeasures[i].column} and ${numericMeasures[j].column}`,
            confidence: 0.7,
            dimensions: [],
            measures: [numericMeasures[i].column, numericMeasures[j].column],
            reasoning: 'Multiple numeric measures can reveal correlations in scatter plots'
          });
        }
      }
    }

    // Heatmaps for correlation matrices
    if (dataProfile.categoricalFields.length >= 1 && dataProfile.measures.length >= 1) {
      suggestions.push({
        type: '2d',
        chartType: 'heatmap',
        title: 'Correlation Heatmap',
        description: 'Heatmap showing correlations between different dimensions and measures',
        confidence: 0.6,
        dimensions: dataProfile.categoricalFields.slice(0, 2).map(c => c.column),
        measures: dataProfile.measures.slice(0, 1).map(m => m.column),
        reasoning: 'Heatmaps are effective for showing relationships in multidimensional data'
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  protected buildDataProfile(columns: ColumnMetadata[], sampleData: Record<string, unknown>[]): DataProfile {
    const profile: DataProfile = {
      dimensions: [],
      measures: [],
      timeFields: [],
      categoricalFields: [],
      geographicFields: []
    };

    columns.forEach(column => {
      const values = sampleData.map(row => row[column.name]);
      const dataType = this.analyzeDataType(values[0]);

      // Determine field type based on data type and statistics
      if (dataType === 'number' && column.statistics.cardinality === 'high') {
        profile.measures.push({
          column: column.name,
          type: 'continuous',
          aggregations: ['sum', 'avg', 'count', 'min', 'max'],
          distribution: this.inferDistribution(values as number[])
        });
      } else if (dataType === 'date') {
        profile.timeFields.push({
          column: column.name,
          format: 'ISO',
          granularity: this.inferTimeGranularity(values as Date[]),
          range: {
            min: column.statistics.minValue as Date,
            max: column.statistics.maxValue as Date
          }
        });
      } else if (dataType === 'string' && column.statistics.cardinality === 'low') {
        profile.categoricalFields.push({
          column: column.name,
          categories: column.statistics.distribution.map(d => ({
            value: String(d.value),
            count: d.count
          }))
        });

        // Check if it might be geographic
        if (this.isGeographicField(column.name, values as string[])) {
          profile.geographicFields.push({
            column: column.name,
            type: this.inferGeographicType(column.name),
            format: 'string',
            examples: values.slice(0, 5).map(String)
          });
        }
      }

      // Add as dimension
      profile.dimensions.push({
        column: column.name,
        type: this.mapToFieldType(dataType, column.statistics.cardinality),
        cardinality: column.statistics.distinctCount,
        examples: column.statistics.distribution.slice(0, 3).map(d => String(d.value))
      });
    });

    return profile;
  }

  private inferDistribution(values: number[]): 'normal' | 'skewed' | 'uniform' | 'bimodal' {
    // Simple heuristic - can be improved with proper statistical analysis
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const skewness = values.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / (values.length * Math.pow(variance, 1.5));
    
    if (Math.abs(skewness) > 1) return 'skewed';
    if (variance < mean * 0.1) return 'uniform';
    return 'normal';
  }

  private inferTimeGranularity(values: Date[]): 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' {
    if (values.length < 2) return 'day';
    
    const diffs = values.slice(1).map((date, i) => date.getTime() - values[i].getTime());
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    
    if (avgDiff > 365 * 24 * 60 * 60 * 1000) return 'year';
    if (avgDiff > 30 * 24 * 60 * 60 * 1000) return 'month';
    if (avgDiff > 24 * 60 * 60 * 1000) return 'day';
    if (avgDiff > 60 * 60 * 1000) return 'hour';
    if (avgDiff > 60 * 1000) return 'minute';
    return 'second';
  }

  private isGeographicField(columnName: string, values: string[]): boolean {
    const geoKeywords = ['country', 'state', 'city', 'region', 'location', 'address', 'lat', 'lng', 'longitude', 'latitude'];
    const nameMatch = geoKeywords.some(keyword => columnName.toLowerCase().includes(keyword));
    
    if (nameMatch) return true;

    // Check if values look like country codes, states, etc.
    const commonCountries = ['US', 'USA', 'United States', 'UK', 'Canada', 'Germany', 'France'];
    const commonStates = ['CA', 'NY', 'TX', 'FL', 'California', 'New York', 'Texas'];
    
    const sampleValues = values.slice(0, 10);
    const geoMatches = sampleValues.filter(value => 
      commonCountries.includes(value) || commonStates.includes(value)
    ).length;
    
    return geoMatches > sampleValues.length * 0.3;
  }

  private inferGeographicType(columnName: string): 'country' | 'state' | 'city' | 'coordinate' | 'postal_code' {
    const name = columnName.toLowerCase();
    if (name.includes('country')) return 'country';
    if (name.includes('state') || name.includes('province')) return 'state';
    if (name.includes('city')) return 'city';
    if (name.includes('lat') || name.includes('lng') || name.includes('coordinate')) return 'coordinate';
    if (name.includes('zip') || name.includes('postal')) return 'postal_code';
    return 'city';
  }

  private mapToFieldType(dataType: string, cardinality: 'low' | 'medium' | 'high'): 'categorical' | 'ordinal' | 'temporal' | 'geographic' {
    if (dataType === 'date') return 'temporal';
    if (dataType === 'string' && cardinality === 'low') return 'categorical';
    if (dataType === 'number' && cardinality === 'low') return 'ordinal';
    return 'categorical';
  }
}
