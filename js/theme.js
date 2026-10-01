// Shared light/dark toggle for all three pages. Persists the viewer's choice
// in localStorage; with nothing stored, the page still follows the OS theme
// (see css/styles.css's prefers-color-scheme block) and this toggle just
// shows what that resolves to.
(function () {
  "use strict";
  const root = document.documentElement;
  const KEY = 'nascar-theme';

  function systemIsDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function currentTheme() {
    return localStorage.getItem(KEY) || (systemIsDark() ? 'dark' : 'light');
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.classList.toggle('is-dark', theme === 'dark');
    });
  }

  // Set the root attribute immediately (before the toggle button even exists
  // in the DOM) so there's no flash of the wrong theme on load.
  root.setAttribute('data-theme', currentTheme());
  // Re-apply once the toggle button exists, to sync its icon/aria-label.
  document.addEventListener('DOMContentLoaded', () => apply(currentTheme()));

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
  });
})();
