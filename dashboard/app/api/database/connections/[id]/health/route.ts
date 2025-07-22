import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    const health = await databaseService.getConnectionHealth(connectionId);
    
    return NextResponse.json({ health });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check connection health', details: String(error) },
      { status: 500 }
    );
  }
}
