/**
 * FarmGuard — Auth Module
 */
function initLoginPage() {
  const phoneForm = document.getElementById('phoneForm');
  const otpForm = document.getElementById('otpForm');
  const farmSetup = document.getElementById('farmSetup');
  const phoneInput = document.getElementById('phoneInput');
  const otpInputs = document.querySelectorAll('.otp-digit');
  const resendBtn = document.getElementById('resendBtn');
  const timerSpan = document.getElementById('otpTimer');

  let currentPhone = '';
  let generatedOTP = '';
  let timerInterval = null;

  // Phone submit
  phoneForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    currentPhone = phoneInput.value.replace(/\s/g, '');
    if (currentPhone.length !== 10) { showToast('Enter valid 10-digit number', 'error'); return; }
    try {
      const data = await apiFetch('/auth/request-otp', { method: 'POST', body: { phone: currentPhone } });
      generatedOTP = data.otp_hint || '';
      if (generatedOTP) showToast(`Demo OTP: ${generatedOTP}`, 'info', 8000);
      document.getElementById('step1').classList.add('hidden');
      document.getElementById('step2').classList.remove('hidden');
      otpInputs[0]?.focus();
      startTimer(120);
    } catch (err) { showToast(err.message, 'error'); }
  });

  // OTP input auto-advance
  otpInputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      if (inp.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
      if (i === otpInputs.length - 1 && inp.value) verifyOTP();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && i > 0) otpInputs[i - 1].focus();
    });
  });

  // OTP verify
  otpForm?.addEventListener('submit', (e) => { e.preventDefault(); verifyOTP(); });

  async function verifyOTP() {
    const otp = Array.from(otpInputs).map(i => i.value).join('');
    if (otp.length !== 6) { showToast('Enter complete 6-digit OTP', 'error'); return; }
    try {
      const data = await apiFetch('/auth/verify-otp', { method: 'POST', body: { phone: currentPhone, otp } });
      localStorage.setItem('farmguard-token', data.token);
      if (data.is_new_user) {
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step3').classList.remove('hidden');
        detectLocation();
      } else {
        localStorage.setItem('farmguard-user', JSON.stringify(data.user));
        showToast('Welcome back! 🌾', 'success');
        Router.go('/dashboard');
      }
    } catch (err) { showToast(err.message, 'error'); otpInputs.forEach(i => { i.value = ''; }); otpInputs[0]?.focus(); }
  }

  // Farm setup
  farmSetup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const farmName = document.getElementById('farmName').value;
    const cropType = document.getElementById('cropType').value;
    const farmLat = document.getElementById('farmLat').value;
    const farmLon = document.getElementById('farmLon').value;
    try {
      const data = await apiFetch('/auth/setup-farm', {
        method: 'POST',
        body: { farm_name: farmName, crop_type: cropType, lat: parseFloat(farmLat) || 0, lon: parseFloat(farmLon) || 0 }
      });
      localStorage.setItem('farmguard-user', JSON.stringify(data.user));
      showToast('Farm setup complete! 🚜', 'success');
      Router.go('/dashboard');
    } catch (err) { showToast(err.message, 'error'); }
  });

  // Location detect
  function detectLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          document.getElementById('farmLat').value = pos.coords.latitude.toFixed(4);
          document.getElementById('farmLon').value = pos.coords.longitude.toFixed(4);
          showToast('Location detected!', 'success');
        },
        () => showToast('Could not detect location — enter manually', 'warning')
      );
    }
  }

  // Resend timer
  function startTimer(sec) {
    let remaining = sec;
    resendBtn.disabled = true;
    timerInterval = setInterval(() => {
      remaining--;
      timerSpan.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
      if (remaining <= 0) { clearInterval(timerInterval); resendBtn.disabled = false; timerSpan.textContent = ''; }
    }, 1000);
  }

  resendBtn?.addEventListener('click', async () => {
    try {
      const data = await apiFetch('/auth/request-otp', { method: 'POST', body: { phone: currentPhone } });
      generatedOTP = data.otp_hint || '';
      if (generatedOTP) showToast(`New OTP: ${generatedOTP}`, 'info', 8000);
      startTimer(120);
    } catch (err) { showToast(err.message, 'error'); }
  });
}
