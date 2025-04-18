<?php
// Database configuration
$db_host = 'srv1826.hstgr.io'; // Your Hostinger MySQL hostname
$db_name = 'u169124818_shopifyai';
$db_user = 'u169124818_shopifyai';
$db_pass = 'Xebrand@123';

// Connect to database
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed']));
}

// JWT Secret for token generation
define('JWT_SECRET', 'shopify-wizard-secret-key-2024');

// Claude API key - replace with your actual API key
define('CLAUDE_API_KEY', 'your-actual-claude-api-key-here');

// Google OAuth configuration
define('GOOGLE_CLIENT_ID', '802248433819-m0c01tgegms2rhu61idvp2rcug28kkko.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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');
define('GOOGLE_REDIRECT_URI', 'http://localhost:3000/api/auth/callback/google');

// CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Helper function to get authenticated user from JWT token
function getAuthUser() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return null;
    }
    
    $auth = $headers['Authorization'];
    if (strpos($auth, 'Bearer ') !== 0) {
        return null;
    }
    
    $token = substr($auth, 7);
    return verifyJWT($token);
}
?>
