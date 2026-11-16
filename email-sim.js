(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("emailSimForm");
  if (!form) return;
  const input = $("emailSimAddress");
  const start = $("emailSimStart");
  const reset = $("emailSimReset");
  const bar = $("emailSimBar");
  const percent = $("emailSimPercent");
  const stage = $("emailSimStage");
  const terminal = $("emailSimTerminal");
  const result = $("emailSimResult");
  const duration = 90000;
  let running = false, startedAt = 0, timer = null, logIndex = 0;
  const stages = [
    {at:0,label:"Preparing email review workspace",lines:["[BOOT] Initializing email review workspace...","[CORE] Loading address parser and guidance library...","[CHECK] Preparing review checklist..."]},
    {at:8,label:"Checking email address format",lines:["[INPUT] Email address received for format review.","[PARSER] Checking address syntax...","[PARSER] Separating local part and domain...","[PARSER] Reviewing domain text structure..."]},
    {at:18,label:"Preparing account protection checklist",lines:["[CHECKLIST] Loading password security recommendations...","[CHECKLIST] Preparing multi-factor authentication guidance...","[CHECKLIST] Preparing recovery contact recommendations...","[CHECKLIST] Preparing active-session review guidance..."]},
    {at:32,label:"Reviewing security recommendations",lines:["[GUIDANCE] Reviewing unique-password best practices...","[GUIDANCE] Reviewing multi-factor authentication options...","[GUIDANCE] Reviewing recovery email and phone guidance...","[GUIDANCE] Reviewing suspicious-session safety steps..."]},
    {at:48,label:"Organizing review findings",lines:["[REPORT] Recording email format result...","[REPORT] Organizing account-protection checklist...","[REPORT] Preparing recovery-safety recommendations...","[REPORT] Formatting review sections..."]},
    {at:65,label:"Compiling security review report",lines:["[BUILD] Compiling report section 01/06...","[BUILD] Compiling report section 02/06...","[BUILD] Compiling report section 03/06...","[BUILD] Compiling report section 04/06...","[BUILD] Compiling report section 05/06...","[BUILD] Compiling report section 06/06...","[CHECK] Checking report formatting..."]},
    {at:82,label:"Finalizing review report",lines:["[FINAL] Completing address-format review...","[FINAL] Adding account-protection recommendations...","[FINAL] Preparing review summary..."]}
  ];
  function append(line) {
    const stamp = new Date().toLocaleTimeString();
    terminal.textContent += "[" + stamp + "] " + line + "\n";
    terminal.scrollTop = terminal.scrollHeight;
  }
  function setProgress(value) {
    const n = Math.max(0, Math.min(100, Math.floor(value)));
    bar.style.width = n + "%";
    percent.textContent = n + "%";
    bar.setAttribute("aria-valuenow", String(n));
  }
  function resetUI() {
    running = false;
    clearInterval(timer);
    timer = null;
    setProgress(0);
    stage.textContent = "READY — WAITING FOR INPUT";
    terminal.textContent = "[SYSTEM] Email security review ready.\n[SYSTEM] Enter an email address to begin.\n";
    result.hidden = true;
    start.disabled = false;
    start.textContent = "▶ START REVIEW";
    input.disabled = false;
    reset.hidden = true;
  }
  function finish() {
    clearInterval(timer);
    running = false;
    setProgress(100);
    stage.textContent = "REVIEW COMPLETE";
    append("[DONE] Email address review and guidance report completed.");
    append("[RESULT] Address-format review and account-protection guidance are ready.");
    result.innerHTML = "<strong>REVIEW COMPLETE</strong><span>Security review prepared for <b></b></span><small>Review covers email address format and account-protection recommendations.</small>";
    result.querySelector("b").textContent = input.value.trim();
    result.hidden = false;
    start.disabled = false;
    start.textContent = "↻ RUN AGAIN";
    input.disabled = false;
    reset.hidden = false;
  }
  function tick() {
    const elapsed = Date.now() - startedAt;
    const p = Math.min(100, elapsed / duration * 100);
    setProgress(p);
    let active = stages[0];
    for (const item of stages) if (p >= item.at) active = item;
    stage.textContent = active.label.toUpperCase();
    while (logIndex < stages.length && p >= stages[logIndex].at) {
      for (const line of stages[logIndex].lines) append(line);
      logIndex++;
    }
    if (p >= 100) finish();
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (running) return;
    if (!input.checkValidity()) { input.reportValidity(); return; }
    if (percent.textContent === "100%") resetUI();
    running = true;
    startedAt = Date.now();
    logIndex = 0;
    terminal.textContent = "";
    result.hidden = true;
    start.disabled = true;
    start.textContent = "REVIEW IN PROGRESS…";
    input.disabled = true;
    reset.hidden = false;
    append("[START] Beginning email address review and report preparation.");
    append("[INFO] Review includes address-format checks and general security guidance.");
    tick();
    timer = setInterval(tick, 250);
  });
  reset.addEventListener("click", resetUI);
  resetUI();
})();