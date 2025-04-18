<?php
// Backend/get-credits.php
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
if (!isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
    exit;
}

$user_id = $data['user_id'];

try {
    // Get user plan
    $stmt = $pdo->prepare('SELECT plan_type, credits_remaining, max_credits FROM user_plans WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$plan) {
        // Create default plan if not exists
        $stmt = $pdo->prepare('INSERT INTO user_plans (user_id, plan_type, credits_remaining, max_credits) VALUES (?, ?, ?, ?)');
        $stmt->execute([$user_id, 'free', 3, 3]);
        
        $plan = [
            'plan_type' => 'free',
            'credits_remaining' => 3,
            'max_credits' => 3
        ];
    }
    
    // Return credits info
    echo json_encode([
        'status' => 'success',
        'plan_type' => $plan['plan_type'],
        'credits_remaining' => (int)$plan['credits_remaining'],
        'max_credits' => (int)$plan['max_credits']
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
