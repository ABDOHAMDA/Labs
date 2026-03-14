<?php
error_reporting(0);
ini_set('display_errors', '0');
ob_start();
require_once 'config.php';

$userid = isset($_GET['userid']) ? (int) $_GET['userid'] : 0;

$response = ['success' => false, 'user' => null];

if ($userid < 1) {
    ob_clean();
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("SELECT u.id, u.username, u.email, u.role, p.flag FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?");
$stmt->bind_param("i", $userid);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $row = $result->fetch_assoc()) {
    $response['success'] = true;
    $response['user'] = [
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'email' => $row['email'] ?? '',
        'role' => $row['role'],
        'flag' => $row['flag'] ?? null
    ];
}

ob_clean();
echo json_encode($response);
