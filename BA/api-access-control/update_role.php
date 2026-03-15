<?php
/**
 * VULNERABLE: No access control — any user can set any user's role (including promoting themselves to admin).
 */
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$role = $input['role'] ?? '';

$response = ['success' => false, 'message' => ''];

if ($username === '' || $role === '') {
    $response['message'] = 'username and role required';
    echo json_encode($response);
    exit;
}

$allowed_roles = ['user', 'admin'];
if (!in_array($role, $allowed_roles)) {
    $response['message'] = 'Invalid role';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE users SET role = ? WHERE username = ?");
$stmt->bind_param("ss", $role, $username);
$stmt->execute();

if ($conn->affected_rows > 0) {
    $response['success'] = true;
    $response['message'] = 'Role updated';
} else {
    $response['message'] = 'User not found or no change';
}

echo json_encode($response);
?>
