(() => {
  "use strict";
  function addMetaConnectionPanel() {
    if (document.getElementById("metaConnectionCard")) return;
    const settingsGrid = document.querySelector("#settings .settings-grid");
    if (!settingsGrid) return;

    const card = document.createElement("section");
    card.className = "panel settings-card";
    card.id = "metaConnectionCard";
    card.innerHTML = `
      <span class="eyebrow">META INTEGRATION</span>
      <h2>Meta Connection</h2>
      <div class="meta-connection-status">
        <span class="meta-status-dot" aria-hidden="true"></span>
        <strong>Not connected</strong>
        <span class="meta-status-tag">Setup required</span>
      </div>
      <p>No Meta Developer App is configured yet. RecoveryX is not currently connected to Facebook or Meta, and no account data is being retrieved.</p>
      <div class="meta-connection-details">
        <div><small>Connection</small><strong>Not configured</strong></div>
        <div><small>Authorization</small><strong>Not authorized</strong></div>
        <div><small>Data access</small><strong>None</strong></div>
      </div>
      <a class="button button-secondary meta-developer-link"
         href="https://developers.facebook.com/apps/"
         target="_blank" rel="noopener noreferrer">Open Meta for Developers ↗</a>
      <small class="field-hint">After creating your Meta Developer App, configure OAuth and secure server-side token storage. Only data allowed by Meta permissions will be available. Standard Facebook Login does not expose disabled-account decisions.</small>
    `;
    settingsGrid.insertBefore(card, settingsGrid.firstChild);

    if (!document.getElementById("metaConnectionStyles")) {
      const style = document.createElement("style");
      style.id = "metaConnectionStyles";
      style.textContent = `
        .meta-connection-status{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:12px 0 14px;padding:11px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}
        .meta-status-dot{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:#d69b36;box-shadow:0 0 0 4px #d69b361c}
        .meta-connection-status strong{font-size:13px;color:var(--text)}
        .meta-status-tag{margin-left:auto;padding:4px 8px;border-radius:20px;background:#d69b3618;color:#b47a1d;font-size:10px;font-weight:700}
        .meta-connection-details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}
        .meta-connection-details div{padding:10px;border:1px solid var(--border);border-radius:9px;min-width:0}
        .meta-connection-details small,.meta-connection-details strong{display:block}
        .meta-connection-details small{font-size:10px;color:var(--muted);margin-bottom:5px}
        .meta-connection-details strong{font-size:11px;color:var(--text);overflow-wrap:anywhere}
        .meta-developer-link{display:inline-flex;text-decoration:none;align-items:center;justify-content:center;margin:2px 0 10px}
        @media(max-width:560px){.meta-connection-details{grid-template-columns:1fr}.meta-status-tag{margin-left:0}}
      `;
      document.head.appendChild(style);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addMetaConnectionPanel, { once: true });
  } else {
    addMetaConnectionPanel();
  }
})();