// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define feedback data structure
interface Feedback {
  rating: number;
  comment: string;
  generatedCode: string;
  timestamp: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data: Feedback = await request.json();
    
    // Validate required fields
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return NextResponse.json(
        { error: 'Valid rating (1-5) is required' },
        { status: 400 }
      );
    }
    
    // Prepare feedback data for storage
    const feedbackEntry = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    
    // Get the comments file path
    const commentsDir = path.join(process.cwd(), 'data');
    const commentsFile = path.join(commentsDir, 'comments.json');
    
    // Ensure the directory exists
    if (!fs.existsSync(commentsDir)) {
      fs.mkdirSync(commentsDir, { recursive: true });
    }
    
    // Read existing comments or create empty array
    let comments = [];
    if (fs.existsSync(commentsFile)) {
      const fileContent = fs.readFileSync(commentsFile, 'utf-8');
      comments = JSON.parse(fileContent);
    }
    
    // Add new comment and write back to file
    comments.push(feedbackEntry);
    fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2), 'utf-8');
    
    // You could also implement email sending functionality here
    // to notify customersupport@xebrand.in about new feedback
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
