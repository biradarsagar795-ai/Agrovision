/**
 * FarmGuard — Disease Detection Module
 * Adapted from original script.js
 */
function initDetect() {
  const uploadZone = document.getElementById("detectUploadZone");
  const fileInput = document.getElementById("detectFileInput");
  const preview = document.getElementById("detectPreview");
  const previewImg = document.getElementById("detectPreviewImg");
  const analyzeBtn = document.getElementById("detectAnalyzeBtn");
  const clearBtn = document.getElementById("detectClearBtn");
  const newBtn = document.getElementById("detectNewBtn");
  const loading = document.getElementById("detectLoading");
  const results = document.getElementById("detectResults");
  const webcamBtn = document.getElementById("detectWebcamBtn");

  let selectedFile = null;

  // Cleanup old listeners if re-initializing
  const newUploadZone = uploadZone.cloneNode(true);
  uploadZone.parentNode.replaceChild(newUploadZone, uploadZone);
  const newFileInput = document.getElementById("detectFileInput");

  newUploadZone.addEventListener("click", () => newFileInput.click());
  newFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  newUploadZone.addEventListener("dragover", (e) => { e.preventDefault(); newUploadZone.classList.add("drag-over"); });
  newUploadZone.addEventListener("dragleave", () => newUploadZone.classList.remove("drag-over"));
  newUploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    newUploadZone.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) { showToast("Invalid file type", "error"); return; }
    if (file.size > 10 * 1024 * 1024) { showToast("File too large", "error"); return; }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      document.getElementById("detectFileName").textContent = file.name;
      document.getElementById("detectFileSize").textContent = (file.size / 1024 / 1024).toFixed(2) + " MB";
      preview.style.display = "block";
      results.style.display = "none";
      loading.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  function resetUI() {
    selectedFile = null;
    newFileInput.value = "";
    preview.style.display = "none";
    results.style.display = "none";
    loading.style.display = "none";
  }

  clearBtn.onclick = resetUI;
  newBtn.onclick = resetUI;

  analyzeBtn.onclick = async () => {
    if (!selectedFile) return;
    preview.style.display = "none";
    loading.style.display = "block";
    results.style.display = "none";

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(API_BASE + '/predict', { method: "POST", body: formData });
      if (!res.ok) throw new Error("Analysis failed");
      const result = await res.json();
      displayResults(result);
      showToast("Analysis complete!", "success");
      // Add to history/tasks API call could happen here
    } catch (e) {
      showToast(e.message, "error");
      preview.style.display = "block";
    } finally {
      loading.style.display = "none";
    }
  };

  function displayResults(result) {
    document.getElementById("detectResultImg").src = previewImg.src;
    document.getElementById("detectDiseaseName").textContent = result.disease;
    document.getElementById("detectPlantName").textContent = `🌱 ${result.plant} — ${result.condition}`;
    
    const badge = document.getElementById("detectStatusBadge");
    badge.textContent = result.is_healthy ? "✅ Healthy" : "⚠️ Diseased";
    badge.className = `status-badge ${result.is_healthy ? "healthy" : "diseased"}`;

    const conf = result.confidence;
    document.getElementById("detectConfValue").textContent = conf.toFixed(1) + "%";
    const bar = document.getElementById("detectConfBar");
    bar.style.width = "0%";
    bar.className = "confidence-bar-fill";
    if (conf < 50) bar.classList.add("low"); else if (conf < 80) bar.classList.add("medium");
    setTimeout(() => { bar.style.width = conf + "%"; }, 100);

    document.getElementById("detectDescription").textContent = result.description || "—";

    const symBox = document.getElementById("detectSymptomsBox");
    if (result.symptoms && result.symptoms.length > 0) {
      symBox.style.display = "block";
      document.getElementById("detectSymptoms").innerHTML = result.symptoms.map(s => `<li><span class="icon">⚠️</span><span>${s}</span></li>`).join("");
    } else {
      symBox.style.display = "none";
    }

    document.getElementById("detectTreatmentList").innerHTML = result.treatment.map((t, i) => `<li><span class="icon">${i + 1}.</span><span>${t}</span></li>`).join("");

    document.getElementById("detectTopPreds").innerHTML = (result.top_predictions || []).map(p => `
      <div class="prediction-item">
        <span class="name">${p.disease}</span><span class="score">${p.confidence.toFixed(1)}%</span>
      </div>`).join("");

    results.style.display = "block";
  }
}
