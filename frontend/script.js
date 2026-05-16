/**
 * CropGuard AI — Frontend Application Logic
 * Handles: upload, preview, API calls, results display,
 *          dark mode, webcam, history, and toast notifications.
 */

// ── API Configuration ──────────────────────────────────────────
const API_BASE = window.location.origin;
const PREDICT_URL = `${API_BASE}/predict`;
const HEALTH_URL = `${API_BASE}/health`;

// ── DOM Elements ───────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const uploadZone     = $("uploadZone");
const fileInput      = $("fileInput");
const previewSection = $("previewSection");
const previewImg     = $("previewImg");
const fileName       = $("fileName");
const fileSize       = $("fileSize");
const analyzeBtn     = $("analyzeBtn");
const clearBtn       = $("clearBtn");
const loadingSection = $("loadingSection");
const resultsSection = $("resultsSection");
const resultImg      = $("resultImg");
const diseaseName    = $("diseaseName");
const plantName      = $("plantName");
const statusBadge    = $("statusBadge");
const confidenceValue= $("confidenceValue");
const confidenceBar  = $("confidenceBar");
const diseaseDesc    = $("diseaseDescription");
const symptomsContainer = $("symptomsContainer");
const symptomsList   = $("symptomsList");
const treatmentList  = $("treatmentList");
const topPredictions = $("topPredictions");
const newAnalysisBtn = $("newAnalysisBtn");
const historySection = $("historySection");
const historyGrid    = $("historyGrid");
const clearHistoryBtn= $("clearHistoryBtn");
const toastContainer = $("toastContainer");
const themeToggle    = $("themeToggle");
const modeBadge      = $("modeBadge");
const webcamBtn      = $("webcamBtn");
const webcamModal    = $("webcamModal");
const webcamVideo    = $("webcamVideo");
const webcamCanvas   = $("webcamCanvas");
const captureBtn     = $("captureBtn");
const cancelWebcam   = $("cancelWebcam");
const closeModal     = $("closeModal");

// ── State ──────────────────────────────────────────────────────
let selectedFile = null;
let webcamStream = null;

// ═══════════════════════════════════════════════════════════════
//  THEME MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function initTheme() {
  const saved = localStorage.getItem("cropguard-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  themeToggle.textContent = saved === "dark" ? "🌙" : "☀️";
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("cropguard-theme", next);
  themeToggle.textContent = next === "dark" ? "🌙" : "☀️";
});

// ═══════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

function showToast(message, type = "success", duration = 3500) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  toast.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ═══════════════════════════════════════════════════════════════
//  FILE UPLOAD & DRAG-AND-DROP
// ═══════════════════════════════════════════════════════════════

// Click to browse
uploadZone.addEventListener("click", () => fileInput.click());

// File selected via browse
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

// Drag events
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("drag-over");
});
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  // Client-side validation
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    showToast("Invalid file type. Please upload JPG, PNG, or WebP.", "error");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast("File too large. Maximum size is 10 MB.", "error");
    return;
  }

  selectedFile = file;
  showPreview(file);
}

// ═══════════════════════════════════════════════════════════════
//  IMAGE PREVIEW
// ═══════════════════════════════════════════════════════════════

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    fileName.textContent = file.name;
    fileSize.textContent = formatSize(file.size);

    // Show preview, hide others
    previewSection.classList.add("visible");
    resultsSection.classList.remove("visible");
    loadingSection.classList.remove("visible");
  };
  reader.readAsDataURL(file);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// Clear button
clearBtn.addEventListener("click", resetUI);
newAnalysisBtn.addEventListener("click", resetUI);

function resetUI() {
  selectedFile = null;
  fileInput.value = "";
  previewSection.classList.remove("visible");
  resultsSection.classList.remove("visible");
  loadingSection.classList.remove("visible");
}

// ═══════════════════════════════════════════════════════════════
//  ANALYZE — SEND TO API
// ═══════════════════════════════════════════════════════════════

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    showToast("Please select an image first.", "warning");
    return;
  }

  // Show loading, hide preview/results
  previewSection.classList.remove("visible");
  loadingSection.classList.add("visible");
  resultsSection.classList.remove("visible");

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(PREDICT_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error (${response.status})`);
    }

    const result = await response.json();
    displayResults(result);
    saveToHistory(result);
    showToast("Analysis complete!", "success");

  } catch (error) {
    console.error("Prediction error:", error);
    showToast(error.message || "Failed to analyze image. Please try again.", "error");
    previewSection.classList.add("visible");
  } finally {
    loadingSection.classList.remove("visible");
  }
});

// ═══════════════════════════════════════════════════════════════
//  DISPLAY RESULTS
// ═══════════════════════════════════════════════════════════════

function displayResults(result) {
  // Image
  resultImg.src = previewImg.src;

  // Disease name & plant
  diseaseName.textContent = result.disease;
  plantName.textContent = `🌱 ${result.plant} — ${result.condition}`;

  // Status badge
  statusBadge.textContent = result.is_healthy ? "✅ Healthy" : "⚠️ Diseased";
  statusBadge.className = `status-badge ${result.is_healthy ? "healthy" : "diseased"}`;

  // Confidence bar (animated)
  const conf = result.confidence;
  confidenceValue.textContent = conf.toFixed(1) + "%";
  confidenceBar.style.width = "0%";
  confidenceBar.className = "confidence-bar-fill";
  if (conf < 50) confidenceBar.classList.add("low");
  else if (conf < 80) confidenceBar.classList.add("medium");

  // Trigger animation after a short delay
  requestAnimationFrame(() => {
    setTimeout(() => { confidenceBar.style.width = conf + "%"; }, 100);
  });

  // Description
  diseaseDesc.textContent = result.description || "—";

  // Symptoms
  if (result.symptoms && result.symptoms.length > 0) {
    symptomsContainer.style.display = "block";
    symptomsList.innerHTML = result.symptoms
      .map((s) => `<li><span class="icon">⚠️</span><span>${s}</span></li>`)
      .join("");
  } else {
    symptomsContainer.style.display = "none";
  }

  // Treatment
  treatmentList.innerHTML = result.treatment
    .map((t, i) => `<li><span class="icon">${i + 1}.</span><span>${t}</span></li>`)
    .join("");

  // Top predictions
  topPredictions.innerHTML = (result.top_predictions || [])
    .map(
      (p) => `
      <div class="prediction-item">
        <span class="name">${p.disease}</span>
        <span class="score">${p.confidence.toFixed(1)}%</span>
      </div>`
    )
    .join("");

  // Show results section
  resultsSection.classList.add("visible");
}

// ═══════════════════════════════════════════════════════════════
//  PREDICTION HISTORY (localStorage)
// ═══════════════════════════════════════════════════════════════

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("cropguard-history") || "[]");
  } catch { return []; }
}

function saveToHistory(result) {
  const history = getHistory();
  history.unshift({
    disease: result.disease,
    confidence: result.confidence,
    is_healthy: result.is_healthy,
    plant: result.plant,
    time: new Date().toLocaleString(),
  });
  // Keep only last 10
  if (history.length > 10) history.pop();
  localStorage.setItem("cropguard-history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historySection.classList.remove("visible");
    return;
  }
  historySection.classList.add("visible");
  historyGrid.innerHTML = history
    .map(
      (h) => `
      <div class="history-card glass">
        <div class="h-top">
          <span class="h-disease">${h.disease}</span>
          <span class="h-conf">${h.confidence.toFixed(1)}%</span>
        </div>
        <div class="h-time">${h.time}</div>
      </div>`
    )
    .join("");
}

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("cropguard-history");
  renderHistory();
  showToast("History cleared.", "success");
});

// ═══════════════════════════════════════════════════════════════
//  WEBCAM CAPTURE
// ═══════════════════════════════════════════════════════════════

webcamBtn.addEventListener("click", async () => {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: 640, height: 480 },
    });
    webcamVideo.srcObject = webcamStream;
    webcamModal.classList.add("visible");
  } catch (err) {
    showToast("Camera access denied or not available.", "error");
  }
});

captureBtn.addEventListener("click", () => {
  const ctx = webcamCanvas.getContext("2d");
  webcamCanvas.width = webcamVideo.videoWidth;
  webcamCanvas.height = webcamVideo.videoHeight;
  ctx.drawImage(webcamVideo, 0, 0);

  webcamCanvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
      handleFile(file);
      closeWebcam();
      showToast("Image captured from webcam!", "success");
    }
  }, "image/jpeg", 0.9);
});

function closeWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach((t) => t.stop());
    webcamStream = null;
  }
  webcamVideo.srcObject = null;
  webcamModal.classList.remove("visible");
}

cancelWebcam.addEventListener("click", closeWebcam);
closeModal.addEventListener("click", closeWebcam);

// ═══════════════════════════════════════════════════════════════
//  HEALTH CHECK & INIT
// ═══════════════════════════════════════════════════════════════

async function checkHealth() {
  try {
    const res = await fetch(HEALTH_URL);
    const data = await res.json();
    if (data.mode === "simulation") {
      modeBadge.textContent = "Simulation";
      modeBadge.style.background = "rgba(245,158,11,0.15)";
      modeBadge.style.color = "#f59e0b";
    } else {
      modeBadge.textContent = "Live Model";
      modeBadge.style.background = "rgba(34,197,94,0.15)";
      modeBadge.style.color = "#22c55e";
    }
  } catch {
    modeBadge.textContent = "Offline";
    modeBadge.style.background = "rgba(239,68,68,0.15)";
    modeBadge.style.color = "#ef4444";
  }
}

// ── Initialize ─────────────────────────────────────────────────
initTheme();
renderHistory();
checkHealth();
