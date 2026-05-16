/**
 * FarmGuard — Hash-based SPA Router
 */
const Router = {
  routes: {},
  currentPage: null,
  contentEl: null,
  initCallbacks: {},

  init(contentElId) {
    this.contentEl = document.getElementById(contentElId);
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  },

  register(path, templateUrl, initFn) {
    this.routes[path] = templateUrl;
    if (initFn) this.initCallbacks[path] = initFn;
  },

  async navigate() {
    const hash = window.location.hash || '#/dashboard';
    const path = hash.replace('#', '');
    const token = localStorage.getItem('farmguard-token');

    // Auth guard
    if (!token && path !== '/login') {
      window.location.hash = '#/login';
      return;
    }
    if (token && path === '/login') {
      window.location.hash = '#/dashboard';
      return;
    }

    const templateUrl = this.routes[path];
    if (!templateUrl) {
      window.location.hash = '#/dashboard';
      return;
    }

    // Load page
    try {
      this.contentEl.classList.add('page-exit');
      await new Promise(r => setTimeout(r, 150));

      const res = await fetch(templateUrl);
      const html = await res.text();
      this.contentEl.innerHTML = html;
      this.currentPage = path;

      this.contentEl.classList.remove('page-exit');
      this.contentEl.classList.add('page-enter');
      setTimeout(() => this.contentEl.classList.remove('page-enter'), 400);

      // Update nav
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === path);
      });

      // Call page init
      if (this.initCallbacks[path]) {
        this.initCallbacks[path]();
      }
    } catch (e) {
      console.error('Router error:', e);
      this.contentEl.innerHTML = '<div class="error-page"><h2>Page not found</h2></div>';
    }
  },

  go(path) {
    window.location.hash = '#' + path;
  }
};
