// app/api/test-insert/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const result = await executeQuery({
      query: 'INSERT INTO users (google_id, name, email, credits_remaining, max_credits) VALUES (?, ?, ?, ?, ?)',
      values: ['test123', 'Test User', 'test@example.com', 5, 5]
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
