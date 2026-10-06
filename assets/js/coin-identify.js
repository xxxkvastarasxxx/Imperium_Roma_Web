/* ============================================================
   AI coin identification (Services page, "Coin Tools" section).

   The visitor adds an obverse (required) and reverse (optional)
   photo. Each is downscaled in the browser to at most 1568px on
   the long edge - the size the vision model works at - and sent
   as JPEG to /identify-coin.php, which asks Claude for a
   structured attribution and returns it as JSON.

   Everything the model returns is rendered with textContent,
   never innerHTML.
   ============================================================ */
(function () {
    'use strict';

    // Localised strings injected by the build (window.I18N); English literals are the fallback.
    const T = (window.I18N && window.I18N.js) || {};
    const t = function (key, fallback, vars) {
        return String(T[key] !== undefined ? T[key] : fallback)
            .replace(/\{(\w+)\}/g, function (m, n) { return vars && n in vars ? vars[n] : m; });
    };

    const ENDPOINT = '/identify-coin.php';
    const MAX_EDGE = 1568;          // px, long edge sent to the model
    const MAX_SOURCE = 25 * 1024 * 1024; // refuse absurd originals before decoding them
    const lang = (window.I18N && window.I18N.lang) || document.documentElement.lang || 'en';

    const form = document.getElementById('aiIdForm');
    const output = document.getElementById('aiIdOutput');
    const submit = document.getElementById('aiIdSubmit');
    if (!form || !output || !submit) return;

    const promiseHtml = output.innerHTML; // the idle "what you get" list, restored on reset
    const photos = { obverse: null, reverse: null }; // what is sent to the AI
    const thumbs = { obverse: null, reverse: null }; // square, coin centred, for display
    let busy = false;

    // ---------- helpers ----------
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function updateSubmit() {
        submit.disabled = busy || !photos.obverse;
    }

    // Free alternative: Google Lens visual search. Google offers no way to pass
    // the photo along, so the visitor uploads it there themselves. Google Images
    // (camera icon = Lens upload) is the entry point that works on desktop and
    // mobile; lens.google.com can land on Google's product page instead.
    function lensLink(className) {
        const a = el('a', className, t('aiid.lens', 'Search similar coins on Google Lens'));
        a.href = 'https://images.google.com/';
        a.title = t('aiid.lensHint', 'Tap the camera icon and upload your photo');
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        return a;
    }

    function showError(message) {
        output.replaceChildren();
        const box = el('div', 'aiid-callout aiid-callout--error');
        box.setAttribute('role', 'alert');
        box.appendChild(icon('warn'));
        const body = el('div');
        body.appendChild(el('strong', null, message));
        const alt = el('p', null, t('aiid.lensInstead', 'Meanwhile, you can look for similar coins for free:') + ' ');
        alt.appendChild(lensLink('aiid-link'));
        body.appendChild(alt);
        box.appendChild(body);
        output.appendChild(box);
    }

    /**
     * Find the coin in a photo: estimate the background from the four corners,
     * mark pixels that differ from it, and take the bounding box of rows and
     * columns that are clearly part of the object. Returns a square crop
     * {x, y, size} in image pixels, or null when unsure (busy background, coin
     * already filling the frame), so callers fall back to the whole photo.
     */
    function findCoin(img) {
        const W = img.naturalWidth, H = img.naturalHeight;
        const s = Math.min(1, 200 / Math.max(W, H));
        const w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        let data;
        try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return null; }

        // Background colour: average of four corner patches
        const patch = Math.max(2, Math.round(Math.min(w, h) * 0.06));
        let r = 0, g = 0, b = 0, n = 0;
        [[0, 0], [w - patch, 0], [0, h - patch], [w - patch, h - patch]].forEach(function (p) {
            for (let y = p[1]; y < p[1] + patch; y++) {
                for (let x = p[0]; x < p[0] + patch; x++) {
                    const i = (y * w + x) * 4;
                    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
                }
            }
        });
        r /= n; g /= n; b /= n;

        const rows = new Array(h).fill(0), cols = new Array(w).fill(0);
        let fg = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const d = Math.max(Math.abs(data[i] - r), Math.abs(data[i + 1] - g), Math.abs(data[i + 2] - b));
                if (d > 38) { rows[y]++; cols[x]++; fg++; }
            }
        }
        // Ignore specks: a row/column belongs to the coin only if enough of it differs
        const minRow = w * 0.04, minCol = h * 0.04;
        let top = rows.findIndex(function (v) { return v > minRow; });
        let left = cols.findIndex(function (v) { return v > minCol; });
        if (top < 0 || left < 0) return null;
        let bottom = h - 1 - rows.slice().reverse().findIndex(function (v) { return v > minRow; });
        let right = w - 1 - cols.slice().reverse().findIndex(function (v) { return v > minCol; });

        const bw = right - left + 1, bh = bottom - top + 1;
        const share = (bw * bh) / (w * h);
        if (share < 0.04 || share > 0.92 || fg / (w * h) > 0.9) return null; // not confident

        const side = Math.max(bw, bh) * 1.08; // a little breathing room around the rim
        const cx = (left + right) / 2, cy = (top + bottom) / 2;
        return { x: (cx - side / 2) / s, y: (cy - side / 2) / s, size: side / s };
    }

    /** Draw a region of the image onto a white canvas and encode it as JPEG. */
    function render(img, sx, sy, sw, sh, maxEdge, quality) {
        const scale = Math.min(1, maxEdge / Math.max(sw, sh));
        const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; // transparent PNGs (and crop overhang) become white, not black
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', quality);
    }

    /**
     * Decode a picked file into { upload, thumb }:
     *  upload - what the AI sees: the coin cropped square when it could be
     *           found (more pixels on the legends), else the whole photo;
     *           at most 1568px on the long edge.
     *  thumb  - a 320px square with the coin centred, for previews and the
     *           round thumbnails in the result.
     */
    function prepareImage(file) {
        return new Promise(function (resolve, reject) {
            if (!file || !/^image\//.test(file.type || 'image/')) return reject(new Error('type'));
            if (file.size > MAX_SOURCE) return reject(new Error('size'));
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = function () {
                const W = img.naturalWidth, H = img.naturalHeight;
                const crop = findCoin(img);
                let upload, thumb;
                if (crop) {
                    upload = render(img, crop.x, crop.y, crop.size, crop.size, MAX_EDGE, 0.9);
                    thumb = render(img, crop.x, crop.y, crop.size, crop.size, 320, 0.85);
                } else {
                    upload = render(img, 0, 0, W, H, MAX_EDGE, 0.88);
                    const side = Math.min(W, H); // centre square for the round thumbnails
                    thumb = render(img, (W - side) / 2, (H - side) / 2, side, side, 320, 0.85);
                }
                URL.revokeObjectURL(url);
                resolve({ upload: upload, thumb: thumb });
            };
            img.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error('decode')); // e.g. HEIC on browsers that can't read it
            };
            img.src = url;
        });
    }

    // ---------- photo slots ----------
    form.querySelectorAll('input[type="file"][data-side]').forEach(function (input) {
        const side = input.getAttribute('data-side');
        const slot = input.closest('.ai-id__slot');
        const drop = slot.querySelector('.ai-id__drop');
        const remove = slot.querySelector('.ai-id__remove');

        function setPhoto(prepared) {
            photos[side] = prepared ? prepared.upload : null;
            thumbs[side] = prepared ? prepared.thumb : null;
            let preview = drop.querySelector('.ai-id__preview');
            if (prepared) {
                if (!preview) {
                    preview = el('img', 'ai-id__preview');
                    preview.alt = '';
                    drop.appendChild(preview);
                }
                preview.src = prepared.thumb;
                drop.classList.add('has-image');
                remove.classList.remove('hidden');
            } else {
                if (preview) preview.remove();
                drop.classList.remove('has-image');
                remove.classList.add('hidden');
                input.value = '';
            }
            updateSubmit();
        }

        async function take(file) {
            if (!file) return;
            try {
                setPhoto(await prepareImage(file));
            } catch (err) {
                setPhoto(null);
                showError(err.message === 'size'
                    ? t('aiid.tooBig', 'This photo is too large. Please use an image under 25 MB.')
                    : t('aiid.badFile', 'This file could not be opened as a photo. Please use a JPEG, PNG or WebP image.'));
            }
        }

        input.addEventListener('change', function () { take(input.files && input.files[0]); });
        remove.addEventListener('click', function () { setPhoto(null); });

        // Drag and drop onto the slot
        ['dragenter', 'dragover'].forEach(function (type) {
            drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.add('is-dragover'); });
        });
        ['dragleave', 'drop'].forEach(function (type) {
            drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.remove('is-dragover'); });
        });
        drop.addEventListener('drop', function (e) {
            const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            take(file);
        });

        slot._reset = function () { setPhoto(null); };
    });

    // ---------- icons (fixed markup from this file, never model output) ----------
    const ICONS = {
        ruler: '<path d="M4 17h16l1-9-5 3.5L12 5l-4 6.5L3 8l1 9z"/><path d="M4 20h16"/>',
        coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/>',
        metal: '<path d="M4 15l3-7h10l3 7H4z"/><path d="M2.5 19h19"/>',
        mint: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
        date: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
        book: '<path d="M2.5 5.5c2.9-1.4 6.1-1.3 9.5.9 3.4-2.2 6.6-2.3 9.5-.9v13.2c-2.9-1.4-6.1-1.3-9.5.9-3.4-2.2-6.6-2.3-9.5-.9V5.5z"/><path d="M12 6.4v13.2"/>',
        bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.5"/>',
        shield: '<path d="M12 2.6l7 2.6v5.5c0 4.3-2.9 8.3-7 9.7-4.1-1.4-7-5.4-7-9.7V5.2l7-2.6z"/><path d="m8.8 11.9 2.2 2.2 4.2-4.4"/>',
        again: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
        check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
        sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
        warn: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.2v.3"/>',
        search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20.5 20.5-5.4-5.4"/>',
    };
    function icon(name, className) {
        const span = el('span', 'aiid-icon' + (className ? ' ' + className : ''));
        span.setAttribute('aria-hidden', 'true');
        span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
        return span;
    }

    // ---------- loading state: a checklist that advances while we wait ----------
    let loadingTimer = null;
    function showLoading() {
        const steps = [
            t('aiid.loading1', 'Reading the legends…'),
            t('aiid.loading2', 'Comparing portrait and reverse type…'),
            t('aiid.loading3', 'Checking mints and catalogues…'),
            t('aiid.loading4', 'Almost there…'),
        ];
        output.replaceChildren();
        const box = el('div', 'aiid-loading');
        box.setAttribute('role', 'status');
        const head = el('div', 'aiid-loading__head');
        // Both coins under a sweeping gold scan line
        const scanner = el('div', 'aiid-scan');
        ['obverse', 'reverse'].forEach(function (s) {
            if (!thumbs[s]) return;
            const coin = el('span', 'aiid-scan__coin');
            const img = el('img');
            img.src = thumbs[s];
            img.alt = '';
            coin.appendChild(img);
            scanner.appendChild(coin);
        });
        head.appendChild(scanner);
        const headText = el('div', 'aiid-loading__text');
        headText.appendChild(el('p', 'aiid-loading__title', t('aiid.analysing', 'Analysing your coin')));
        headText.appendChild(el('p', 'aiid-loading__sub', t('aiid.loadingSub', 'This usually takes 20–40 seconds')));
        head.appendChild(headText);
        box.appendChild(head);
        box.appendChild(el('div', 'aiid-loading__bar'));
        const list = el('ol', 'aiid-steps');
        const items = steps.map(function (s) {
            const li = el('li');
            li.appendChild(icon('check', 'aiid-steps__tick'));
            li.appendChild(el('span', null, s));
            list.appendChild(li);
            return li;
        });
        box.appendChild(list);
        output.appendChild(box);

        let i = 0;
        items[0].classList.add('is-active');
        loadingTimer = setInterval(function () {
            if (i >= items.length - 1) return; // the last step stays "in progress"
            items[i].classList.remove('is-active');
            items[i].classList.add('is-done');
            i++;
            items[i].classList.add('is-active');
        }, 4000);
    }
    function stopLoading() {
        clearInterval(loadingTimer);
        loadingTimer = null;
    }

    // ---------- result ----------
    const LEVELS = ['low', 'medium', 'high'];

    function section(className, iconName, title) {
        const s = el('section', 'aiid-section ' + className);
        const h = el('h5', 'aiid-section__title');
        if (iconName) h.appendChild(icon(iconName));
        h.appendChild(el('span', null, title));
        s.appendChild(h);
        return s;
    }

    function thumb(src, label) {
        const wrap = el('span', 'aiid-thumb');
        if (src) {
            const img = el('img');
            img.src = src;
            img.alt = label;
            wrap.appendChild(img);
        }
        return wrap;
    }

    function factTile(iconName, label, value) {
        if (!value) return null;
        const tile = el('div', 'aiid-fact'); // <div> groups a dt/dd pair inside the <dl>
        tile.appendChild(icon(iconName, 'aiid-fact__icon'));
        const body = el('div');
        body.appendChild(el('dt', null, label));
        body.appendChild(el('dd', null, value));
        tile.appendChild(body);
        return tile;
    }

    function sideCard(title, side, photo) {
        if (!side || (!side.legend && !side.description)) return null;
        const card = el('div', 'aiid-side');
        // The coin itself, large and round, above its legend
        if (photo) card.appendChild(thumb(photo, title));
        card.appendChild(el('h5', 'aiid-side__title', title));
        if (side.legend) {
            card.appendChild(el('p', 'aiid-legend', side.legend));
        } else {
            card.appendChild(el('p', 'aiid-legend aiid-legend--none', t('aiid.legendUnread', 'Legend not legible')));
        }
        if (side.description) card.appendChild(el('p', 'aiid-side__desc', side.description));
        return card;
    }

    /** A catalogue type confirmed by the verification step. */
    function matchCard(m) {
        const level = LEVELS.indexOf(m.confidence) >= 0 ? m.confidence : 'low';
        const card = el('div', 'aiid-match aiid-match--' + level);
        const head = el('div', 'aiid-match__head');
        head.appendChild(el('strong', 'aiid-match__label', m.label));
        head.appendChild(el('span', 'aiid-match__pill', t('aiid.match.' + level,
            { high: 'Exact match', medium: 'Likely match', low: 'Possible match' }[level])));
        card.appendChild(head);
        const meta = [m.mint, m.date].filter(Boolean).join(' · ');
        if (meta) card.appendChild(el('p', 'aiid-match__meta', meta));
        const legends = el('dl', 'aiid-match__legends');
        [[t('aiid.obverseShort', 'Obv.'), m.obverse_legend], [t('aiid.reverseShort', 'Rev.'), m.reverse_legend]].forEach(function (p) {
            if (!p[1]) return;
            const row = el('div');
            row.appendChild(el('dt', null, p[0]));
            row.appendChild(el('dd', null, p[1]));
            legends.appendChild(row);
        });
        if (legends.children.length) card.appendChild(legends);
        if (m.why) card.appendChild(el('p', 'aiid-match__why', m.why));
        if (/^https:\/\/numismatics\.org\//.test(m.uri || '')) {
            card.appendChild(externalLink('aiid-link aiid-match__link', t('aiid.catOpen', 'Open catalogue entry'), m.uri));
        }
        return card;
    }

    function confidenceBlock(level) {
        const box = el('div', 'aiid-confidence aiid-confidence--' + level);
        const meter = el('span', 'aiid-meter');
        meter.setAttribute('aria-hidden', 'true');
        for (let n = 0; n < 3; n++) meter.appendChild(el('span', n <= LEVELS.indexOf(level) ? 'is-on' : null));
        box.appendChild(meter);
        const text = el('div');
        text.appendChild(el('strong', null, t('aiid.confidence.' + level,
            { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }[level])));
        text.appendChild(el('span', 'aiid-confidence__hint', t('aiid.confHint.' + level, {
            high: 'The legends and design point to one specific issue.',
            medium: 'The ruler and denomination are clear; the exact issue is not.',
            low: 'A best guess. Clearer photos or an expert would help.',
        }[level])));
        box.appendChild(text);
        return box;
    }

    function externalLink(className, text, href) {
        const a = el('a', className, text);
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        return a;
    }

    function renderResult(r) {
        output.replaceChildren();
        const roman = r.is_coin && r.is_roman_coin;
        const card = el('article', 'aiid-card' + (roman ? '' : ' aiid-card--empty'));

        // Hero: the visitor's own coin + the attribution in one line
        const hero = el('div', 'aiid-hero') /* not <header>: the site styles every <header> as the fixed nav */;
        const coins = el('div', 'aiid-hero__coins');
        coins.appendChild(thumb(thumbs.obverse, t('aiid.obverse', 'Obverse')));
        if (thumbs.reverse) coins.appendChild(thumb(thumbs.reverse, t('aiid.reverse', 'Reverse')));
        hero.appendChild(coins);
        const heroText = el('div', 'aiid-hero__text');
        const eyebrow = el('p', 'aiid-eyebrow');
        eyebrow.appendChild(icon('sparkle'));
        eyebrow.appendChild(el('span', null, t('aiid.eyebrow', 'AI attribution')));
        heroText.appendChild(eyebrow);
        heroText.appendChild(el('h4', 'aiid-title', r.summary || ''));
        hero.appendChild(heroText);
        card.appendChild(hero);

        if (!roman) {
            const msg = el('div', 'aiid-callout aiid-callout--warn');
            msg.appendChild(icon('warn'));
            msg.appendChild(el('p', null, !r.is_coin
                ? t('aiid.notCoin', 'We could not find a coin in these photos. Try a closer, sharper shot of one side at a time.')
                : t('aiid.notRoman', 'This does not look like an ancient Roman coin, so we cannot attribute it here.')));
            card.appendChild(msg);
        } else {
            const level = LEVELS.indexOf(r.confidence) >= 0 ? r.confidence : 'low';
            card.appendChild(confidenceBlock(level));

            const facts = el('dl', 'aiid-facts');
            [
                factTile('ruler', t('aiid.ruler', 'Ruler'), r.ruler),
                factTile('coin', t('aiid.denomination', 'Denomination'), r.denomination),
                factTile('metal', t('aiid.metal', 'Metal'), r.metal),
                factTile('mint', t('aiid.mint', 'Mint'), r.mint),
                factTile('date', t('aiid.date', 'Date'), r.date),
            ].forEach(function (tile) { if (tile) facts.appendChild(tile); });
            if (facts.children.length) card.appendChild(facts);

            const sides = el('div', 'aiid-sides');
            [sideCard(t('aiid.obverse', 'Obverse'), r.obverse, thumbs.obverse),
             sideCard(t('aiid.reverse', 'Reverse'), r.reverse, thumbs.reverse)]
                .forEach(function (c) { if (c) sides.appendChild(c); });
            if (sides.children.length) card.appendChild(sides);

            const hasRefs = Array.isArray(r.references) && r.references.length;
            const cat = r.catalogue || { status: 'skipped', matches: [] };
            const verified = cat.status === 'verified' && cat.matches && cat.matches.length;
            if (hasRefs || verified || r.catalogue_query) {
                const refs = section('aiid-refs', 'book', t('aiid.references', 'Catalogue references'));
                if (verified) {
                    // Confirmed against the catalogue: one card per matching type
                    const badge = el('p', 'aiid-verified');
                    badge.appendChild(icon('check'));
                    badge.appendChild(el('span', null, t('aiid.catVerified', 'Checked against the OCRE catalogue') +
                        (cat.checked ? ' · ' + t('aiid.catCompared', '{n} types compared', { n: cat.checked }) : '')));
                    refs.appendChild(badge);
                    cat.matches.forEach(function (m) { refs.appendChild(matchCard(m)); });
                } else {
                    if (hasRefs) {
                        const chips = el('div', 'aiid-chips');
                        r.references.forEach(function (ref) { chips.appendChild(el('span', 'aiid-chip', ref)); });
                        refs.appendChild(chips);
                    } else {
                        refs.appendChild(el('p', 'aiid-muted', t('aiid.noRefs', 'No exact reference from these photos.')));
                    }
                    if (cat.status === 'no_match' || cat.status === 'unavailable') {
                        refs.appendChild(el('p', 'aiid-unverified', cat.status === 'no_match'
                            ? t('aiid.catNoMatch', 'No catalogue type matched every visible detail, so these references are the AI’s suggestion and are not verified.')
                            : t('aiid.catUnavailable', 'The catalogue check is unavailable right now, so these references are not verified.')));
                    }
                }
                if (cat.note && cat.status !== 'skipped') refs.appendChild(el('p', 'aiid-muted aiid-cat-note', cat.note));
                if (r.catalogue_query) {
                    // Search button: what will be searched is shown, so the visitor knows what they'll get
                    const search = externalLink('aiid-search', '',
                        'https://numismatics.org/ocre/results?q=' + encodeURIComponent(r.catalogue_query));
                    search.appendChild(icon('search'));
                    const label = el('span', 'aiid-search__text');
                    label.appendChild(el('strong', null, t('aiid.ocre', 'Browse matching types in OCRE')));
                    label.appendChild(el('span', 'aiid-search__query', '“' + r.catalogue_query + '”'));
                    search.appendChild(label);
                    refs.appendChild(search);
                }
                card.appendChild(refs);
            }

            if (r.reasoning) {
                const why = section('aiid-why', 'bulb', t('aiid.reasoning', 'Why this attribution'));
                why.appendChild(el('p', null, r.reasoning));
                card.appendChild(why);
            }

            if (Array.isArray(r.alternatives) && r.alternatives.length) {
                const alt = el('details', 'aiid-more');
                const sum = el('summary');
                sum.appendChild(el('span', null, t('aiid.alternatives', 'Other possibilities ({n})', { n: r.alternatives.length })));
                alt.appendChild(sum);
                const ul = el('ul');
                r.alternatives.forEach(function (a) {
                    const li = el('li');
                    li.appendChild(el('strong', null, a.label));
                    if (a.why) li.appendChild(el('span', null, a.why));
                    ul.appendChild(li);
                });
                alt.appendChild(ul);
                card.appendChild(alt);
            }
        }

        if (r.notes) {
            const notes = el('div', 'aiid-callout aiid-callout--info');
            notes.appendChild(icon('info'));
            const body = el('div');
            body.appendChild(el('strong', null, t('aiid.notes', 'Notes')));
            body.appendChild(el('p', null, r.notes));
            notes.appendChild(body);
            card.appendChild(notes);
        }

        // Next steps: verification is the main action
        const actions = el('div', 'aiid-actions') /* not <footer>, same reason */;
        const expert = el('a', 'aiid-btn aiid-btn--primary');
        expert.href = (lang === 'en' ? '' : '/' + lang) + '/contact/?subject=identification';
        expert.appendChild(icon('shield'));
        expert.appendChild(el('span', null, t('aiid.expert', 'Ask an expert')));
        actions.appendChild(expert);
        const again = el('button', 'aiid-btn aiid-btn--ghost');
        again.type = 'button';
        again.appendChild(icon('again'));
        again.appendChild(el('span', null, t('aiid.again', 'Try another coin')));
        again.addEventListener('click', reset);
        actions.appendChild(again);
        card.appendChild(actions);

        const second = el('p', 'aiid-second', t('aiid.secondOpinion', 'Want a second opinion?') + ' ');
        second.appendChild(lensLink('aiid-link'));
        card.appendChild(second);

        // Sections appear one after another rather than all at once
        Array.prototype.forEach.call(card.children, function (child, i) {
            child.style.setProperty('--aiid-i', i);
        });

        output.appendChild(card);
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function reset() {
        form.querySelectorAll('.ai-id__slot').forEach(function (slot) { if (slot._reset) slot._reset(); });
        output.innerHTML = promiseHtml;
        updateSubmit();
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ---------- submit ----------
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (busy || !photos.obverse) return;
        busy = true;
        updateSubmit();
        form.classList.add('is-busy');
        showLoading();

        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ lang: lang, obverse: photos.obverse, reverse: photos.reverse }),
            });
            const type = response.headers.get('content-type') || '';
            if (!type.includes('application/json')) {
                // 404 page or PHP not running (e.g. the local static dev server)
                throw new Error('unavailable');
            }
            const data = await response.json();
            stopLoading();
            if (response.ok && data.success && data.result) {
                renderResult(data.result);
            } else {
                showError(data.error || t('aiid.failed', 'The identification could not be completed. Please try again.'));
            }
        } catch (err) {
            stopLoading();
            showError(err.message === 'unavailable'
                ? t('aiid.unavailable', 'AI identification is temporarily unavailable. Please try again later.')
                : t('aiid.network', 'Network error. Check your connection and try again.'));
        } finally {
            busy = false;
            form.classList.remove('is-busy');
            updateSubmit();
        }
    });
})();
