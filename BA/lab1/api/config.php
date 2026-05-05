<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header("Content-Type: application/json");

$host = "db";
$user = "lab_user";
$pass = "lab_pass";

// Try security_lab_1 first, fall back to security_lab_db
$conn = @new mysqli($host, $user, $pass, "security_lab_1");
if ($conn->connect_error) {
    $conn = @new mysqli($host, $user, $pass, "security_lab_db");
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["error" => "Database not found. Run: docker compose down -v && docker compose up -d"]);
        exit;
    }
}
$conn->set_charset("utf8mb4");
