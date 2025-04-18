// lib/auth-options.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

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
    image?: string;
  };
  credits_remaining: number;
  max_credits: number;
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

async function syncWithBackend(userData: UserSyncData): Promise<BackendResponse | null> {
  try {
    const response = await fetch('http://localhost/Backend/google-auth-sync.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Backend sync failed: ${response.status}`);
    }
    
    return await response.json();
  } catch {
    // Removed unused error parameter
    console.error('Backend sync error occurred');
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
      // If this is a sign-in with new user data
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      
      // If this is a sign-in with Google
      if (account && account.provider === 'google') {
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
          token.backendId = backendData.user.id;
          token.credits = {
            current: backendData.credits_remaining,
            max: backendData.max_credits
          };
          
          // Update image from backend if available
          if (backendData.user.image) {
            token.picture = backendData.user.image;
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Add user ID to the session - ensuring string type
        session.user.id = String(token.sub || token.id || "");
        
        // Fix for the backendId type compatibility
        session.user.backendId = String(token.backendId || "");
        
        // Ensure image is set and handle potential null/undefined
        session.user.image = String(token.picture || "");
        
        // Add credits info to the session
        if (token.credits) {
          session.user.credits = token.credits;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
