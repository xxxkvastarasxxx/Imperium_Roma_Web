// Domus features playful animation: gentle bobbing of cards and dynamic connector
(() => {
  const prefersReducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function init() {
  const section = document.querySelector('.domus-why-join');
    if (!section) return;
  const allowMotion = section.getAttribute('data-allow-motion') === 'true';
  const prefersReduced = prefersReducedQuery.matches;
  const useMotion = allowMotion || !prefersReduced;

    // Ensure SVG connector exists; create if missing
    let svg = section.querySelector('.features-connector');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'features-connector');
      svg.setAttribute('viewBox', '0 0 1000 300');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('role', 'presentation');
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', 'features-connector-stroke');
      grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
      const stops = [
        ['0%', '0.9'], ['50%', '0.6'], ['100%', '0.9']
      ];
      stops.forEach(([off, opa]) => {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s.setAttribute('offset', off);
        s.setAttribute('stop-color', '#ffcc00');
        s.setAttribute('stop-opacity', opa);
        grad.appendChild(s);
      });
      defs.appendChild(grad);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('id', 'features-connector-path');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', 'features-connector-pulses');
      svg.appendChild(defs);
      svg.appendChild(p);
      svg.appendChild(g);
      section.insertBefore(svg, section.querySelector('.domus-features'));
    }

    const path = section.querySelector('#features-connector-path');
    const pulses = section.querySelector('#features-connector-pulses');
    const grid = section.querySelector('.domus-features');
    const cards = Array.from(section.querySelectorAll('.domus-features .feature-card'));
    if (!svg || !path || !grid || cards.length < 2) return;

  // Utility to get positions relative to section/svg
  function relToSectionX(x) { return x - section.getBoundingClientRect().left; }
  function relToSvgY(y) { return y - svg.getBoundingClientRect().top; }

  // Resize SVG to cover grid area with padding
  function sizeSvg() {
    const sRect = section.getBoundingClientRect();
    const gRect = grid.getBoundingClientRect();
    const pad = 80;
    const top = Math.max(0, gRect.top - sRect.top - pad/2);
    const height = gRect.height + pad;
    svg.style.top = `${top}px`;
    svg.style.height = `${height}px`;
    const width = svg.clientWidth || section.clientWidth;
    svg.setAttribute('viewBox', `0 0 ${Math.max(width, 1000)} ${Math.max(height, 300)}`);
  }

  // Compute smoothed path across card anchor points
  function computePath() {
    const points = cards.map((card, i) => {
      const r = card.getBoundingClientRect();
      return {
        x: relToSectionX(r.left + r.width / 2),
        y: relToSvgY(r.top + r.height * 0.2), // near icon area
      };
    });
    if (points.length < 2) { path.setAttribute('d', ''); return; }
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const dx = (p1.x - p0.x) * 0.55;
      const midY = (p0.y + p1.y) / 2;
      d += ` C ${p0.x + dx},${midY} ${p1.x - dx},${midY} ${p1.x},${p1.y}`;
    }
    path.setAttribute('d', d);
    // Pulses
    if (pulses) {
      pulses.innerHTML = '';
      points.forEach((p, i) => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('class', 'pulse');
        c.setAttribute('cx', `${p.x}`);
        c.setAttribute('cy', `${p.y}`);
        c.setAttribute('r', '3.5');
        c.style.animationDelay = `${i * 0.25}s`;
        pulses.appendChild(c);
      });
    }
  }

    // Gentle animation loop for cards and connector
    let rafId;
    // Persistent phases ensure no visible reset on rAF restarts
    const phases = cards.map((_, i) => i * 0.8);
    function animate() {
      if (!useMotion) return; // honor reduced motion unless overridden
      // Slower, calmer motion
      cards.forEach((card, i) => {
        const amp = 3.5; // px
        const base = 0.35; // global speed scalar
        const speed = base + i * 0.04; // subtle variance
        phases[i] += speed; // accumulate phase in small steps
        const y = Math.sin(phases[i] * 0.015) * amp; // very slow
        const x = Math.cos(phases[i] * 0.011) * (amp * 0.4);
        card.style.transform = `translate(${x}px, ${y}px)`;
      });
      // After transforms, recompute path (throttle lightly via rAF cadence)
      computePath();
      rafId = requestAnimationFrame(animate);
    }

    function start() {
      sizeSvg();
      computePath();
  if (useMotion) rafId = requestAnimationFrame(animate);
    }

    // Events
    const ro = new ResizeObserver(() => { sizeSvg(); computePath(); });
    ro.observe(section);
    window.addEventListener('resize', () => { sizeSvg(); computePath(); });
    document.addEventListener('visibilitychange', () => {
  if (document.hidden && rafId) cancelAnimationFrame(rafId);
  else if (useMotion) rafId = requestAnimationFrame(animate);
    });

    // Start immediately if DOM is ready
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
