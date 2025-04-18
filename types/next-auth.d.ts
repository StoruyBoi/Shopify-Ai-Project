// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      backendId?: string;
      credits?: {
        current: number;
        max: number;
      };
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    picture?: string;
    backendId?: string;
    credits?: {
      current: number;
      max: number;
    };
  }
}
