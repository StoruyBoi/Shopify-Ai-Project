/**
 * Claude API integration for Shopify Liquid code generation
 * Optimized for serverless environments with timeout handling and error management
 */

export async function generateShopifyCode(
  sectionType: string,
  requirements: string,
  imageDescriptions: string
) {
  try {
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50-second timeout
    
    console.log(`Starting Claude API request for section type: ${sectionType}`);
    
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
        messages: [
          { 
            role: "user", 
            content: createPrompt(sectionType, requirements, imageDescriptions) 
          }
        ]
      }),
      signal: controller.signal // Connect AbortController
    });
    
    // Clear timeout to prevent memory leaks
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Claude API error: ${response.status} ${response.statusText}`);
      let errorData;
      try {
        errorData = await response.json();
      } catch { // Removed parameter entirely to fix ESLint error
        errorData = { message: 'Failed to parse error response' };
      }
      throw new Error(errorData.message || `Error calling Claude API: ${response.status}`);
    }

    console.log('Claude API response received successfully');
    const data = await response.json();
    
    // Validate response structure
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude API');
    }
    
    return data.content[0].text;
  } catch (error: unknown) {
    // Handle specific AbortError for timeouts
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Claude API request timed out after 50 seconds');
      throw new Error('Request to generate code timed out. Please try again.');
    }
    
    console.error('Error generating code:', error);
    throw error;
  }
}

function createPrompt(sectionType: string, requirements: string, imageDescriptions: string): string {
  return `You are ShopifyExpert, a specialized AI expert in creating flawless Shopify Liquid code. I need you to generate complete code for a ${sectionType} section in Shopify.

REFERENCE IMAGES:
${imageDescriptions || 'No reference images provided.'}

SECTION REQUIREMENTS:
${requirements}

Please create a complete, production-ready Shopify section that implements all these requirements. Include HTML, CSS, and JSON schema. Follow these specifications:

1. Use unique class names with the pattern "section-${sectionType.toLowerCase().replace(/\s+/g, '-')}-[element]" to avoid CSS conflicts
2. Make all text content placeholder (Lorem Ipsum)
3. Include these standard settings in schema: background_color, padding_top, padding_bottom
4. Make the section fully responsive for mobile, tablet and desktop
5. Add appropriate comments explaining the code
6. Follow modern Shopify best practices
7. Use the latest Liquid syntax and features
8. Ensure the code is clean, well-structured, and easy to read
9. Include error handling and fallback mechanisms where necessary
10. Use best practices for performance optimization
11. Ensure accessibility standards are met
12. Use semantic HTML elements where appropriate
13. For images and video use always default shopfy placeholder
14. Fully Dynamic , Customizable and Responsive

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

<style>
/* CSS code for the section */
</style>

{% schema %}
{
  // JSON schema for the section
}
{% endschema %}`;
}
