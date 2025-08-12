import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_BASE = process.env.PYTHON_API_BASE || 'http://localhost:8000/api/business-planning';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${PYTHON_API_BASE}/simulation/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in market simulation generate route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate market simulation' },
      { status: 500 }
    );
  }
}
