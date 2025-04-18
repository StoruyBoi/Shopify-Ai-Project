// app/api/generate-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateShopifyCode } from '@/lib/claude';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

// Define proper type instead of any
interface CreditResponse {
  credits_remaining: number;
  max_credits: number;
}

// Renamed from useCredit to deductCredit and removed unused userId parameter
async function deductCredit(): Promise<CreditResponse> {
  // Updated to use the new API endpoint
  const response = await fetch('https://www.codehallow.com/api/credits/use', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
    // Removed user_id from body as it's retrieved from session in the API
  });
  
  if (!response.ok) {
    throw new Error(`Failed to use credit: ${response.status}`);
  }
  
  return await response.json();
}

// Helper function to fetch credits with proper return type
// Removed unused userId parameter
async function fetchCredits(): Promise<CreditResponse> {
  // Updated to use the new API endpoint
  const response = await fetch('https://www.codehallow.com/api/credits', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
    // Removed user_id from body as it's retrieved from session in the API
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch credits: ${response.status}`);
  }
  
  return await response.json();
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
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }
    
    // Check user credits - removed userId argument
    const creditsData = await fetchCredits();
    
    if (creditsData.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Please upgrade your plan.' },
        { status: 402 }
      );
    }
    
    // Generate code using Claude API
    const code = await generateShopifyCode(
      sectionType,
      requirements || '',
      imageDescriptions || 'No reference images provided.'
    );
    
    // Deduct credit (renamed function call) - removed userId argument
    const creditData = await deductCredit();
    
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
