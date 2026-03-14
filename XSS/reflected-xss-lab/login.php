<?php
session_start();

$valid_user = 'guest';
$valid_pass = 'guest123';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $user = trim($_POST['username'] ?? '');
  $pass = $_POST['password'] ?? '';
  if ($user === $valid_user && $pass === $valid_pass) {
    $_SESSION['blog_user'] = $user;
    $params = [];
    if (!empty($_GET['labId'])) $params['labId'] = $_GET['labId'];
    if (!empty($_GET['token'])) $params['token'] = $_GET['token'];
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
