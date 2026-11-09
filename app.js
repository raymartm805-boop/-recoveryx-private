document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =====================================
  // RECOVERYX - LOCAL WORKSPACE
  // =====================================

  const STORAGE = {
    records: "rx_records_v5",
    history: "rx_history_v5",
    profile: "rx_profile_v5",
    compact: "rx_compact_v5",
    confirmDelete: "rx_confirm_delete_v5"
  };

  const PLATFORMS = [
    "Facebook",
    "Instagram",
    "Gmail",
    "TikTok",
    "Other"
  ];

  const STATUSES = [
    "Pending",
    "In Review",
    "Recovered",
    "Closed"
  ];

  const PAGE_NAMES = {
    dashboard: "Dashboard",
    account: "Account Records",
    "recovery-tools": "Recovery Resources",
    "customer-support": "Customer Support",
    settings: "Settings"
  };

  const $ = (id) => document.getElementById(id);

  // =====================================
  // LOCAL STORAGE
  // =====================================

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error("Storage read error:", error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage write error:", error);
      showToast("Unable to save data in this browser.");
      return false;
    }
  }

  let records = readStorage(STORAGE.records, []);
  let activityHistory = readStorage(STORAGE.history, []);

  let profile = readStorage(STORAGE.profile, {
    fullName: "",
    email: "",
    displayName: "Account Owner"
  });

  if (!Array.isArray(records)) records = [];
  if (!Array.isArray(activityHistory)) activityHistory = [];

  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    profile = {
      fullName: "",
      email: "",
      displayName: "Account Owner"
    };
  }

  // =====================================
  // HELPERS
  // =====================================

  function createReference() {
    return "RX-" + Date.now().toString(36).toUpperCase();
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return replacements[character];
    });
  }

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function saveRecords() {
    return writeStorage(STORAGE.records, records);
  }

  function saveHistory() {
    activityHistory = activityHistory.slice(0, 50);
    return writeStorage(STORAGE.history, activityHistory);
  }

  let toastTimer;

  function showToast(message) {
    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  function addHistory(action, details) {
    activityHistory.unshift({
      id: createReference(),
      action: String(action),
      details: String(details),
      date: new Date().toISOString()
    });

    saveHistory();
    renderHistory();
  }

  function statusClass(status) {
    const classes = {
      "Pending": "status-pending",
      "In Review": "status-review",
      "Recovered": "status-completed",
      "Closed": "status-closed"
    };

    return classes[status] || "status-pending";
  }

  // =====================================
  // NORMALIZE RECORDS
  // =====================================

  records = records.map((record) => {
    record = record && typeof record === "object" ? record : {};

    return {
      id: String(record.id || createReference()),
      name: String(record.name || "Untitled record"),
      platform: PLATFORMS.includes(record.platform)
        ? record.platform
        : "Other",
      issue: String(record.issue || ""),
      status: STATUSES.includes(record.status)
        ? record.status
        : "Pending",
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt ||
        record.createdAt ||
        new Date().toISOString()
    };
  });

  // =====================================
  // NAVIGATION
  // =====================================

  const navLinks = document.querySelectorAll(".nav-link");
  const pages = document.querySelectorAll(".page-section");

  function showPage(pageId) {
    if (!PAGE_NAMES[pageId] || !$(pageId)) {
      pageId = "dashboard";
    }

    pages.forEach((page) => {
      page.classList.toggle("active", page.id === pageId);
    });

    navLinks.forEach((link) => {
      const active = link.dataset.page === pageId;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const title = $("pageTitle");

    if (title) {
      title.textContent = PAGE_NAMES[pageId];
    }

    $("sidebar")?.classList.remove("open");

    if (pageId === "dashboard") {
      renderChart();
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const pageId = link.dataset.page;

      showPage(pageId);

      // Use the browser history, not the activityHistory array.
      window.history.replaceState(null, "", "#" + pageId);
    });
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.go;

      showPage(pageId);
      window.history.replaceState(null, "", "#" + pageId);
    });
  });

  $("menuToggle")?.addEventListener("click", () => {
    $("sidebar")?.classList.toggle("open");
  });

  $("avatarButton")?.addEventListener("click", () => {
    showPage("settings");
    window.history.replaceState(null, "", "#settings");
  });

  // =====================================
  // ACCOUNT DIALOG
  // =====================================

  const dialog = $("accountDialog");
  const accountForm = $("accountForm");

  function openDialog() {
    if (!dialog || !accountForm) return;

    accountForm.reset();

    if ($("recordStatus")) {
      $("recordStatus").value = "Pending";
    }

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog() {
    if (!dialog) return;

    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  $("addAccountBtn")?.addEventListener("click", openDialog);
  $("addAccountBtn2")?.addEventListener("click", openDialog);
  $("addAccountBtn3")?.addEventListener("click", openDialog);

  $("closeDialog")?.addEventListener("click", closeDialog);
  $("cancelDialog")?.addEventListener("click", closeDialog);

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });

  // =====================================
  // ADD RECORD
  // =====================================

  accountForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("recordName")?.value.trim() || "";
    const platform = $("recordPlatform")?.value || "";
    const issue = $("recordIssue")?.value.trim() || "";
    const status = $("recordStatus")?.value || "";

    if (!name) {
      showToast("Please enter a record name.");
      return;
    }

    if (!PLATFORMS.includes(platform)) {
      showToast("Please select a valid platform.");
      return;
    }

    if (!STATUSES.includes(status)) {
      showToast("Please select a valid status.");
      return;
    }

    const now = new Date().toISOString();

    const newRecord = {
      id: createReference(),
      name,
      platform,
      issue,
      status,
      createdAt: now,
      updatedAt: now
    };

    records.unshift(newRecord);

    if (!saveRecords()) {
      records.shift();
      return;
    }

    addHistory(
      "Record added",
      newRecord.id + " - " + newRecord.name
    );

    closeDialog();
    renderAll();

    showToast("Record saved successfully.");
  });

  // =====================================
  // UPDATE STATUS
  // =====================================

  function updateStatus(id, newStatus) {
    if (!STATUSES.includes(newStatus)) return;

    const record = records.find((item) => item.id === id);

    if (!record) return;

    if (newStatus === "Recovered") {
      const confirmed = window.confirm(
        "Has the account owner confirmed that access has been restored?"
      );

      if (!confirmed) {
        renderAccounts();
        return;
      }
    }

    const oldStatus = record.status;
    const oldUpdatedAt = record.updatedAt;

    record.status = newStatus;
    record.updatedAt = new Date().toISOString();

    if (!saveRecords()) {
      record.status = oldStatus;
      record.updatedAt = oldUpdatedAt;
      renderAccounts();
      return;
    }

    addHistory(
      "Status updated",
      record.id + ": " + oldStatus + " → " + newStatus
    );

    renderAll();
    showToast("Status updated.");
  }

  // =====================================
  // DELETE RECORD
  // =====================================

  function deleteRecord(id) {
    const record = records.find((item) => item.id === id);

    if (!record) return;

    const confirmToggle = $("confirmDeleteToggle");

    const shouldConfirm = confirmToggle
      ? confirmToggle.checked
      : true;

    if (
      shouldConfirm &&
      !window.confirm("Delete this record from your local workspace?")
    ) {
      return;
    }

    const oldRecords = records.slice();

    records = records.filter((item) => item.id !== id);

    if (!saveRecords()) {
      records = oldRecords;
      renderAccounts();
      return;
    }

    addHistory(
      "Record deleted",
      record.id + " - " + record.name
    );

    renderAll();
    showToast("Record deleted.");
  }

  // =====================================
  // RENDER ACCOUNT RECORDS
  // =====================================

  function renderAccounts() {
    const tableBody = $("accountTableBody");

    if (!tableBody) return;

    const searchText = (
      $("accountSearch")?.value || ""
    ).toLowerCase().trim();

    const selectedPlatform =
      $("platformFilter")?.value || "all";

    const selectedStatus =
      $("statusFilter")?.value || "all";

    const filtered = records.filter((record) => {
      const searchableText = [
        record.id,
        record.name,
        record.platform,
        record.issue
      ].join(" ").toLowerCase();

      const matchesSearch =
        searchableText.includes(searchText);

      const matchesPlatform =
        selectedPlatform === "all" ||
        record.platform === selectedPlatform;

      const matchesStatus =
        selectedStatus === "all" ||
        record.status === selectedStatus;

      return matchesSearch && matchesPlatform && matchesStatus;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">
            No matching records found.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map((record) => {
      const id = escapeHTML(record.id);
      const name = escapeHTML(record.name);
      const platform = escapeHTML(record.platform);
      const status = escapeHTML(record.status);

      const options = STATUSES.map((item) => `
        <option
          value="${escapeHTML(item)}"
          ${record.status === item ? "selected" : ""}
        >${escapeHTML(item)}</option>
      `).join("");

      return `
        <tr>
          <td>${id}</td>
          <td>${name}</td>
          <td>${platform}</td>
          <td>
            <span class="status-pill ${statusClass(record.status)}">
              ${status}
            </span>
          </td>
          <td>${formatDate(record.createdAt)}</td>
          <td>
            <div class="record-actions">
              <select
                class="record-status-select"
                data-action="status"
                data-id="${id}"
                aria-label="Update status for ${name}"
              >
                ${options}
              </select>

              <button
                type="button"
                class="delete-btn"
                data-action="delete"
                data-id="${id}"
                aria-label="Delete ${name}"
              >Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  $("accountTableBody")?.addEventListener("change", (event) => {
    const select = event.target.closest(
      '[data-action="status"]'
    );

    if (!select) return;

    updateStatus(select.dataset.id, select.value);
  });

  $("accountTableBody")?.addEventListener("click", (event) => {
    const button = event.target.closest(
      '[data-action="delete"]'
    );

    if (!button) return;

    deleteRecord(button.dataset.id);
  });

  $("accountSearch")?.addEventListener("input", renderAccounts);
  $("platformFilter")?.addEventListener("change", renderAccounts);
  $("statusFilter")?.addEventListener("change", renderAccounts);

  // =====================================
  // DASHBOARD STATISTICS
  // =====================================

  function renderDashboard() {
    const total = records.length;

    const pending = records.filter(
      (item) => item.status === "Pending"
    ).length;

    const review = records.filter(
      (item) => item.status === "In Review"
    ).length;

    const recovered = records.filter(
      (item) => item.status === "Recovered"
    ).length;

    const closed = records.filter(
      (item) => item.status === "Closed"
    ).length;

    const recoveredPercent = total
      ? Math.round((recovered / total) * 100)
      : 0;

    const reviewPercent = total
      ? Math.round((review / total) * 100)
      : 0;

    if ($("totalAccounts")) {
      $("totalAccounts").textContent = total;
    }

    if ($("pendingAccounts")) {
      $("pendingAccounts").textContent = pending;
    }

    if ($("reviewAccounts")) {
      $("reviewAccounts").textContent = review;
    }

    if ($("completedAccounts")) {
      $("completedAccounts").textContent = recovered;
    }

    if ($("progressPercent")) {
      $("progressPercent").textContent =
        recoveredPercent + "%";
    }

    if ($("progressTitle")) {
      $("progressTitle").textContent = total
        ? recovered + " recovered record(s)"
        : "No completed records";
    }

    if ($("progressDescription")) {
      $("progressDescription").textContent = total
        ? "Summary of records marked recovered."
        : "Your record summary will appear here.";
    }

    if ($("progressBar")) {
      $("progressBar").style.width =
        recoveredPercent + "%";
    }

    if ($("progressCounts")) {
      $("progressCounts").textContent =
        recovered + " of " + total + " records";
    }

    if ($("progressRing")) {
      $("progressRing").style.setProperty(
        "--progress",
        recoveredPercent + "%"
      );
    }

    renderChart({
      pending,
      review,
      recovered,
      closed
    });
  }

  // =====================================
  // STATUS CHART
  // =====================================

  function renderChart(stats) {
    const canvas = $("activityChart");

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const width = Math.max(250, canvas.clientWidth || 400);
    const height = 190;
    const ratio = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const values = [
      stats.pending,
      stats.review,
      stats.recovered,
      stats.closed
    ];

    const labels = [
      "Pending",
      "Review",
      "Recovered",
      "Closed"
    ];

    const colors = [
      "#f59e0b",
      "#8b5cf6",
      "#22c55e",
      "#64748b"
    ];

    const maxValue = Math.max(1, ...values);
    const chartTop = 15;
    const chartBottom = 145;
    const chartHeight = chartBottom - chartTop;

    const sectionWidth = width / 4;
    const barWidth = Math.min(42, sectionWidth * 0.48);

    context.font = "11px Arial";
    context.textAlign = "center";

    values.forEach((value, index) => {
      const centerX = sectionWidth * (index + 0.5);
      const barHeight = (value / maxValue) * chartHeight;
      const x = centerX - barWidth / 2;
      const y = chartBottom - barHeight;

      context.fillStyle = colors[index];

      context.fillRect(
        x,
        y,
        barWidth,
        Math.max(3, barHeight)
      );

      context.fillStyle = "#c5d7ed";

      context.fillText(
        String(value),
        centerX,
        Math.max(11, y - 7)
      );

      context.fillStyle = "#8fa9c9";

      context.fillText(
        labels[index],
        centerX,
        170
      );
    });
  }

  // =====================================
  // ACTIVITY HISTORY
  // =====================================

  function renderHistory() {
    const tableBody = $("historyTableBody");

    if (!tableBody) return;

    if (activityHistory.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="table-empty">
            No activity yet.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = activityHistory
      .slice(0, 10)
      .map((item) => `
        <tr>
          <td>${escapeHTML(item.action || "Activity")}</td>
          <td>${escapeHTML(item.details || "")}</td>
          <td>${formatDate(item.date)}</td>
        </tr>
      `)
      .join("");
  }

  // =====================================
  // PROFILE SETTINGS
  // =====================================

  function renderProfile() {
    if ($("fullName")) {
      $("fullName").value = profile.fullName || "";
    }

    if ($("email")) {
      $("email").value = profile.email || "";
    }

    if ($("displayName")) {
      $("displayName").value =
        profile.displayName || "Account Owner";
    }

    const displayName =
      profile.displayName || "Account Owner";

    if ($("profileNameHeading")) {
      $("profileNameHeading").textContent = displayName;
    }

    if ($("profileInitial")) {
      $("profileInitial").textContent =
        displayName.charAt(0).toUpperCase();
    }

    if ($("avatarButton")) {
      $("avatarButton").textContent =
        displayName.charAt(0).toUpperCase();
    }
  }

  $("profileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const newProfile = {
      fullName: $("fullName")?.value.trim() || "",
      email: $("email")?.value.trim() || "",
      displayName:
        $("displayName")?.value.trim() || "Account Owner"
    };

    if (!writeStorage(STORAGE.profile, newProfile)) {
      return;
    }

    profile = newProfile;

    renderProfile();

    if ($("profileMessage")) {
      $("profileMessage").textContent =
        "Profile saved in this browser.";
    }

    showToast("Profile saved.");
  });

  // =====================================
  // DISPLAY PREFERENCES
  // =====================================

  const compactToggle = $("compactToggle");
  const confirmDeleteToggle = $("confirmDeleteToggle");

  if (compactToggle) {
    compactToggle.checked =
      readStorage(STORAGE.compact, false) === true;

    document.body.classList.toggle(
      "compact-mode",
      compactToggle.checked
    );

    compactToggle.addEventListener("change", () => {
      const enabled = compactToggle.checked;

      document.body.classList.toggle(
        "compact-mode",
        enabled
      );

      writeStorage(STORAGE.compact, enabled);
    });
  }

  if (confirmDeleteToggle) {
    confirmDeleteToggle.checked =
      readStorage(STORAGE.confirmDelete, true) !== false;

    confirmDeleteToggle.addEventListener("change", () => {
      writeStorage(
        STORAGE.confirmDelete,
        confirmDeleteToggle.checked
      );
    });
  }

  // =====================================
  // SUPPORT DRAFT
  // =====================================

  $("supportForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = $("supportName")?.value.trim() || "";
    const email = $("supportEmail")?.value.trim() || "";
    const category = $("supportCategory")?.value || "";
    const message = $("supportMessage")?.value.trim() || "";

    const feedback = $("supportFeedback");

    if (!name || !email || !message) {
      if (feedback) {
        feedback.textContent =
          "Please complete your name, email, and message.";
      }
      return;
    }

    const draft = [
      "RecoveryX Support Draft",
      "Name: " + name,
      "Email: " + email,
      "Category: " + category,
      "",
      "Message:",
      message
    ].join("\n");

    if (feedback) {
      feedback.textContent =
        "Draft prepared locally. It has not been sent.";
    }

    addHistory(
      "Support draft prepared",
      category + " support request"
    );

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draft);
        showToast("Support draft copied.");
      } else {
        showToast("Support draft prepared.");
      }
    } catch (error) {
      console.warn("Clipboard unavailable:", error);
      showToast("Support draft prepared, but not copied.");
    }
  });

  // =====================================
  // RENDER ALL
  // =====================================

  function renderAll() {
    renderAccounts();
    renderDashboard();
    renderHistory();
    renderProfile();
  }

  // =====================================
  // INITIALIZE
  // =====================================

  // Save normalized records without deleting existing entries.
  saveRecords();

  renderAll();

  const initialPage = window.location.hash.replace("#", "");

  if (PAGE_NAMES[initialPage]) {
    showPage(initialPage);
  } else {
    showPage("dashboard");
  }

  window.addEventListener("resize", () => {
    renderChart();
  });

  console.log("RecoveryX workspace initialized.");
});
