<?php
require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$token = null;
if (!empty($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(.+)/', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
    $token = trim($m[1]);
}
if ($token === null && !empty($input['token'])) {
    $token = trim($input['token']);
}

if ($token !== '') {
    $token_esc = $conn->real_escape_string($token);
    $conn->query("DELETE FROM academy_sessions WHERE token = '$token_esc'");
}

echo json_encode(['success' => true, 'message' => 'Logged out']);
