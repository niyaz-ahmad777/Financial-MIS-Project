const apiBase = "http://127.0.0.1:5000/api";
let authToken = localStorage.getItem("authToken");
let currentUsername = localStorage.getItem("currentUsername") || "Admin";
let currentRole = localStorage.getItem("currentRole") || "";
let dashboardChartsInitialized = false;
let txCurrentPage = 1;

function parseRoleFromToken(token) {
  if (!token || typeof token !== "string" || token.split(".").length < 2) {
    return "";
  }

  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const decoded = JSON.parse(atob(normalized));
    return String(decoded.role || "");
  } catch (_error) {
    return "";
  }
}

if (!currentRole) {
  currentRole = parseRoleFromToken(authToken);
  if (currentRole) {
    localStorage.setItem("currentRole", currentRole);
  }
}

function isAdminUser() {
  return String(currentRole).toLowerCase() === "admin";
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";
const protectedPages = ["dashboard.html", "transactions.html", "alerts.html", "reports.html", "profile.html"];

if (currentPage === "index.html" && authToken) {
  window.location.href = "dashboard.html";
}

if (protectedPages.includes(currentPage) && !authToken) {
  window.location.href = "index.html";
}

function authHeaders(extraHeaders = {}) {
  return authToken
    ? { ...extraHeaders, Authorization: `Bearer ${authToken}` }
    : { ...extraHeaders };
}

async function apiGet(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: authHeaders(options.headers || {})
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      window.location.href = "index.html";
    }
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function apiRequest(path, method, payload) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: payload ? JSON.stringify(payload) : undefined
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUsername");
  localStorage.removeItem("currentRole");
  authToken = null;
  currentRole = "";
}

function initBackButtons() {
  document.querySelectorAll(".back-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const fallback = button.dataset.backHref || "dashboard.html";
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallback;
      }
    });
  });
}

function getInitials(username) {
  return username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getProfileData() {
  const role = isAdminUser() ? "Admin" : "Analyst";
  const normalizedUsername = String(currentUsername || "").trim();
  const email = normalizedUsername.includes("@")
    ? normalizedUsername.toLowerCase()
    : `${normalizedUsername.toLowerCase()}@company.com`;
  return {
    username: currentUsername,
    role,
    email
  };
}

function updateUserProfile() {
  const profile = getProfileData();
  const sidebarUsername = document.getElementById("sidebarUsername");
  const avatarInitials = document.getElementById("avatarInitials");
  const menuUsername = document.getElementById("menuUsername");
  const userPill = document.querySelector(".user-pill");

  if (sidebarUsername) sidebarUsername.textContent = profile.username;
  if (avatarInitials) avatarInitials.textContent = getInitials(profile.username);
  if (menuUsername) menuUsername.textContent = profile.username;
  if (userPill) userPill.innerHTML = `<i class="bi bi-person-circle"></i> ${profile.username}`;

  const profileUsername = document.getElementById("profileUsername");
  const profileRole = document.getElementById("profileRole");
  const profileEmail = document.getElementById("profileEmail");

  if (profileUsername) profileUsername.textContent = profile.username;
  if (profileRole) profileRole.textContent = profile.role;
  if (profileEmail) profileEmail.textContent = profile.email;
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailOrUsername = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailOrUsername, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        authToken = data.token;
        currentUsername = data.user.username;
        currentRole = data.user.role || "";
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUsername", data.user.username);
        localStorage.setItem("currentRole", currentRole);
        window.location.href = "dashboard.html";
      } else {
        message.textContent = data.message || "Invalid credentials";
      }
    } catch (_error) {
      message.textContent = "Login failed. Please try again.";
    }
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm_password = document.getElementById("registerConfirm").value;
    const registerMessage = document.getElementById("registerMessage");
    const loginMessage = document.getElementById("message");

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirm_password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        registerMessage.style.color = "#0f766e";
        registerMessage.textContent = "Registration successful. Please login with same email and password.";
        loginMessage.textContent = "";
        document.getElementById("username").value = email;
        document.getElementById("password").value = "";
        registerForm.reset();
      } else {
        registerMessage.style.color = "#b91c1c";
        registerMessage.textContent = data.message || "Registration failed";
      }
    } catch (_error) {
      registerMessage.style.color = "#b91c1c";
      registerMessage.textContent = "Registration failed. Please try again.";
    }
  });
}

const loginModal = document.getElementById("loginModal");
const dashboardLoginForm = document.getElementById("dashboardLoginForm");
const dashboardRegisterForm = document.getElementById("dashboardRegisterForm");
const closeLoginModal = document.getElementById("closeLoginModal");

function showLoginModal() {
  if (loginModal) {
    loginModal.classList.add("show");
    loginModal.setAttribute("aria-hidden", "false");
  }
}

function hideLoginModal() {
  if (loginModal) {
    loginModal.classList.remove("show");
    loginModal.setAttribute("aria-hidden", "true");
  }
}

if (closeLoginModal) {
  closeLoginModal.addEventListener("click", hideLoginModal);
}

if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      hideLoginModal();
    }
  });
}

if (dashboardLoginForm) {
  dashboardLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("dashboardLoginMessage");

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        authToken = data.token;
        currentUsername = data.user.username;
        currentRole = data.user.role || "";
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUsername", data.user.username);
        localStorage.setItem("currentRole", currentRole);
        hideLoginModal();
        location.reload();
      } else {
        message.textContent = data.message || "Invalid credentials";
      }
    } catch (_error) {
      message.textContent = "Login failed. Please try again.";
    }
  });
}

if (dashboardRegisterForm) {
  dashboardRegisterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm_password = document.getElementById("registerConfirm").value;
    const message = document.getElementById("dashboardRegisterMessage");

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirm_password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        authToken = data.token;
        currentUsername = data.user.username;
        currentRole = data.user.role || "";
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUsername", data.user.username);
        localStorage.setItem("currentRole", currentRole);
        hideLoginModal();
        location.reload();
      } else {
        message.textContent = data.message || "Registration failed";
      }
    } catch (_error) {
      message.textContent = "Registration failed. Please try again.";
    }
  });
}

function switchAuthTab(tab) {
  const modalLoginForm = document.getElementById("dashboardLoginForm");
  const registerForm = document.getElementById("dashboardRegisterForm");
  const loginTabBtn = document.getElementById("loginTabBtn");
  const registerTabBtn = document.getElementById("registerTabBtn");

  if (!modalLoginForm || !registerForm || !loginTabBtn || !registerTabBtn) {
    return;
  }

  if (tab === "login") {
    modalLoginForm.style.display = "block";
    registerForm.style.display = "none";
    loginTabBtn.style.borderBottom = "2px solid #0f766e";
    loginTabBtn.style.color = "#0f766e";
    registerTabBtn.style.borderBottom = "2px solid #ddd";
    registerTabBtn.style.color = "#999";
  } else {
    modalLoginForm.style.display = "none";
    registerForm.style.display = "block";
    registerTabBtn.style.borderBottom = "2px solid #0f766e";
    registerTabBtn.style.color = "#0f766e";
    loginTabBtn.style.borderBottom = "2px solid #ddd";
    loginTabBtn.style.color = "#999";
  }
}

window.switchAuthTab = switchAuthTab;

const logoutAction = document.getElementById("logoutAction");
if (logoutAction) {
  logoutAction.addEventListener("click", () => {
    clearSession();
  });
}

const profileLogout = document.getElementById("profileLogout");
if (profileLogout) {
  profileLogout.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}

const darkModeEnabled = localStorage.getItem("darkMode") === "true";
if (darkModeEnabled) {
  document.body.classList.add("dark");
}

const darkModeToggle = document.getElementById("darkModeToggle");
if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", String(document.body.classList.contains("dark")));
  });
}

const appToast = document.getElementById("appToast");
function showToast(message) {
  if (!appToast) return;
  appToast.textContent = message;
  appToast.classList.add("show");
  setTimeout(() => appToast.classList.remove("show"), 2000);
}

const notifyBtn = document.getElementById("notifyBtn");
if (notifyBtn) {
  notifyBtn.addEventListener("click", () => showToast("New threat intelligence synced."));
}

const fraudModal = document.getElementById("fraudModal");
const fraudModalText = document.getElementById("fraudModalText");
const closeFraudModal = document.getElementById("closeFraudModal");

function showFraudModal(message) {
  if (!fraudModal || !fraudModalText) return;
  fraudModalText.textContent = message;
  fraudModal.classList.add("show");
  fraudModal.setAttribute("aria-hidden", "false");
}

function hideFraudModal() {
  if (!fraudModal) return;
  fraudModal.classList.remove("show");
  fraudModal.setAttribute("aria-hidden", "true");
}

if (closeFraudModal) closeFraudModal.addEventListener("click", hideFraudModal);
if (fraudModal) {
  fraudModal.addEventListener("click", (event) => {
    if (event.target === fraudModal) hideFraudModal();
  });
}

const sidebarUser = document.getElementById("sidebarUser");
if (sidebarUser) {
  sidebarUser.addEventListener("click", () => {
    const menu = document.getElementById("profileMenu");
    if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
  });
}

document.addEventListener("click", (event) => {
  const profileMenu = document.getElementById("profileMenu");
  if (profileMenu && sidebarUser && !sidebarUser.contains(event.target) && !profileMenu.contains(event.target)) {
    profileMenu.style.display = "none";
  }
});

async function loadDashboard() {
  const kpiTransactions = document.getElementById("kpiTransactions");
  if (!kpiTransactions) return;

  const [summary, transactionsPayload, alertsPayload] = await Promise.all([
    apiGet("/transactions/summary"),
    apiGet("/transactions"),
    apiGet("/alerts")
  ]);

  const transactions = transactionsPayload.transactions || [];
  const alerts = alertsPayload.alerts || [];
  const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  document.getElementById("kpiTransactions").textContent = summary.total_transactions;
  document.getElementById("kpiAlerts").textContent = summary.total_alerts;
  document.getElementById("kpiHighRisk").textContent = summary.high_risk;

  const totalAmountNode = document.getElementById("kpiTotalAmount");
  if (totalAmountNode) {
    totalAmountNode.textContent = `INR ${totalAmount.toLocaleString("en-IN")}`;
  }

  const latestBody = document.getElementById("latestTransactionsBody");
  if (latestBody) {
    latestBody.innerHTML = transactions
      .slice(0, 6)
      .map((tx) => {
        const isFraud = tx.risk === "HIGH";
        return `
          <tr>
            <td>${tx.id}</td>
            <td>${tx.account}</td>
            <td>${Number(tx.amount || 0).toLocaleString("en-IN")}</td>
            <td>${tx.type}</td>
            <td><span class="status-pill ${isFraud ? "fraud" : "normal"}" data-account="${tx.account}" data-amount="${tx.amount}">${isFraud ? "Fraud" : "Normal"}</span></td>
          </tr>
        `;
      })
      .join("");

    latestBody.querySelectorAll(".status-pill.fraud").forEach((node) => {
      node.addEventListener("click", () => {
        showFraudModal(
          `Transaction flagged: Account ${node.dataset.account}, Amount INR ${Number(node.dataset.amount || 0).toLocaleString("en-IN")}.`
        );
      });
    });
  }

  const recentAlertsList = document.getElementById("recentAlertsList");
  if (recentAlertsList) {
    recentAlertsList.innerHTML = alerts
      .slice(0, 4)
      .map((alert) => `
        <article class="alert-item">
          <div>
            <strong>${alert.message}</strong>
            <p>Alert ID: ${alert.id}</p>
          </div>
          <span class="alert-level ${alert.level}">${alert.level}</span>
        </article>
      `)
      .join("");
  }

  renderDashboardCharts(transactions, summary);
}

function renderDashboardCharts(transactions, summary) {
  if (dashboardChartsInitialized) return;

  const barCanvas = document.getElementById("barChart");
  const pieCanvas = document.getElementById("pieChart");
  if (!barCanvas || !pieCanvas || typeof Chart === "undefined") return;

  const monthlyMap = new Map();
  transactions.forEach((tx) => {
    const month = tx.created_at
      ? new Date(tx.created_at).toLocaleString("en-US", { month: "short" })
      : "Current";
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
  });

  const barLabels = [...monthlyMap.keys()];
  const barValues = [...monthlyMap.values()];

  new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: barLabels.length ? barLabels : ["Current"],
      datasets: [{
        label: "Transactions",
        data: barValues.length ? barValues : [0],
        borderRadius: 8,
        backgroundColor: ["#4f8fd9", "#3b82f6", "#1d4ed8", "#2563eb"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: { legend: { display: false } }
    }
  });

  const fraudulent = Number(summary.high_risk || 0);
  const legitimate = Math.max(Number(summary.total_transactions || 0) - fraudulent, 0);

  new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: ["Fraudulent", "Legitimate"],
      datasets: [{
        data: [fraudulent, legitimate],
        backgroundColor: ["#ef4444", "#22c55e"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: { legend: { position: "right" } }
    }
  });

  dashboardChartsInitialized = true;
}

function attachFraudModalHandlers(container) {
  container.querySelectorAll(".status-pill.fraud").forEach((node) => {
    node.addEventListener("click", () => {
      showFraudModal(
        `Transaction flagged: Account ${node.dataset.account}, Amount INR ${Number(node.dataset.amount || 0).toLocaleString("en-IN")}.`
      );
    });
  });
}

function openTxModal(tx = null) {
  const txModal = document.getElementById("txModal");
  const txModalTitle = document.getElementById("txModalTitle");
  const txId = document.getElementById("txId");
  const txAccount = document.getElementById("txAccount");
  const txAmount = document.getElementById("txAmount");
  const txType = document.getElementById("txType");
  const txFormMessage = document.getElementById("txFormMessage");

  if (!txModal || !txModalTitle || !txId || !txAccount || !txAmount || !txType) {
    return;
  }

  txFormMessage.textContent = "";
  if (tx) {
    txModalTitle.textContent = "Edit Transaction";
    txId.value = tx.id;
    txAccount.value = tx.account;
    txAmount.value = tx.amount;
    txType.value = tx.type;
  } else {
    txModalTitle.textContent = "Add Transaction";
    txId.value = "";
    txAccount.value = "";
    txAmount.value = "";
    txType.value = "transfer";
  }

  txModal.classList.add("show");
  txModal.setAttribute("aria-hidden", "false");
}

function closeTxModal() {
  const txModal = document.getElementById("txModal");
  if (!txModal) return;
  txModal.classList.remove("show");
  txModal.setAttribute("aria-hidden", "true");
}

async function loadTransactions() {
  const tbody = document.querySelector("#transactionsTable tbody");
  if (!tbody) return;

  const searchNode = document.getElementById("txSearch");
  const statusNode = document.getElementById("txFilterStatus");
  const search = searchNode ? searchNode.value.trim() : "";
  const status = statusNode ? statusNode.value : "all";

  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (status !== "all") query.set("status", status);

  const payload = await apiGet(`/transactions${query.toString() ? `?${query.toString()}` : ""}`);

  const sortNode = document.getElementById("txSortBy");
  const pageSizeNode = document.getElementById("txPageSize");
  const pageInfoNode = document.getElementById("txPageInfo");
  const countInfoNode = document.getElementById("txCountInfo");
  const prevBtn = document.getElementById("txPrevPage");
  const nextBtn = document.getElementById("txNextPage");

  const sortBy = sortNode ? sortNode.value : "id_desc";
  const pageSize = pageSizeNode ? Number(pageSizeNode.value || 10) : 10;

  const sorted = [...(payload.transactions || [])].sort((a, b) => {
    switch (sortBy) {
      case "id_asc":
        return Number(a.id) - Number(b.id);
      case "amount_desc":
        return Number(b.amount || 0) - Number(a.amount || 0);
      case "amount_asc":
        return Number(a.amount || 0) - Number(b.amount || 0);
      case "account_asc":
        return String(a.account || "").localeCompare(String(b.account || ""));
      case "account_desc":
        return String(b.account || "").localeCompare(String(a.account || ""));
      case "id_desc":
      default:
        return Number(b.id) - Number(a.id);
    }
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  txCurrentPage = Math.min(txCurrentPage, totalPages);
  const offset = (txCurrentPage - 1) * pageSize;
  const paged = sorted.slice(offset, offset + pageSize);

  if (pageInfoNode) {
    pageInfoNode.textContent = `Page ${txCurrentPage} of ${totalPages}`;
  }
  if (countInfoNode) {
    const start = sorted.length === 0 ? 0 : offset + 1;
    const end = Math.min(offset + pageSize, sorted.length);
    countInfoNode.textContent = `${start}-${end} of ${sorted.length} records`;
  }
  if (prevBtn) {
    prevBtn.disabled = txCurrentPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = txCurrentPage >= totalPages;
  }

  tbody.innerHTML = paged
    .map((tx) => {
      const isFraud = tx.risk === "HIGH";
      const riskText = isFraud
        ? `<span class="status-pill fraud" data-account="${tx.account}" data-amount="${tx.amount}">Fraud</span>`
        : `<span class="status-pill normal">Normal</span>`;
      const deleteButton = isAdminUser()
        ? `<button class="action-btn delete" data-id="${tx.id}">Delete</button>`
        : "";

      return `
        <tr>
          <td>${tx.id}</td>
          <td>${tx.account}</td>
          <td>${Number(tx.amount || 0).toLocaleString("en-IN")}</td>
          <td>${tx.type}</td>
          <td>${riskText}</td>
          <td class="actions-cell">
            <button class="action-btn edit" data-edit='${JSON.stringify(tx)}'>Edit</button>
            ${deleteButton}
          </td>
        </tr>
      `;
    })
    .join("");

  attachFraudModalHandlers(tbody);

  tbody.querySelectorAll(".action-btn.edit").forEach((node) => {
    node.addEventListener("click", () => {
      openTxModal(JSON.parse(node.dataset.edit));
    });
  });

  tbody.querySelectorAll(".action-btn.delete").forEach((node) => {
    node.addEventListener("click", async () => {
      const confirmed = window.confirm("Delete this transaction?");
      if (!confirmed) return;
      try {
        await apiRequest(`/transactions/${node.dataset.id}`, "DELETE");
        showToast("Transaction deleted");
        await loadTransactions();
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

async function loadAlerts() {
  const list = document.getElementById("alertsList");
  if (!list) return;

  const payload = await apiGet("/alerts");
  list.innerHTML = payload.alerts
    .map((alert) => {
      const text = String(alert.message || "").toLowerCase();
      const type = text.includes("login") ? "Multiple login attempts" : "High-value transaction";
      const level = String(alert.level || "MEDIUM").toLowerCase();
      return `
        <article class="alert-card">
          <h3>${type}</h3>
          <p>${alert.message}</p>
          <div class="alert-meta">Alert #${alert.id} | ${String(alert.created_at || "").replace("T", " ").slice(0, 19)}</div>
          <span class="badge ${level}">${alert.level}</span>
        </article>
      `;
    })
    .join("");
}

const reportButton = document.getElementById("generateReport");
if (reportButton) {
  reportButton.addEventListener("click", async () => {
    const status = document.getElementById("reportStatus");
    const period = document.getElementById("reportPeriod")?.value || "monthly";
    const format = document.getElementById("reportFormat")?.value || "csv";

    try {
      const response = await fetch(`${apiBase}/transactions/report?period=${period}&format=${format}`, {
        headers: authHeaders()
      });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions_${period}_report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      status.textContent = `Report downloaded (${period}, ${format.toUpperCase()}).`;
    } catch (_error) {
      status.textContent = "Failed to download report.";
    }
  });
}

const addTxBtn = document.getElementById("addTxBtn");
if (addTxBtn) {
  addTxBtn.addEventListener("click", () => openTxModal());
}

const closeTxModalBtn = document.getElementById("closeTxModal");
if (closeTxModalBtn) {
  closeTxModalBtn.addEventListener("click", closeTxModal);
}

const txModal = document.getElementById("txModal");
if (txModal) {
  txModal.addEventListener("click", (event) => {
    if (event.target === txModal) closeTxModal();
  });
}

const txSearch = document.getElementById("txSearch");
if (txSearch) {
  txSearch.addEventListener("input", () => {
    txCurrentPage = 1;
    loadTransactions().catch(() => {});
  });
}

const txFilterStatus = document.getElementById("txFilterStatus");
if (txFilterStatus) {
  txFilterStatus.addEventListener("change", () => {
    txCurrentPage = 1;
    loadTransactions().catch(() => {});
  });
}

const txSortBy = document.getElementById("txSortBy");
if (txSortBy) {
  txSortBy.addEventListener("change", () => {
    txCurrentPage = 1;
    loadTransactions().catch(() => {});
  });
}

const txPageSize = document.getElementById("txPageSize");
if (txPageSize) {
  txPageSize.addEventListener("change", () => {
    txCurrentPage = 1;
    loadTransactions().catch(() => {});
  });
}

const txPrevPage = document.getElementById("txPrevPage");
if (txPrevPage) {
  txPrevPage.addEventListener("click", () => {
    txCurrentPage = Math.max(1, txCurrentPage - 1);
    loadTransactions().catch(() => {});
  });
}

const txNextPage = document.getElementById("txNextPage");
if (txNextPage) {
  txNextPage.addEventListener("click", () => {
    txCurrentPage += 1;
    loadTransactions().catch(() => {});
  });
}

const txForm = document.getElementById("txForm");
if (txForm) {
  txForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const txId = document.getElementById("txId").value;
    const account = document.getElementById("txAccount").value.trim();
    const amount = Number(document.getElementById("txAmount").value);
    const type = document.getElementById("txType").value;
    const txFormMessage = document.getElementById("txFormMessage");

    try {
      if (txId) {
        await apiRequest(`/transactions/${txId}`, "PUT", { account, amount, type });
        showToast("Transaction updated");
      } else {
        await apiRequest("/transactions", "POST", { account, amount, type });
        showToast("Transaction created");
      }
      closeTxModal();
      await loadTransactions();
    } catch (error) {
      txFormMessage.textContent = error.message;
    }
  });
}

const reportRoleNote = document.getElementById("reportRoleNote");
if (reportRoleNote && isAdminUser()) {
  reportRoleNote.textContent = "You are logged in as admin.";
}

if (reportButton && !isAdminUser()) {
  reportButton.disabled = true;
  const reportStatus = document.getElementById("reportStatus");
  if (reportStatus) {
    reportStatus.textContent = "Only admin users can generate reports.";
  }
}

updateUserProfile();
initBackButtons();
loadDashboard().catch(() => {});
loadTransactions().catch(() => {});
loadAlerts().catch(() => {});
