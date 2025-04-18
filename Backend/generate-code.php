<?php
// Backend/generate-code.php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
require_once 'jwt_helper.php';

// Get authenticated user
$user = getAuthUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

// Get JSON data
$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($data['sectionType'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Section type is required']);
    exit;
}

try {
    // Check if user has credits
    $stmt = $pdo->prepare('SELECT credits_remaining, max_credits FROM user_plans WHERE user_id = ?');
    $stmt->execute([$user['user_id']]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$plan) {
        // Create default plan if not exists
        $stmt = $pdo->prepare('INSERT INTO user_plans (user_id, plan_type, credits_remaining, max_credits) VALUES (?, ?, ?, ?)');
        $stmt->execute([$user['user_id'], 'free', 3, 3]);
        $plan = ['credits_remaining' => 3, 'max_credits' => 3];
    }
    
    if ((int)$plan['credits_remaining'] <= 0) {
        http_response_code(402);
        echo json_encode(['status' => 'error', 'message' => 'No credits remaining. Please upgrade your plan.']);
        exit;
    }
    
    // Extract data for code generation
    $sectionType = $data['sectionType'];
    $requirements = isset($data['requirements']) ? $data['requirements'] : '';
    $imageDescription = isset($data['imageDescription']) ? $data['imageDescription'] : '';
    
    // Load Claude API key from environment variable or config file
    $claudeApiKey = getenv('CLAUDE_API_KEY');
    if (!$claudeApiKey) {
        // Try to get from config file
        $claudeApiKey = defined('CLAUDE_API_KEY') ? CLAUDE_API_KEY : null;
    }
    
    if (!$claudeApiKey) {
        throw new Exception("Claude API key not configured");
    }
    
    // Generate code using Claude API
    $code = generateCodeWithClaude($claudeApiKey, $sectionType, $requirements, $imageDescription);
    
    // Deduct one credit
    $stmt = $pdo->prepare('UPDATE user_plans SET credits_remaining = credits_remaining - 1 WHERE user_id = ?');
    $stmt->execute([$user['user_id']]);
    
    // Get updated credits
    $stmt = $pdo->prepare('SELECT credits_remaining, max_credits FROM user_plans WHERE user_id = ?');
    $stmt->execute([$user['user_id']]);
    $updatedPlan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return generated code with updated credits
    echo json_encode([
        'status' => 'success',
        'code' => $code,
        'credits_remaining' => (int)$updatedPlan['credits_remaining'],
        'max_credits' => (int)$updatedPlan['max_credits']
    ]);
    
} catch (Exception $e) {
    error_log("Error in generate-code.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to generate code: ' . $e->getMessage()]);
}

/**
 * Generate code using Claude API
 */
function generateCodeWithClaude($apiKey, $sectionType, $requirements, $imageDescription) {
    // Create prompt for Claude
    $prompt = "You are ShopifyExpert, a specialized AI expert in creating flawless Shopify Liquid code. I need you to generate complete code for a {$sectionType} section in Shopify.

REFERENCE IMAGES:
" . ($imageDescription ?: 'No reference images provided.') . "

SECTION REQUIREMENTS:
{$requirements}

Please create a complete, production-ready Shopify section that implements all these requirements. Include HTML, CSS, and JSON schema. Follow these specifications:

1. Use unique class names with the pattern \"section-" . strtolower($sectionType) . "-[element]\" to avoid CSS conflicts
2. Make all text content placeholder (Lorem Ipsum)
3. Include these standard settings in schema: background_color, padding_top, padding_bottom
4. Make the section fully responsive for mobile, tablet and desktop
5. Add appropriate comments explaining the code
6. Follow modern Shopify best practices

For images, use this structure:
<img src=\"{{ section.settings.image | img_url: 'master'}}\" alt=\"{{ section.settings.image_alt | escape }}\" loading=\"lazy\">

For videos, use this structure:
{% if section.settings.video != blank %}
  <video src=\"{{ section.settings.video.sources[1].url }}\" loop muted playsinline autoplay style=\"width: 100%; display: block;\"></video>
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
{% endschema %}";

    // Call Claude API
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01',
        'content-type: application/json'
    ]);
    
    $requestBody = json_encode([
        'model' => 'claude-3-5-sonnet-20241022',
        'max_tokens' => 4000,
        'messages' => [
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ]
    ]);
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Claude API error: HTTP code $httpCode, response: $response");
    }
    
    $responseData = json_decode($response, true);
    if (!isset($responseData['content']) || !isset($responseData['content'][0]['text'])) {
        throw new Exception("Invalid response from Claude API");
    }
    
    return $responseData['content'][0]['text'];
}
?>
