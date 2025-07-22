import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; table: string } }
) {
  try {
    const connectionId = params.id;
    const tableName = params.table;
    const body = await request.json();
    
    const { dimensions, measures, aggregationType = 'sum' } = body;

    if (!dimensions || !Array.isArray(dimensions) || dimensions.length === 0) {
      return NextResponse.json(
        { error: 'At least one dimension is required' },
        { status: 400 }
      );
    }

    if (!measures || !Array.isArray(measures) || measures.length === 0) {
      return NextResponse.json(
        { error: 'At least one measure is required' },
        { status: 400 }
      );
    }

    const result = await databaseService.getAggregatedData(
      connectionId,
      tableName,
      dimensions,
      measures,
      aggregationType
    );
    
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get aggregated data', details: String(error) },
      { status: 500 }
    );
  }
}
