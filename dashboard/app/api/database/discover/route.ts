import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    const databases = await databaseService.discoverDatabases(connectionString);
    
    return NextResponse.json({ databases });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to discover databases', details: String(error) },
      { status: 500 }
    );
  }
}
