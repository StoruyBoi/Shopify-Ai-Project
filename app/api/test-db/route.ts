// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // Simple query to test connection
    await executeQuery({ 
      query: 'SELECT 1 as test' 
    });
    
    // Also test table structure
    const tableInfo = await executeQuery({
      query: 'SHOW COLUMNS FROM users'
    });
    
    console.log('Database connection test successful');
    console.log('Table structure:', tableInfo);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tableInfo
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
