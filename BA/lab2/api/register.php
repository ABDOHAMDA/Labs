<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';
$email = trim($input['email'] ?? '');

$response = ['success' => false, 'message' => '', 'user' => null];

if ($username === '' || $password === '') {
    $response['message'] = 'Username and password required';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();
if ($res && $res->num_rows > 0) {
    $response['message'] = 'Username already exists';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 'user')");
$stmt->bind_param("sss", $username, $password, $email);
if ($stmt->execute()) {
    $uid = (int) $conn->insert_id;
    $conn->query("INSERT INTO profiles (user_id) VALUES ($uid)");
    $response['success'] = true;
    $response['message'] = 'Registered successfully';
    $response['user'] = [
        'id' => $uid,
        'username' => $username,
        'email' => $email,
        'role' => 'user'
    ];
} else {
    $response['message'] = 'Registration failed';
}

echo json_encode($response);
?>
