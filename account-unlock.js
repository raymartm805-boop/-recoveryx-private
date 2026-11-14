(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ref = "RX-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + Math.random().toString(36).slice(2,7).toUpperCase();
  $("unlockReference").textContent = ref;
  let photoUrl = "";
  let selectedPlatform = "";
  const routes = {
    "Facebook": "https://www.facebook.com/login/identify",
    "Instagram": "https://www.instagram.com/hacked/",
    "Google / Gmail": "https://accounts.google.com/signin/recovery",
    "TikTok": "https://support.tiktok.com/en/log-in-troubleshoot"
  };
  $("unlockPhotoRemove").addEventListener("click", () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = "";
    $("unlockPhoto").value = "";
    $("unlockPhotoPreview").removeAttribute("src");
    $("unlockPhotoPreview").hidden = true;
    $("unlockPhotoFallback").hidden = false;
    $("unlockPhotoRemove").hidden = true;
  });
  $("unlockPhoto").addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      $("unlockResult").textContent = "Choose an image under 5 MB.";
      e.target.value = "";
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file);
    $("unlockPhotoPreview").src = photoUrl;
    $("unlockPhotoPreview").hidden = false;
    $("unlockPhotoFallback").hidden = true;
    $("unlockPhotoRemove").hidden = false;
  });
  $("unlockPlatform").addEventListener("change", e => {
    selectedPlatform = e.target.value;
    $("unlockOfficialHelp").disabled = !routes[selectedPlatform];
  });
  $("unlockOfficialHelp").addEventListener("click", () => {
    const url = routes[selectedPlatform];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
  $("unlockAnalyze").addEventListener("click", () => {
    const name = $("unlockAccountName").value.trim();
    const platform = $("unlockPlatform").value;
    const issue = $("unlockIssue").value.trim();
    const lines = [];
    const add = (s) => lines.push(s);
    add("[START] Local account diagnostic started");
    add("[PROFILE] " + (name || "Account name not supplied"));
    add("[PLATFORM] " + (platform || "Not selected"));
    add("[REFERENCE] " + ref);
    add("[CHECK] Input completeness… " + (name && platform && issue ? "OK" : "NEEDS DETAILS"));
    if (!name || !platform || !issue) {
      add("[ACTION] Enter account name, platform, and exact notice to continue.");
      $("unlockRunState").textContent = "INCOMPLETE";
      $("unlockLog").textContent = lines.join("\n");
      $("unlockResult").textContent = "Add the missing account details and exact error notice.";
      return;
    }
    const patterns = [
      [/disabled|suspended|deactivated/i, "The notice appears to describe a disabled or suspended account. Use the provider's appeal or account review process."],
      [/locked|temporarily blocked|too many attempts/i, "The notice appears to describe a temporary lock. Follow the provider's wait and identity-verification instructions."],
      [/checkpoint|confirm your identity|verify your identity/i, "The notice appears to request an identity or security checkpoint. Complete it only in the official app or website."],
      [/password|incorrect|reset/i, "The notice appears related to sign-in credentials. Use the provider's official password-reset flow."],
      [/hacked|compromised|unauthorized/i, "The notice may indicate account compromise. Secure the email account first and use the provider's hacked-account flow."]
    ];
    const match = patterns.find(([re]) => re.test(issue));
    add("[CHECK] Restriction wording scan… COMPLETE");
    add("[CHECK] Provider-side account status… NOT ACCESSIBLE");
    add("[CHECK] Security controls… NOT MODIFIED");
    add("[RESULT] " + (match ? "POSSIBLE ISSUE PATTERN FOUND" : "NO KNOWN PATTERN MATCHED"));
    add("[NEXT] " + (match ? match[1] : "Compare the full notice with the provider's official help guidance."));
    add("[SAFE] No bypass code executed; no account data was sent.");
    $("unlockRunState").textContent = "COMPLETE · GUIDANCE ONLY";
    $("unlockLog").textContent = lines.join("\n");
    $("unlockResult").textContent = match ? match[1] : "No known issue pattern matched. Review the exact notice with the provider's support guidance.";
    $("unlockOfficialHelp").disabled = !routes[platform];
    if (typeof window.toast === "function") window.toast("Local diagnostic completed.");
  });
})();