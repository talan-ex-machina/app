import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; table: string } }
) {
  try {
    const connectionId = params.id;
    const tableName = params.table;
    
    const suggestions = await databaseService.getSuggestedVisualizations(connectionId, tableName);
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get visualization suggestions', details: String(error) },
      { status: 500 }
    );
  }
}
