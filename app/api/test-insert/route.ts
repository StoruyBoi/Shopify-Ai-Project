// app/api/test-user-insert/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // Test direct user insertion
    const result = await executeQuery({
      query: `
        INSERT INTO users 
        (google_id, name, email, image, credits_remaining, max_credits) 
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: [
        'test-google-id-' + Date.now(),
        'Test User',
        'test@example.com',
        'https://example.com/image.jpg',
        5,
        5
      ]
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test user inserted successfully',
      result
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to insert test user',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
