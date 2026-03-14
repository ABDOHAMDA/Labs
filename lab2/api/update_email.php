<?php
error_reporting(0);
ini_set('display_errors', '0');
ob_start();

/**
 * VULNERABLE: IDOR - trusts userid from request, no check that requester owns this account.
 */
require_once 'config.php';

$raw = file_get_contents('php://input');
$input = is_string($raw) ? json_decode($raw, true) : null;
$input = is_array($input) ? $input : [];

$userid = isset($input['userid']) ? (int) $input['userid'] : 0;
$email = trim((string) ($input['email'] ?? ''));

$response = ['success' => false, 'message' => '', 'userid' => $userid, 'email' => $email];

if ($userid < 1) {
    $response['message'] = 'Invalid user id';
    ob_clean();
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE users SET email = ? WHERE id = ?");
$stmt->bind_param("si", $email, $userid);
if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Email updated';
    $response['email'] = $email;
} else {
    $response['message'] = 'Update failed';
}

ob_clean();
echo json_encode($response);
