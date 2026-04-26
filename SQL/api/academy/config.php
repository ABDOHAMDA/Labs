<?php
error_reporting(0);
ini_set('display_errors', '0');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header("Content-Type: application/json");
// Avoid empty cached bodies (304) in the browser for dynamic JSON / SQLi long URLs
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

require_once __DIR__ . '/../../../lib/pdo_mysqli_shim.php';

$host = "db";
$user = "lab_user";
$pass = "lab_pass";
$db   = "security_lab_db";

$dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit;
}
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
$conn = new PdoMysqliShim($pdo);

$conn->set_charset("utf8mb4");

/**
 * Labs use a shared Docker volume: db-init/*.sql runs only on first DB create.
 * If the volume predates the lab_target seed row, the admin list would be empty.
 * INSERT IGNORE keeps idempotency (unique user_name).
 */
if (!function_exists('academy_ensure_lab_target_user')) {
    function academy_ensure_lab_target_user(PdoMysqliShim $conn)
    {
        $conn->query(
            "INSERT IGNORE INTO academy_users (user_name, password, role, email) " .
            "VALUES ('lab_target', 'RemoveMe!99', 'user', 'lab_target@academy.demo')"
        );
    }
}
