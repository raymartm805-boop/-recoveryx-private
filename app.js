(() => {
"use strict";
const KEYS={recovery:"rx2_recovery",deletion:"rx2_deletion",activity:"rx2_activity",checklist:"rx2_checklist",theme:"rx2_theme"};
const $=id=>document.getElementById(id);
const safeRead=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v===null?fallback:v}catch(_){return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){toast("Could not save. Device storage may be full.");return false}};
let recovery=safeRead(KEYS.recovery,null),deletions=safeRead(KEYS.deletion,null),activity=safeRead(KEYS.activity,[]),checks=safeRead(KEYS.checklist,[]);
if(!Array.isArray(recovery)){
  const legacy=safeRead("rx_records_v5",[]);
  recovery=Array.isArray(legacy)?legacy.map(x=>({id:String(x.id||"RX-"+Date.now()),name:String(x.name||"Untitled record"),platform:["Facebook","Instagram","Gmail","TikTok","Other"].includes(x.platform)?x.platform:"Other",issue:String(x.issue||""),followup:x.followup||"",status:["Pending","In Review","Recovered","Permanently Recovered","Closed"].includes(x.status)?x.status:"Pending",createdAt:x.createdAt||new Date().toISOString(),updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()})):[];
  if(recovery.length)try{localStorage.setItem(KEYS.recovery,JSON.stringify(recovery))}catch(_){}
}
if(!Array.isArray(deletions)){
  deletions=[];
  try{const oldTrack=JSON.parse(sessionStorage.getItem("dxtrack")||"null");if(oldTrack&&oldTrack.provider)deletions.push({id:"DX-"+Date.now(),provider:String(oldTrack.provider),requestDate:oldTrack.date||new Date().toISOString().slice(0,10),status:["Draft","Request submitted","Identity verification pending","Provider reviewing request","Deletion confirmed by provider","Some records retained by provider","Request declined"].includes(oldTrack.status)?oldTrack.status:"Draft",notes:String(oldTrack.note||""),followup:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});if(deletions.length)localStorage.setItem(KEYS.deletion,JSON.stringify(deletions))}catch(_){}
}
if(!Array.isArray(activity))activity=[];if(!Array.isArray(checks))checks=[];
const checklistText=["I use a unique password for each important account.","I have enabled two-factor authentication where available.","My recovery email and phone number are current.","I have saved backup codes in a secure place outside this app.","I reviewed active sessions and signed out unknown devices.","I checked connected apps and removed ones I do not recognize.","I use only official websites or apps for account recovery.","I never share passwords, OTPs, or backup codes with anyone."];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const id=()=> "RX-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
const date=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"})};
const stamp=()=>new Date().toISOString();
let toastTimer;
function toast(message){const el=$("toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
function log(action,details){activity.unshift({id:id(),action,details,date:stamp()});activity=activity.slice(0,80);save(KEYS.activity,activity);renderActivity();renderDashboard()}
function statusClass(status){if(["Recovered","Permanently Recovered","Deletion confirmed"].includes(status))return "status-completed";if(["Closed","Request declined"].includes(status))return "status-closed";if(["In Review","Provider reviewing","Identity verification","Request submitted"].includes(status))return "status-review";return "status-pending"}
const pageNames={calendar:"Follow-up calendar",reports:"Reports & export",dashboard:"Dashboard",recovery:"Recovery records",deletion:"DeleteX requests",resources:"Official resources",checklist:"Privacy checklist",activity:"Activity history",settings:"Settings"};
function showPage(name){if(!pageNames[name])name="dashboard";document.querySelectorAll(".page-section").forEach(p=>p.classList.toggle("active",p.id===name));document.querySelectorAll(".nav-link").forEach(a=>{const active=a.dataset.page===name;a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});$("pageTitle").textContent=pageNames[name];$("sidebar").classList.remove("open");location.hash=name}
document.querySelectorAll("[data-page]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showPage(a.dataset.page)}));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("avatarButton").addEventListener("click",()=>showPage("settings"));
$("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem(KEYS.theme,document.body.classList.contains("light")?"light":"dark")});
if(localStorage.getItem(KEYS.theme)==="light")document.body.classList.add("light");

function renderDashboard(){
$("recoveryCount").textContent=recovery.length;
$("deletionCount").textContent=deletions.length;
$("progressCount").textContent=recovery.filter(x=>["Pending","In Review"].includes(x.status)).length+deletions.filter(x=>!["Deletion confirmed","Request declined"].includes(x.status)).length;
$("closedCount").textContent=recovery.filter(x=>["Recovered","Permanently Recovered","Closed"].includes(x.status)).length+deletions.filter(x=>x.status==="Deletion confirmed").length;
const target=$("dashboardActivity");const recent=activity.slice(0,5);
target.innerHTML=recent.length?recent.map(item=>activityHTML(item)).join(""):'<div class="empty-state">No activity yet. Add a record to get started.</div>';
}
function activityHTML(item){return '<div class="activity-item"><span class="activity-mark">•</span><div class="activity-copy"><strong>'+esc(item.action)+'</strong><span>'+esc(item.details)+'</span><time>'+date(item.date)+'</time></div></div>'}
function renderActivity(){$("activityList").innerHTML=activity.length?activity.map(activityHTML).join(""):'<div class="empty-state">No activity recorded.</div>'}

const recordDialog=$("recordDialog"),deletionDialog=$("deletionDialog");
function openDialog(dialog){if(dialog.showModal)dialog.showModal();else dialog.setAttribute("open","")}
function closeDialog(dialog){if(dialog.close)dialog.close();else dialog.removeAttribute("open")}
$("addRecoveryBtn").addEventListener("click",()=>{ $("recordForm").reset();openDialog(recordDialog) });
$("closeRecordDialog").addEventListener("click",()=>closeDialog(recordDialog));
$("cancelRecordDialog").addEventListener("click",()=>closeDialog(recordDialog));
$("addDeletionBtn").addEventListener("click",()=>{$("deletionForm").reset();$("deleteDate").value=new Date().toISOString().slice(0,10);openDialog(deletionDialog)});
$("closeDeletionDialog").addEventListener("click",()=>closeDialog(deletionDialog));
$("cancelDeletionDialog").addEventListener("click",()=>closeDialog(deletionDialog));

$("recordForm").addEventListener("submit",e=>{e.preventDefault();const item={id:id(),name:$("recordName").value.trim(),platform:$("recordPlatform").value,issue:$("recordIssue").value.trim(),followup:$("recordFollowup").value,status:$("recordStatus").value,createdAt:stamp(),updatedAt:stamp()};if(!item.name||!item.platform)return;recovery.unshift(item);if(!save(KEYS.recovery,recovery)){recovery.shift();return}closeDialog(recordDialog);renderAll();log("Recovery record added",item.platform+" · "+item.name);toast("Recovery record saved.")});
$("deletionForm").addEventListener("submit",e=>{e.preventDefault();const item={id:id(),provider:$("deleteProvider").value.trim(),requestDate:$("deleteDate").value,status:$("deleteStatus").value,followup:$("deleteFollowup").value,notes:$("deleteNotes").value.trim(),createdAt:stamp(),updatedAt:stamp()};if(!item.provider)return;deletions.unshift(item);if(!save(KEYS.deletion,deletions)){deletions.shift();return}closeDialog(deletionDialog);renderAll();log("DeleteX request added",item.provider+" · "+item.status);toast("Deletion request saved.")});

function renderRecovery(){
const q=$("recoverySearch").value.toLowerCase().trim(),platform=$("recoveryPlatformFilter").value,status=$("recoveryStatusFilter").value;
const rows=recovery.filter(x=>([x.name,x.platform,x.issue].join(" ").toLowerCase().includes(q))&&(platform==="all"||x.platform===platform)&&(status==="all"||x.status===status));
$("recoveryTableBody").innerHTML=rows.length?rows.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong></td><td>'+esc(x.platform)+'</td><td title="'+esc(x.issue)+'">'+esc(x.issue||"—").slice(0,48)+'</td><td><span class="status-pill '+statusClass(x.status)+'">'+esc(x.status)+'</span></td><td>'+date(x.updatedAt)+'</td><td><div class="record-actions"><select class="record-status-select" data-recovery-status="'+esc(x.id)+'" aria-label="Update status"><option '+(x.status==="Pending"?"selected":"")+'>Pending</option><option '+(x.status==="In Review"?"selected":"")+'>In Review</option><option '+(x.status==="Recovered"?"selected":"")+'>Recovered</option><option '+(x.status==="Permanently Recovered"?"selected":"")+'>Permanently Recovered</option><option '+(x.status==="Closed"?"selected":"")+'>Closed</option></select><button class="delete-btn" data-delete-recovery="'+esc(x.id)+'">Delete</button></div></td></tr>').join(""):'<tr><td colspan="6" class="table-empty">No matching recovery records.</td></tr>';
}
function renderDeletions(){
const q=$("deletionSearch").value.toLowerCase().trim(),status=$("deletionStatusFilter").value;
const rows=deletions.filter(x=>([x.provider,x.notes,x.status].join(" ").toLowerCase().includes(q))&&(status==="all"||x.status===status));
$("deletionTableBody").innerHTML=rows.length?rows.map(x=>'<tr><td><strong>'+esc(x.provider)+'</strong></td><td>'+date(x.requestDate)+'</td><td><span class="status-pill '+statusClass(x.status)+'">'+esc(x.status)+'</span></td><td title="'+esc(x.notes)+'">'+esc(x.notes||"—").slice(0,45)+'</td><td>'+date(x.updatedAt)+'</td><td><div class="record-actions"><select class="record-status-select" data-deletion-status="'+esc(x.id)+'" aria-label="Update request status">'+["Draft","Request submitted","Provider reviewing","Identity verification","Deletion confirmed","Partially retained","Request declined"].map(s=>'<option '+(x.status===s?"selected":"")+'>'+s+'</option>').join("")+'</select><button class="delete-btn" data-delete-deletion="'+esc(x.id)+'">Delete</button></div></td></tr>').join(""):'<tr><td colspan="6" class="table-empty">No matching deletion requests.</td></tr>';
}
$("recoverySearch").addEventListener("input",renderRecovery);$("recoveryPlatformFilter").addEventListener("change",renderRecovery);$("recoveryStatusFilter").addEventListener("change",renderRecovery);
$("deletionSearch").addEventListener("input",renderDeletions);$("deletionStatusFilter").addEventListener("change",renderDeletions);
$("recoveryTableBody").addEventListener("change",e=>{const sel=e.target.closest("[data-recovery-status]");if(!sel)return;const item=recovery.find(x=>x.id===sel.dataset.recoveryStatus);if(!item)return;if(["Recovered","Permanently Recovered"].includes(sel.value)&&!confirm(sel.value==="Permanently Recovered"?"Has the account owner confirmed they can still access this account and that recovery is complete? Only choose this after confirmation.":"Has the account owner confirmed access has been restored?")){renderRecovery();return}const old=item.status;item.status=sel.value;item.updatedAt=stamp();save(KEYS.recovery,recovery);renderAll();log("Recovery status updated",item.name+" · "+old+" → "+item.status)});
$("deletionTableBody").addEventListener("change",e=>{const sel=e.target.closest("[data-deletion-status]");if(!sel)return;const item=deletions.find(x=>x.id===sel.dataset.deletionStatus);if(!item)return;if(sel.value==="Deletion confirmed"&&!confirm("Did the provider confirm deletion? Only choose this after receiving confirmation.")){renderDeletions();return}const old=item.status;item.status=sel.value;item.updatedAt=stamp();save(KEYS.deletion,deletions);renderAll();log("DeleteX status updated",item.provider+" · "+old+" → "+item.status)});
$("recoveryTableBody").addEventListener("click",e=>{const b=e.target.closest("[data-delete-recovery]");if(!b)return;const item=recovery.find(x=>x.id===b.dataset.deleteRecovery);if(!item||!confirm("Delete this recovery record from this browser?"))return;recovery=recovery.filter(x=>x.id!==item.id);save(KEYS.recovery,recovery);renderAll();log("Recovery record deleted",item.name)});
$("deletionTableBody").addEventListener("click",e=>{const b=e.target.closest("[data-delete-deletion]");if(!b)return;const item=deletions.find(x=>x.id===b.dataset.deleteDeletion);if(!item||!confirm("Delete this request from this browser?"))return;deletions=deletions.filter(x=>x.id!==item.id);save(KEYS.deletion,deletions);renderAll();log("DeleteX request deleted",item.provider)});

function renderChecklist(){
$("checklistItems").innerHTML=checklistText.map((t,i)=>'<label class="check-item"><input type="checkbox" data-check="'+i+'" '+(checks.includes(i)?"checked":"")+'><span>'+esc(t)+'</span></label>').join("");
const count=checks.length;$("checklistProgress").textContent=count+" of "+checklistText.length+" completed";$("checklistBar").style.width=(count/checklistText.length*100)+"%";
}
$("checklistItems").addEventListener("change",e=>{const box=e.target.closest("[data-check]");if(!box)return;const n=Number(box.dataset.check);checks=box.checked?[...new Set([...checks,n])]:checks.filter(x=>x!==n);save(KEYS.checklist,checks);renderChecklist()});
$("resetChecklist").addEventListener("click",()=>{if(!confirm("Reset all checklist ticks?"))return;checks=[];save(KEYS.checklist,checks);renderChecklist();toast("Checklist reset.")});
$("clearActivityBtn").addEventListener("click",()=>{if(!confirm("Clear activity history?"))return;activity=[];save(KEYS.activity,activity);renderAll();toast("Activity history cleared.")});

$("exportBtn").addEventListener("click",()=>{const payload={app:"BYPASSING TOOLS",version:3,exportedAt:stamp(),recovery,deletions,activity,checks};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="recoveryx-deletx-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(url);toast("Backup exported. Keep it private.")});
$("importFile").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!data||!Array.isArray(data.recovery)||!Array.isArray(data.deletions))throw new Error("Invalid backup");if(!confirm("Restore this backup? Current local records will be replaced."))return;recovery=data.recovery;deletions=data.deletions;activity=Array.isArray(data.activity)?data.activity:[];checks=Array.isArray(data.checks)?data.checks:[];save(KEYS.recovery,recovery);save(KEYS.deletion,deletions);save(KEYS.activity,activity);save(KEYS.checklist,checks);renderAll();toast("Backup restored.")}catch(_){toast("Could not restore. Choose a valid BYPASSING TOOLS backup.")}finally{e.target.value=""}});
$("clearAllBtn").addEventListener("click",()=>{if(!confirm("Permanently clear all BYPASSING TOOLS and DeleteX data saved in this browser? Export a backup first if needed."))return;recovery=[];deletions=[];activity=[];checks=[];Object.values(KEYS).forEach(k=>localStorage.removeItem(k));renderAll();toast("Local workspace cleared.")});
function renderCalendar(){
 const items=[...recovery.filter(x=>x.followup).map(x=>({type:"Recovery",name:x.name,date:x.followup,status:x.status})),...deletions.filter(x=>x.followup).map(x=>({type:"DeleteX",name:x.provider,date:x.followup,status:x.status}))].sort((a,b)=>a.date.localeCompare(b.date));
 $("calendarList").innerHTML=items.length?items.map(x=>'<div class="activity-item"><span class="activity-mark">◷</span><div class="activity-copy"><strong>'+esc(x.type)+': '+esc(x.name)+'</strong><span>'+esc(x.status)+' · '+date(x.date)+'</span><time>'+(x.date<new Date().toISOString().slice(0,10)?'Overdue':x.date===new Date().toISOString().slice(0,10)?'Due today':'Upcoming')+'</time></div></div>').join(""):'<div class="empty-state">No follow-up dates scheduled yet. Add a date when creating a record or request.</div>';
 const due=items.filter(x=>x.date<=new Date().toISOString().slice(0,10)).length;
 $("reportRecovery").textContent=recovery.length;$("reportDeletion").textContent=deletions.length;$("reportDue").textContent=due;$("reportActivity").textContent=activity.length;$("reportDue").textContent=due;
}
function renderAll(){renderDashboard();renderRecovery();renderDeletions();renderActivity();renderChecklist();renderCalendar()}
$("csvExportBtn").addEventListener("click",()=>{const rows=[["Type","Name","Platform / Provider","Status","Follow-up date","Notes"],...recovery.map(x=>["Recovery",x.name,x.platform,x.status,x.followup||"",x.issue||""]),...deletions.map(x=>["DeleteX",x.provider,"",x.status,x.followup||"",x.notes||""])];const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");downloadFile(csv,"text/csv;charset=utf-8","recoveryx-report-"+new Date().toISOString().slice(0,10)+".csv");log("CSV report exported","Recovery and DeleteX records")});
$("pdfExportBtn").addEventListener("click",()=>{const w=window.open("","_blank");if(!w){toast("Allow pop-ups to create the printable report.");return}const esc2=esc;w.document.write('<!doctype html><html><head><title>BYPASSING TOOLS report</title><style>body{font:14px Arial,sans-serif;color:#172b45;padding:32px}h1{margin-bottom:4px}small{color:#60758d}table{width:100%;border-collapse:collapse;margin:22px 0}td,th{border:1px solid #ccd6e2;padding:8px;text-align:left;font-size:12px}th{background:#edf3f9}h2{margin-top:26px}</style></head><body><h1>BYPASSING TOOLS</h1><small>Private workspace report · '+new Date().toLocaleString()+ '</small><h2>Recovery records</h2><table><tr><th>Account</th><th>Platform</th><th>Status</th><th>Follow-up</th></tr>'+recovery.map(x=>'<tr><td>'+esc2(x.name)+'</td><td>'+esc2(x.platform)+'</td><td>'+esc2(x.status)+'</td><td>'+esc2(x.followup||"—")+'</td></tr>').join("")+'</table><h2>DeleteX requests</h2><table><tr><th>Provider</th><th>Status</th><th>Follow-up</th><th>Request date</th></tr>'+deletions.map(x=>'<tr><td>'+esc2(x.provider)+'</td><td>'+esc2(x.status)+'</td><td>'+esc2(x.followup||"—")+'</td><td>'+esc2(x.requestDate||"—")+'</td></tr>').join("")+'</table><p><small>Organizer only. This report does not verify account recovery or deletion with any provider.</small></p></body></html>');w.document.close();w.focus();w.print();log("PDF report prepared","Printable workspace summary")});
function downloadFile(content,type,name){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
let installPrompt=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;const b=$("installAppBtn");b.disabled=false;$("installHint").textContent="Your browser supports installation."});$("installAppBtn").addEventListener("click",async()=>{if(!installPrompt){toast("Use your browser menu and choose Add to Home screen.");return}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installAppBtn").disabled=true});
if("serviceWorker" in navigator && location.protocol.startsWith("http")){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
renderAll();
const start=location.hash.replace("#","");if(pageNames[start]){document.querySelectorAll(".page-section").forEach(p=>p.classList.toggle("active",p.id===start));document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===start));$("pageTitle").textContent=pageNames[start]}
})();