// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Enhanced feedback data structure with more user details
interface Feedback {
  rating: number;
  comment: string;
  generatedCode?: string;
  timestamp: string;
  email?: string;
  userName?: string;
  userEmail?: string;
  sectionType?: string;
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
    
    // Add current timestamp if not provided
    const feedbackEntry = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };
    
    // Format the star rating as emoji stars
    const starRating = '⭐'.repeat(data.rating);
    
    // Send email with feedback
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Shopify Code Generator <feedback@codehallow.com>',
      to: 'customersupport@xebrand.in',
      subject: `${starRating} New Feedback: ${data.rating}/5 Stars - Shopify Code Generator`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">New User Feedback Received</h2>
          
          <div style="margin-bottom: 20px; background-color: #f9fafb; padding: 15px; border-radius: 6px;">
            <p style="margin-top: 0; font-size: 18px; font-weight: bold;">Rating: ${starRating} (${data.rating}/5)</p>
            <p style="margin-bottom: 0;"><strong>Submitted:</strong> ${new Date(feedbackEntry.timestamp).toLocaleString()}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #4b5563;">User Information</h3>
            <p><strong>Name:</strong> ${feedbackEntry.userName || 'Anonymous'}</p>
            <p><strong>Email:</strong> ${feedbackEntry.userEmail || 'Not provided'}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #4b5563;">Feedback Details</h3>
            <p><strong>Section Type:</strong> ${feedbackEntry.sectionType || 'Not specified'}</p>
            <p><strong>Comment:</strong></p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${feedbackEntry.comment || 'No comment provided'}</div>
          </div>
          
          <div>
            <h3 style="margin-top: 0; color: #4b5563;">Generated Code Preview</h3>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-family: monospace; overflow: auto; max-height: 300px; white-space: pre-wrap;">${
              feedbackEntry.generatedCode?.substring(0, 500) || 'No code provided'
            }${feedbackEntry.generatedCode && feedbackEntry.generatedCode.length > 500 ? '...' : ''}</div>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
            This feedback was submitted through the Shopify Code Generator feedback system.
          </p>
        </div>
      `
    });
    
    // Handle potential email error
    if (emailError) {
      console.error('Error sending feedback email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email notification' },
        { status: 500 }
      );
    }
    
    // Log email sent success with the correct property
    console.log('Feedback email sent:', emailData?.id);
    
    // Log the feedback in server logs (this works in serverless)
    console.log('📝 New Feedback Received:');
    console.log(JSON.stringify({
      rating: feedbackEntry.rating,
      comment: feedbackEntry.comment,
      userName: feedbackEntry.userName || 'Anonymous',
      userEmail: feedbackEntry.userEmail || 'Not provided',
      sectionType: feedbackEntry.sectionType || 'Not specified',
      timestamp: feedbackEntry.timestamp,
    }, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: "Feedback received and email notification sent"
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
