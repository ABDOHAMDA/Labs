<?php
ob_start();
session_start();

$labId = $_GET['labId'] ?? $_GET['lab_id'] ?? '';
$token = $_GET['token'] ?? '';
$deviceBind = $_GET['device_bind'] ?? '';
$macAddress = $_GET['mac_address'] ?? '';
$clientLocalIp = $_GET['client_local_ip'] ?? '';

if (empty($_SESSION['blog_user'])) {
  $redirect = 'login.php';
  if ($labId || $token) {
    $redirect .= '?' . http_build_query(array_filter(['labId' => $labId, 'token' => $token]));
  }
  header('Location: ' . $redirect);
  exit;
}

$username = $_SESSION['blog_user'];
$q = isset($_GET['q']) ? trim($_GET['q']) : '';

$posts = [
  ['title' => 'Understanding Cross-Site Scripting', 'author' => 'Security Team', 'body' => 'XSS occurs when untrusted data is rendered into the page without proper encoding.', 'tags' => ['xss','security','web']],
  ['title' => 'Reflected vs Stored XSS', 'author' => 'Security Team', 'body' => 'Reflected XSS is immediate in the response. Stored XSS persists and affects other users.', 'tags' => ['xss','security']],
  ['title' => 'Input Validation Basics', 'author' => 'DevOps', 'body' => 'Validate input server-side and encode output by context to reduce XSS risk.', 'tags' => ['validation','web']],
  ['title' => 'Content Security Policy', 'author' => 'Blue Team', 'body' => 'CSP helps mitigate script injection but should complement secure coding.', 'tags' => ['csp','security']],
  ['title' => 'Secure JavaScript Patterns', 'author' => 'Web Team', 'body' => 'Avoid unsafe sinks like innerHTML and document.write with untrusted data.', 'tags' => ['javascript','web']],
  ['title' => 'Lab Notes', 'author' => 'Trainer', 'body' => 'Use this page to practice reflected XSS in a controlled environment.', 'tags' => ['lab','training']],
];

$filtered = [];
if ($q !== '') {
  foreach ($posts as $p) {
    if (
      stripos($p['title'], $q) !== false ||
      stripos($p['body'], $q) !== false ||
      stripos(implode(' ', $p['tags']), $q) !== false
    ) {
      $filtered[] = $p;
    }
  }
} else {
  $filtered = $posts;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reflected XSS Blog Lab</title>
  <link rel="stylesheet" href="style.css" />
  <script>
    const originalAlert = window.alert;
    window.alert = function(){
      const qs = location.search || '';
      fetch('/solved.php' + qs, { method: 'POST' }).then(function(r){
        if (r.ok) location.href = '/solved.php' + qs;
      });
      originalAlert.apply(window, arguments);
    };
  </script>
</head>
<body>
  <div class="container">
    <div class="blog-header">
      <div>
        <h1>Reflected XSS Blog</h1>
        <p class="tagline">Logged in as <?php echo htmlspecialchars($username); ?></p>
      </div>
      <a class="logout-btn" href="logout.php<?php echo ($labId || $token) ? '?' . http_build_query(array_filter(['labId'=>$labId,'token'=>$token,'device_bind'=>$deviceBind,'mac_address'=>$macAddress,'client_local_ip'=>$clientLocalIp])) : ''; ?>">Logout</a>
    </div>

    <form method="GET" class="search-form">
      <?php if ($labId): ?><input type="hidden" name="labId" value="<?php echo htmlspecialchars($labId); ?>"><?php endif; ?>
      <?php if ($token): ?><input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>"><?php endif; ?>
      <?php if ($deviceBind): ?><input type="hidden" name="device_bind" value="<?php echo htmlspecialchars($deviceBind); ?>"><?php endif; ?>
      <?php if ($macAddress): ?><input type="hidden" name="mac_address" value="<?php echo htmlspecialchars($macAddress); ?>"><?php endif; ?>
      <?php if ($clientLocalIp): ?><input type="hidden" name="client_local_ip" value="<?php echo htmlspecialchars($clientLocalIp); ?>"><?php endif; ?>
      <input type="text" name="q" placeholder="Search posts..." value="<?php echo $q !== '' ? htmlspecialchars($q) : ''; ?>" />
      <button type="submit">Search</button>
    </form>

    <section class="results">
      <?php if ($q !== ''): ?>
        <h2>Results for "<?php echo $q; ?>"</h2>
      <?php else: ?>
        <h2>All Posts</h2>
      <?php endif; ?>

      <?php if (empty($filtered)): ?>
        <p class="no-results">No posts found.</p>
      <?php else: ?>
        <?php foreach ($filtered as $post): ?>
          <article class="blog-item">
            <h3><?php echo htmlspecialchars($post['title']); ?></h3>
            <p class="meta">By <?php echo htmlspecialchars($post['author']); ?></p>
            <p class="excerpt"><?php echo htmlspecialchars($post['body']); ?></p>
            <p class="tags"><?php foreach ($post['tags'] as $t): ?><span class="tag">#<?php echo htmlspecialchars($t); ?></span><?php endforeach; ?></p>
          </article>
        <?php endforeach; ?>
      <?php endif; ?>
    </section>
  </div>
</body>
</html>
