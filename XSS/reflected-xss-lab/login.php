<?php
ob_start();
session_start();

$valid_user = 'guest';
$valid_pass = 'guest123';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $user = trim($_POST['username'] ?? '');
  $pass = $_POST['password'] ?? '';
  if ($user === $valid_user && $pass === $valid_pass) {
    $_SESSION['blog_user'] = $user;
    $g = static function (string $k) {
      return $_POST[$k] ?? $_GET[$k] ?? null;
    };
    $params = [];
    if (!empty($g('labId'))) $params['labId'] = $g('labId');
    if (!empty($g('token'))) $params['token'] = $g('token');
    if (!empty($g('device_bind'))) $params['device_bind'] = $g('device_bind');
    if (!empty($g('mac_address'))) $params['mac_address'] = $g('mac_address');
    if (!empty($g('client_local_ip'))) $params['client_local_ip'] = $g('client_local_ip');
    header('Location: index.php' . ($params ? '?' . http_build_query($params) : ''));
    exit;
  }
  $error = 'Invalid username or password.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - Reflected XSS Lab</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container login-page">
    <header>
      <h1>Welcome to the Blog</h1>
      <p class="tagline">Sign in to continue</p>
    </header>
    <form method="POST" class="login-form">
      <?php if (!empty($_GET['labId'])): ?><input type="hidden" name="labId" value="<?php echo htmlspecialchars((string) $_GET['labId'], ENT_QUOTES, 'UTF-8'); ?>"><?php endif; ?>
      <?php if (!empty($_GET['token'])): ?><input type="hidden" name="token" value="<?php echo htmlspecialchars((string) $_GET['token'], ENT_QUOTES, 'UTF-8'); ?>"><?php endif; ?>
      <?php if (!empty($_GET['device_bind'])): ?><input type="hidden" name="device_bind" value="<?php echo htmlspecialchars((string) $_GET['device_bind'], ENT_QUOTES, 'UTF-8'); ?>"><?php endif; ?>
      <?php if (!empty($_GET['mac_address'])): ?><input type="hidden" name="mac_address" value="<?php echo htmlspecialchars((string) $_GET['mac_address'], ENT_QUOTES, 'UTF-8'); ?>"><?php endif; ?>
      <?php if (!empty($_GET['client_local_ip'])): ?><input type="hidden" name="client_local_ip" value="<?php echo htmlspecialchars((string) $_GET['client_local_ip'], ENT_QUOTES, 'UTF-8'); ?>"><?php endif; ?>
      <div class="form-group">
        <label>Username</label>
        <input type="text" name="username" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required />
      </div>
      <button type="submit" class="btn-primary">Login</button>
    </form>
    <?php if ($error): ?><div class="error-msg"><?php echo htmlspecialchars($error); ?></div><?php endif; ?>
    <p class="login-hint">Hint: guest / guest123</p>
  </div>
</body>
</html>
