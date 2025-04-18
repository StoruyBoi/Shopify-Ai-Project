<?php
// Backend/upgrade-plan.php
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
if (!isset($data['plan_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Plan ID is required']);
    exit;
}

$plan_id = $data['plan_id'];

// Define available plans
$available_plans = [
    'basic' => ['name' => 'Basic', 'credits' => 100, 'price' => 9.99],
    'pro' => ['name' => 'Pro', 'credits' => 300, 'price' => 19.99],
    'enterprise' => ['name' => 'Enterprise', 'credits' => 1000, 'price' => 49.99]
];

// Check if plan exists
if (!isset($available_plans[$plan_id])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid plan ID']);
    exit;
}

$selected_plan = $available_plans[$plan_id];

try {
    // In a real application, you would process payment here
    
    // Update user plan
    $pdo->beginTransaction();
    
    // Update user_plans table
    $stmt = $pdo->prepare('UPDATE user_plans SET plan_type = ?, credits_remaining = ?, max_credits = ? WHERE user_id = ?');
    $stmt->execute([$plan_id, $selected_plan['credits'], $selected_plan['credits'], $user['user_id']]);
    
    // Add payment record
    $stmt = $pdo->prepare('INSERT INTO payments (user_id, plan_id, amount, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([$user['user_id'], $plan_id, $selected_plan['price'], 'completed']);
    
    $pdo->commit();
    
    // Return success
    echo json_encode([
        'status' => 'success',
        'message' => 'Plan upgraded successfully',
        'plan' => [
            'id' => $plan_id,
            'name' => $selected_plan['name'],
            'credits' => $selected_plan['credits']
        ]
    ]);
    
} catch (PDOException $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to upgrade plan: ' . $e->getMessage()]);
}
?>
