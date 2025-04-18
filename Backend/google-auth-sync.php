<?php
// Backend/google-auth-sync.php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

// Get JSON data
$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($data['email']) || !isset($data['name']) || !isset($data['google_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
$name = htmlspecialchars($data['name']);
$google_id = $data['google_id'];
$image = isset($data['image']) ? $data['image'] : null;

try {
    // Check if user exists
    $stmt = $pdo->prepare('SELECT user_id, email, name, profile_image FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // Create new user
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('INSERT INTO users (email, name, is_google_user, google_id, profile_image) VALUES (?, ?, 1, ?, ?)');
        $stmt->execute([$email, $name, $google_id, $image]);
        
        $user_id = $pdo->lastInsertId();
        
        // Create free plan for user
        $stmt = $pdo->prepare('INSERT INTO user_plans (user_id, plan_type, credits_remaining, max_credits) VALUES (?, ?, ?, ?)');
        $stmt->execute([$user_id, 'free', 3, 3]);
        
        $pdo->commit();
        
        $user = [
            'user_id' => $user_id,
            'email' => $email,
            'name' => $name,
            'profile_image' => $image
        ];
    } else {
        // Update existing user's Google info
        $stmt = $pdo->prepare('UPDATE users SET is_google_user = 1, google_id = ?, profile_image = ?, last_login = NOW() WHERE user_id = ?');
        $stmt->execute([$google_id, $image, $user['user_id']]);
        
        // Update the user object with the new image
        $user['profile_image'] = $image;
    }
    
    // Get user plan
    $stmt = $pdo->prepare('SELECT plan_type, credits_remaining, max_credits FROM user_plans WHERE user_id = ?');
    $stmt->execute([$user['user_id']]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$plan) {
        // Create default plan if not exists
        $stmt = $pdo->prepare('INSERT INTO user_plans (user_id, plan_type, credits_remaining, max_credits) VALUES (?, ?, ?, ?)');
        $stmt->execute([$user['user_id'], 'free', 3, 3]);
        $plan = [
            'plan_type' => 'free',
            'credits_remaining' => 3,
            'max_credits' => 3
        ];
    }
    
    // Return user data
    echo json_encode([
        'status' => 'success',
        'user' => [
            'id' => $user['user_id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'image' => $user['profile_image']
        ],
        'credits_remaining' => (int)$plan['credits_remaining'],
        'max_credits' => (int)$plan['max_credits']
    ]);
    
} catch (PDOException $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
