<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

// VULNERABLE: Direct string concatenation - SQL Injection vulnerability
$query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";

$response = [
    'success' => false,
    'message' => '',
    'user' => null,
    'query' => $query,
    'error' => null
];

try {
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        $response['success'] = true;
        $response['message'] = "Login successful! Welcome, " . $user['username'];
        $response['user'] = [
            'id' => $user['id'],
            'username' => $user['username']
        ];
    } else {
        $response['message'] = "Invalid username or password";
    }
} catch (Exception $e) {
    $response['message'] = "SQL Error detected!";
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
?>
