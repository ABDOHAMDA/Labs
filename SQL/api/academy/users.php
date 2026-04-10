<?php
require_once __DIR__ . '/config.php';

$token = null;
// POST JSON { "token": "..." } — most reliable cross-origin (Apache often omits Authorization)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = json_decode(file_get_contents('php://input'), true) ?? [];
    if (!empty($raw['token'])) {
        $token = trim((string) $raw['token']);
    }
}
if ($token === null && !empty($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(.+)/', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
    $token = trim($m[1]);
}
if ($token === null && !empty($_GET['token'])) {
    $token = trim((string) $_GET['token']);
}

$out = ['success' => false, 'message' => '', 'users' => []];

if ($token === '') {
    $out['message'] = 'Unauthorized';
    echo json_encode($out);
    exit;
}

$token_esc = $conn->real_escape_string($token);
$row = $conn->query("SELECT user_id, role FROM academy_sessions WHERE token = '$token_esc' AND expires_at > NOW() LIMIT 1");
if (!$row || $row->num_rows === 0) {
    $out['message'] = 'Invalid or expired session';
    echo json_encode($out);
    exit;
}

$session = $row->fetch_assoc();
if ($session['role'] !== 'admin') {
    $out['message'] = 'Admin only';
    echo json_encode($out);
    exit;
}

academy_ensure_lab_target_user($conn);

// Admin panel: only the lab victim account (one row to delete)
$res = $conn->query("SELECT user_id, user_name, email, role FROM academy_users WHERE user_name = 'lab_target' LIMIT 1");
$users = [];
if ($res === false) {
    $out['message'] = 'Database error';
    echo json_encode($out);
    exit;
}
while ($r = $res->fetch_assoc()) {
    $users[] = [
        'user_id'   => (int) $r['user_id'],
        'user_name' => $r['user_name'],
        'email'     => $r['email'],
        'role'      => $r['role'],
    ];
}

$out['success'] = true;
$out['users'] = $users;
echo json_encode($out);
