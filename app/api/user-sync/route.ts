// app/api/user-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// Define interfaces for type safety
interface UserData {
  email: string | null | undefined;
  name: string | null | undefined;
  google_id: string;
  image?: string | null | undefined;
}

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
    console.log('📥 Received user sync request');
    const userData = await request.json() as UserData;
    
    if (!userData.google_id) {
      console.error('❌ No google_id provided in sync request');
      return NextResponse.json(
        { error: 'Google ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Syncing user data for google_id:', userData.google_id);
    
    // Ensure users table exists
    try {
      await executeQuery({
        query: `
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            google_id VARCHAR(255) UNIQUE,
            name VARCHAR(255),
            email VARCHAR(255),
            image VARCHAR(255),
            credits_remaining INT DEFAULT 5,
            max_credits INT DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `,
        values: []
      });
      console.log('✅ Users table created or already exists');
    } catch (tableError) {
      console.error('❌ Error ensuring users table exists:', tableError);
      // Continue execution - table might already exist
    }

    // Check if user exists in database
    console.log('🔍 Checking if user exists');
    const existingUsers = await executeQuery<DbUser[]>({
      query: 'SELECT * FROM users WHERE google_id = ?',
      values: [userData.google_id]
    });
    
    let userId;
    let isNewUser = false;
    
    if (existingUsers.length > 0) {
      // User exists, update their data
      const user = existingUsers[0];
      userId = user.id;
      
      console.log('👤 Existing user found, updating:', userId);
      
      await executeQuery({
        query: 'UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?',
        values: [userData.name || null, userData.email || null, userData.image || null, userId]
      });
    } else {
      // Create new user
      isNewUser = true;
      console.log('➕ Creating new user');
      
      const result = await executeQuery<QueryResult>({
        query: 'INSERT INTO users (google_id, name, email, image, credits_remaining, max_credits) VALUES (?, ?, ?, ?, 5, 5)',
        values: [userData.google_id, userData.name || null, userData.email || null, userData.image || null]
      });
      
      if (!result || !('insertId' in result)) {
        console.error('❌ Insert succeeded but no insertId was returned');
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        );
      }
      
      userId = result.insertId;
      console.log('✅ New user created with ID:', userId);
    }
    
    // Get fresh user data including credits
    const userRows = await executeQuery<DbUser[]>({
      query: 'SELECT id, name, email, image, credits_remaining, max_credits FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (userRows.length > 0) {
      const user = userRows[0];
      console.log('📤 Returning user data for ID:', userId);
      
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
      console.error('❌ User not found after creation/update');
      return NextResponse.json(
        { error: 'Failed to retrieve user data after sync' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API route error:', error);
    // Return detailed error information
    return NextResponse.json({
      error: 'Failed to sync user data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
