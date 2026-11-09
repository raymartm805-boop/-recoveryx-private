
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =====================================
  // RECOVERYX - LOCAL WORKSPACE
  // =====================================

  const STORAGE = {
    records: "rx_records_v4",
    history: "rx_history_v4",
    profile: "rx_profile_v4",
    compact: "rx_compact_v4",
    confirmDelete: "rx_confirm_delete_v4"
  };

  const PLATFORMS = [
    "Gmail",
    "Facebook",
    "Instagram",
    "TikTok",
    "Other"
  ];

  const STATUSES = [
    "Pending",
    "In Review",
    "Recovered",
    "Closed"
  ];

  const $ = (id) => document.getElementById(id);

  // =====================================
  // SAFE STORAGE
  // =====================================

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
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
  let history = readStorage(STORAGE.history, []);
  let profile = readStorage(STORAGE.profile, {
    fullName: "",
    email: "",
    displayName: "Account Owner"
  });

  if (!Array.isArray(records)) records = [];
  if (!Array.isArray(history)) history = [];

  // Normalize saved records safely.
  records = records.map((record) => ({
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
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString()
  }));

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
    writeStorage(STORAGE.records, records);
  }

  function saveHistory() {
    history = history.slice(0, 50);
    writeStorage(STORAGE.history, history);
  }

  function showToast(message) {
    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  function addHistory(action, details) {
    history.unshift({
      id: createReference(),
      action,
      details,
      date: new Date().toISOString()
    });

    saveHistory();
    renderHistory();
  }

  // =====================================
  // NAVIGATION
  // =====================================

  const navLinks = document.querySelectorAll(".nav-link");
  const pages = document.querySelectorAll(".page-section");

  const pageNames = {
    dashboard: "Dashboard",
    account: "Account Records",
    "recovery-tools": "Recovery Resources",
    "customer-support": "Customer Support",
    settings: "Settings"
  };

  function showPage(pageId) {
    const target = $(pageId);

    if (!target || !target.classList.contains("page-section")) {
      pageId = "dashboard";
    }

    pages.forEach((page) => {
      page.classList.toggle("active", page.id === pageId);
    });

    navLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        link.dataset.page === pageId
      );
    });

    const title = $("pageTitle");

    if (title) {
      title.textContent = pageNames[pageId] || "Dashboard";
    }

    $("sidebar")?.classList.remove("open");
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const pageId = link.dataset.page;

      showPage(pageId);

      history.replaceState(null, "", "#" + pageId);
    });
  });

  // =====================================
  // MOBILE MENU
  // =====================================

  $("menuToggle")?.addEventListener("click", () => {
    $("sidebar")?.classList.toggle("open");
  });

  // =====================================
  // ACCOUNT DIALOG
  // =====================================

  const dialog = $("accountDialog");
  const accountForm = $("accountForm");

  function openDialog() {
    if (!dialog) return;

    accountForm?.reset();

    const statusInput = $("recordStatus");

    if (statusInput) {
      statusInput.value = "Pending";
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
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
  $("closeDialog")?.addEventListener("click", closeDialog);
  $("cancelDialog")?.addEventListener("click", closeDialog);

  // =====================================
  // ADD RECORD
  // =====================================

  accountForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("recordName")?.value.trim();
    const platform = $("recordPlatform")?.value;
    const issue = $("recordIssue")?.value.trim();
    const status = $("recordStatus")?.value;

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

    saveRecords();

    addHistory(
      "Record added",
      newRecord.id + " - " + newRecord.name
    );

    closeDialog();
    renderAll();

    showToast("Record saved successfully.");
  });

  // =====================================
  // RECORD STATUS
  // =====================================

  function statusClass(status) {
    const classes = {
      "Pending": "status-pending",
      "In Review": "status-review",
      "Recovered": "status-completed",
      "Closed": "status-closed"
    };

    return classes[status] || "status-pending";
  }

  function updateStatus(id, newStatus) {
    if (!STATUSES.includes(newStatus)) return;

    const record = records.find((item) => item.id === id);

    if (!record) return;

    if (
      newStatus === "Recovered" &&
      !window.confirm(
        "Has the account owner confirmed that access has been restored?"
      )
    ) {
      renderAccounts();
      return;
    }

    const oldStatus = record.status;

    record.status = newStatus;
    record.updatedAt = new Date().toISOString();

    saveRecords();

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

    records = records.filter((item) => item.id !== id);

    saveRecords();

    addHistory(
      "Record deleted",
      record.id + " - " + record.name
    );

    renderAll();
    showToast("Record deleted.");
  }

  // =====================================
  // RENDER RECORDS
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

      return (
        matchesSearch &&
        matchesPlatform &&
        matchesStatus
      );
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">No matching records found.</td>
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
        >
          ${escapeHTML(item)}
        </option>
      `).join("");

      return `
        <tr>
          <td>${id}</td>
          <td>${name}</td>
          <td>${platform}</td>
          <td>
            <span class="status-badge ${statusClass(record.status)}">
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
              >
                Delete
              </button>
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

    const percent = total
      ? Math.round((recovered / total) * 100)
      : 0;

    if ($("totalAccounts")) {
      $("totalAccounts").textContent = total;
    }

    if ($("pendingAccounts")) {
      $("pendingAccounts").textContent = pending;
    }

    if ($("completedAccounts")) {
      $("completedAccounts").textContent = recovered;
    }

    if ($("reviewPercent")) {
      $("reviewPercent").textContent = percent + "%";
    }

    if ($("progressPercent")) {
      $("progressPercent").textContent = percent + "%";
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
      $("progressBar").style.width = percent + "%";
    }

    if ($("progressCounts")) {
      $("progressCounts").textContent =
        recovered + " of " + total + " records";
    }

    if ($("progressRing")) {
      $("progressRing").style.background =
        `conic-gradient(#22c55e ${percent}%, #e5e7eb ${percent}%)`;
    }

    renderChart({
      total,
      pending,
      review,
      recovered,
      closed: records.filter(
        (item) => item.status === "Closed"
      ).length
    });
  }

  // =====================================
  // SIMPLE ACTIVITY CHART
  // =====================================

  function renderChart(stats) {
    const canvas = $("activityChart");

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const width = canvas.clientWidth || 400;
    const height = 180;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

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

    const maxValue = Math.max(1, ...values);
    const chartTop = 12;
    const chartBottom = 130;
    const chartHeight = chartBottom - chartTop;

    const barWidth = Math.min(42, width / 9);
    const gap = width / 5;

    context.font = "11px Arial";
    context.textAlign = "center";

    values.forEach((value, index) => {
      const x = gap * (index + 0.5) - barWidth / 2;
      const barHeight = (value / maxValue) * chartHeight;
      const y = chartBottom - barHeight;

      context.fillStyle = [
        "#f59e0b",
        "#8b5cf6",
        "#22c55e",
        "#64748b"
      ][index];

      context.fillRect(
        x,
        y,
        barWidth,
        Math.max(3, barHeight)
      );

      context.fillStyle = "#64748b";

      context.fillText(
        String(value),
        x + barWidth / 2,
        Math.max(10, y - 6)
      );

      context.fillText(
        labels[index],
        x + barWidth / 2,
        153
      );
    });
  }

  // =====================================
  // ACTIVITY HISTORY
  // =====================================

  function renderHistory() {
    const tableBody = $("historyTableBody");

    if (!tableBody) return;

    if (history.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3">No activity yet.</td>
        </tr>
      `;

      return;
    }

    tableBody.innerHTML = history.slice(0, 10).map((item) => `
      <tr>
        <td>${escapeHTML(item.action || "Activity")}</td>
        <td>${escapeHTML(item.details || "")}</td>
        <td>${formatDate(item.date)}</td>
      </tr>
    `).join("");
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
  }

  $("profileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    profile = {
      fullName: $("fullName")?.value.trim() || "",
      email: $("email")?.value.trim() || "",
      displayName:
        $("displayName")?.value.trim() || "Account Owner"
    };

    if (!writeStorage(STORAGE.profile, profile)) return;

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
      writeStorage(STORAGE.compact, compactToggle.checked);

      document.body.classList.toggle(
        "compact-mode",
        compactToggle.checked
      );
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
  // SUPPORT FORM
  // =====================================

  $("supportForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("supportName")?.value.trim() || "";
    const email = $("supportEmail")?.value.trim() || "";
    const category = $("supportCategory")?.value || "";
    const message = $("supportMessage")?.value.trim() || "";

    if (!name || !email || !message) {
      if ($("supportFeedback")) {
        $("supportFeedback").textContent =
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

    if ($("supportFeedback")) {
      $("supportFeedback").textContent =
        "Draft prepared locally. It has not been sent.";
    }

    addHistory(
      "Support draft prepared",
      category + " support request"
    );

    // Copy is optional; the draft remains visible in the message.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(draft).then(
        () => showToast("Support draft copied."),
        () => showToast("Support draft prepared.")
      );
    } else {
      showToast("Support draft prepared.");
    }
  });

  // =====================================
  // RENDER EVERYTHING
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

  saveRecords();

  renderAll();

  const initialPage = window.location.hash.replace("#", "");

  if (pageNames[initialPage]) {
    showPage(initialPage);
  } else {
    showPage("dashboard");
  }

  window.addEventListener("resize", () => {
    renderDashboard();
  });

  console.log("RecoveryX workspace initialized.");
});
