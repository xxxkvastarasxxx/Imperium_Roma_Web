/* ============================================================
   About-page: Scroll-reveal, Collapsible Journey & Warrior
   Marching Background — all in one file.

   PERFORMANCE NOTE
   Warriors are pre-rendered onto a <canvas> and exported as a
   single bitmap per row.  Each card therefore contains only TWO
   plain <div>s (one per row) with a CSS background-image —
   no child <img> elements, no SVG re-rasterisation during
   scroll or animation.  Total animated DOM nodes: 10.
   ============================================================ */
(function () {
    'use strict';

    /* ==========================================================
       §1  Scroll-reveal + Collapsible Journey Toggle
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

    /* ==========================================================
       §2  Warrior Marching Background  (Canvas pre-render)
       ========================================================== */

    var warriorSrcs = [
        '/assets/images/general/roman-warrior1.svg',
        '/assets/images/general/roman-warrior2.svg',
        '/assets/images/general/roman-warrior3.svg',
        '/assets/images/general/roman-warrior4.svg'
    ];

    var rowConfigs = [
        { top:    '8px', opacity: 0.18, speed: 35, size: 28 },
        { bottom: '8px', opacity: 0.12, speed: 48, size: 22 }
    ];

    var GAP   = 40;   /* px between warriors */
    var STRIP = 800;  /* one tile width (div is 2× for seamless loop) */

    var containers = document.querySelectorAll('.warrior-bg');
    if (!containers.length) return;

    /* ── Step 1: Load all 4 SVGs as raster Image objects ── */
    function loadImages(srcs) {
        return Promise.all(srcs.map(function (src) {
            return new Promise(function (resolve) {
                var img   = new Image();
                img.onload  = function () { resolve(img); };
                img.onerror = function () { resolve(null); };
                img.src = src;
            });
        }));
    }

    /* ── Step 2: Paint a horizontal tile onto a canvas ── */
    function renderTile(validImgs, size) {
        var canvas    = document.createElement('canvas');
        canvas.width  = STRIP;
        canvas.height = size;
        var ctx = canvas.getContext('2d');

        var x = 0;
        while (x < STRIP) {
            var img = validImgs[Math.floor(Math.random() * validImgs.length)];
            ctx.drawImage(img, x, 0, size, size);
            x += size + GAP;
        }
        return canvas.toDataURL('image/png');
    }

    /* ── Step 3: Create one row <div> with bitmap background ── */
    function buildRow(cfg, validImgs) {
        var row = document.createElement('div');
        row.className = 'warrior-row';
        row.style.opacity = cfg.opacity;
        row.style.setProperty('--march-duration', cfg.speed + 's');

        if (cfg.top    !== undefined) row.style.top    = cfg.top;
        if (cfg.bottom !== undefined) row.style.bottom = cfg.bottom;

        var dataUrl = renderTile(validImgs, cfg.size);

        row.style.width            = (STRIP * 2) + 'px';
        row.style.height           = cfg.size + 'px';
        row.style.backgroundImage  = 'url("' + dataUrl + '")';
        row.style.backgroundRepeat = 'repeat-x';
        row.style.backgroundSize   = STRIP + 'px ' + cfg.size + 'px';

        return row;
    }

    /* ── Step 4: Load images, then inject rows ── */
    loadImages(warriorSrcs).then(function (loaded) {
        var validImgs = loaded.filter(Boolean);
        if (!validImgs.length) return;

        for (var c = 0; c < containers.length; c++) {
            for (var r = 0; r < rowConfigs.length; r++) {
                containers[c].appendChild(buildRow(rowConfigs[r], validImgs));
            }
        }
    });
})();
