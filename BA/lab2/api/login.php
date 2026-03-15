<?php
error_reporting(0);
ini_set('display_errors', '0');
ob_start();

require_once 'config.php';

$raw = file_get_contents('php://input');
$input = is_string($raw) ? json_decode($raw, true) : null;
$input = $input ?? [];

$username = trim($input['username'] ?? '');
$password = (string) ($input['password'] ?? '');
$email = trim($input['email'] ?? '');

$response = ['success' => false, 'message' => '', 'user' => null];

if ($username === '' || $password === '') {
    $response['message'] = 'Username and password required';
    ob_clean();
    echo json_encode($response);
    exit;
}

// Default user: ensure it exists so login always works (user / password / user@gmail.com)
if ($username === 'user' && $password === 'password') {
    $check = $conn->query("SELECT id FROM users WHERE username = 'user' LIMIT 1");
    if ($check && $check->num_rows === 0) {
        $emailVal = $email !== '' ? $email : 'user@gmail.com';
        $ins = $conn->prepare("INSERT INTO users (username, password, email, role) VALUES ('user', 'password', ?, 'user')");
        $ins->bind_param("s", $emailVal);
        $ins->execute();
        $uid = (int) $conn->insert_id;
        if ($uid > 0) {
            $conn->query("INSERT IGNORE INTO profiles (user_id, flag) VALUES ($uid, NULL)");
        }
    }
}

$stmt = $conn->prepare("SELECT id, username, email, role FROM users WHERE username = ? AND password = ?");
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $response['success'] = true;
    $response['message'] = 'Login successful';
    $response['user'] = [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'email' => $user['email'] ?? '',
        'role' => $user['role']
    ];
} else {
    $response['message'] = 'Invalid username or password';
}

ob_clean();
echo json_encode($response);
