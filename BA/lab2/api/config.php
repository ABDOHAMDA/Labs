<?php
error_reporting(0);
ini_set('display_errors', '0');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

$host = getenv("MYSQL_HOST");
if (!is_string($host) || $host === "") {
    // Inside Docker API container this file exists; on local PHP use 127.0.0.1 (publish MySQL port).
    $host = file_exists("/.dockerenv") ? "db" : "127.0.0.1";
}
$user = "lab_user";
$pass = "lab_pass";
$db   = "security_lab_2";

mysqli_report(MYSQLI_REPORT_OFF);
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_errno) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed. If the API runs in Docker, start the stack; if PHP runs on your machine, use MYSQL_HOST=127.0.0.1 and expose MySQL port 3306.",
        "user" => null,
        "detail" => $conn->connect_error ?: ("errno " . $conn->connect_errno),
    ]);
    exit;
}
