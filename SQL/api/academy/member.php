<?php
/**
 * Public profile lookup by id (GET). Returns JSON only.
 * The id parameter is concatenated into SQL — intended lab surface: UNION-based injection only.
 *
 * Connection uses PDO with libmysql-style error handling (no exceptions on query failure) so the UI always gets JSON.
 */
require_once __DIR__ . '/config.php';

// Do NOT use trim(): trailing space after "-- " is required for MySQL line comments; trim() broke UNION payloads.
$id = isset($_GET['id']) ? ltrim((string) $_GET['id']) : '';

// MySQL treats `--` as a comment only if followed by whitespace. Many URLs end with `--` without `%20`,
// producing `...--'` which errors near `--''`. If id ends with `--` but not `-- `, append a space.
if ($id !== '' && preg_match('/--$/', $id)) {
    $id .= ' ';
}

$out = ['success' => false, 'message' => '', 'member' => null, 'rows' => []];

$jsonFlags = JSON_UNESCAPED_UNICODE;
if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
    $jsonFlags |= JSON_INVALID_UTF8_SUBSTITUTE;
}

function academy_member_send_json(array $data, int $flags): void
{
    $encoded = json_encode($data, $flags);
    if ($encoded === false) {
        $encoded = '{"success":false,"message":"JSON encode failed","member":null,"rows":[]}';
    }
    echo $encoded;
}

try {
    if ($id === '') {
        $out['message'] = 'Missing id parameter';
        academy_member_send_json($out, $jsonFlags);
        exit;
    }

    // Four columns (UNION payloads must match this order): user_name, password, role, email
    $sql = "SELECT user_name, password, role, email FROM academy_users WHERE user_id = '" . $id . "'";

    try {
        $result = $conn->query($sql);
    } catch (Throwable $qe) {
        $out['message'] = 'Query error: ' . $qe->getMessage();
        academy_member_send_json($out, $jsonFlags);
        exit;
    }

    if ($result === false) {
        $out['message'] = 'Query failed: ' . $conn->error;
        academy_member_send_json($out, $jsonFlags);
        exit;
    }

    $rows = [];
    $maxRows = 5000;
    $n = 0;
    if (is_object($result) && method_exists($result, 'fetch_assoc')) {
        while ($n < $maxRows && ($row = $result->fetch_assoc())) {
            $n++;
            // Do not cast user_id to int: UNION/injection puts strings (e.g. table_name) in column 1 — (int)"academy_users" === 0.
            $rows[] = [
                'user_name' => array_key_exists('user_name', $row) ? $row['user_name'] : null,
                'password'  => array_key_exists('password', $row) ? $row['password'] : null,
                'role'      => array_key_exists('role', $row) ? $row['role'] : null,
                'email'     => array_key_exists('email', $row) ? $row['email'] : null,
            ];
        }
        $result->free();
    }

    if (count($rows) > 0) {
        $out['success'] = true;
        $out['rows'] = $rows;
        $out['member'] = $rows[0];
    } else {
        $out['message'] = 'No rows';
    }

    $encoded = json_encode($out, $jsonFlags);
    if ($encoded === false) {
        $out = [
            'success' => false,
            'message' => 'Could not encode response (invalid characters in row data).',
            'member'  => null,
            'rows'    => [],
        ];
        $encoded = json_encode($out, $jsonFlags) ?: '{"success":false,"message":"encode error"}';
    }
    echo $encoded;
} catch (Throwable $e) {
    http_response_code(500);
    academy_member_send_json([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'member'  => null,
        'rows'    => [],
    ], $jsonFlags);
}
