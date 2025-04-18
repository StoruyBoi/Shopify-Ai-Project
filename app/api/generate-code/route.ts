// app/api/generate-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateShopifyCode } from '@/lib/claude';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { executeQuery } from '@/lib/db';

// Define proper types
interface CreditResponse {
  credits_remaining: number;
  max_credits: number;
}

interface UserCredits {
  credits_remaining: number;
  max_credits: number;
}

// Function to fetch credits directly from database
async function fetchCredits(userId: string): Promise<CreditResponse> {
  console.log('Fetching credits for user:', userId);
  
  try {
    const results = await executeQuery<UserCredits[]>({
      query: 'SELECT credits_remaining, max_credits FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (results.length === 0) {
      throw new Error('User not found in database');
    }
    
    console.log('Credits data fetched:', results[0]);
    return {
      credits_remaining: results[0].credits_remaining,
      max_credits: results[0].max_credits
    };
  } catch (error) {
    console.error('Error fetching credits from database:', error);
    throw error;
  }
}

// Function to deduct credit directly in database
async function deductCredit(userId: string): Promise<CreditResponse> {
  console.log('Deducting credit for user:', userId);
  
  try {
    // Update user credits (decrement by 1, but not below 0)
    await executeQuery({
      query: 'UPDATE users SET credits_remaining = GREATEST(credits_remaining - 1, 0) WHERE id = ?',
      values: [userId]
    });
    
    // Get updated credits
    const results = await executeQuery<UserCredits[]>({
      query: 'SELECT credits_remaining, max_credits FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (results.length === 0) {
      throw new Error('User not found after credit deduction');
    }
    
    console.log('Credits updated:', results[0]);
    return {
      credits_remaining: results[0].credits_remaining,
      max_credits: results[0].max_credits
    };
  } catch (error) {
    console.error('Error deducting credit in database:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { sectionType, requirements, imageDescriptions } = await req.json();
    
    if (!sectionType) {
      return NextResponse.json(
        { error: 'Section type is required' },
        { status: 400 }
      );
    }
    
    // Get the user ID from NextAuth session
    const userId = session.user.backendId;
    if (!userId) {
      console.error('No backendId found in session', session.user);
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }
    
    console.log('Starting code generation for user:', userId);
    
    // Check user credits - access database directly
    const creditsData = await fetchCredits(userId);
    
    if (creditsData.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Please upgrade your plan.' },
        { status: 402 }
      );
    }
    
    // Generate code using Claude API
    console.log('Generating code with Claude API for section type:', sectionType);
    const code = await generateShopifyCode(
      sectionType,
      requirements || '',
      imageDescriptions || 'No reference images provided.'
    );
    
    // Deduct credit directly in database
    const creditData = await deductCredit(userId);
    
    // Return the generated code and updated credit info
    return NextResponse.json({ 
      code,
      credits_remaining: creditData.credits_remaining,
      max_credits: creditData.max_credits
    });
    
  } catch (error) {
    console.error('API route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate code';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
