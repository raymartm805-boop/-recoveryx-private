(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const required = ["unlockReference","unlockPhotoRemove","unlockPhotoDownload","unlockPhoto","unlockPhotoPreview","unlockPhotoFallback","unlockResult","unlockPlatform","unlockOfficialHelp","unlockAnalyze","unlockAccountName","unlockLiveName","unlockIssue","unlockRunState","unlockLog"];
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
  };

  $("unlockAccountName").addEventListener("input", () => {
    const name = $("unlockAccountName").value.trim();
    $("unlockLiveName").textContent = name || "Account name preview";
    $("unlockLiveName").classList.toggle("is-filled", Boolean(name));
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
      $("unlockResult").textContent = "Selected photo: " + selectedPhotoName + ". Preview loaded; it remains on this device unless you choose to save it.";
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
    const lines = [
      "[START] Local account diagnostic started",
      "[PROFILE] " + (name || "Account name not supplied"),
      "[PLATFORM] " + (platform || "Not selected"),
      "[REFERENCE] " + ref,
      "[CHECK] Input completeness… " + (name && platform && issue ? "OK" : "NEEDS DETAILS")
    ];
    if (!name || !platform || !issue) {
      lines.push("[ACTION] Enter account name, platform, and exact notice to continue.");
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
    lines.push("[CHECK] Restriction wording scan… COMPLETE");
    lines.push("[CHECK] Provider-side account status… NOT ACCESSIBLE");
    lines.push("[CHECK] Security controls… NOT MODIFIED");
    lines.push("[RESULT] " + (match ? "POSSIBLE ISSUE PATTERN FOUND" : "NO KNOWN PATTERN MATCHED"));
    lines.push("[NEXT] " + (match ? match[1] : "Compare the full notice with the provider's official help guidance."));
    lines.push("[SAFE] No bypass code executed; no account data was sent.");
    $("unlockRunState").textContent = "COMPLETE · GUIDANCE ONLY";
    $("unlockLog").textContent = lines.join("\n");
    $("unlockResult").textContent = match ? match[1] : "No known issue pattern matched. Review the exact notice with the provider's support guidance.";
    $("unlockResult").setAttribute("role", "status");
    $("unlockOfficialHelp").disabled = !routes[platform];
    if (typeof window.toast === "function") window.toast("Local diagnostic completed.");
  });

  window.addEventListener("beforeunload", () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });
})();