// app/api/credits/use/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { executeQuery } from '@/lib/db';

// Define a proper interface for the credits data
interface UserCredits {
  credits_remaining: number;
  max_credits: number;
}

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user ID
    const userId = session.user.backendId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Update user credits (decrement by 1)
    await executeQuery({
      query: 'UPDATE users SET credits_remaining = GREATEST(credits_remaining - 1, 0) WHERE id = ?',
      values: [userId]
    });
    
    // Get updated credits - using proper type instead of any[]
    const results = await executeQuery<UserCredits[]>({
      query: 'SELECT credits_remaining, max_credits FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (results.length === 0) {
      return NextResponse.json(
        { error: 'User not found', credits_remaining: 0, max_credits: 0 },
        { status: 404 }
      );
    }
    
    // Return the updated credits data
    return NextResponse.json({
      credits_remaining: results[0].credits_remaining,
      max_credits: results[0].max_credits
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to use credit', credits_remaining: 0, max_credits: 0 },
      { status: 500 }
    );
  }
}
