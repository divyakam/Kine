/* ============================================================
   KINE — Shared Navigation & UI Components
   Multi-Page Application Controller
   ============================================================ */

(function () {
  'use strict';

  // ================================================================
  // PAGE NAVIGATION — Map screen IDs to page URLs
  // ================================================================

  const PAGE_MAP = {
    'sign-up': 'signup.html',
    'log-in': 'login.html',
    'forgot-password': 'forgot-password.html',
    'wear-instruction': 'setup.html',
    'user-selection': 'user-selection.html',
    'home-dashboard': 'dashboard.html',
    'live-posture': 'live-posture.html',
    'notifications': 'notifications.html',
    'analytics': 'analytics.html',
    'daily-timeline': 'timeline.html',
    'journey': 'journey.html',
    'leaderboard': 'leaderboard.html',
    'daily-missions': 'missions.html',
    'settings-hub': 'settings.html',
    'device-management': 'device-management.html',
    'recalibrate': 'recalibrate.html',
    'vibration-haptics': 'vibration.html',
    'smart-sleep': 'smart-sleep.html',
    'edit-profile': 'edit-profile.html',
    'help-support': 'help.html',
    'intro-screens': 'intro.html',
    'splash-screen': 'index.html',
    'state-disconnected': 'disconnected.html',
    'state-recalib-prompt': 'recalib-prompt.html',
    'state-empty': 'empty-state.html'
  };

  // Handle data-navigate clicks — navigate to the mapped page URL
  function initPageNavigation() {
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', function (e) {
        const target = this.dataset.navigate;
        const page = PAGE_MAP[target];
        if (page) {
          e.preventDefault();
          // Prevent redundant reloads
          if (window.location.pathname.endsWith(page)) return;
          window.location.href = page;
        }
      });
    });
  }

  // Handle data-back clicks — go to previous page
  function initBackButtons() {
    document.querySelectorAll('[data-back]').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        history.back();
      });
    });
  }

  // ================================================================
  // NAVIGATION — Active State Based on Current Page
  // ================================================================

  const NAV_MAP = {
    'dashboard': 'dashboard',
    'live-posture': 'live-posture',
    'journey': 'journey',
    'analytics': 'analytics',
    'settings': 'settings',
    'timeline': 'timeline',
    'leaderboard': 'leaderboard',
    'missions': 'missions',
    'device-management': 'device-management',
    'recalibrate': 'recalibrate',
    'vibration': 'vibration',
    'smart-sleep': 'smart-sleep',
    'notifications': 'notifications',
    'edit-profile': 'edit-profile',
    'help': 'help',
    'disconnected': 'dashboard',
    'recalib-prompt': 'settings',
    'empty-state': 'dashboard'
  };

  function highlightActiveNav() {
    // Standardize current file name extraction (handle root, file separators, and extensions)
    const path = window.location.pathname;
    const fileName = path.split(/[/\\]/).pop() || 'index.html';
    const currentFile = fileName.replace('.html', '') || 'index';

    // Exact match target
    const activeId = NAV_MAP[currentFile] || currentFile;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      // Check both data-page and title/text fallback
      if (item.dataset.page === activeId) {
        item.classList.add('active');
      }
    });
  }

  // ================================================================
  // UI COMPONENTS
  // ================================================================

  function initToggleSwitches() {
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', function () {
        this.dispatchEvent(new CustomEvent('toggle-change', { detail: { checked: this.checked } }));
      });
    });
  }

  function initRangeSliders() {
    document.querySelectorAll('.range-slider').forEach(slider => {
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      function updateValue() {
        if (valueDisplay) {
          valueDisplay.textContent = slider.value + '%';
        }
        const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        // Updated to use Obsidian Pulse variable
        slider.style.background = `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${pct}%, var(--surface-highest) ${pct}%, var(--surface-highest) 100%)`;
      }
      slider.addEventListener('input', updateValue);
      updateValue();
    });
  }

  function initAccordions() {
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', function () {
        const item = this.closest('.accordion-item');
        const isOpen = item.classList.contains('open');
        item.parentElement.querySelectorAll('.accordion-item').forEach(ai => ai.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });
  }

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

  function initOverlayClose() {
    document.querySelectorAll('[data-close-overlay]').forEach(btn => {
      btn.addEventListener('click', function () {
        const overlay = this.closest('.overlay, .overlay-screen');
        if (overlay) overlay.classList.remove('active');
      });
    });
  }

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

  function initSegmentedToggle() {
    document.querySelectorAll('.seg-toggle').forEach(toggle => {
      const btns = toggle.querySelectorAll('button');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });
  }

  // ================================================================
  // SIDEBAR ENHANCEMENTS
  // ================================================================

  function initBranding() {
    const navLogo = document.querySelector('.side-nav .nav-logo');
    if (navLogo) {
      navLogo.innerHTML = `
        <img src="logo.svg" alt="KINE Logo" class="brand-logo">
      `;
    }
  }

  // ================================================================
  // HAMBURGER MENU (Mobile)
  // ================================================================

  function initHamburgerMenu() {
    // Only initialize on mobile
    const isMobile = window.matchMedia('(max-width: 767px)');
    if (!isMobile.matches) return;

    const sideNav = document.querySelector('.side-nav');
    if (!sideNav) return;

    // --- Inject Hamburger Button ---
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    hamburger.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;
    document.body.appendChild(hamburger);

    // --- Make side-nav a mobile overlay menu ---
    sideNav.classList.add('mobile-overlay-menu');

    function openMenu() {
      sideNav.classList.add('menu-active');
      hamburger.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      sideNav.classList.remove('menu-active');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
      if (sideNav.classList.contains('menu-active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on nav item click
    sideNav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', closeMenu);
    });
  }

  function animateCounter(el, from, to, duration, decimals = 0, suffix = '') {
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = from + (to - from) * eased;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function init() {
    initBranding();
    initPageNavigation();
    initBackButtons();
    highlightActiveNav();
    initToggleSwitches();
    initRangeSliders();
    initAccordions();
    initMissionChecks();
    initBadgeClicks();
    initOverlayClose();
    initQuickSwitch();
    initSegmentedToggle();
    initHamburgerMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.KINE = { animateCounter };

})();
