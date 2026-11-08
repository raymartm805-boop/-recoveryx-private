document.addEventListener("DOMContentLoaded", () => {
  const links = [...document.querySelectorAll(".nav-link")];
  const sections = [...document.querySelectorAll(".page-section")];
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const dialog = document.getElementById("accountDialog");
  const toast = document.getElementById("toast");
  const KEYS = { accounts:"rx_records_v3", history:"rx_history_v3", profile:"rx_profile_v3", compact:"rx_compact_v3", confirm:"rx_confirm_delete_v3" };
  const read = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { notify("Could not save: browser storage may be unavailable."); return false; } };
  let accounts = read(KEYS.accounts, []);
  let historyLog = read(KEYS.history, []);
  let profile = read(KEYS.profile, { fullName:"Account Owner", email:"", displayName:"" });

  function notify(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove("show"), 2600); }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function go(page, updateHash = true) {
    const target = document.getElementById(page);
    if (!target || !target.classList.contains("page-section")) return;
    sections.forEach(s => { s.hidden = s.id !== page; });
    links.forEach(a => { const active = a.hash === `#${page}`; a.classList.toggle("active", active); if (active) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
    if (updateHash) history.replaceState(null,"",`#${page}`);
    sidebar.classList.remove("open"); menuToggle.setAttribute("aria-expanded","false"); window.scrollTo({top:0,behavior:"smooth"});
  }
  links.forEach(a => a.addEventListener("click", e => { e.preventDefault(); go(a.hash.slice(1)); }));
  document.querySelectorAll("[data-go]").forEach(el => el.addEventListener("click", () => go(el.dataset.go)));
  menuToggle.addEventListener("click", () => { const open = sidebar.classList.toggle("open"); menuToggle.setAttribute("aria-expanded",String(open)); });
  document.addEventListener("click", e => { if (innerWidth <= 760 && sidebar.classList.contains("open") && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) { sidebar.classList.remove("open"); menuToggle.setAttribute("aria-expanded","false"); } });
  window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (document.getElementById(id)?.classList.contains("page-section")) go(id,false); });

  function addHistory(action, record, status) {
    historyLog.unshift({ time:new Date().toISOString(), action, reference:record.id, status:status || record.status || "—" });
    historyLog = historyLog.slice(0,100);
    save(KEYS.history,historyLog);
  }
  function formatDate(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value || "—") : d.toLocaleString([], {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
  function badgeClass(status) { return ({Pending:"status-pending","In Review":"status-review",Completed:"status-completed",Closed:"status-closed"})[status] || "status-closed"; }

  // Profile is stored only in this browser.
  const profileForm = document.getElementById("profileForm");
  function renderProfile() {
    document.getElementById("fullName").value = profile.fullName || "";
    document.getElementById("email").value = profile.email || "";
    document.getElementById("displayName").value = profile.displayName || "";
    const label = profile.displayName || profile.fullName || "Account Owner";
    document.getElementById("profileNameHeading").textContent = label;
    document.getElementById("profileInitial").textContent = label.trim().charAt(0).toUpperCase() || "A";
    document.querySelector(".avatar").textContent = label.trim().charAt(0).toUpperCase() || "A";
  }
  profileForm.addEventListener("submit", e => { e.preventDefault(); profile = {fullName:document.getElementById("fullName").value.trim(),email:document.getElementById("email").value.trim(),displayName:document.getElementById("displayName").value.trim()}; if (save(KEYS.profile,profile)) { renderProfile(); document.getElementById("profileMessage").textContent = "Profile saved in this browser."; notify("Profile saved."); } });

  const tableBody = document.getElementById("accountTableBody");
  const search = document.getElementById("accountSearch");
  const platformFilter = document.getElementById("platformFilter");
  const statusFilter = document.getElementById("statusFilter");
  function renderHistory() {
    const body = document.getElementById("historyTableBody");
    if (!historyLog.length) { body.innerHTML = '<tr><td colspan="4" class="table-empty">No activity recorded yet.</td></tr>'; return; }
    body.innerHTML = historyLog.slice(0,7).map(item => `<tr><td>${escapeHTML(formatDate(item.time))}</td><td>${escapeHTML(item.action)}</td><td><strong>${escapeHTML(item.reference)}</strong></td><td><span class="status-pill ${badgeClass(item.status)}">${escapeHTML(item.status)}</span></td></tr>`).join("");
  }
  function renderChart(total, completed, pending) {
    const chart = document.getElementById("activityChart");
    if (!total) { chart.innerHTML = '<div class="chart-empty">Add account records to see the summary.</div>'; return; }
    const max = Math.max(total,1);
    const values = [{label:"Total",n:total,cls:"total"},{label:"Done",n:completed,cls:"completed"},{label:"Pending",n:pending,cls:"pending"}];
    chart.innerHTML = values.map(v => `<div class="chart-column"><div class="chart-bars"><span class="chart-bar ${v.cls}" style="height:${Math.max(v.n/max*100,3)}%" title="${v.label}: ${v.n}"></span></div><small>${v.label}<br>${v.n}</small></div>`).join("");
  }
  function renderDashboard() {
    const total = accounts.length;
    const completed = accounts.filter(x => x.status === "Completed" || x.status === "Closed").length;
    const pending = accounts.filter(x => x.status === "Pending" || x.status === "In Review").length;
    const percent = total ? Math.round(completed / total * 100) : 0;
    document.getElementById("totalAccounts").textContent = total;
    document.getElementById("pendingAccounts").textContent = pending;
    document.getElementById("completedAccounts").textContent = accounts.filter(x => x.status === "Completed").length;
    document.getElementById("reviewPercent").textContent = `${percent}%`;
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressRing").style.setProperty("--progress",`${percent*3.6}deg`);
    document.getElementById("progressBar").style.width = `${percent}%`;
    document.getElementById("progressTitle").textContent = total ? `${completed} of ${total} records reviewed` : "No records yet";
    document.getElementById("progressDescription").textContent = pending ? `${pending} record${pending===1?"":"s"} still pending or in review.` : total ? "All saved records have been reviewed or closed." : "Add records to track their review status.";
    document.getElementById("progressCounts").textContent = `${completed} completed / closed · ${pending} pending / review`;
    renderChart(total,completed,pending);
    renderHistory();
  }
  function renderAccounts() {
    const q = search.value.trim().toLowerCase(), platform = platformFilter.value, status = statusFilter.value;
    const filtered = accounts.filter(x => (!q || x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q)) && (!platform || x.platform===platform) && (!status || x.status===status));
    if (!filtered.length) tableBody.innerHTML = `<tr><td colspan="7" class="table-empty">${accounts.length ? "No matching records found." : "No account records yet."}</td></tr>`;
    else tableBody.innerHTML = filtered.map(x => `<tr><td><strong>${escapeHTML(x.id)}</strong></td><td>${escapeHTML(x.name)}</td><td>${escapeHTML(x.platform)}</td><td>${escapeHTML(x.issue)}</td><td>${escapeHTML(x.date)}</td><td><select class="status-select ${badgeClass(x.status)}" data-status-id="${escapeHTML(x.id)}" aria-label="Update status for ${escapeHTML(x.name)}"><option ${x.status==="Pending"?"selected":""}>Pending</option><option ${x.status==="In Review"?"selected":""}>In Review</option><option ${x.status==="Completed"?"selected":""}>Completed</option><option ${x.status==="Closed"?"selected":""}>Closed</option></select></td><td><button class="table-action" type="button" data-delete="${escapeHTML(x.id)}">Remove</button></td></tr>`).join("");
    renderDashboard();
  }
  search.addEventListener("input",renderAccounts); platformFilter.addEventListener("change",renderAccounts); statusFilter.addEventListener("change",renderAccounts);
  document.getElementById("addAccountBtn").addEventListener("click",() => dialog.showModal());
  function closeDialog(){dialog.close();}
  document.getElementById("closeDialog").addEventListener("click",closeDialog); document.getElementById("cancelDialog").addEventListener("click",closeDialog);
  document.getElementById("accountForm").addEventListener("submit",e => {
    e.preventDefault(); const name=document.getElementById("recordName").value.trim(); if(!name)return;
    const record={id:"RX-"+Date.now().toString().slice(-8),name,platform:document.getElementById("recordPlatform").value,issue:document.getElementById("recordIssue").value,status:document.getElementById("recordStatus").value,date:new Date().toLocaleDateString()};
    accounts.unshift(record); if(save(KEYS.accounts,accounts)){addHistory("Record added",record,record.status);renderAccounts();e.target.reset();closeDialog();notify("Account record added.");}
  });
  tableBody.addEventListener("change",e => { const select=e.target.closest("[data-status-id]"); if(!select)return; const record=accounts.find(x=>x.id===select.dataset.statusId); if(!record)return; const old=record.status; record.status=select.value; if(save(KEYS.accounts,accounts)){addHistory(`Status changed: ${old} → ${record.status}`,record,record.status);renderAccounts();notify("Record status updated.");} });
  tableBody.addEventListener("click",e => { const btn=e.target.closest("[data-delete]"); if(!btn)return; const confirmDelete=document.getElementById("confirmDeleteToggle").checked; if(confirmDelete&&!confirm("Remove this record from this browser?"))return; const record=accounts.find(x=>x.id===btn.dataset.delete); accounts=accounts.filter(x=>x.id!==btn.dataset.delete); if(save(KEYS.accounts,accounts)){if(record)addHistory("Record removed",record,"Closed");renderAccounts();notify("Record removed.");} });

  document.getElementById("supportForm").addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("supportName").value.trim(),email=document.getElementById("supportEmail").value.trim(),message=document.getElementById("supportMessage").value.trim();if(!name||!email||!message)return;const ref="RX-"+Date.now().toString().slice(-8);document.getElementById("supportFeedback").textContent=`Request draft created: ${ref}. This form does not send data to a support server.`;e.target.reset();});
  const compact=document.getElementById("compactToggle"),confirmDelete=document.getElementById("confirmDeleteToggle");compact.checked=read(KEYS.compact,false);confirmDelete.checked=read(KEYS.confirm,true);document.body.classList.toggle("compact",compact.checked);
  compact.addEventListener("change",()=>{document.body.classList.toggle("compact",compact.checked);save(KEYS.compact,compact.checked);});confirmDelete.addEventListener("change",()=>save(KEYS.confirm,confirmDelete.checked));
  renderProfile();renderAccounts();const initial=location.hash.slice(1);go(sections.some(s=>s.id===initial)?initial:"dashboard",false);
});
