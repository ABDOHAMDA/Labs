<?php
/**
 * Fallback: DOM lab now shows in-page modal; this page exists if someone navigates here directly.
 * Sends labId + token to HackMe lab_solved API.
 */
$labId = (int)($_GET['labId'] ?? $_GET['lab_id'] ?? 0);
$token = trim((string)($_GET['token'] ?? ''));

$hackMeApi = 'http://localhost/HackMe/server/api/labs/lab_solved.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lab Solved - DOM XSS</title>
  <style>
    body { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif;
      display: flex; align-items: center; justify-content: center; padding: 24px;
      background: #fafaf9; color: #292524; }
    .box { max-width: 420px; padding: 2rem; text-align: center;
      background: #fff; border-radius: 1rem; border: 1px solid #e7e5e4; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .box h2 { color: #059669; margin-top: 0; }
    .pts { color: #059669; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Lab Solved!</h2>
    <p id="result">Reporting to HackMe...</p>
    <p id="pts" class="pts" style="display:none;"></p>
  </div>
  <script>
    (function() {
      var labId = <?= (int)$labId ?>;
      var token = <?= json_encode($token) ?>;
      var api = <?= json_encode($hackMeApi) ?>;

      if (!labId || !token) {
        document.getElementById('result').textContent = 'Missing labId or token. Open lab from HackMe "Start Lab" to get points.';
        return;
      }

      fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lab_id: labId, labId: labId, token: token })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var el = document.getElementById('result');
        var ptsEl = document.getElementById('pts');
        if (data.success) {
          var pts = (data.data && data.data.points_earned) ? data.data.points_earned : 0;
          el.textContent = data.message === 'LAB_ALREADY_SOLVED'
            ? 'You had already solved this lab.'
            : 'You successfully executed JavaScript via DOM XSS in the search bar.';
          if (pts > 0) {
            ptsEl.textContent = '+' + pts + ' points added to your HackMe account!';
            ptsEl.style.display = 'block';
          } else if (data.message === 'LAB_ALREADY_SOLVED') {
            ptsEl.textContent = 'No additional points.';
            ptsEl.style.display = 'block';
          }
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'HACKME_LAB_SOLVED', labId: labId, lab_id: labId, points: pts }, '*');
          }
        } else {
          el.textContent = 'Error: ' + (data.message || 'Unknown');
        }
      })
      .catch(function(err) {
        document.getElementById('result').textContent = 'Failed to report: ' + err.message + '. Is HackMe running?';
      });
    })();
  </script>
</body>
</html>
