(() => {
  "use strict";
  const RECOVERY_KEY = "rx2_recovery";
  const DELETION_KEY = "rx2_deletion";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
  const read = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  const displayDate = value => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? esc(value) :
      d.toLocaleDateString("en-PH", {year:"numeric", month:"short", day:"numeric"});
  };
  const records = () => {
    const recovery = read(RECOVERY_KEY).map(item => ({
      type: "Recovery",
      name: item.name || "Unnamed account",
      platform: item.platform || "Other",
      status: item.status === "Recovered" ? "Recovered" : "Pending Review",
      id: item.id || "—",
      notes: item.issue || "",
      followup: item.followup || "",
      updated: item.updatedAt || item.createdAt || ""
    }));
    const deletion = read(DELETION_KEY).map(item => ({
      type: "DeleteX",
      name: item.provider || "Unnamed provider",
      platform: "Deletion request",
      status: item.status === "Deletion confirmed" ? "Deleted" : "Pending Review",
      id: item.id || "—",
      notes: item.notes || "",
      followup: item.followup || "",
      updated: item.updatedAt || item.createdAt || item.requestDate || ""
    }));
    return [...recovery, ...deletion];
  };

  const style = document.createElement("style");
  style.textContent = `
    #rxAccountOverview { margin:18px 0; padding:18px; border:1px solid var(--line,#254567);
      border-radius:16px; background:linear-gradient(135deg,#0d2343,#09172d); }
    #rxAccountOverview .rx-overview-head { display:flex; justify-content:space-between;
      align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
    #rxAccountOverview h2 { margin:5px 0 0; font-size:18px; }
    #rxAccountOverview .rx-controls { display:flex; gap:9px; flex-wrap:wrap; margin:12px 0 15px; }
    #rxAccountOverview input,#rxAccountOverview select { min-width:0; padding:10px 12px;
      border:1px solid #31577f; border-radius:9px; background:#07172d; color:#edf5ff; }
    #rxAccountOverview input { flex:1; min-width:170px; }
    #rxAccountOverview select { min-width:150px; }
    #rxAccountOverview .rx-card-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    #rxAccountOverview .rx-account-card { min-width:0; padding:14px; border:1px solid #1b3a60;
      border-radius:12px; background:#0a1b34; }
    #rxAccountOverview .rx-card-top { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
    #rxAccountOverview .rx-account-card h3 { margin:0 0 5px; font-size:13px; overflow-wrap:anywhere; }
    #rxAccountOverview .rx-meta { color:#91a9c8; font-size:10px; line-height:1.6; overflow-wrap:anywhere; }
    #rxAccountOverview .rx-status { display:inline-block; flex-shrink:0; border-radius:20px;
      padding:5px 8px; font-size:9px; font-weight:800; white-space:nowrap; }
    #rxAccountOverview .rx-pending { background:#54380d; color:#ffd17b; }
    #rxAccountOverview .rx-recovered { background:#0c4c3d; color:#75efc4; }
    #rxAccountOverview .rx-deleted { background:#123c72; color:#8dc6ff; }
    #rxAccountOverview .rx-notes { margin-top:9px; padding-top:8px; border-top:1px solid #1b3555;
      color:#b7cbe3; font-size:10px; line-height:1.5; overflow-wrap:anywhere; }
    #rxAccountOverview .rx-empty { padding:24px 10px; text-align:center; color:#91a9c8; font-size:12px; }
    @media(max-width:650px) { #rxAccountOverview .rx-card-grid { grid-template-columns:1fr; } }
    body.light #rxAccountOverview { background:#fff; }
    body.light #rxAccountOverview .rx-account-card { background:#f7faff; border-color:#dce6f1; }
    body.light #rxAccountOverview input,body.light #rxAccountOverview select { background:#f7faff;
      color:#142b46; border-color:#c9d8e9; }
    body.light #rxAccountOverview .rx-meta,body.light #rxAccountOverview .rx-notes { color:#617b98; }
  `;
  document.head.appendChild(style);

  const dashboard = document.getElementById("dashboard");
  if (!dashboard) return;
  const section = document.createElement("section");
  section.id = "rxAccountOverview";
  section.innerHTML = `
    <div class="rx-overview-head">
      <div><span class="eyebrow">ACCOUNT REGISTER</span><h2>All Accounts</h2></div>
      <span class="rx-meta">Status is based on your saved records</span>
    </div>
    <div class="rx-controls">
      <input id="rxAccountSearch" type="search" placeholder="Search account or provider..." aria-label="Search all accounts">
      <select id="rxAccountStatus" aria-label="Filter by account status">
        <option value="all">All statuses</option>
        <option value="Pending Review">Pending Review</option>
        <option value="Recovered">Recovered</option>
        <option value="Deleted">Deleted</option>
      </select>
    </div>
    <div id="rxAccountCards" class="rx-card-grid" aria-live="polite"></div>
  `;
  const grid = dashboard.querySelector(".dashboard-grid");
  if (grid) dashboard.insertBefore(section, grid);
  else dashboard.appendChild(section);

  const search = section.querySelector("#rxAccountSearch");
  const filter = section.querySelector("#rxAccountStatus");
  const cards = section.querySelector("#rxAccountCards");

  function render() {
    if (!cards) return;
    const query = search.value.trim().toLowerCase();
    const status = filter.value;
    const list = records().filter(item => {
      const haystack = [item.name, item.platform, item.type, item.notes, item.id].join(" ").toLowerCase();
      return haystack.includes(query) && (status === "all" || item.status === status);
    });
    if (!list.length) {
      cards.innerHTML = '<div class="rx-empty" style="grid-column:1/-1">Walang matching account records. Magdagdag muna ng record sa Recovery Records o DeleteX Requests.</div>';
      return;
    }
    cards.innerHTML = list.map(item => {
      const cls = item.status === "Recovered" ? "rx-recovered" :
        item.status === "Deleted" ? "rx-deleted" : "rx-pending";
      return `<article class="rx-account-card">
        <div class="rx-card-top">
          <div><h3>${esc(item.name)}</h3><div class="rx-meta">${esc(item.platform)} · ${esc(item.type)}</div></div>
          <span class="rx-status ${cls}">${esc(item.status)}</span>
        </div>
        <div class="rx-meta" style="margin-top:9px">Record ID: ${esc(item.id)}<br>
          Updated: ${displayDate(item.updated)}<br>Follow-up: ${displayDate(item.followup)}</div>
        ${item.notes ? `<div class="rx-notes">${esc(item.notes)}</div>` : ""}
      </article>`;
    }).join("");
  }

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  // Refresh the overview after the existing app adds, edits, or deletes records.
  document.addEventListener("click", () => setTimeout(render, 0));
  document.addEventListener("change", () => setTimeout(render, 0));
  document.addEventListener("submit", () => setTimeout(render, 0), true);
  const watchIds = ["dashboardActivity", "recoveryTableBody", "deletionTableBody"];
  const observer = new MutationObserver(render);
  watchIds.map(id => document.getElementById(id)).filter(Boolean)
    .forEach(node => observer.observe(node, {childList:true, subtree:true}));
  render();
})();