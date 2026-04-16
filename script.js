/* ============================================================
   KINE — Single Page Application Controller
   ============================================================ */

(function () {
  'use strict';

  // ---- Constants ----
  const NAV_SCREENS = ['home-dashboard', 'live-posture', 'journey', 'analytics', 'settings-hub'];
  const DEFAULT_SCREEN = 'splash-screen';

  // ---- State ----
  let currentScreen = null;
  let previousScreen = null;
  let postureInterval = null;

  // ---- Data Variables ----
  window.USER_TREND_WEEKLY = [78, 85, 92, 65, 88, 95, 82]; // Monday to Sunday
  window.USER_TREND_LABELS_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  window.USER_TREND_DAILY = [60, 65, 80, 75, 90, 85, 78, 82]; // 8 AM to 10 PM
  window.USER_TREND_LABELS_DAY = ['8A', '10A', '12P', '2P', '4P', '6P', '8P', '10P'];

  // ================================================================
  // ROUTING
  // ================================================================

  /**
   * Navigate to a screen by its ID (without the "screen-" prefix internally,
   * but the actual section id uses the full name like "home-dashboard").
   */
  function MapsTo(screenId) {
    const targetId = screenId.startsWith('screen-') ? screenId : screenId;
    const allScreens = document.querySelectorAll('.screen');
    const overlays = document.querySelectorAll('.overlay-screen');
    const target = document.getElementById(targetId);

    if (!target) {
      console.warn(`[KINE Router] Screen "${targetId}" not found.`);
      return;
    }

    // Store previous for back navigation
    if (currentScreen && currentScreen !== targetId) {
      previousScreen = currentScreen;
    }

    // Hide all screens
    allScreens.forEach(s => s.classList.remove('active'));
    overlays.forEach(o => o.classList.remove('active'));

    // Show target
    target.classList.add('active');
    currentScreen = targetId;

    // Update nav state
    updateNavActive(targetId);

    // Show/hide nav based on screen group
    toggleNavVisibility(targetId);

    // Clean up intervals
    cleanUpScreen();

    // Screen-specific init
    initScreen(targetId);

    // Scroll to top
    window.scrollTo(0, 0);
  }

  function goBack() {
    if (previousScreen) {
      MapsTo(previousScreen);
    }
  }

  function updateNavActive(screenId) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.screen === screenId) {
        item.classList.add('active');
      }
    });
  }

  function toggleNavVisibility(screenId) {
    const bottomNav = document.querySelector('.bottom-nav');
    const sideNav = document.querySelector('.side-nav');
    const noNavScreens = [
      'splash-screen', 'intro-screens', 'sign-up', 'log-in', 'forgot-password',
      'wear-instruction', 'bluetooth-pairing', 'pairing-success',
      'first-calibration', 'calibration-success', 'user-selection', 'add-profile', 'profile-calib'
    ];

    const shouldHideNav = noNavScreens.includes(screenId);
    if (bottomNav) bottomNav.style.display = shouldHideNav ? 'none' : '';
    if (sideNav) sideNav.style.display = shouldHideNav ? 'none' : '';
  }

  // ================================================================
  // SCREEN-SPECIFIC INITIALIZATION
  // ================================================================

  function initScreen(screenId) {
    switch (screenId) {
      case 'splash-screen':
        // Auto-advance after 2.5s
        setTimeout(() => MapsTo('intro-screens'), 2500);
        break;

      case 'home-dashboard':
        animateProgressRing();
        animateStats();
        if (window.KINE_Charts) {
          KINE_Charts.renderTrendChart('dashboard-trend-svg', window.USER_TREND_WEEKLY);
          KINE_Charts.renderLabels('dashboard-chart-labels', window.USER_TREND_LABELS_WEEK);
        }
        break;

      case 'live-posture':
        startPostureSimulation();
        break;

      case 'analytics':
        initSegmentedToggle();
        break;

      case 'journey':
        animateLevelBar();
        break;
    }
  }

  function cleanUpScreen() {
    if (postureInterval) {
      clearInterval(postureInterval);
      postureInterval = null;
    }
  }

  // ================================================================
  // HOME DASHBOARD
  // ================================================================

  function animateProgressRing() {
    const ring = document.querySelector('#home-dashboard .ring-fill');
    if (!ring) return;

    const radius = ring.getAttribute('r');
    const circumference = 2 * Math.PI * radius;
    const score = 78; // Mock score
    const offset = circumference - (score / 100) * circumference;

    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;

    requestAnimationFrame(() => {
      setTimeout(() => {
        ring.style.strokeDashoffset = offset;
      }, 200);
    });

    // Update score text
    const valueEl = document.querySelector('#home-dashboard .ring-value');
    if (valueEl) {
      animateCounter(valueEl, 0, score, 1000);
    }
  }

  function animateStats() {
    const statValues = document.querySelectorAll('#home-dashboard .stat-value');
    const targets = [12, 5, 6.2];
    statValues.forEach((el, i) => {
      if (targets[i] !== undefined) {
        const isDecimal = !Number.isInteger(targets[i]);
        animateCounter(el, 0, targets[i], 800 + i * 200, isDecimal ? 1 : 0, el.dataset.suffix || '');
      }
    });
  }

  function animateCounter(el, from, to, duration, decimals = 0, suffix = '') {
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = from + (to - from) * eased;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ================================================================
  // LIVE POSTURE
  // ================================================================

  function startPostureSimulation() {
    const indicator = document.querySelector('.posture-indicator');
    const statusText = document.querySelector('.status-text');
    if (!indicator || !statusText) return;

    let isAligned = true;
    function toggle() {
      isAligned = !isAligned;
      if (isAligned) {
        indicator.classList.remove('slouching');
        indicator.classList.add('zenith-glow');
        indicator.innerHTML = '<i class="ph ph-check-circle"></i>';
        statusText.textContent = 'Zenith State';
        statusText.classList.remove('bad');
      } else {
        indicator.classList.remove('zenith-glow');
        indicator.classList.add('slouching');
        indicator.innerHTML = '<i class="ph ph-warning-circle"></i>';
        statusText.textContent = 'Deviated';
        statusText.classList.add('bad');
      }
    }

    postureInterval = setInterval(toggle, 4000);
  }

  // ================================================================
  // ANALYTICS
  // ================================================================

  function initSegmentedToggle() {
    const toggleBtns = document.querySelectorAll('#analytics .seg-toggle button');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // ================================================================
  // JOURNEY / GAMIFICATION
  // ================================================================

  function animateLevelBar() {
    const fill = document.querySelector('.level-fill');
    if (!fill) return;
    fill.style.width = '0%';
    requestAnimationFrame(() => {
      setTimeout(() => {
        fill.style.width = '65%';
      }, 300);
    });
  }

  // ================================================================
  // UI COMPONENTS
  // ================================================================

  // Toggle Switches
  function initToggleSwitches() {
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', function () {
        // The CSS handles the visual state via :checked
        // Fire a custom event for extensibility
        this.dispatchEvent(new CustomEvent('toggle-change', { detail: { checked: this.checked } }));
      });
    });
  }

  // Range Sliders
  function initRangeSliders() {
    document.querySelectorAll('.range-slider').forEach(slider => {
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      function updateValue() {
        if (valueDisplay) {
          valueDisplay.textContent = slider.value + '%';
        }
        // Update CSS gradient for filled portion
        const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${pct}%, var(--surface-highest) ${pct}%, var(--surface-highest) 100%)`;
      }
      slider.addEventListener('input', updateValue);
      updateValue();
    });
  }

  // Accordion
  function initAccordions() {
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', function () {
        const item = this.closest('.accordion-item');
        const isOpen = item.classList.contains('open');

        // Close all in same container
        item.parentElement.querySelectorAll('.accordion-item').forEach(ai => ai.classList.remove('open'));

        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });
  }

  // Mission Checkboxes
  function initMissionChecks() {
    document.querySelectorAll('.mission-check').forEach(check => {
      check.addEventListener('click', function () {
        this.classList.toggle('checked');
        if (this.classList.contains('checked')) {
          this.innerHTML = '<i class="ph ph-check"></i>';
        } else {
          this.innerHTML = '';
        }
      });
    });
  }

  // Badge click to show details
  function initBadgeClicks() {
    document.querySelectorAll('.badge-grid-item').forEach(item => {
      item.addEventListener('click', function () {
        const name = this.querySelector('span')?.textContent || 'Badge';
        const isLocked = this.querySelector('.badge-circle')?.classList.contains('locked');
        const modal = document.getElementById('badge-details');
        if (modal) {
          modal.querySelector('.badge-detail-name').textContent = name;
          modal.querySelector('.badge-detail-status').textContent = isLocked ? 'Locked — Keep going!' : 'Unlocked! ✨';
          modal.classList.add('active');
        }
      });
    });
  }

  // Close modals / overlays
  function initOverlayClose() {
    document.querySelectorAll('[data-close-overlay]').forEach(btn => {
      btn.addEventListener('click', function () {
        const overlay = this.closest('.overlay, .overlay-screen');
        if (overlay) overlay.classList.remove('active');
      });
    });
  }

  // Quick Switch Overlay
  function initQuickSwitch() {
    const openBtn = document.querySelector('[data-open-switch]');
    const overlay = document.getElementById('quick-switch-overlay');
    if (openBtn && overlay) {
      openBtn.addEventListener('click', () => overlay.classList.add('active'));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    }
  }

  // ================================================================
  // NAVIGATION
  // ================================================================

  function initNavigation() {
    // Shared navigation is now handled in nav.js to support MPA migration.
    // Screen-specific navigation can be added here if needed.
  }

  // ================================================================
  // INITIALIZATION
  // ================================================================

  function init() {
    initNavigation();
    initToggleSwitches();
    initRangeSliders();
    initAccordions();
    initMissionChecks();
    initBadgeClicks();
    initOverlayClose();
    initQuickSwitch();

    // Start on splash
    MapsTo(DEFAULT_SCREEN);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose router globally for inline onclick etc.
  window.MapsTo = MapsTo;
  window.goBack = goBack;

})();
