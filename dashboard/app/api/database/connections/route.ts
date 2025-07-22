import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/DatabaseService';

export async function GET() {
  try {
    const connections = databaseService.getConnections();
    return NextResponse.json({ connections });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get connections', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, connectionString, host, port, database, username, password, ssl } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const connectionId = await databaseService.addConnection({
      name,
      type,
      connectionString: connectionString || '',
      host,
      port,
      database,
      username,
      password,
      ssl: ssl || false
    });

    const connection = databaseService.getConnection(connectionId);
    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add connection', details: String(error) },
      { status: 500 }
    );
  }
}
