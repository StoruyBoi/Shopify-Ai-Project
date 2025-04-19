// app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// Define a proper interface for user data
interface UserData {
  id: number;
  google_id: string;
  name: string | null;
  email: string | null;
  credits_remaining: number;
}

export async function GET() {
  try {
    // Test simple query
    const testResult = await executeQuery<{test: number}[]>({
      query: 'SELECT 1 as test'
    });
    
    // Test users table
    const userCount = await executeQuery<{count: number}[]>({
      query: 'SELECT COUNT(*) as count FROM users'
    });
    
    // Get sample user data - using the proper interface
    const sampleUsers = await executeQuery<UserData[]>({
      query: 'SELECT id, google_id, name, email, credits_remaining FROM users LIMIT 3'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      testResult,
      userCount: userCount[0]?.count || 0,
      sampleUsers
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
