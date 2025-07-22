import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    const metadata = await databaseService.getMetadata(connectionId);
    
    return NextResponse.json({ metadata });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get metadata', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    const metadata = await databaseService.getMetadata(connectionId);
    
    return NextResponse.json({ metadata });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh metadata', details: String(error) },
      { status: 500 }
    );
  }
}
