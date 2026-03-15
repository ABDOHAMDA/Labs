<?php
error_reporting(0);
ini_set('display_errors', '0');
ob_start();
require_once 'config.php';

$response = ['success' => false, 'users' => []];

$result = $conn->query("SELECT id, username, email, role FROM users ORDER BY id");

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $response['users'][] = [
            'id' => (int) $row['id'],
            'username' => $row['username'],
            'email' => $row['email'] ?? '',
            'role' => $row['role']
        ];
    }
    $response['success'] = true;
}

ob_clean();
echo json_encode($response);
