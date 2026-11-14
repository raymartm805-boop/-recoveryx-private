(() => {
  "use strict";
  const RECOVERY_KEY = "rx2_recovery";
  const DELETION_KEY = "rx2_deletion";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
  const read = key => {
    try { const value=JSON.parse(localStorage.getItem(key)||"[]"); return Array.isArray(value)?value:[]; }
    catch (_) { return []; }
  };
  const date = value => {
    if (!value) return "—";
    const d=new Date(value);
    return Number.isNaN(d.getTime())?esc(value):d.toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"});
  };
  const statusLabel = value => value==="Pending" ? "Pending Review" : value || "Pending Review";
  const statusClass = value => {
    const s=statusLabel(value).toLowerCase();
    if (s==="recovered" || s==="permanently recovered" || s==="closed" || s==="deleted") return "rx-good";
    if (s.includes("review")) return "rx-review";
    if (s==="disabled" || s.includes("declined")) return "rx-disabled";
    return "rx-pending";
  };
  const records = () => [
    ...read(RECOVERY_KEY).map(x=>({
      name:x.name||"Unnamed account", platform:x.platform||"Other",
      status:statusLabel(x.status), notes:x.issue||"", id:x.id||"—",
      updated:x.updatedAt||x.createdAt||"", followup:x.followup||"", type:"Recovery"
    })),
    ...read(DELETION_KEY).map(x=>({
      name:x.provider||"Unnamed provider", platform:"Privacy request",
      status:x.status==="Deletion confirmed"?"Deleted":x.status==="Provider reviewing"?"In Review":statusLabel(x.status),
      notes:x.notes||"", id:x.id||"—", updated:x.updatedAt||x.createdAt||x.requestDate||"",
      followup:x.followup||"", type:"DeleteX"
    }))
  ];
  const style=document.createElement("style");
  style.textContent=`
    #rxAccountOverview{margin:18px 0 24px;padding:22px;border:1px solid #292b31;border-radius:13px;background:#17181c;color:#f3f4f6;box-shadow:0 12px 32px #0002}
    #rxAccountOverview *{box-sizing:border-box}
    #rxAccountOverview .rx-head{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:18px}
    #rxAccountOverview .rx-title{margin:0;font-size:25px;letter-spacing:-.7px;color:#f7f7f8}
    #rxAccountOverview .rx-sub{margin:5px 0 0;color:#9699a2;font-size:12px}
    #rxAccountOverview .rx-add{border:0;border-radius:8px;background:#c8102e;color:white;font-weight:700;padding:11px 16px;cursor:pointer}
    #rxAccountOverview .rx-add:hover{background:#e0183b}
    #rxAccountOverview .rx-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
    #rxAccountOverview .rx-stat{background:#202126;border:1px solid #303139;border-radius:10px;padding:15px 16px;min-width:0}
    #rxAccountOverview .rx-stat span{display:block;color:#a5a7ae;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
    #rxAccountOverview .rx-stat strong{display:block;color:#fff;font-size:29px;line-height:1.2;margin-top:8px;font-variant-numeric:tabular-nums}
    #rxAccountOverview .rx-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 14px}
    #rxAccountOverview .rx-search{flex:1;min-width:190px}
    #rxAccountOverview input,#rxAccountOverview select{width:100%;min-width:0;background:#202126;border:1px solid #34363e;border-radius:8px;padding:11px 12px;color:#f3f4f6;outline:none;font:inherit;font-size:12px}
    #rxAccountOverview input:focus,#rxAccountOverview select:focus{border-color:#777b88;box-shadow:0 0 0 2px #ffffff12}
    #rxAccountOverview .rx-filter{width:auto;min-width:145px}
    #rxAccountOverview .rx-table-wrap{width:100%;overflow:auto;border:1px solid #2b2d34;border-radius:9px}
    #rxAccountOverview table{width:100%;min-width:850px;border-collapse:collapse;white-space:normal}
    #rxAccountOverview th{background:#1d1e23;color:#a9abb3;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.7px;font-weight:800;padding:14px 13px;border-bottom:1px solid #303139}
    #rxAccountOverview td{padding:13px;border-bottom:1px solid #292b31;color:#e5e6e9;font-size:12px;vertical-align:middle}
    #rxAccountOverview tbody tr:hover{background:#202126}
    #rxAccountOverview tbody tr:last-child td{border-bottom:0}
    #rxAccountOverview .rx-name{font-weight:700;color:#f7f7f8;overflow-wrap:anywhere}
    #rxAccountOverview .rx-muted{color:#9b9da5;font-size:11px;line-height:1.5;overflow-wrap:anywhere}
    #rxAccountOverview .rx-pill{display:inline-flex;align-items:center;border-radius:20px;padding:5px 9px;font-size:10px;font-weight:800;white-space:nowrap}
    #rxAccountOverview .rx-good{background:#123d2b;color:#75e6a5}
    #rxAccountOverview .rx-review{background:#163451;color:#8fcaff}
    #rxAccountOverview .rx-pending{background:#493718;color:#ffd27c}
    #rxAccountOverview .rx-disabled{background:#4a2028;color:#ff9eaa}
    #rxAccountOverview .rx-view{border:1px solid #41434b;background:#292b31;color:#f2f2f3;border-radius:7px;padding:7px 10px;font-size:10px;font-weight:700;cursor:pointer}
    #rxAccountOverview .rx-empty{padding:30px 12px;text-align:center;color:#a2a4ac;font-size:12px}
    #rxAccountOverview .rx-foot{padding-top:12px;color:#858892;font-size:10px}
    @media(max-width:900px){#rxAccountOverview .rx-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){#rxAccountOverview{padding:14px;margin:12px 0}#rxAccountOverview .rx-title{font-size:21px}#rxAccountOverview .rx-stats{gap:8px}#rxAccountOverview .rx-stat{padding:12px}#rxAccountOverview .rx-stat strong{font-size:24px}#rxAccountOverview .rx-filter{flex:1}}
    body.light #rxAccountOverview{background:#fff;color:#142b46;border-color:#dce3eb}
    body.light #rxAccountOverview .rx-title,body.light #rxAccountOverview .rx-stat strong,body.light #rxAccountOverview .rx-name{color:#142b46}
    body.light #rxAccountOverview .rx-stat,body.light #rxAccountOverview input,body.light #rxAccountOverview select{background:#f5f7fa;border-color:#dce3eb;color:#142b46}
    body.light #rxAccountOverview th{background:#f0f2f5;color:#596575}
    body.light #rxAccountOverview td{color:#29384a;border-color:#e6e9ee}
    body.light #rxAccountOverview tbody tr:hover{background:#f6f8fb}
    body.light #rxAccountOverview .rx-view{background:#f1f3f6;color:#29384a;border-color:#d9dee6}
  `;
  document.head.appendChild(style);
  const dashboard=document.getElementById("dashboard");
  if(!dashboard)return;
  const section=document.createElement("section");
  section.id="rxAccountOverview";
  section.innerHTML=`
    <div class="rx-head">
      <div><span class="eyebrow">ACCOUNT MANAGEMENT</span><h2 class="rx-title">Accounts</h2><p class="rx-sub">A clear overview of your saved Facebook, Instagram, and other account records.</p></div>
      <button class="rx-add" id="rxAddAccount" type="button">＋ Add Account</button>
    </div>
    <div class="rx-stats" aria-live="polite">
      <article class="rx-stat"><span>Total Accounts</span><strong id="rxTotal">0</strong></article>
    </div>
    <div class="rx-tools">
      <input class="rx-search" id="rxAccountSearch" type="search" placeholder="⌕  Search accounts..." aria-label="Search accounts">
      <select class="rx-filter" id="rxPlatformFilter" aria-label="Filter platform"><option value="all">All platforms</option><option>Facebook</option><option>Instagram</option><option>Gmail</option><option>TikTok</option><option>Other</option></select>
      <select class="rx-filter" id="rxSort" aria-label="Sort accounts"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name A–Z</option></select>
    </div>
    <div class="rx-table-wrap"><table><thead><tr><th>Account / Username</th><th>Platform</th><th>Updated</th><th>Action</th></tr></thead><tbody id="rxAccountRows"></tbody></table></div>
  `;
  const grid=dashboard.querySelector(".dashboard-grid");
  if(grid)dashboard.insertBefore(section,grid);else dashboard.appendChild(section);
  const $=id=>section.querySelector("#"+id);
  const search=$("rxAccountSearch"),platform=$("rxPlatformFilter"),sort=$("rxSort"),rows=$("rxAccountRows");
  function render(){
    const all=records();
    $("rxTotal").textContent=all.length;
    const q=search.value.trim().toLowerCase();
    let list=all.filter(x=>[x.name,x.platform,x.id].join(" ").toLowerCase().includes(q))
      .filter(x=>platform.value==="all"||x.platform===platform.value);
    if(sort.value==="name")list.sort((a,b)=>a.name.localeCompare(b.name));
    else list.sort((a,b)=>String(a.updated).localeCompare(String(b.updated))*(sort.value==="oldest"?1:-1));
    rows.innerHTML=list.length?list.map(x=>`<tr>
      <td><div class="rx-name">${esc(x.name)}</div><div class="rx-muted">${esc(x.id)}</div></td>
      <td>${esc(x.platform)}</td>
      <td>${date(x.updated)}</td>
      <td><button class="rx-view" type="button" data-rx-view="1">View records</button></td>
    </tr>`).join(""):'<tr><td colspan="4" class="rx-empty">No matching account records. Use “Add Account” to create your first record.</td></tr>';
  }
  $("rxAddAccount").addEventListener("click",()=>document.getElementById("addRecoveryBtn")?.click());
  rows.addEventListener("click",e=>{if(e.target.closest("[data-rx-view]"))document.querySelector('[data-page="recovery"]')?.click()});
  search.addEventListener("input",render);platform.addEventListener("change",render);sort.addEventListener("change",render);
  document.addEventListener("click",()=>setTimeout(render,0));
  document.addEventListener("change",()=>setTimeout(render,0));
  document.addEventListener("submit",()=>setTimeout(render,0),true);
  const observer=new MutationObserver(render);
  ["recoveryTableBody","deletionTableBody"].map(id=>document.getElementById(id)).filter(Boolean)
    .forEach(node=>observer.observe(node,{childList:true,subtree:true}));
  window.addEventListener("storage",render);
  render();
})();