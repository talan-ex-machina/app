import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    const body = await request.json();
    
    const { table, select, where, groupBy, orderBy, limit, offset, aggregation } = body;

    if (!table) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }

    const queryRequest = {
      connectionId,
      table,
      select,
      where,
      groupBy,
      orderBy,
      limit,
      offset,
      aggregation
    };

    const result = await databaseService.executeQuery(connectionId, queryRequest);
    
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute query', details: String(error) },
      { status: 500 }
    );
  }
}
