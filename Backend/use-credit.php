<?php
// Backend/use-credit.php
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
    // Use a transaction to prevent race conditions
    $pdo->beginTransaction();
    
    // Get current credits with a lock
    $stmt = $pdo->prepare('SELECT credits_remaining, max_credits FROM user_plans WHERE user_id = ? FOR UPDATE');
    $stmt->execute([$user_id]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$plan) {
        // Create default plan if not exists
        $stmt = $pdo->prepare('INSERT INTO user_plans (user_id, plan_type, credits_remaining, max_credits) VALUES (?, ?, ?, ?)');
        $stmt->execute([$user_id, 'free', 3, 3]);
        $plan = ['credits_remaining' => 3, 'max_credits' => 3];
    }
    
    if ((int)$plan['credits_remaining'] <= 0) {
        $pdo->rollBack();
        http_response_code(402);
        echo json_encode(['status' => 'error', 'message' => 'No credits remaining']);
        exit;
    }
    
    // Deduct one credit
    $stmt = $pdo->prepare('UPDATE user_plans SET credits_remaining = credits_remaining - 1 WHERE user_id = ?');
    $stmt->execute([$user_id]);
    
    // Get updated credits
    $stmt = $pdo->prepare('SELECT credits_remaining, max_credits FROM user_plans WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $updatedPlan = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Log the credit usage
    $stmt = $pdo->prepare('INSERT INTO credit_usage_log (user_id, credits_before, credits_after, timestamp) VALUES (?, ?, ?, NOW())');
    $stmt->execute([$user_id, $plan['credits_remaining'], $updatedPlan['credits_remaining']]);
    
    // Commit the transaction
    $pdo->commit();
    
    // Return updated credits
    echo json_encode([
        'status' => 'success',
        'message' => 'Credit used successfully',
        'credits_remaining' => (int)$updatedPlan['credits_remaining'],
        'max_credits' => (int)$updatedPlan['max_credits']
    ]);
    
} catch (PDOException $e) {
    // Rollback the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
