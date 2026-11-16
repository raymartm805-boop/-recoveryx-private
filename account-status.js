(() => {
  "use strict";
  const badge = document.getElementById("accountStatusBadge");
  const markButton = document.getElementById("markAccountHacked");
  const resolveButton = document.getElementById("markAccountResolved");
  if (!badge || !markButton || !resolveButton) return;
  const KEY = "bypassing_tools_account_compromised_v1";
  function render() {
    const compromised = localStorage.getItem(KEY) === "yes";
    badge.textContent = compromised ? "HACKED" : "NO ISSUE REPORTED";
    badge.classList.toggle("is-hacked", compromised);
    markButton.hidden = compromised;
    resolveButton.hidden = !compromised;
  }
  markButton.addEventListener("click", () => {
    if (!confirm("Confirm that this is your own account and you believe it has been compromised. This records your report in this browser; it does not access or scan the account.")) return;
    localStorage.setItem(KEY, "yes");
    render();
  });
  resolveButton.addEventListener("click", () => {
    if (!confirm("Have you secured your account and confirmed that the issue is resolved?")) return;
    localStorage.removeItem(KEY);
    render();
  });
  render();
})();