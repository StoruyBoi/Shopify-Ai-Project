// app/api/auth/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// Add these interfaces to define proper types instead of using 'any'
interface DbUser {
  id: number;
  google_id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  credits_remaining: number;
  max_credits: number;
}

interface QueryResult {
  insertId: number;
  affectedRows: number;
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    if (!userData.google_id) {
      return NextResponse.json(
        { error: 'Google ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists - replaced any[] with DbUser[]
    const existingUsers = await executeQuery<DbUser[]>({
      query: 'SELECT * FROM users WHERE google_id = ?',
      values: [userData.google_id]
    });
    
    let userId;
    let isNewUser = false;
    
    if (existingUsers.length > 0) {
      // User exists, update their data
      userId = existingUsers[0].id;
      
      await executeQuery({
        query: 'UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?',
        values: [userData.name || null, userData.email || null, userData.image || null, userId]
      });
    } else {
      // Create new user
      isNewUser = true;
      // Replaced any with QueryResult
      const result = await executeQuery<QueryResult>({
        query: 'INSERT INTO users (google_id, name, email, image, credits_remaining, max_credits) VALUES (?, ?, ?, ?, 5, 5)',
        values: [userData.google_id, userData.name || null, userData.email || null, userData.image || null]
      });
      
      userId = result.insertId;
    }
    
    // Get user data including credits - replaced any[] with DbUser[]
    const userRows = await executeQuery<DbUser[]>({
      query: 'SELECT id, name, email, image, credits_remaining, max_credits FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (userRows.length > 0) {
      const user = userRows[0];
      
      return NextResponse.json({
        status: 'success',
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          image: user.image
        },
        credits_remaining: user.credits_remaining,
        max_credits: user.max_credits,
        is_new_user: isNewUser
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to retrieve user data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user data' },
      { status: 500 }
    );
  }
}
