import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { executeQuery } from '@/lib/db';

// Define a proper interface for the user credits
interface UserCredits {
  credits_remaining: number;
  max_credits: number;
}

// Set default max credits to 3
const DEFAULT_MAX_CREDITS = 3;

export async function GET() {
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
      console.error('No backendId in session:', JSON.stringify(session.user));
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    console.log('Fetching credits for user ID:', userId);

    // Add failsafe - if userId isn't a number, try to parse it
    const userIdValue = isNaN(Number(userId)) ? userId : Number(userId);

    // Query database for credits with retry logic
    let results: UserCredits[] = [];
    let retries = 3;
    
    while (retries > 0) {
      try {
        results = await executeQuery<UserCredits[]>({
          query: 'SELECT credits_remaining, max_credits FROM users WHERE id = ?',
          values: [userIdValue]
        });
        break; // Success, exit the loop
      } catch (retryError) {
        retries--;
        if (retries === 0) throw retryError; // Rethrow if all retries failed
        // Wait before retrying (exponential backoff)
        await new Promise(r => setTimeout(r, (3-retries) * 500));
      }
    }
    
    if (results.length === 0) {
      // Fallback: Use default values if user not found
      console.log('User not found, using default credits values');
      return NextResponse.json({
        credits_remaining: DEFAULT_MAX_CREDITS,
        max_credits: DEFAULT_MAX_CREDITS
      });
    }
    
    console.log('Credits data retrieved:', results[0]);
    
    // Return the credits data (enforce max_credits = 3 if needed)
    return NextResponse.json({
      credits_remaining: results[0].credits_remaining,
      max_credits: Math.min(results[0].max_credits, DEFAULT_MAX_CREDITS)
    });
    
  } catch (error) {
    console.error('API route error:', error);
    // Return default values instead of error to prevent client errors
    return NextResponse.json({
      credits_remaining: DEFAULT_MAX_CREDITS,
      max_credits: DEFAULT_MAX_CREDITS
    });
  }
}
