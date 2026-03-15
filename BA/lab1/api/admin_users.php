<?php
/**
 * VULNERABLE: Unprotected Admin Panel
 */
require_once 'config.php';

$response = ['success' => false, 'users' => []];

$result = $conn->query("SELECT id, username, role FROM users");

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $response['users'][] = $row;
    }
    $response['success'] = true;
}

echo json_encode($response);
?>
