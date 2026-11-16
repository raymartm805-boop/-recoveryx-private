(() => {
  const form = document.getElementById('gmailHackedForm');
  const email = document.getElementById('gmailHackedEmail');
  const status = document.getElementById('gmailHackedStatus');
  const details = document.getElementById('gmailHackedDetails');
  if (!form || !email || !status || !details) return;
  status.textContent = 'READY TO RECOVER';
  details.textContent = 'Your recovery steps will be handled securely by Google.';
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const address = email.value.trim();
    if (!/^[^\s@]+@gmail\.com$/i.test(address)) {
      status.textContent = 'CHECK GMAIL ADDRESS';
      details.textContent = 'Enter a valid Gmail address ending in @gmail.com.';
      return;
    }
    status.textContent = 'OPENING GOOGLE RECOVERY';
    details.textContent = 'Follow the instructions on Google’s official recovery page.';
    const url = new URL('https://accounts.google.com/signin/recovery');
    url.searchParams.set('email', address);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  });
})();