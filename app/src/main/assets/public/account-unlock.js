(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const required = ["unlockReference","unlockBannerPhoto","unlockBannerInitial","unlockBannerName","unlockBannerPlatform","unlockBannerPlatformIcon","unlockBannerStatus","unlockPhotoRemove","unlockPhotoDownload","unlockPhoto","unlockPhotoPreview","unlockPhotoFallback","unlockResult","unlockPlatform","unlockOfficialHelp","unlockAnalyze","unlockAccountName","unlockLiveName","unlockRunState","unlockLog","unlockWorkspaceButton","unlockAccessPanel"];
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
    $("unlockBannerStatus").textContent = name && platform ? "ACTIVE PROFILE" : "PROFILE DETAILS NEEDED";
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

  const premiumButton = $("premiumReleaseButton");
  if (premiumButton) premiumButton.addEventListener("click", () => {
    window.alert("Premium app access: $18.00 USD. Payment checkout is not configured yet. No payment has been taken, and this purchase cannot change the external account status.");
  });

  let diagnosticComplete = false;
  $("unlockWorkspaceButton").addEventListener("click", () => {
    if (!diagnosticComplete) return;
    $("unlockAccessPanel").hidden = false;
    $("unlockWorkspaceButton").hidden = true;
    $("unlockOfficialHelp").disabled = !routes[selectedPlatform];
    $("unlockRunState").textContent = "WORKSPACE READY";
    $("unlockResult").textContent = "Recovery workspace unlocked. Continue through the official provider recovery page; this app cannot change the provider's account status.";
  });

  $("unlockAnalyze").addEventListener("click", () => {
    const name = $("unlockAccountName").value.trim();
    const platform = $("unlockPlatform").value;
    const lines = [
      "[START] ACCOUNT PROFILE CHECK",
      "[PROFILE] " + (name || "Account name not supplied"),
      "[PLATFORM] " + (platform || "Not selected"),
      "[REFERENCE] " + ref,
      "[CHECK] Profile details… " + (name && platform ? "COMPLETE" : "MISSING")
    ];
    if (!name || !platform) {
      lines.push("[ACTION] Add the account name and select a platform.");
      $("unlockRunState").textContent = "INCOMPLETE";
      $("unlockLog").textContent = lines.join("\n");
      $("unlockResult").textContent = "Add the account name and select a platform to continue.";
      $("unlockResult").setAttribute("role", "alert");
      return;
    }

    lines.push("[RESULT] PROFILE DETAILS COMPLETE");
    lines.push("[NEXT] Continue to the official provider recovery page for account review.");
    $("unlockRunState").textContent = "PROFILE CHECK COMPLETE";
    $("unlockLog").textContent = lines.join("\\n");
    $("unlockResult").textContent = "Profile details checked. You can continue to the provider's official recovery process.";
    $("unlockResult").setAttribute("role", "status");
    diagnosticComplete = true;
    $("unlockWorkspaceButton").disabled = false;
    $("unlockWorkspaceButton").textContent = "UNLOCK FULL ACCESS";
    updateAccountBanner();
    if (typeof window.toast === "function") window.toast("Profile check complete. Recovery workspace is ready.");
  });

  updateAccountBanner();

  window.addEventListener("beforeunload", () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });
})();