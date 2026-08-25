/* ============================================================
   Services page: reveal the certificate facts on scroll.
   Same is-visible convention used by the About-page journey.
   ============================================================ */
(function () {
    'use strict';

    var facts = document.querySelectorAll('.cert-fact');
    if (!facts.length) return;

    // Without the API (or with reduced motion) show everything immediately —
    // the CSS animates from opacity 0, so the content must not stay hidden.
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
        facts.forEach(function (f) { f.classList.add('is-visible'); });
        return;
    }

    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.25 });

    facts.forEach(function (f) { obs.observe(f); });
})();
