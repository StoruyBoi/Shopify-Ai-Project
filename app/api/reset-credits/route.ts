import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Check for authorization header to secure the endpoint
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized attempt to reset credits');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Starting credit reset process...');
    
    // Reset all users' credits to their maximum value
    await executeQuery({
      query: 'UPDATE users SET credits_remaining = max_credits',
      values: []
    });
    
    console.log('Credit reset completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'All user credits have been reset to their maximum values',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Credit reset failed:', error);
    return NextResponse.json({
      error: 'Failed to reset credits',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
