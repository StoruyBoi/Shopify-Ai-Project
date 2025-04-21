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
