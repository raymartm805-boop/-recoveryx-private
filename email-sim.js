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
    {at:0,label:"Initializing local simulation environment",lines:["[BOOT] Starting isolated demonstration runtime...","[CORE] Loading visual terminal modules...","[SAFE] External network access: DISABLED","[SAFE] Credential capture modules: NOT PRESENT"]},
    {at:8,label:"Preparing email-format analysis",lines:["[INPUT] Email address accepted for display-only simulation.","[PARSER] Checking address syntax locally...","[PARSER] Normalizing domain text...","[NOTICE] No message sent. No mailbox connection opened."]},
    {at:18,label:"Building demonstration task queue",lines:["[QUEUE] Allocating local demo tasks: 128","[QUEUE] Generating synthetic task identifiers...","[WORKER] Starting visual worker pool 01/08...","[WORKER] Starting visual worker pool 08/08...","[TRACE] Creating fictional trace sequence..."]},
    {at:32,label:"Running simulated security diagnostics",lines:["[SCAN] Reviewing sample domain-format patterns...","[SCAN] Checking fictional DNS response fixtures...","[SCAN] Evaluating sample authentication-flow diagrams...","[ANALYSIS] Comparing synthetic policy records...","[ANALYSIS] No provider systems queried."]},
    {at:48,label:"Processing synthetic verification stages",lines:["[TASK] Simulating mailbox metadata stage...","[TASK] Simulating session-integrity stage...","[TASK] Simulating recovery-route stage...","[TASK] Simulating risk-scoring stage...","[ENGINE] Updating local demonstration state..."]},
    {at:65,label:"Compiling simulated diagnostic report",lines:["[BUILD] Compiling report section 01/06...","[BUILD] Compiling report section 02/06...","[BUILD] Compiling report section 03/06...","[BUILD] Compiling report section 04/06...","[BUILD] Compiling report section 05/06...","[BUILD] Compiling report section 06/06...","[CHECK] Verifying local report consistency..."]},
    {at:82,label:"Finalizing demonstration sequence",lines:["[FINAL] Closing synthetic worker tasks...","[FINAL] Clearing temporary in-memory demo values...","[FINAL] Preparing completion summary...","[SAFE] Confirmed: no account was accessed or modified."]}
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
    terminal.textContent = "[SYSTEM] Local email security demonstration ready.\n[SYSTEM] Enter an email address to begin.\n";
    result.hidden = true;
    start.disabled = false;
    start.textContent = "▶ START SIMULATION";
    input.disabled = false;
    reset.hidden = true;
  }
  function finish() {
    clearInterval(timer);
    running = false;
    setProgress(100);
    stage.textContent = "SIMULATION COMPLETE";
    append("[DONE] Demonstration sequence completed successfully.");
    append("[RESULT] This is a locally generated demo report, not an account access result.");
    result.innerHTML = "<strong>DEMO COMPLETE</strong><span>Simulation finished for <b></b></span><small>No login was attempted. No password or OTP was requested. No email account was accessed, checked, or changed.</small>";
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
    start.textContent = "SIMULATION RUNNING…";
    input.disabled = true;
    reset.hidden = false;
    append("[START] Beginning 90-second local demonstration.");
    append("[SAFE] This page performs no network requests and cannot access email accounts.");
    tick();
    timer = setInterval(tick, 250);
  });
  reset.addEventListener("click", resetUI);
  resetUI();
})();