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

$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// Support both security_lab_1 (db-init) and security_lab_db (legacy seed-access-control)
if (!$conn->select_db('security_lab_1') && !$conn->select_db('security_lab_db')) {
    http_response_code(500);
    echo json_encode(["error" => "Database not found. Run: docker-compose -f docker-compose.access-control.yml down -v && docker-compose -f docker-compose.access-control.yml up -d"]);
    exit;
}
?>
