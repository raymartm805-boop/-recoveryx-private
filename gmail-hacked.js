(() => {
  const form = document.getElementById('gmailHackedForm');
  const email = document.getElementById('gmailHackedEmail');
  const status = document.getElementById('gmailHackedStatus');
  const details = document.getElementById('gmailHackedDetails');
  const resolve = document.getElementById('gmailHackedResolve');
  if (!form || !email || !status || !details || !resolve) return;
  const key = 'bypassing_tools_gmail_hacked_report_v1';
  const render = () => {
    const saved = localStorage.getItem(key);
    status.textContent = saved ? 'HACKED — USER REPORT' : 'NO ISSUE REPORTED';
    details.textContent = saved ? 'A possible compromise has been reported for ' + saved + '. This is your report, not a verified security finding.' : 'No Gmail compromise has been reported in this browser.';
    resolve.hidden = !saved;
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const address = email.value.trim();
    if (!/^[^\s@]+@gmail\.com$/i.test(address)) {
      status.textContent = 'ENTER A VALID GMAIL ADDRESS';
      return;
    }
    if (!window.confirm('Confirm this is your own Gmail account and you believe it may be compromised. This only saves your report on this device.')) return;
    localStorage.setItem(key, address);
    render();
  });
  resolve.addEventListener('click', () => {
    if (!window.confirm('Mark your Gmail report as resolved?')) return;
    localStorage.removeItem(key);
    render();
  });
  render();
})();