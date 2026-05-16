/**
 * FarmGuard — Dashboard Module
 */
function initDashboard() {
  loadDashboardData();
  drawHealthMini();
}

async function loadDashboardData() {
  try {
    const data = await apiFetch('/farm/overview');
    renderGrade(data.grade);
    renderWeatherWidget(data.weather);
    renderHealthWidget(data.health_pct);
    renderTaskWidget(data.pending_tasks, data.next_task);
    renderDiseaseWidget(data.active_diseases, data.latest_disease);
    renderAlerts(data.alerts);
    renderActivity(data.activities);
  } catch (e) {
    // Use defaults shown in HTML
    console.log('Using default dashboard data');
  }
}

function renderGrade(grade) {
  const banner = document.getElementById('gradeBanner');
  const letter = document.getElementById('gradeLetter');
  const title = document.getElementById('gradeTitle');
  const desc = document.getElementById('gradeDesc');
  if (!banner) return;

  const grades = {
    A: { class: 'grade-a', title: 'Everything is Optimal ✅', desc: 'Your farm is in excellent condition. No issues detected.' },
    B: { class: 'grade-b', title: 'Caution — Action Needed ⚠️', desc: 'Mild issues detected. Check disease alerts and weather forecast.' },
    C: { class: 'grade-c', title: 'Urgent Intervention Required 🚨', desc: 'Critical issues found. Immediate action needed on your farm.' }
  };
  const g = grades[grade] || grades['B'];
  banner.className = 'grade-banner ' + g.class;
  letter.textContent = grade || 'B';
  title.textContent = g.title;
  desc.textContent = g.desc;
}

function renderWeatherWidget(w) {
  if (!w) return;
  const el = (id) => document.getElementById(id);
  if (el('wTemp')) el('wTemp').textContent = w.temp + '°C';
  if (el('wHumidity')) el('wHumidity').textContent = 'Humidity: ' + w.humidity + '%';
  if (el('wRain')) el('wRain').textContent = w.rain_text || 'No rain expected';
}

function renderHealthWidget(pct) {
  if (document.getElementById('healthPct')) document.getElementById('healthPct').textContent = (pct || 78) + '%';
  drawHealthMini(pct || 78);
}

function renderTaskWidget(count, next) {
  if (document.getElementById('taskCount')) document.getElementById('taskCount').textContent = count || '3';
  if (document.getElementById('nextTask') && next) document.getElementById('nextTask').textContent = 'Next: ' + next;
}

function renderDiseaseWidget(count, latest) {
  if (document.getElementById('diseaseCount')) document.getElementById('diseaseCount').textContent = count || '1';
  if (document.getElementById('latestDisease') && latest) document.getElementById('latestDisease').textContent = latest;
}

function renderAlerts(alerts) {
  const bar = document.getElementById('alertsBar');
  if (!bar || !alerts || !alerts.length) return;
  bar.innerHTML = alerts.map(a => `<div class="alert-chip ${a.type}">${a.icon} ${a.text}</div>`).join('');
}

function renderActivity(acts) {
  const list = document.getElementById('activityList');
  if (!list || !acts) return;
  list.innerHTML = acts.map(a => `
    <div class="activity-item">
      <span class="activity-dot dot-${a.color}"></span>
      <div class="activity-content">
        <span class="activity-text">${a.text}</span>
        <span class="activity-time">${a.time}</span>
      </div>
    </div>`).join('');
}

function drawHealthMini(pct = 78) {
  const c = document.getElementById('healthMiniCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const cx = 30, cy = 30, r = 24;
  ctx.clearRect(0, 0, 60, 60);
  // Background arc
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 5; ctx.stroke();
  // Value arc
  const angle = (pct / 100) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, angle);
  ctx.strokeStyle = pct > 70 ? '#22c55e' : pct > 40 ? '#f59e0b' : '#ef4444';
  ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
}
