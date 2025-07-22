import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    const connection = databaseService.getConnection(connectionId);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ connection });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get connection', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    await databaseService.removeConnection(connectionId);
    
    return NextResponse.json({ message: 'Connection removed successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove connection', details: String(error) },
      { status: 500 }
    );
  }
}
