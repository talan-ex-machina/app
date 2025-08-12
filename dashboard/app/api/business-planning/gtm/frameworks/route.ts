import { NextResponse } from 'next/server';

const PYTHON_API_BASE = process.env.PYTHON_API_BASE || 'http://localhost:8000/api/business-planning';

export async function GET() {
  try {
    const response = await fetch(`${PYTHON_API_BASE}/gtm/frameworks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GTM frameworks route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GTM frameworks' },
      { status: 500 }
    );
  }
}
