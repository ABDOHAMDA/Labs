<?php
/**
 * VULNERABLE: Unprotected Admin Panel
 * This endpoint should only be for admins, but there is NO check for user role.
 * Any logged-in (or even unauthenticated) user can access admin data.
 */
require_once 'config.php';

$response = ['success' => false, 'users' => []];

// NO authorization check - anyone can list all users (unprotected admin functionality)
$result = $conn->query("SELECT id, username, role FROM users");

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $response['users'][] = $row;
    }
    $response['success'] = true;
}

echo json_encode($response);
?>
