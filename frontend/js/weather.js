/**
 * FarmGuard — Weather Module
 */
let tempChartInstance = null;
let rainChartInstance = null;

function initWeather() {
  loadWeatherData();
}

async function loadWeatherData() {
  try {
    const user = getUser();
    const lat = user?.lat || 20.5937;
    const lon = user?.lon || 78.9629;

    const [current, forecast] = await Promise.all([
      apiFetch(`/weather/current?lat=${lat}&lon=${lon}`),
      apiFetch(`/weather/forecast?lat=${lat}&lon=${lon}`)
    ]);

    renderCurrentWeather(current);
    renderForecast(forecast.daily);
    renderTempChart(forecast.hourly);
    renderRainChart(forecast.daily);
    renderSprayTable(forecast.daily);
    updateSprayBanner(current);
  } catch (e) {
    console.log('Weather: using defaults', e);
    renderDefaultWeather();
  }
}

function renderCurrentWeather(w) {
  const el = id => document.getElementById(id);
  const icons = { clear: '☀️', clouds: '☁️', rain: '🌧️', drizzle: '🌦️', thunderstorm: '⛈️', snow: '❄️', mist: '🌫️' };
  if (el('weatherIconBig')) el('weatherIconBig').textContent = icons[w.condition] || '🌤️';
  if (el('tempBig')) el('tempBig').textContent = Math.round(w.temp) + '°C';
  if (el('weatherDesc')) el('weatherDesc').textContent = w.description || 'Clear Sky';
  if (el('humidity')) el('humidity').textContent = w.humidity + '%';
  if (el('windSpeed')) el('windSpeed').textContent = w.wind_speed + ' km/h';
  if (el('feelsLike')) el('feelsLike').textContent = Math.round(w.feels_like) + '°C';
  if (el('uvIndex')) el('uvIndex').textContent = w.uv_index || '5';
  if (el('weatherLoc')) el('weatherLoc').textContent = '📍 ' + (w.location || 'Your Farm');
}

function updateSprayBanner(w) {
  const banner = document.getElementById('sprayBanner');
  const status = document.getElementById('sprayStatus');
  const detail = document.getElementById('sprayDetail');
  if (!banner) return;
  const safe = w.wind_speed < 15 && !w.rain_next_6h;
  banner.className = 'spray-banner ' + (safe ? 'spray-safe' : 'spray-unsafe');
  if (status) status.textContent = safe ? 'Safe to Spray ✅' : 'Not Safe to Spray ❌';
  if (detail) detail.textContent = safe
    ? `Wind ${w.wind_speed} km/h, No rain for 6h`
    : `Wind ${w.wind_speed} km/h${w.rain_next_6h ? ', Rain expected soon' : ''}`;
}

function renderForecast(days) {
  const strip = document.getElementById('forecastStrip');
  if (!strip || !days) return;
  const icons = { clear: '☀️', clouds: '☁️', rain: '🌧️', drizzle: '🌦️', thunderstorm: '⛈️' };
  strip.innerHTML = days.map(d => `
    <div class="forecast-day">
      <span class="fc-day">${d.day_name}</span>
      <span class="fc-icon">${icons[d.condition] || '🌤️'}</span>
      <span class="fc-temp">${d.temp_max}° / ${d.temp_min}°</span>
      <span class="fc-rain">${d.rain_prob}%💧</span>
    </div>`).join('');
}

function renderTempChart(hourly) {
  const ctx = document.getElementById('tempChart');
  if (!ctx) return;
  if (tempChartInstance) tempChartInstance.destroy();
  const labels = hourly ? hourly.map(h => h.time) : ['6AM','9AM','12PM','3PM','6PM','9PM','12AM'];
  const data = hourly ? hourly.map(h => h.temp) : [24,27,31,33,30,27,25];
  tempChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Temperature °C', data, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4, pointRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } } }
  });
}

function renderRainChart(days) {
  const ctx = document.getElementById('rainChart');
  if (!ctx) return;
  if (rainChartInstance) rainChartInstance.destroy();
  const labels = days ? days.map(d => d.day_name) : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const data = days ? days.map(d => d.precipitation) : [0,2,15,8,0,0,5];
  rainChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Precipitation (mm)', data, backgroundColor: 'rgba(56,189,248,0.5)', borderColor: '#38bdf8', borderWidth: 1, borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } } }
  });
}

function renderSprayTable(days) {
  const tbody = document.getElementById('sprayTableBody');
  if (!tbody || !days) return;
  tbody.innerHTML = days.slice(0, 3).map(d => {
    const safe = d.wind_avg < 15 && d.rain_prob < 30;
    return `<tr>
      <td>${d.day_name}</td>
      <td>${d.spray_window || '6:00-10:00 AM'}</td>
      <td>${d.wind_avg || 10} km/h</td>
      <td>${d.rain_prob}%</td>
      <td><span class="spray-status-dot ${safe ? 'dot-green' : 'dot-red'}">${safe ? '✅ Safe' : '❌ Risky'}</span></td>
    </tr>`;
  }).join('');
}

function renderDefaultWeather() {
  renderForecast([
    { day_name: 'Mon', condition: 'clear', temp_max: 34, temp_min: 24, rain_prob: 5 },
    { day_name: 'Tue', condition: 'clouds', temp_max: 32, temp_min: 23, rain_prob: 20 },
    { day_name: 'Wed', condition: 'rain', temp_max: 29, temp_min: 22, rain_prob: 75 },
    { day_name: 'Thu', condition: 'drizzle', temp_max: 28, temp_min: 21, rain_prob: 60 },
    { day_name: 'Fri', condition: 'clouds', temp_max: 30, temp_min: 22, rain_prob: 15 },
    { day_name: 'Sat', condition: 'clear', temp_max: 33, temp_min: 24, rain_prob: 5 },
    { day_name: 'Sun', condition: 'clear', temp_max: 35, temp_min: 25, rain_prob: 0 }
  ]);
  renderTempChart(null);
  renderRainChart(null);
  renderSprayTable([
    { day_name: 'Today', wind_avg: 8, rain_prob: 5, spray_window: '6:00-10:00 AM' },
    { day_name: 'Tomorrow', wind_avg: 12, rain_prob: 20, spray_window: '7:00-11:00 AM' },
    { day_name: 'Day After', wind_avg: 18, rain_prob: 75, spray_window: 'Not recommended' }
  ]);
}
