// lib/auth-options.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { executeQuery } from '@/lib/db';

// Create proper interface instead of using 'any'
interface UserSyncData {
  email: string | null | undefined;
  name: string | null | undefined;
  google_id: string;
  image?: string | null | undefined;
}

// Define backend response type
interface BackendResponse {
  status: string;
  user: {
    id: string;
    image?: string | null;
  };
  credits_remaining: number;
  max_credits: number;
}

// Database interfaces
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

// Define session and token types to extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      backendId: string;
      image: string;
      credits?: {
        current: number;
        max: number;
      };
      name?: string | null;
      email?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    backendId?: string;
    credits?: {
      current: number;
      max: number;
    };
    sub?: string;
    picture?: string | null;
    name?: string | null;
    email?: string | null;
  }
}

// IMPORTANT: This function directly interacts with the database - enhanced with better error handling
async function syncWithBackend(userData: UserSyncData): Promise<BackendResponse | null> {
  try {
    console.log('🔄 Syncing user data with database:', userData.email);
    
    if (!userData.google_id) {
      console.error('❌ No google_id provided for user sync');
      return null;
    }
    
    // Create table if it doesn't exist - use a simple query to avoid permissions issues
    try {
      await executeQuery({
        query: `
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            google_id VARCHAR(255) UNIQUE,
            name VARCHAR(255),
            email VARCHAR(255),
            image TEXT,
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
    console.log('🔍 Checking if user exists with google_id:', userData.google_id);
    
    // FIX: Explicitly type existingUsers variable and initialize with empty array
    let existingUsers: DbUser[] = [];
    
    try {
      existingUsers = await executeQuery<DbUser[]>({
        query: 'SELECT * FROM users WHERE google_id = ?',
        values: [userData.google_id]
      });
    } catch (queryError) {
      console.error('❌ Error querying for existing user:', queryError);
      // existingUsers remains an empty array
    }
    
    let userId;
    let userCredits = 5; // Default credits for new users
    let maxCredits = 5;  // Default max credits
    
    if (existingUsers.length > 0) {
      // User exists, update their data
      const user = existingUsers[0];
      userId = user.id;
      userCredits = user.credits_remaining;
      maxCredits = user.max_credits;
      
      console.log('👤 Existing user found, updating:', userId);
      
      try {
        await executeQuery({
          query: 'UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?',
          values: [
            userData.name || null, 
            userData.email || null, 
            userData.image || null, 
            userId
          ]
        });
        console.log('✅ User data updated successfully');
      } catch (updateError) {
        console.error('❌ Error updating user data:', updateError);
        // Still return user data even if update fails
      }
    } else {
      // Create new user
      console.log('➕ Creating new user with google_id:', userData.google_id);
      
      try {
        const result = await executeQuery<QueryResult>({
          query: `
            INSERT INTO users 
            (google_id, name, email, image, credits_remaining, max_credits) 
            VALUES (?, ?, ?, ?, 5, 5)
          `,
          values: [
            userData.google_id, 
            userData.name || null, 
            userData.email || null, 
            userData.image || null
          ]
        });
        
        if (result && 'insertId' in result) {
          userId = result.insertId;
          console.log('✅ New user created with ID:', userId);
        } else {
          console.error('❌ Insert succeeded but no insertId was returned');
          // Create a fallback ID if necessary
          userId = Date.now(); // Temporary ID as fallback
        }
      } catch (insertError) {
        console.error('❌ Error creating new user:', insertError);
        return null;
      }
    }
    
    // Prepare response
    console.log('🔄 Sync successful, returning user data with ID:', userId);
    return {
      status: 'success',
      user: {
        id: String(userId),
        image: userData.image
      },
      credits_remaining: userCredits,
      max_credits: maxCredits
    };
  } catch (error) {
    console.error('❌ Fatal database sync error:', error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        // If this is a sign-in with new user data
        if (user) {
          console.log('👤 Setting user data in token from sign-in');
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
        
        // If this is a sign-in with Google
        if (account && account.provider === 'google') {
          console.log('🔐 Google sign-in detected, syncing with database');
          // Prepare user data for backend
          const userData: UserSyncData = {
            email: token.email,
            name: token.name,
            google_id: token.sub || "",
            image: token.picture
          };
          
          // Sync with backend
          const backendData = await syncWithBackend(userData);
          
          if (backendData && backendData.status === 'success') {
            // Store backend user ID and credits in token
            console.log('💾 Saving backendId to token:', backendData.user.id);
            token.backendId = backendData.user.id;
            token.credits = {
              current: backendData.credits_remaining,
              max: backendData.max_credits
            };
            
            // Update image from backend if available
            if (backendData.user.image) {
              token.picture = backendData.user.image;
            }
          } else {
            console.error('❌ Failed to sync with database');
          }
        }
        
        // Make sure we always have a backendId and credits to avoid undefined errors
        if (!token.backendId) {
          console.warn('⚠️ No backendId found in token, using fallback');
          token.backendId = token.sub || token.id || String(Date.now());
        }
        
        if (!token.credits) {
          console.warn('⚠️ No credits found in token, using defaults');
          token.credits = { current: 5, max: 5 };
        }
        
        // Log the token for debugging
        console.log('🔑 JWT callback - token values:', {
          id: token.id,
          sub: token.sub,
          backendId: token.backendId,
          credits: token.credits
        });
      } catch (error) {
        console.error('❌ Error in JWT callback:', error);
        // Don't rethrow - allow auth to continue even if there's an error
      }
      
      return token;
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          // Add user ID to the session - ensuring string type
          session.user.id = String(token.sub || token.id || "");
          
          // Fix for the backendId type compatibility - ensure it's never undefined
          console.log('💾 Setting session.user.backendId from token:', token.backendId);
          session.user.backendId = String(token.backendId || token.sub || token.id || "");
          
          // Ensure image is set and handle potential null/undefined
          session.user.image = String(token.picture || "");
          
          // Add credits info to the session
          if (token.credits) {
            session.user.credits = token.credits;
          } else {
            session.user.credits = { current: 5, max: 5 };
          }
          
          // Log session for debugging
          console.log('🔐 Session callback - session.user values:', {
            id: session.user.id,
            backendId: session.user.backendId,
            credits: session.user.credits
          });
        }
      } catch (error) {
        console.error('❌ Error in session callback:', error);
        // Don't rethrow - allow auth to continue even if there's an error
      }
      
      return session;
    },
  },
  debug: true, // Enable debug mode for detailed NextAuth logs
  logger: {
    error(code, metadata) {
      console.error('NextAuth error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth warning:', code);
    },
    debug(code, metadata) {
      console.log('NextAuth debug:', code, metadata);
    }
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
