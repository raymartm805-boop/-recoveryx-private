(() => {
  const form = document.getElementById('gmailHackedForm');
  const email = document.getElementById('gmailHackedEmail');
  const status = document.getElementById('gmailHackedStatus');
  const details = document.getElementById('gmailHackedDetails');
  const clear = document.getElementById('gmailHackedResolve');
  if (!form || !email || !status || !details || !clear) return;
  status.textContent = 'READY';
  details.textContent = 'Enter your Gmail address and continue to Google security.';
  clear.hidden = true;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@gmail\.com$/i.test(email.value.trim())) {
      status.textContent = 'INVALID GMAIL ADDRESS';
      details.textContent = 'Enter a valid Gmail address.';
      return;
    }
    status.textContent = 'OPENING GOOGLE SECURITY';
    details.textContent = 'Complete sign-in and security checks directly with Google.';
    window.open('https://myaccount.google.com/security', '_blank', 'noopener,noreferrer');
  });
})();