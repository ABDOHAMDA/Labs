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

require_once __DIR__ . '/../../../lib/pdo_mysqli_shim.php';

$host = getenv("MYSQL_HOST");
if (!is_string($host) || $host === "") {
    // Inside Docker API container this file exists; on local PHP use 127.0.0.1 (publish MySQL port).
    $host = file_exists("/.dockerenv") ? "db" : "127.0.0.1";
}
$user = "lab_user";
$pass = "lab_pass";
$db   = "security_lab_2";

$dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed. If the API runs in Docker, start the stack; if PHP runs on your machine, use MYSQL_HOST=127.0.0.1 and expose MySQL port 3306.",
        "user" => null,
        "detail" => $e->getMessage(),
    ]);
    exit;
}
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
$conn = new PdoMysqliShim($pdo);
