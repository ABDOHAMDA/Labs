<?php
/**
 * One-time: insert default login user (user / password / user@gmail.com) if missing.
 * Call once: http://localhost:3001/lab2/seed_default_user.php
 */
require_once 'config.php';

header("Content-Type: application/json");

$check = $conn->query("SELECT id FROM users WHERE username = 'user' LIMIT 1");
if ($check && $check->num_rows > 0) {
    echo json_encode(["success" => true, "message" => "User 'user' already exists. You can login."]);
    exit;
}

$conn->query("INSERT INTO users (username, password, email, role) VALUES ('user', 'password', 'user@gmail.com', 'user')");
$uid = (int) $conn->insert_id;

if ($uid > 0) {
    $conn->query("INSERT IGNORE INTO profiles (user_id, flag) VALUES ($uid, NULL)");
    echo json_encode(["success" => true, "message" => "Default user added. Login with: user / password / user@gmail.com"]);
} else {
    echo json_encode(["success" => false, "message" => "Insert failed"]);
}
