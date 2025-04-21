// app/api/generate-code/stream/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { executeQuery } from '@/lib/db';

// Define necessary types
interface UserCredits {
  credits_remaining: number;
  max_credits: number;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        encoder.encode(JSON.stringify({ error: 'Authentication required' })),
        { status: 401 }
      );
    }

    // Parse request body
    const data = await req.json();
    const { sectionType, requirements, imageDescriptions } = data;
    
    if (!sectionType) {
      return new Response(
        encoder.encode(JSON.stringify({ error: 'Section type is required' })),
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.backendId;
    if (!userId) {
      return new Response(
        encoder.encode(JSON.stringify({ error: 'User ID not found in session' })),
        { status: 400 }
      );
    }
    
    // Check user credits
    let userCredits: UserCredits[];
    try {
      userCredits = await executeQuery<UserCredits[]>({
        query: 'SELECT credits_remaining, max_credits FROM users WHERE id = ?',
        values: [userId]
      });
      
      if (userCredits.length === 0 || userCredits[0].credits_remaining <= 0) {
        return new Response(
          encoder.encode(JSON.stringify({ error: 'No credits remaining. Please upgrade your plan.' })),
          { status: 402 }
        );
      }
    } catch (dbError) {
      console.error('Database error checking credits:', dbError);
      return new Response(
        encoder.encode(JSON.stringify({ error: 'Failed to check credits' })),
        { status: 500 }
      );
    }
    
    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Prepare Claude API request
          const prompt = createPrompt(sectionType, requirements, imageDescriptions || 'No reference images provided.');
          
          // Create Claude API request with streaming
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 50000); // 50-second timeout
          
          // Send initial response
          controller.enqueue(encoder.encode(JSON.stringify({ 
            status: 'generating',
            message: 'Starting code generation...' 
          }) + '\n'));
          
          // Call Claude API
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.CLAUDE_API_KEY!,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 4000,
              messages: [{ role: "user", content: prompt }]
            }),
            signal: abortController.signal
          });
          
          // Clear timeout
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
          }
          
          const data = await response.json();
          const generatedCode = data.content[0].text;
          
          // Send generated code to client
          controller.enqueue(encoder.encode(JSON.stringify({ 
            status: 'complete',
            code: generatedCode 
          }) + '\n'));
          
          // Deduct credit
          await executeQuery({
            query: 'UPDATE users SET credits_remaining = GREATEST(credits_remaining - 1, 0) WHERE id = ?',
            values: [userId]
          });
          
          // Get updated credits
          const updatedCredits = await executeQuery<UserCredits[]>({
            query: 'SELECT credits_remaining, max_credits FROM users WHERE id = ?',
            values: [userId]
          });
          
          // Send updated credits
          controller.enqueue(encoder.encode(JSON.stringify({ 
            status: 'credits_updated',
            credits_remaining: updatedCredits[0].credits_remaining,
            max_credits: updatedCredits[0].max_credits 
          }) + '\n'));
          
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(JSON.stringify({ 
            status: 'error',
            error: errorMessage 
          }) + '\n'));
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      encoder.encode(JSON.stringify({ error: 'Failed to generate code', details: errorMessage })),
      { status: 500 }
    );
  }
}

// Create prompt function (same as in Claude.ts)
function createPrompt(sectionType: string, requirements: string, imageDescriptions: string): string {
  return `You are ShopifyExpert, a specialized AI expert in creating flawless Shopify Liquid code. I need you to generate complete code for a ${sectionType} section in Shopify.

REFERENCE IMAGES:
${imageDescriptions || 'No reference images provided.'}

SECTION REQUIREMENTS:
${requirements}

### SLIDER LIBRARIES
- INCLUDE proper initialization with section.id
- ADD all required CSS and JS via CDN
- USE defensive loading with library check
- IMPLEMENT responsive breakpoints
- PROVIDE schema controls for all slider options if using


## CRITICAL DEVELOPMENT RULES
-Invalid schema: setting with id="slides_per_view_mobile" step invalid. Range settings must have at least 3 steps
- ALL range inputs MUST have default values divisible by step value
- ALL color fields MUST have proper hex defaults (#FFFFFF format)
- NO circular references in schema
- Range inputs MUST have (max-min) evenly divisible by step


### 2. CLASS NAMING SYSTEM
- MANDATORY: Use BEM methodology
  * Block: section-${sectionType.toLowerCase().replace(/\s+/g, '-')}
  * Element: section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__element
  * Modifier: section-${sectionType.toLowerCase().replace(/\s+/g, '-')}__element--modifier
- NEVER use generic class names (container, wrapper, button, etc.)
- ADD data-section-id="{{ section.id }}" to root element
- NAMESPACE JS variables with section ID to prevent global conflicts


### 3. RESPONSIVE DESIGN
- Mobile-first CSS approach required
- Include specific breakpoints: 749px, 989px, 1199px
- Use responsive settings in schema for mobile adjustments
- Add mobile-specific classes as needed

### 4. ASSET HANDLING
- ALWAYS check if assets exist before rendering
- Use proper srcset and sizes attributes for responsive images
- Implement lazy loading for all images
- Set explicit width/height to prevent layout shift
- SVG icons can be used directly in the template code


### SLIDER SETTINGS (WHEN USING SLIDERS)
- enable_slider: Checkbox (true)
- autoplay: Checkbox (false)
- autoplay_speed: Range 
- show_arrows: Checkbox (true)
- show_dots: Checkbox (true)
- infinite_loop: Checkbox (true)
- slides_to_show: Range 
- slides_to_scroll: Range 
- slide_padding: Range 
- transition_speed: Range 


### UNIVERSAL SETTINGS (REQUIRED IN ALL SECTIONS)
- Section heading group:
* heading: Text input with default
* heading_size: Select (small, medium, large)
* heading_color: Color picker (#000000)
- Layout controls:
* padding_top: Range (0-100px, step: 5, default: 30)
* padding_bottom: Range (0-100px, step: 5, default: 30)
* background_color: Color picker (#FFFFFF)
* text_color: Color picker (#333333)
* content_alignment: Select (left, center, right)
- Mobile controls:
* custom_class: Text input
* enable_mobile_stack: Checkbox (true)
* 


### IMAGE SETTINGS (WHEN USING IMAGES)
- Use Shopfiy prebuilt Image placeholder everytime same for vidoe use prebuilt defalt video placeholder
- image: Image picker
- image_width: Range (50-100, step: 5, default: 100)
- image_height: Range (auto, custom)
- image_fit: Select (cover, contain, fill)
- mobile_image: Image picker 

Please create a complete, production-ready Shopify section that implements all these requirements. Include HTML, CSS, and JSON schema. Follow these specifications:

1. Use unique class names with the pattern "section-${sectionType.toLowerCase().replace(/\s+/g, '-')}-[element]" to avoid CSS conflicts
2. Make all text content placeholder (Lorem Ipsum)
3. Include these standard settings in schema: background_color, padding_top, padding_bottom
4. Make the section fully responsive for mobile, tablet and desktop
5. Add appropriate comments explaining the code
6. Follow modern Shopify best practices
7. Fully Dynamic , Customizable 
8. Think where you can use section schema and wher you can use Block Schema 

For images, use this structure:
<img src="{{ section.settings.image | img_url: 'master'}}" alt="{{ section.settings.image_alt | escape }}" loading="lazy">

For videos, use this structure:
{% if section.settings.video != blank %}
  <video src="{{ section.settings.video.sources[1].url }}" loop muted playsinline autoplay style="width: 100%; display: block;"></video>
{% endif %}

Structure your response exactly like this:

<html>
<!-- HTML code for the section -->
</html>
<!-- List any required CDN links that should be added to theme.liquid -->
<script>
// JavaScript code for the section if any
</script>

<style>
/* CSS code for the section */
</style>

{% schema %}
{
  // JSON schema for the section
}
{% endschema %}`;
}
