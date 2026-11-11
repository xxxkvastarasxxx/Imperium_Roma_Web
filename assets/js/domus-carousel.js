/**
 * Domus tour: screenshot carousel (home page, "Tour" tab).
 *
 * All slides are stacked on one 16:9 stage and moved with transforms. The
 * active slide sits at 0; the one it replaces leaves towards -100% (+100% when
 * going back), and the incoming one is first parked on the opposite side with
 * no transition. That keeps the loop seamless: after the last slide the first
 * one simply comes in from the right again, instead of rewinding past the rest.
 *
 * It advances every INTERVAL ms and holds while someone is looking closely:
 * mouse hover, keyboard focus inside it, the pause button, another Domus tab
 * being open, the carousel being off screen, or the browser tab being hidden.
 * With prefers-reduced-motion it never starts on its own (the pause button can
 * still start it) and slides change instantly (see index.css).
 */
(() => {
  const INTERVAL = 5000;
  const SWIPE_MIN = 40; // px of horizontal travel that counts as a swipe

  function init(root) {
    const viewport = root.querySelector('.tour-carousel__viewport');
    const slides = Array.from(root.querySelectorAll('.tour-carousel__slide'));
    const dots = Array.from(root.querySelectorAll('.tour-carousel__dot'));
    const toggle = root.querySelector('.tour-carousel__toggle');
    const panel = root.closest('.domus-tab-panel');
    if (!viewport || slides.length < 2) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let timer = null;
    let userPaused = reducedMotion.matches;
    let hovered = false;
    let keyboardFocus = false;
    let onScreen = !('IntersectionObserver' in window);

    // Moves a slide to an offset. Without `animate` the jump is instant: the
    // transition is switched off, the position committed by forcing a layout,
    // then the transition restored for the next move.
    function place(slide, percent, animate) {
      if (!animate) slide.style.transition = 'none';
      slide.style.transform = 'translateX(' + percent + '%)';
      if (!animate) {
        void slide.offsetWidth;
        slide.style.transition = '';
      }
    }

    function show(to, dir) {
      to = (to + slides.length) % slides.length;
      if (to === index) return;
      if (dir === undefined) dir = to > index ? 1 : -1;
      const from = slides[index];
      const next = slides[to];
      place(next, dir * 100, false);
      place(from, -dir * 100, true);
      place(next, 0, true);
      from.setAttribute('aria-hidden', 'true');
      next.setAttribute('aria-hidden', 'false');
      if (dots[index]) dots[index].removeAttribute('aria-current');
      if (dots[to]) dots[to].setAttribute('aria-current', 'true');
      index = to;
    }

    const tabActive = () => !panel || panel.classList.contains('active');
    const running = () =>
      !userPaused && !hovered && !keyboardFocus && onScreen && !document.hidden && tabActive();

    // One timer, always re-armed from scratch, so any manual move restarts the
    // full interval instead of advancing again a moment later.
    function schedule() {
      clearTimeout(timer);
      timer = null;
      if (!running()) return;
      timer = setTimeout(() => {
        if (running()) show(index + 1, 1);
        schedule();
      }, INTERVAL);
    }

    function syncToggle() {
      root.classList.toggle('is-paused', userPaused);
      // Screen readers announce the new slide only while it is not rotating.
      viewport.setAttribute('aria-live', userPaused ? 'polite' : 'off');
      if (toggle) {
        const label = userPaused ? toggle.dataset.labelPlay : toggle.dataset.labelPause;
        if (label) toggle.setAttribute('aria-label', label);
      }
    }

    // Initial state: first slide in view, the rest parked to the right.
    slides.forEach((slide, i) => {
      place(slide, i === 0 ? 0 : 100, false);
      slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      const img = slide.querySelector('img');
      if (img) img.draggable = false; // a mouse drag must not start a native image drag
    });
    syncToggle();

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        show(i);
        schedule();
      });
    });

    if (toggle) {
      toggle.addEventListener('click', () => {
        userPaused = !userPaused;
        syncToggle();
        schedule();
      });
    }

    root.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      show(index + dir, dir);
      schedule();
    });

    // Hover only counts for a real mouse: on touch screens pointerenter fires on
    // tap and pointerleave may never follow, which would stop it for good.
    root.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovered = true;
      schedule();
    });
    root.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovered = false;
      schedule();
    });

    // Only keyboard focus holds it. A mouse click on a dot also focuses the
    // button, and that should restart the interval, not stop the carousel.
    const updateFocus = () => {
      let focusVisible = false;
      try {
        focusVisible = !!root.querySelector(':focus-visible');
      } catch (err) {
        focusVisible = root.contains(document.activeElement);
      }
      keyboardFocus = focusVisible;
      schedule();
    };
    root.addEventListener('focusin', updateFocus);
    root.addEventListener('focusout', () => setTimeout(updateFocus, 0));

    // Swipe / drag on the stage. touch-action: pan-y (CSS) keeps vertical page
    // scrolling with the browser while horizontal moves come here.
    let startX = null;
    let startY = 0;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
    });
    viewport.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
      const dir = dx < 0 ? 1 : -1;
      show(index + dir, dir);
      schedule();
    });
    viewport.addEventListener('pointercancel', () => {
      startX = null;
    });

    if (!onScreen) {
      let loaded = false;
      new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        // The parked slides sit outside the stage, where lazy loading may never
        // see them; fetch them once the carousel is near so no slide arrives blank.
        if (onScreen && !loaded) {
          loaded = true;
          root.querySelectorAll('img[loading="lazy"]').forEach((img) => {
            img.loading = 'eager';
          });
        }
        schedule();
      }, { threshold: 0.35 }).observe(root);
    }

    // domus-tabs.js toggles .active on the panel; resume or hold with it.
    if (panel && 'MutationObserver' in window) {
      new MutationObserver(schedule).observe(panel, { attributes: true, attributeFilter: ['class'] });
    }

    document.addEventListener('visibilitychange', schedule);

    const onMotionChange = () => {
      if (reducedMotion.matches) userPaused = true;
      syncToggle();
      schedule();
    };
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionChange);
    else if (reducedMotion.addListener) reducedMotion.addListener(onMotionChange);

    schedule();
  }

  function start() {
    document.querySelectorAll('.tour-carousel').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
