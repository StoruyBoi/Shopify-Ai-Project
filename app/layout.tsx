// app/layout.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import ThemeTransition from "@/components/ThemeTransition";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`
              ${geistSans.variable} ${geistMono.variable}
              antialiased min-h-screen
              bg-white dark:bg-gray-900
              text-gray-900 dark:text-gray-100
              transition-colors duration-200
            `}
          >
            <ThemeProvider>
              <ThemeTransition />
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-grow">{children}</main>
              </div>
            </ThemeProvider>
          </body>
        </html>
      </AuthProvider>
    </SessionProvider>
  );
}
