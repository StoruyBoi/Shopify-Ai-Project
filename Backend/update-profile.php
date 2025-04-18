<?php
// Backend/update-profile.php
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

// Get JSON data
$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($data['name']) || !isset($data['email'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Name and email are required']);
    exit;
}

$name = htmlspecialchars($data['name']);
$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
$user_id = isset($data['user_id']) ? $data['user_id'] : null;
$profile_image = isset($data['profile_image']) ? $data['profile_image'] : null;

// If no user_id provided, try to get from JWT
if (!$user_id) {
    // Get JWT from Authorization header
    $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        $jwt = $matches[1];
        
        // Verify JWT and get user_id
        require_once 'jwt_helper.php';
        try {
            $payload = JWT::decode($jwt, JWT_SECRET, ['HS256']);
            $user_id = $payload->user_id;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
            exit;
        }
    } else {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Authorization token required']);
        exit;
    }
}

try {
    // Start transaction
    $pdo->beginTransaction();
    
    // Check if user exists
    $stmt = $pdo->prepare('SELECT * FROM users WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        exit;
    }
    
    // Check if email is already taken by another user
    if ($email !== $user['email']) {
        $stmt = $pdo->prepare('SELECT user_id FROM users WHERE email = ? AND user_id != ?');
        $stmt->execute([$email, $user_id]);
        if ($stmt->fetch()) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Email is already in use']);
            exit;
        }
    }
    
    // Handle password change if requested
    $password_updated = false;
    if (isset($data['current_password']) && !empty($data['current_password']) && 
        isset($data['new_password']) && !empty($data['new_password'])) {
        
        // Skip password verification for Google users
        if (!$user['is_google_user']) {
            // Verify current password
            if (!password_verify($data['current_password'], $user['password'])) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Current password is incorrect']);
                exit;
            }
        }
        
        // Hash new password
        $new_password_hash = password_hash($data['new_password'], PASSWORD_DEFAULT);
        
        // Update password
        $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE user_id = ?');
        $stmt->execute([$new_password_hash, $user_id]);
        
        $password_updated = true;
    }
    
    // Update user profile
    $stmt = $pdo->prepare('UPDATE users SET name = ?, email = ?, profile_image = ? WHERE user_id = ?');
    $stmt->execute([$name, $email, $profile_image, $user_id]);
    
    // Commit transaction
    $pdo->commit();
    
    // Get updated user data
    $stmt = $pdo->prepare('SELECT user_id, name, email, profile_image, is_google_user FROM users WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $updated_user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile updated successfully' . ($password_updated ? ' with new password' : ''),
        'user' => [
            'id' => $updated_user['user_id'],
            'name' => $updated_user['name'],
            'email' => $updated_user['email'],
            'profile_image' => $updated_user['profile_image'],
            'is_google_user' => (bool)$updated_user['is_google_user']
        ]
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
