// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Create the handler using the imported authOptions
const handler = NextAuth(authOptions);

// Only export the route handler functions
export { handler as GET, handler as POST };
