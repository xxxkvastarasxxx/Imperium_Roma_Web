// Domus split-screen tab navigation
(() => {
  function init() {
    const tabs = document.querySelectorAll('.domus-tab');
    const panels = document.querySelectorAll('.domus-tab-panel');
    const rightPanel = document.querySelector('.domus-right');
    if (!tabs.length || !panels.length) return;

    // Set initial ARIA + tabindex
    tabs.forEach((tab, i) => {
      tab.setAttribute('tabindex', i === 0 ? '0' : '-1');
    });
    panels.forEach(p => {
      p.setAttribute('aria-hidden', !p.classList.contains('active') ? 'true' : 'false');
    });

    function switchTab(targetTab) {
      const target = targetTab.dataset.tab;

      // Deactivate all tabs
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });

      // Hide all panels
      panels.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-hidden', 'true');
      });

      // Activate clicked tab
      targetTab.classList.add('active');
      targetTab.setAttribute('aria-selected', 'true');
      targetTab.setAttribute('tabindex', '0');

      const activePanel = document.getElementById(`domus-panel-${target}`);
      if (activePanel) {
        requestAnimationFrame(() => {
          activePanel.classList.add('active');
          activePanel.setAttribute('aria-hidden', 'false');
        });
      }

      // On mobile, scroll tab bar into view smoothly
      if (window.innerWidth <= 900 && rightPanel) {
        const tabNav = document.querySelector('.domus-tabs');
        if (tabNav) {
          const offset = tabNav.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      }
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab));
    });

    // Keyboard navigation (roving tabindex)
    const tabList = document.querySelector('.domus-tabs');
    if (tabList) {
      tabList.addEventListener('keydown', (e) => {
        const tabArr = Array.from(tabs);
        const current = tabArr.findIndex(t => t.classList.contains('active'));
        let next = -1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          next = (current + 1) % tabArr.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          next = (current - 1 + tabArr.length) % tabArr.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          next = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          next = tabArr.length - 1;
        }

        if (next >= 0) {
          switchTab(tabArr[next]);
          tabArr[next].focus();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
