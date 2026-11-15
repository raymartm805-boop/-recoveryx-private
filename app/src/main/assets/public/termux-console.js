(() => {
"use strict";
const nav=document.querySelector(".navigation");
const wrap=document.querySelector(".page-wrap");
if(!nav||!wrap||document.getElementById("termuxWorkspace"))return;
const link=document.createElement("a");
link.className="nav-link";link.href="#termux";link.dataset.page="termux";
link.innerHTML='<span class="nav-icon">›_</span>Termux Terminal';
nav.appendChild(link);
const page=document.createElement("section");
page.className="page-section";page.id="termuxWorkspace";
page.innerHTML=`
<div class="page-heading"><div><span class="eyebrow">LOCAL ANDROID SHELL</span><h1>Termux Terminal</h1><p>Run selected read-only diagnostics through your installed Termux app.</p></div></div>
<div class="tx-panel">
 <div class="tx-top"><span><i></i> TERMUX BRIDGE</span><span id="txStatus">Checking connection…</span></div>
 <div class="tx-intro">Commands require Android permission and explicit confirmation. Only built-in diagnostic commands are available in this integration.</div>
 <div class="tx-actions">
  <button data-cmd="pwd">PWD</button><button data-cmd="identity">ID</button><button data-cmd="system">UNAME -A</button><button data-cmd="date">DATE</button><button data-cmd="storage">DF -H</button><button data-cmd="files">LS -LA</button>
 </div>
 <pre class="tx-output" id="txOutput" aria-live="polite">MALWARE BYPASSING TOOLS // TERMUX BRIDGE
Waiting for command…</pre>
 <div class="tx-foot">No root access. No arbitrary shell input. No account bypass or credential operations.</div>
 <button class="button button-secondary" id="txPermission">Check / request Termux permission</button>
</div>`;
wrap.appendChild(page);
const style=document.createElement("style");
style.textContent=`
#termuxWorkspace .tx-panel{border:1px solid #245077;border-radius:14px;background:#050b10;padding:16px;color:#d5f5e6;font:13px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;box-shadow:0 12px 34px #0005}
#termuxWorkspace .tx-top{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #234333;padding-bottom:12px;color:#68e6a2;font-weight:700;font-size:11px;letter-spacing:1px}
#termuxWorkspace .tx-top i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#35dc8a;margin-right:7px}
#termuxWorkspace .tx-intro,#termuxWorkspace .tx-foot{color:#8ca99a;font-size:11px;margin:13px 0}
#termuxWorkspace .tx-actions{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0}
#termuxWorkspace .tx-actions button{background:#101d18;border:1px solid #28533c;color:#8ff0b4;border-radius:7px;padding:9px 12px;font:700 11px ui-monospace,monospace}
#termuxWorkspace .tx-actions button:active{background:#1b3b2a}
#termuxWorkspace .tx-output{min-height:180px;max-height:420px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:#020604;border:1px solid #1b3928;border-radius:8px;padding:14px;color:#9ce9b7}
#termuxWorkspace #txPermission{margin-top:8px}
`;
document.head.appendChild(style);
function status(s){document.getElementById("txStatus").textContent=s}
function output(s){document.getElementById("txOutput").textContent=s}
window.onTermuxResult=(state,text,code)=>{
 status(state==="result"?"RESULT RECEIVED":state.toUpperCase());
 output(text+(state==="result"?"\n\n[exit code: "+code+"]":""));
};
function check(){
 if(!window.AndroidTermux){status("NATIVE BRIDGE UNAVAILABLE");return}
 const installed=AndroidTermux.isInstalled();
 const permitted=AndroidTermux.hasRunPermission();
 status(!installed?"TERMUX NOT INSTALLED":permitted?"CONNECTED / PERMISSION GRANTED":"TERMUX FOUND / PERMISSION NEEDED");
}
document.querySelectorAll("#termuxWorkspace [data-cmd]").forEach(button=>button.addEventListener("click",()=>{
 const id=button.dataset.cmd;
 if(!window.AndroidTermux){output("Native Android bridge is unavailable in this build.");return}
 if(!AndroidTermux.isInstalled()){output("Install Termux from the official F-Droid source first.");status("TERMUX NOT INSTALLED");return}
 if(!AndroidTermux.hasRunPermission()){output("Requesting Android permission. If no prompt appears, open App info > Permissions > Additional permissions.");AndroidTermux.requestRunPermission();return}
 if(!confirm("Run this read-only diagnostic in Termux?\n\n"+button.textContent))return;
 output("$ "+button.textContent+"\nSending command to Termux…");status("COMMAND SENT");
 AndroidTermux.runDiagnostic(id);
}));
document.getElementById("txPermission").addEventListener("click",()=>{
 if(!window.AndroidTermux){output("Native bridge unavailable.");return}
 if(!AndroidTermux.isInstalled()){output("Termux is not installed.");return}
 if(AndroidTermux.hasRunPermission()){output("Permission already granted.");check();return}
 AndroidTermux.requestRunPermission();
});
link.addEventListener("click",()=>{document.querySelectorAll(".page-section").forEach(x=>x.classList.toggle("active",x===page));document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x===link));document.getElementById("pageTitle").textContent="Termux Terminal";document.getElementById("sidebar").classList.remove("open")});
document.querySelectorAll(".nav-link").forEach(a=>{if(a!==link)a.addEventListener("click",()=>{if(a.dataset.page!=="termux"){page.classList.remove("active");link.classList.remove("active")}})});
check();
})();