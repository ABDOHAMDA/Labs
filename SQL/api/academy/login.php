<?php
require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$user_name = isset($input['user_name']) ? trim((string) $input['user_name']) : '';
$password  = isset($input['password']) ? (string) $input['password'] : '';

$out = ['success' => false, 'message' => '', 'user' => null, 'token' => null];

if ($user_name === '' || $password === '') {
    $out['message'] = 'Username and password required';
    echo json_encode($out);
    exit;
}

// Login secured: prepared statements only (no SQLi here)
$stmt = $conn->prepare("SELECT user_id, user_name, role, email FROM academy_users WHERE (user_name = ? OR email = ?) AND password = ? LIMIT 1");
if (!$stmt) {
    $out['message'] = 'Server error';
    echo json_encode($out);
    exit;
}
$stmt->bind_param("sss", $user_name, $user_name, $password);
$stmt->execute();
$stmt->bind_result($uid, $uname, $role, $email);
$found = $stmt->fetch();
$stmt->close();

if ($found) {
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + 3600);
    $stmt2 = $conn->prepare("INSERT INTO academy_sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)");
    if ($stmt2) {
        $stmt2->bind_param("siss", $token, $uid, $role, $expires);
        $stmt2->execute();
        $stmt2->close();
    }
    $out['success'] = true;
    $out['message'] = 'Login successful';
    $out['user'] = [
        'user_id'   => (int) $uid,
        'user_name' => $uname,
        'role'      => $role,
        'email'     => $email,
    ];
    $out['token'] = $token;
} else {
    $out['message'] = 'Invalid username or password';
}

echo json_encode($out);
