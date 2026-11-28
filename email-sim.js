(() => {
"use strict";
const $=id=>document.getElementById(id),form=$("emailSimForm");if(!form)return;
const input=$("emailSimAddress"),start=$("emailSimStart"),bar=$("emailSimBar"),percent=$("emailSimPercent"),stage=$("emailSimStage"),terminal=$("emailSimTerminal"),result=$("emailSimResult"),report=$("auditReport"),gen=$("generatePassword"),copy=$("copyPassword");
function log(s){terminal.textContent+="\\n"+s}
function assess(p){let c=[p.length>=12,p.length>=16,/[a-z]/.test(p),/[A-Z]/.test(p),/[0-9]/.test(p),/[^A-Za-z0-9]/.test(p),!/password|qwerty|admin|123456|letmein/i.test(p)];return {score:c.filter(Boolean).length,percent:Math.round(c.filter(Boolean).length/7*100),checks:c}}
function display(p){let d=assess(p),label=d.score<=2?"WEAK":d.score<=4?"MODERATE":d.score<=5?"STRONG":"VERY STRONG";bar.style.width=d.percent+"%";percent.textContent=d.percent+"%";bar.setAttribute("aria-valuenow",String(d.percent));stage.textContent=label+" · "+d.score+"/7 CHECKS";result.innerHTML="<strong>"+label+"</strong><small>"+d.score+" of 7 password-strength checks passed. Consider using a unique password of 16+ characters.</small>";result.hidden=false;report.textContent="STATUS: CHECK COMPLETE\\nSTRENGTH: "+label+"\\nCHECKS: "+d.score+"/7\\nMODE: LOCAL";terminal.textContent="[CHECK] Password assessed locally.\\n[RESULT] "+label+" ("+d.score+"/7 checks)";return d}
form.addEventListener("submit",e=>{e.preventDefault();display(input.value)});
gen.addEventListener("click",()=>{const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";let p="";for(let i=0;i<20;i++)p+=chars[Math.floor(Math.random()*chars.length)];input.value=p;display(p);log("[GENERATED] New password created locally.")});
copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(input.value);stage.textContent="PASSWORD COPIED";log("[COPY] Password copied to clipboard.")}catch(e){input.focus();input.select();stage.textContent="SELECT PASSWORD AND COPY";log("[INFO] Clipboard permission unavailable; select the text to copy.")}});
display(input.value);
})();