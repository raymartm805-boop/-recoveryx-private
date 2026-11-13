(() => {
"use strict";
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const urls = {
 Facebook:{recover:"https://www.facebook.com/login/identify",hacked:"https://www.facebook.com/hacked",disabled:"https://www.facebook.com/help/103873106370583"},
 Instagram:{recover:"https://www.instagram.com/hacked/",hacked:"https://www.instagram.com/hacked/",disabled:"https://help.instagram.com/"},
 Gmail:{recover:"https://accounts.google.com/signin/recovery",hacked:"https://accounts.google.com/signin/recovery",disabled:"https://support.google.com/accounts/answer/40695"},
 TikTok:{recover:"https://support.tiktok.com/en/log-in-troubleshoot/log-in",hacked:"https://support.tiktok.com/en/safety-hc/account-and-user-safety/account-safety",disabled:"https://support.tiktok.com/en/safety-hc/account-and-user-safety"}
};
const platformNames=["Facebook","Instagram","Gmail","TikTok"];
const issueNames=["Locked / security check","Hacked / suspicious activity","Disabled / suspended","Can't log in / forgot details","Identity verification requested","Other"];
const nav=document.querySelector(".navigation");
if(nav && !document.querySelector('[data-page="assistant"]')){
 const a=document.createElement("a");a.className="nav-link";a.href="#assistant";a.dataset.page="assistant";a.innerHTML='<span class="nav-icon">✦</span>Recovery Assistant';nav.insertBefore(a,nav.children[1]||null);
}
const page=document.createElement("section");page.className="page-section";page.id="recoveryAssistant";
page.innerHTML='<div class="page-heading"><div><span class="eyebrow">GUIDED ACCOUNT SUPPORT</span><h1>Recovery Assistant</h1><p>Describe the access problem to get a step-by-step plan and a draft you can review.</p></div></div>'+
'<div class="ra-layout"><section class="panel ra-form"><span class="eyebrow">STEP 1 · ACCOUNT DETAILS</span><h2>What happened to your account?</h2>'+
'<label class="ra-field">Platform<select id="raPlatform">'+platformNames.map(x=>'<option>'+x+'</option>').join("")+'</select></label>'+
'<label class="ra-field">Problem<select id="raIssue">'+issueNames.map(x=>'<option>'+x+'</option>').join("")+'</select></label>'+
'<label class="ra-field">Can you still access the recovery email or phone?<select id="raContact"><option value="yes">Yes, I can access at least one</option><option value="no">No, I cannot access either</option><option value="unsure">Not sure</option></select></label>'+
'<label class="ra-field">Do you have a device previously used with this account?<select id="raDevice"><option value="yes">Yes</option><option value="no">No</option><option value="unsure">Not sure</option></select></label>'+
'<label class="ra-field">What have you tried already? (optional)<textarea id="raTried" rows="3" maxlength="700" placeholder="Example: tried the official recovery page; it asks me to use a previously used device."></textarea></label>'+
'<label class="ra-field">Name to use in the appeal (optional)<input id="raName" maxlength="80" placeholder="Your real name"></label>'+
'<div class="ra-actions"><button class="button button-primary" id="raGenerate" type="button">Generate my recovery plan</button><button class="button button-secondary" id="raReset" type="button">Clear</button></div>'+
'<p class="ra-safety">Do not enter passwords, OTPs, backup codes, full ID numbers, or private recovery links. Your answers stay in this browser and are not sent to a server.</p></section>'+
'<section class="panel ra-result" id="raResult" aria-live="polite"><span class="eyebrow">STEP 2 · YOUR PLAN</span><h2>Ready when you are</h2><p class="ra-muted">Choose the platform and issue, then generate a recovery plan. The steps will be tailored to your answers.</p><div class="ra-empty">✦</div></section></div>';
const wrap=document.querySelector(".page-wrap");if(wrap)wrap.insertBefore(page,document.getElementById("recovery")||null);
const style=document.createElement("style");style.textContent='#recoveryAssistant .ra-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}#recoveryAssistant .ra-form,#recoveryAssistant .ra-result{padding:20px;min-width:0}#recoveryAssistant h2{font-size:18px;margin:7px 0 17px}#recoveryAssistant .ra-field{display:grid;gap:7px;margin:13px 0;color:var(--muted);font-size:12px;font-weight:650}#recoveryAssistant .ra-field input,#recoveryAssistant .ra-field select,#recoveryAssistant .ra-field textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid var(--line);border-radius:9px;background:var(--surface, #0b1d37);color:var(--text,#edf5ff);font:inherit;font-weight:400}#recoveryAssistant .ra-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}#recoveryAssistant .ra-safety,#recoveryAssistant .ra-muted{font-size:11px;line-height:1.6;color:var(--muted)}#recoveryAssistant .ra-step{padding:12px 0;border-bottom:1px solid var(--line);font-size:12px;line-height:1.6}#recoveryAssistant .ra-step strong{display:block;margin-bottom:3px;color:var(--text)}#recoveryAssistant .ra-link{display:inline-block;margin:12px 0;color:var(--accent,#6bb6ff);font-size:12px}#recoveryAssistant .ra-draft{width:100%;box-sizing:border-box;min-height:190px;margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface,#0b1d37);color:var(--text,#edf5ff);font:12px/1.6 inherit}#recoveryAssistant .ra-empty{display:grid;place-items:center;min-height:180px;border:1px dashed var(--line);border-radius:12px;font-size:48px;color:var(--muted)}#recoveryAssistant .ra-warning{padding:11px;border-radius:9px;background:rgba(222,164,58,.1);font-size:11px;line-height:1.6;margin:12px 0}body.light #recoveryAssistant .ra-field input,body.light #recoveryAssistant .ra-field select,body.light #recoveryAssistant .ra-field textarea,body.light #recoveryAssistant .ra-draft{background:#f6f9fd;color:#172b45}@media(max-width:850px){#recoveryAssistant .ra-layout{grid-template-columns:1fr}#recoveryAssistant .ra-form,#recoveryAssistant .ra-result{padding:15px}}';document.head.appendChild(style);
const navlink=document.querySelector('[data-page="assistant"]');
function show(){document.querySelectorAll(".page-section").forEach(x=>x.classList.toggle("active",x===page));document.querySelectorAll(".nav-link").forEach(x=>{const active=x.dataset.page==="assistant";x.classList.toggle("active",active);if(active)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current")});const title=$("pageTitle");if(title)title.textContent="Recovery Assistant";const side=$("sidebar");if(side)side.classList.remove("open");location.hash="assistant"}
if(navlink)navlink.addEventListener("click",e=>{e.preventDefault();show()});
function generate(){
 const platform=$("raPlatform").value,issue=$("raIssue").value,contact=$("raContact").value,device=$("raDevice").value,tried=$("raTried").value.trim(),name=$("raName").value.trim();
 const key=issue.includes("Hacked")?"hacked":issue.includes("Disabled")?"disabled":"recover";
 const steps=[];
 if(issue.includes("Locked")&&platform==="Facebook"){
  steps.push(["Use a familiar device","Try the phone or computer and browser you previously used for this account. Keep the usual network if possible."]);
  steps.push(["Open the official account finder","Use Facebook's recovery page and follow the on-screen identity/security checks."]);
 } else if(issue.includes("Hacked")){
  steps.push(["Secure the email account first","If the email account may also be compromised, secure it through its provider before changing social-account settings."]);
  steps.push(["Open the provider's hacked-account process","Use the official hacked-account destination below. Review recent security alerts and remove unfamiliar sessions only after regaining access."]);
 } else if(issue.includes("Disabled")){
  steps.push(["Read the provider's notice carefully","Check the exact reason, appeal deadline, and any requested verification steps in the official app or inbox."]);
  steps.push(["Submit an appeal only through the provider","Use the official support flow below. Provide truthful details and genuine, unaltered documents only if requested."]);
 } else if(issue.includes("Identity")){
  steps.push(["Prepare accurate identity details","Make sure your account name and details match the genuine document requested by the provider."]);
  steps.push(["Submit through the official verification screen","Use a clear, complete image only if the provider requests it. Never edit identity details or security features."]);
 } else {
  steps.push(["Start from the official recovery page","Use the provider's official recovery flow and follow the prompts in order."]);
  steps.push(["Use information you can verify","Enter a recovery email/phone or previous password only on the provider's genuine website or app—not in this organizer."]);
 }
 if(contact==="yes")steps.push(["Keep your recovery contact available","Check the inbox and SMS for provider messages, including spam/junk folders. Never share a one-time code with another person."]);
 if(contact==="no")steps.push(["Try to restore access to your recovery contact","Use that email or mobile provider's official process first, if possible. If not, look for the account provider's alternative identity-verification route."]);
 if(device==="yes")steps.push(["Use a previously trusted device","If available, use a device you regularly used with this account. Do not reset it before completing recovery."]);
 if(device==="no")steps.push(["Use the most familiar available environment","Use your usual location and a familiar browser if possible. If the provider requires a prior device, follow its official alternative verification instructions; do not try to bypass the check."]);
 steps.push(["Keep a simple case record","Record the date, the exact notice, and each step attempted. Wait for the provider's response before sending repeated appeals."]);
 const draft="Hello "+platform+" Support,\n\nI need help regaining access to my account. The issue is: "+issue+".\n\n"+(name?"Account holder name: "+name+".\n":"")+"I can access my recovery email or phone: "+(contact==="yes"?"Yes":contact==="no"?"No":"Not sure")+".\nI have a previously used device available: "+(device==="yes"?"Yes":device==="no"?"No":"Not sure")+".\n\n"+(tried?"Steps I have already tried: "+tried+"\n\n":"")+"Please let me know the official steps required to verify ownership and restore access. I can provide genuine supporting information through your secure official process if requested.\n\nThank you.";
 const result=$("raResult");
 result.innerHTML='<span class="eyebrow">STEP 2 · YOUR RECOVERY PLAN</span><h2>'+esc(platform)+' · '+esc(issue)+'</h2><p class="ra-muted">Suggested next steps based on the answers you selected:</p>'+steps.map((s,i)=>'<div class="ra-step"><strong>'+(i+1)+'. '+esc(s[0])+'</strong>'+esc(s[1])+'</div>').join("")+'<a class="ra-link" href="'+esc(urls[platform][key])+'" target="_blank" rel="noopener noreferrer">Open official '+esc(platform)+' support ↗</a><div class="ra-warning">The provider alone can verify ownership and restore access. This plan is guidance only; it does not access the account, submit an appeal, or change its status.</div><h2>Appeal message draft</h2><p class="ra-muted">Review and correct this message before sending it through the provider's official form.</p><textarea class="ra-draft" id="raDraft">'+esc(draft)+'</textarea><div class="ra-actions"><button class="button button-primary" type="button" id="raCopy">Copy appeal draft</button><button class="button button-secondary" type="button" id="raSave">Save plan on this device</button></div><p class="ra-muted" id="raMessage" role="status"></p>';
 $("raCopy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("raDraft").value);$("raMessage").textContent="Draft copied."}catch(_){$("raDraft").select();$("raMessage").textContent="Select and copy the draft manually."}});
 $("raSave").addEventListener("click",()=>{try{localStorage.setItem("rx_recovery_assistant_plan",JSON.stringify({platform,issue,steps,draft,createdAt:new Date().toISOString()}));$("raMessage").textContent="Plan saved in this browser only."}catch(_){$("raMessage").textContent="Could not save on this device."}});
}
$("raGenerate").addEventListener("click",generate);
$("raReset").addEventListener("click",()=>{$("raTried").value="";$("raName").value="";$("raContact").value="yes";$("raDevice").value="yes";$("raResult").innerHTML='<span class="eyebrow">STEP 2 · YOUR PLAN</span><h2>Ready when you are</h2><p class="ra-muted">Choose the platform and issue, then generate a recovery plan.</p><div class="ra-empty">✦</div>'});
})();
