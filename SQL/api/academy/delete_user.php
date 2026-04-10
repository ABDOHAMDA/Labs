<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$token = null;
if (!empty($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(.+)/', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
    $token = trim($m[1]);
}
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if ($token === null && !empty($input['token'])) {
    $token = trim($input['token']);
}

$out = ['success' => false, 'message' => '', 'deleted' => false];

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

$target_id = isset($input['user_id']) ? (int) $input['user_id'] : 0;
if ($target_id < 1) {
    $out['message'] = 'Invalid user_id';
    echo json_encode($out);
    exit;
}

// Only the designated lab user may be deleted (protects admin accounts)
$stmt = $conn->prepare("DELETE FROM academy_users WHERE user_id = ? AND user_name = 'lab_target'");
$stmt->bind_param('i', $target_id);
$stmt->execute();
$deleted = $stmt->affected_rows > 0;
$stmt->close();

if ($deleted) {
    // Shared DB: immediately re-seed lab_target so the next learner sees the same scenario.
    // Who may earn points is enforced only in HackMe (submissions per HackMe user_id).
    $u = 'lab_target';
    $p = 'RemoveMe!99';
    $r = 'user';
    $e = 'lab_target@academy.demo';
    $ins = $conn->prepare('INSERT INTO academy_users (user_name, password, role, email) VALUES (?, ?, ?, ?)');
    if ($ins) {
        $ins->bind_param('ssss', $u, $p, $r, $e);
        $ins->execute();
        $ins->close();
    }
    $out['success'] = true;
    $out['deleted'] = true;
    $out['message'] = 'User deleted';
} else {
    $out['message'] = 'User not found or already deleted';
}

echo json_encode($out);
