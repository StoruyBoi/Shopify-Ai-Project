// app/api/generate-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateShopifyCode } from '@/lib/claude';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Define proper type instead of any
interface CreditResponse {
  credits_remaining: number;
  max_credits: number;
}

// Renamed from useCredit to deductCredit to avoid React Hook naming convention
async function deductCredit(userId: string): Promise<CreditResponse> {
  const response = await fetch('http://localhost/Backend/use-credit.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to use credit: ${response.status}`);
  }
  
  return await response.json();
}

// Helper function to fetch credits with proper return type
async function fetchCredits(userId: string): Promise<CreditResponse> {
  const response = await fetch('http://localhost/Backend/get-credits.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
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
    
    // Check user credits
    const creditsData = await fetchCredits(userId);
    
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
    
    // Deduct credit (renamed function call)
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
