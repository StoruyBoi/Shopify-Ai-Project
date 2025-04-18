// app/api/get-credits/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    // Get the user ID from NextAuth session
    const userId = session.user.backendId;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Fetch credits from PHP backend
    const response = await fetch('http://localhost/Backend/get-credits.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credits: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      credits_remaining: data.credits_remaining,
      max_credits: data.max_credits
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to get credits', credits_remaining: 0, max_credits: 0 },
      { status: 500 }
    );
  }
}
