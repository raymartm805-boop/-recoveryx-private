(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const required = ["unlockReference","unlockBannerPhoto","unlockBannerInitial","unlockBannerName","unlockBannerPlatform","unlockBannerPlatformIcon","unlockBannerStatus","unlockPhotoRemove","unlockPhotoDownload","unlockPhoto","unlockPhotoPreview","unlockPhotoFallback","unlockResult","unlockPlatform","unlockOfficialHelp","unlockAnalyze","unlockAccountName","unlockLiveName","unlockIssue","unlockRunState","unlockLog","unlockWorkspaceButton","unlockAccessPanel"];
  if (required.some(id => !$(id))) {
    console.error("Account diagnostics: required UI element is missing.");
    return;
  }

  const makeReference = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const bytes = new Uint8Array(4);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return "RX-" + date + "-" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  };
  const ref = makeReference();
  $("unlockReference").textContent = ref;

  let photoUrl = "";
  let selectedPhotoName = "";
  let selectedPlatform = "";
  const updateAccountBanner = () => {
    const name = $("unlockAccountName").value.trim();
    const platform = $("unlockPlatform").value;
    $("unlockBannerName").textContent = name || "Account name";
    $("unlockBannerInitial").textContent = (name || "?").slice(0, 1).toUpperCase();
    $("unlockBannerPlatform").textContent = platform || "Select platform";
    $("unlockBannerPlatformIcon").textContent = platform === "Facebook" ? "f" : platform === "Instagram" ? "◎" : platform === "Google / Gmail" ? "G" : platform === "TikTok" ? "♪" : "•";
    $("unlockBannerStatus").textContent = name && platform ? "PROFILE DETAILS PROVIDED" : "PROFILE DETAILS NEEDED";
    $("unlockBannerPhoto").hidden = !photoUrl;
    $("unlockBannerInitial").hidden = Boolean(photoUrl);
    if (photoUrl) $("unlockBannerPhoto").src = photoUrl;
  };
  const routes = {
    "Facebook": "https://www.facebook.com/login/identify",
    "Instagram": "https://www.instagram.com/hacked/",
    "Google / Gmail": "https://accounts.google.com/signin/recovery",
    "TikTok": "https://support.tiktok.com/en/log-in-troubleshoot"
  };
  const setPhotoFallback = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = "";
    selectedPhotoName = "";
    $("unlockPhoto").value = "";
    $("unlockPhotoPreview").removeAttribute("src");
    $("unlockPhotoPreview").hidden = true;
    $("unlockPhotoFallback").hidden = false;
    $("unlockPhotoRemove").hidden = true;
    $("unlockPhotoDownload").hidden = true;
    updateAccountBanner();
  };

  $("unlockAccountName").addEventListener("input", () => {
    const name = $("unlockAccountName").value.trim();
    $("unlockLiveName").textContent = name || "Account name preview";
    $("unlockLiveName").classList.toggle("is-filled", Boolean(name));
    updateAccountBanner();
  });

  $("unlockPhotoRemove").addEventListener("click", setPhotoFallback);
  $("unlockPhotoDownload").addEventListener("click", () => {
    if (!photoUrl) return;
    const link = document.createElement("a");
    link.href = photoUrl;
    link.download = selectedPhotoName || "profile-photo";
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
  $("unlockPhoto").addEventListener("change", event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoFallback();
      $("unlockResult").textContent = "Choose a JPG, PNG, or WEBP image no larger than 5 MB.";
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const nextUrl = URL.createObjectURL(file);
    const preview = $("unlockPhotoPreview");
    preview.onload = () => {
      photoUrl = nextUrl;
      selectedPhotoName = file.name || "profile-photo";
      preview.hidden = false;
      $("unlockPhotoFallback").hidden = true;
      $("unlockPhotoRemove").hidden = false;
      $("unlockPhotoDownload").hidden = false;
      updateAccountBanner();
      $("unlockResult").textContent = "Profile photo added to preview.";
    };
    preview.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      photoUrl = "";
      setPhotoFallback();
      $("unlockResult").textContent = "The selected image could not be opened. Please choose another JPG, PNG, or WEBP file.";
    };
    preview.src = nextUrl;
  });

  $("unlockPlatform").addEventListener("change", event => {
    selectedPlatform = event.target.value;
    updateAccountBanner();
    if (diagnosticComplete) $("unlockOfficialHelp").disabled = !routes[selectedPlatform];
  });
  $("unlockOfficialHelp").addEventListener("click", () => {
    const url = routes[selectedPlatform];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });

  let diagnosticComplete = false;
  $("unlockWorkspaceButton").addEventListener("click", () => {
    if (!diagnosticComplete) return;
    $("unlockAccessPanel").hidden = false;
    $("unlockWorkspaceButton").hidden = true;
    $("unlockOfficialHelp").disabled = !routes[selectedPlatform];
    $("unlockRunState").textContent = "WORKSPACE READY";
    $("unlockResult").textContent = "";
  });

  $("unlockAnalyze").addEventListener("click", () => {
    const name = $("unlockAccountName").value.trim();
    const platform = $("unlockPlatform").value;
    const issue = $("unlockIssue").value.trim();
    const lines = [
      "[START] ACCOUNT NOTICE REVIEW",
      "[PROFILE] " + (name || "Account name not supplied"),
      "[PLATFORM] " + (platform || "Not selected"),
      "[REFERENCE] " + ref,
      "[CHECK] Required details… " + (name && platform && issue ? "COMPLETE" : "MISSING")
    ];
    if (!name || !platform || !issue) {
      lines.push("[ACTION] Complete the missing fields to run the notice review.");
      $("unlockRunState").textContent = "INCOMPLETE";
      $("unlockLog").textContent = lines.join("\n");
      $("unlockResult").textContent = "Add the missing account name, platform, and exact error notice.";
      $("unlockResult").setAttribute("role", "alert");
      return;
    }

    const patterns = [
      [/disabled|suspended|deactivated/i, "The notice appears to describe a disabled or suspended account. Use the provider's appeal or account review process."],
      [/locked|temporarily blocked|too many attempts/i, "The notice appears to describe a temporary lock. Follow the provider's wait and identity-verification instructions."],
      [/checkpoint|confirm your identity|verify your identity/i, "The notice appears to request an identity or security checkpoint. Complete it only in the official app or website."],
      [/password|incorrect|reset/i, "The notice appears related to sign-in credentials. Use the provider's official password-reset flow."],
      [/hacked|compromised|unauthorized/i, "The notice may indicate account compromise. Secure the email account first and use the provider's hacked-account flow."]
    ];
    const match = patterns.find(([regex]) => regex.test(issue));
    lines.push("[RESULT] " + (match ? "NOTICE WORDING MATCHED" : "NO KNOWN NOTICE PATTERN"));
    lines.push("[NEXT] " + (match ? match[1] : "Review the notice using the provider's official help page."));
    $("unlockRunState").textContent = "NOTICE REVIEW COMPLETE";
    $("unlockLog").textContent = lines.join("\n");
    $("unlockResult").textContent = match ? match[1] : "No known issue pattern matched. Review the exact notice with the provider's support guidance.";
    $("unlockResult").setAttribute("role", "status");
    diagnosticComplete = true;
    $("unlockWorkspaceButton").disabled = false;
    $("unlockWorkspaceButton").textContent = "UNLOCK FULL ACCESS";
    updateAccountBanner();
    if (typeof window.toast === "function") window.toast("Notice review complete. Recovery workspace is ready.");
  });

  updateAccountBanner();

  window.addEventListener("beforeunload", () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });
})();