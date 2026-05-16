/**
 * FarmGuard — Farm Health & Disease Module
 */
let trendChartInstance = null;

function initFarmHealth() {
  drawNdviGauge(78); // Default fallback
  renderTrendChart('weekly');
}

function drawNdviGauge(pct) {
  const canvas = document.getElementById('ndviGauge');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h - 10;
  const r = 80;

  ctx.clearRect(0, 0, w, h);

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Value arc
  const angle = Math.PI + (pct / 100) * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, angle);
  ctx.strokeStyle = pct > 70 ? '#22c55e' : pct > 40 ? '#f59e0b' : '#ef4444';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function switchTrend(period, btn) {
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTrendChart(period);
}

function renderTrendChart(period) {
  const ctx = document.getElementById('diseaseTrendChart');
  if (!ctx) return;
  if (trendChartInstance) trendChartInstance.destroy();

  const isWeekly = period === 'weekly';
  const labels = isWeekly ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Week 1','Week 2','Week 3','Week 4'];
  const dataBlight = isWeekly ? [0, 0, 1, 2, 2, 1, 0] : [5, 8, 3, 1];
  const dataMildew = isWeekly ? [2, 3, 2, 1, 0, 0, 0] : [10, 4, 1, 0];

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Late Blight', data: dataBlight, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 },
        { label: 'Powdery Mildew', data: dataMildew, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0' } } },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
      }
    }
  });
}

function toggleDisease(headerEl) {
  const card = headerEl.parentElement;
  const wasOpen = card.classList.contains('open');
  // Close others
  document.querySelectorAll('.disease-card.open').forEach(c => {
    if(c !== card) c.classList.remove('open');
  });
  card.classList.toggle('open');
}

function showTab(btn, tabId) {
  const detail = btn.closest('.disease-detail');
  detail.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  detail.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  detail.querySelector('#' + tabId).classList.add('active');
}

async function resolveDisease(id) {
  const card = document.querySelector(`.disease-card[data-id="${id}"]`);
  if (!card) return;
  card.style.opacity = '0.5';
  card.style.pointerEvents = 'none';
  try {
    await apiFetch(`/farm/diseases/${id}/resolve`, { method: 'POST' });
    showToast('Disease marked as resolved! 🎉', 'success');
    card.style.display = 'none';
  } catch (e) {
    showToast('Demo mode: Disease marked as resolved! 🎉', 'success');
    setTimeout(() => {
      card.style.transform = 'scale(0.9)';
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 300);
    }, 500);
  }
}
