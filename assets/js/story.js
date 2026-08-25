/* ============================================================
   About-page: Scroll-reveal + Collapsible Journey.
   ============================================================ */
(function () {
    'use strict';

    /* ==========================================================
       Scroll-reveal + Collapsible Journey Toggle
       ========================================================== */
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.milestone').forEach(function (m) {
        obs.observe(m);
    });

    /* Collapsible journey */
    var journey = document.querySelector('.journey');
    var btn     = document.getElementById('storyToggle');

    if (journey && btn) {
        journey.classList.add('journey--collapsed');

        btn.addEventListener('click', function () {
            var expanded = journey.classList.contains('journey--expanded');

            if (expanded) {
                journey.classList.remove('journey--expanded');
                journey.classList.add('journey--collapsed');
                btn.classList.remove('is-expanded');
                btn.querySelector('span').textContent = 'Show Full Story';
                btn.setAttribute('aria-expanded', 'false');
                document.getElementById('about').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                journey.classList.remove('journey--collapsed');
                journey.classList.add('journey--expanded');
                btn.classList.add('is-expanded');
                btn.querySelector('span').textContent = 'Show Less';
                btn.setAttribute('aria-expanded', 'true');

                /* Re-observe only milestones that haven't appeared yet */
                journey.querySelectorAll('.milestone:not(.is-visible)').forEach(function (m) {
                    obs.observe(m);
                });
            }
        });
    }
})();
