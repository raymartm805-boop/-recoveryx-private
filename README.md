
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#080b10">
  <title>RecoveryX Private</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <header class="topbar">
    <h2>RECOVERY<span>X</span></h2>
    <div class="system-status">
      <span class="status-dot"></span>
      SYSTEM ONLINE
    </div>
  </header>

  <main class="container">

    <section class="welcome">
      <p class="subtitle">PRIVATE CONTROL CENTER</p>
      <h1>Account Recovery Dashboard</h1>
      <p>Manage and monitor account recovery requests.</p>
    </section>

    <section class="card">
      <h2>Profile Detection</h2>
      <p>Enter a social media profile URL.</p>

      <form id="detectionForm">
        <label for="profileUrl">Profile URL</label>
        <input
          type="url"
          id="profileUrl"
          placeholder="https://www.facebook.com/username"
          required
        >
        <button type="submit">DETECT PROFILE</button>
      </form>

      <div id="profileResult" class="result" hidden>
        <h3>Detected Information</h3>
        <p>Platform: <span id="platform">-</span></p>
        <p>Username: <span id="username">-</span></p>
        <p>Profile ID: <span id="profileId">-</span></p>
        <p>Lookup status: <span id="lookupStatus">-</span></p>
      </div>
    </section>

    <section class="card">
      <h2>Recovery Request</h2>

      <form id="recoveryForm">
        <label for="accountName">Account Username</label>
        <input id="accountName" required placeholder="Enter username">

        <label for="accountPlatform">Platform</label>
        <select id="accountPlatform">
          <option value="Facebook">Facebook</option>
          <option value="Instagram">Instagram</option>
          <option value="TikTok">TikTok</option>
          <option value="X">X (Twitter)</option>
          <option value="Other">Other</option>
        </select>

        <label for="issue">Account Issue</label>
        <select id="issue">
          <option>Disabled Account</option>
          <option>Locked Account</option>
          <option>Suspended Account</option>
          <option>Restricted Account</option>
          <option>Other</option>
        </select>

        <label for="contactEmail">Contact Email</label>
        <input id="contactEmail" type="email" required>

        <button type="submit">CREATE RECOVERY REQUEST</button>
      </form>
    </section>

    <section class="card">
      <h2>Processing Monitor</h2>
      <div class="progress-info">
        <span id="progressStage">Waiting for request</span>
        <span id="progressPercent">0%</span>
      </div>

      <div class="progress-track">
        <div id="progressBar"></div>
      </div>

      <p id="processMessage">
        No active recovery request.
      </p>
    </section>

    <section class="card">
      <h2>Activity History</h2>
      <div id="activityLog">
        <p>No activity recorded.</p>
      </div>
    </section>

  </main>

  <footer>
    RECOVERYX PRIVATE © 2026
  </footer>

  <script src="app.js"></script>
</body>
</html>

