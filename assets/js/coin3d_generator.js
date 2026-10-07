/*
 * 3D coin visualisation (services page, "Coin Tools").
 *
 * Pipeline
 * --------
 * 1. Upload: each photo is analysed in the browser (analyseCoinPhoto). The coin
 *    is separated from the background, its centre found and its real outline
 *    traced as a radius per angle - ancient flans are rarely round, so the
 *    outline is kept rather than forced into a circle. The photo is then
 *    cropped so the coin sits exactly centred in a square texture.
 * 2. Generate: both outlines are combined into one flan shape (the reverse is
 *    first rotated to the orientation where its outline best matches the
 *    obverse, i.e. how the two faces actually sit on the coin). Each face is
 *    mapped onto that shape edge-to-edge, so the coin in the photo fills the
 *    model exactly. Relief comes from a height field estimated from the photo
 *    (geometry for the large forms, a normal map for fine detail), the edge is
 *    rounded and slightly uneven like a struck flan, and the metal (gold,
 *    silver or bronze) is detected from the coin's colour.
 *
 * Element ids are defined in services/index.html and uk/services/index.html.
 */
(function () {
    'use strict';

    const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r132/three.min.js';
    const ORBIT_URL = 'https://cdn.jsdelivr.net/npm/three@0.132.0/examples/js/controls/OrbitControls.min.js';

    // Outline resolution: one radius per degree.
    const OUTLINE_SAMPLES = 360;
    // Longest side of the downscaled copy used to find the coin.
    const DETECT_SIZE = 420;

    // World-space proportions. A denarius is ~19 mm across and ~2 mm thick
    // plus relief; bronzes are larger but keep a similar ratio.
    const COIN_RADIUS = 2;
    const HALF_THICKNESS = 0.15;
    const EDGE_ROUNDING = 0.05;     // share of the radius taken by the rounded edge
    const DEFAULT_RELIEF = 0.07;    // peak relief height per face

    const METALS = {
        gold:   { metalness: 0.9,  roughness: 0.3,  rimRoughness: 0.38 },
        silver: { metalness: 0.8,  roughness: 0.36, rimRoughness: 0.45 },
        bronze: { metalness: 0.55, roughness: 0.52, rimRoughness: 0.6 }
    };

    function t(key, fallback) {
        const dict = window.I18N && window.I18N.js;
        return (dict && dict[key]) || fallback;
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (window.coin3DGeneratorLoaded) return;
        if (!document.getElementById('coin3DPreview')) return;
        window.coin3DGeneratorLoaded = true;

        ensureThree()
            .then(initCoin3DGenerator)
            .catch(err => {
                console.error('Failed to load dependencies:', err);
                alert(t('coin3d.libs', 'Failed to load required libraries. Please refresh the page.'));
            });
    });

    // The page already includes Three.js; only fetch it if it is missing, and
    // load OrbitControls after it since it attaches itself to window.THREE.
    function ensureThree() {
        const load = url => new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return (window.THREE ? Promise.resolve() : load(THREE_URL))
            .then(() => (window.THREE.OrbitControls ? null : load(ORBIT_URL)));
    }

    /* ================================================================ UI */

    function initCoin3DGenerator() {
        const elements = {
            obverseUpload: document.getElementById('obverseUpload'),
            reverseUpload: document.getElementById('reverseUpload'),
            obversePreview: document.getElementById('obversePreview'),
            reversePreview: document.getElementById('reversePreview'),
            generateBtn: document.getElementById('generateModel'),
            removeObverseBtn: document.getElementById('removeObverse'),
            removeReverseBtn: document.getElementById('removeReverse'),
            placeholder: document.getElementById('placeholder'),
            canvas: document.getElementById('coin3DCanvas'),
            container: document.getElementById('coin3DPreview')
        };

        const state = {
            obverse: null,      // analysed photos (see analyseCoinPhoto)
            reverse: null,
            busy: { obverse: false, reverse: false },
            isGenerating: false
        };

        const note = document.createElement('p');
        note.className = 'coin3d-note hidden';
        note.setAttribute('role', 'status');
        elements.generateBtn.parentNode.insertBefore(note, elements.generateBtn);

        const viewer = createViewer(elements);

        setupUpload('obverse', elements.obverseUpload, elements.obversePreview, elements.removeObverseBtn);
        setupUpload('reverse', elements.reverseUpload, elements.reversePreview, elements.removeReverseBtn);

        elements.generateBtn.addEventListener('click', () => {
            if (!state.isGenerating && state.obverse && state.reverse) generate();
        });

        function setupUpload(side, input, preview, removeBtn) {
            input.addEventListener('change', e => {
                const file = e.target.files && e.target.files[0];
                if (file) handleFile(side, file, preview, removeBtn);
            });
            preview.addEventListener('click', () => input.click());

            preview.addEventListener('dragover', e => {
                e.preventDefault();
                preview.classList.add('is-dragover');
            });
            preview.addEventListener('dragleave', () => preview.classList.remove('is-dragover'));
            preview.addEventListener('drop', e => {
                e.preventDefault();
                preview.classList.remove('is-dragover');
                const file = e.dataTransfer.files && e.dataTransfer.files[0];
                if (file) handleFile(side, file, preview, removeBtn);
            });

            removeBtn.addEventListener('click', e => {
                e.stopPropagation();
                input.value = '';
                state[side] = null;
                preview.style.backgroundImage = '';
                preview.classList.remove('is-processing', 'is-fallback');
                preview.removeAttribute('title');
                preview.innerHTML = '<span class="upload-icon">+</span>';
                removeBtn.classList.add('hidden');
                updateNote();
                updateGenerateButton();
            });
        }

        function handleFile(side, file, preview, removeBtn) {
            if (!/^image\//.test(file.type)) {
                showNote(t('coin3d.badFile', 'This file could not be opened as a photo. Please use a JPEG, PNG or WebP image.'));
                return;
            }
            state.busy[side] = true;
            state[side] = null;
            updateGenerateButton();
            preview.classList.add('is-processing');
            preview.innerHTML = '<span class="upload-spinner" aria-hidden="true"></span>';

            loadImage(file)
                .then(img => new Promise(resolve => {
                    // Let the spinner paint before the synchronous analysis.
                    requestAnimationFrame(() => setTimeout(() => resolve(analyseCoinPhoto(img)), 0));
                }))
                .then(result => {
                    state[side] = result;
                    preview.style.backgroundImage = `url(${result.previewUrl})`;
                    preview.innerHTML = '';
                    preview.classList.toggle('is-fallback', !result.detected);
                    if (!result.detected) {
                        preview.title = t('coin3d.notDetected', 'We could not find the edge of the coin, so the whole photo is used.');
                    } else {
                        preview.removeAttribute('title');
                    }
                    removeBtn.classList.remove('hidden');
                })
                .catch(err => {
                    console.error('Coin photo could not be processed:', err);
                    preview.style.backgroundImage = '';
                    preview.innerHTML = '<span class="upload-icon">+</span>';
                    showNote(t('coin3d.badFile', 'This file could not be opened as a photo. Please use a JPEG, PNG or WebP image.'));
                })
                .then(() => {
                    state.busy[side] = false;
                    preview.classList.remove('is-processing');
                    updateNote();
                    updateGenerateButton();
                });
        }

        function updateNote() {
            const fallback = ['obverse', 'reverse'].some(s => state[s] && !state[s].detected);
            if (fallback) {
                showNote(t('coin3d.notDetected', 'We could not find the edge of the coin, so the whole photo is used.') + ' ' +
                         t('coin3d.photoTip', 'For the most accurate model, photograph the coin on a plain, contrasting background.'));
            } else {
                note.classList.add('hidden');
            }
        }

        function showNote(text) {
            note.textContent = text;
            note.classList.remove('hidden');
        }

        function updateGenerateButton() {
            elements.generateBtn.disabled = !(state.obverse && state.reverse) ||
                state.busy.obverse || state.busy.reverse;
        }

        function generate() {
            state.isGenerating = true;
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div><div class="processing-text"></div>';
            overlay.querySelector('.processing-text').textContent = t('coin3d.generating', 'Generating 3D model…');
            elements.container.appendChild(overlay);

            // Give the overlay a frame to paint before the heavy work.
            requestAnimationFrame(() => setTimeout(() => {
                try {
                    viewer.prepare();
                    viewer.show(buildCoin(state.obverse, state.reverse, viewer.maxAnisotropy()));
                    elements.placeholder.classList.add('hidden');
                    elements.canvas.classList.remove('hidden');
                    viewer.resize();
                } catch (error) {
                    console.error('Error generating coin:', error);
                    alert(t('coin3d.error', 'There was an error generating the 3D coin. Please try again.'));
                }
                overlay.remove();
                state.isGenerating = false;
            }, 30));
        }
    }

    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unreadable image')); };
            img.src = url;
        });
    }

    /* ======================================================= coin detection */

    /*
     * Finds the coin in a photo and returns:
     *   detected   - false when no clear coin was found (whole photo used)
     *   outline    - Float32Array(OUTLINE_SAMPLES), edge radius per angle,
     *                normalised so the widest point is 1. Angle k is
     *                2πk/N counter-clockwise from "right", with y pointing up.
     *   texture    - square canvas, coin centred, widest radius touching the
     *                canvas edge, area outside the coin filled with edge colour
     *   edgeInset  - how far inside the traced edge (share of the radius) the
     *                photo is still clean coin
     *   metal      - 'gold' | 'silver' | 'bronze'
     *   previewUrl - cut-out of the coin for the upload thumbnail
     */
    function analyseCoinPhoto(img) {
        const fullW = img.naturalWidth || img.width;
        const fullH = img.naturalHeight || img.height;
        const scale = Math.min(1, DETECT_SIZE / Math.max(fullW, fullH));
        const w = Math.max(8, Math.round(fullW * scale));
        const h = Math.max(8, Math.round(fullH * scale));

        const work = makeCanvas(w, h);
        const wctx = work.getContext('2d', { willReadFrequently: true });
        wctx.drawImage(img, 0, 0, w, h);
        const px = wctx.getImageData(0, 0, w, h).data;

        let found = findCoin(px, w, h);
        const detected = !!found;
        if (!found) {
            // Assume the coin fills the photo: the inscribed circle.
            found = {
                cx: w / 2, cy: h / 2,
                radii: new Float32Array(OUTLINE_SAMPLES).fill(Math.min(w, h) / 2 * 0.98),
                mask: null
            };
        }

        let maxR = 0;
        for (let k = 0; k < OUTLINE_SAMPLES; k++) maxR = Math.max(maxR, found.radii[k]);
        const outline = new Float32Array(OUTLINE_SAMPLES);
        for (let k = 0; k < OUTLINE_SAMPLES; k++) outline[k] = found.radii[k] / maxR;

        // Crop from the full-resolution photo.
        const cx = found.cx / scale, cy = found.cy / scale, R = maxR / scale;
        const texSize = R * 2 >= 1300 ? 2048 : 1024;
        // Texture pixels per photo pixel: > 1 when a small photo is enlarged.
        const upscale = texSize / (R * 2);
        // The traced edge is accurate to about a pixel of the detection
        // copy; stay that far inside it so no background fringe is sampled.
        const edgeInset = Math.max(3, upscale * 2, upscale / scale * 1.2) / (texSize / 2);
        const texture = makeCanvas(texSize, texSize);
        const tctx = texture.getContext('2d', { willReadFrequently: true });
        tctx.imageSmoothingQuality = 'high';
        tctx.drawImage(img, cx - R, cy - R, R * 2, R * 2, 0, 0, texSize, texSize);
        fillOutsideOutline(tctx, texSize, outline, edgeInset);

        return {
            detected,
            outline,
            texture,
            metal: detectMetal(px, w, h, found),
            previewUrl: makePreview(texture, outline),
            edgeInset,
            upscale,
            relief: null,       // computed lazily on first generate
            ringColours: null
        };
    }

    function findCoin(px, w, h) {
        const n = w * h;
        const blurred = blurRGB(px, w, h);
        let inside = new Uint8Array(n);

        // Photos already cut out (transparent PNG/WebP): trust the alpha.
        let transparent = 0;
        for (let i = 0; i < n; i++) if (px[i * 4 + 3] < 128) transparent++;

        if (transparent > n * 0.02) {
            for (let i = 0; i < n; i++) inside[i] = px[i * 4 + 3] >= 128 ? 1 : 0;
        } else {
            const bg = estimateBackground(blurred, w, h);
            if (!bg) return null;
            // Background = pixels close to the background colour that are
            // connected to the border. Coin areas that happen to match the
            // background colour stay inside because they are enclosed.
            const isBg = new Uint8Array(n);
            for (let i = 0; i < n; i++) {
                const dr = blurred[i * 3] - bg.r, dg = blurred[i * 3 + 1] - bg.g, db = blurred[i * 3 + 2] - bg.b;
                isBg[i] = dr * dr + dg * dg + db * db < bg.threshold * bg.threshold ? 1 : 0;
            }
            let outside = floodFromBorder(isBg, w, h);
            if (markShadows(blurred, w, h, bg, isBg, outside)) outside = floodFromBorder(isBg, w, h);
            for (let i = 0; i < n; i++) inside[i] = outside[i] ? 0 : 1;
        }

        // Opening removes thin bridges (threads, shadows) and specks.
        inside = dilate(erode(inside, w, h, 2), w, h, 2);
        const coin = pickCoinComponent(inside, w, h);
        if (!coin) return null;
        const mask = fillHoles(coin.mask, w, h);

        let area = 0;
        for (let i = 0; i < n; i++) area += mask[i];
        if (area < n * 0.04 || area > n * 0.985) return null;

        const lum = luminance(blurred, w, h);
        let cx = coin.cx, cy = coin.cy;
        let radii = traceOutline(mask, lum, w, h, cx, cy);

        // Re-centre on the outline itself (the area centroid is pulled by
        // flan irregularities) and trace once more.
        let sx = 0, sy = 0;
        for (let k = 0; k < OUTLINE_SAMPLES; k++) {
            const a = (k / OUTLINE_SAMPLES) * Math.PI * 2;
            sx += cx + radii[k] * Math.cos(a);
            sy += cy - radii[k] * Math.sin(a);
        }
        cx = sx / OUTLINE_SAMPLES;
        cy = sy / OUTLINE_SAMPLES;
        radii = traceOutline(mask, lum, w, h, cx, cy);

        let minR = Infinity, maxR = 0;
        for (let k = 0; k < OUTLINE_SAMPLES; k++) {
            minR = Math.min(minR, radii[k]);
            maxR = Math.max(maxR, radii[k]);
        }
        // Not coin-like (a long strip, a hand, half a frame...).
        if (minR / maxR < 0.6 || maxR < 12) return null;

        return { cx, cy, radii, mask };
    }

    // Background colour from the four corners: the three corners that agree
    // best are averaged, so one corner touched by the coin is ignored.
    function estimateBackground(rgb, w, h) {
        const p = Math.max(3, Math.round(Math.min(w, h) * 0.06));
        const corners = [[0, 0], [w - p, 0], [0, h - p], [w - p, h - p]].map(([x0, y0]) => {
            let r = 0, g = 0, b = 0, rr = 0, gg = 0, bb = 0, c = 0;
            for (let y = y0; y < y0 + p; y++) {
                for (let x = x0; x < x0 + p; x++) {
                    const i = (y * w + x) * 3;
                    r += rgb[i]; g += rgb[i + 1]; b += rgb[i + 2];
                    rr += rgb[i] * rgb[i]; gg += rgb[i + 1] * rgb[i + 1]; bb += rgb[i + 2] * rgb[i + 2];
                    c++;
                }
            }
            r /= c; g /= c; b /= c;
            const sd = Math.sqrt(Math.max(0, (rr / c - r * r) + (gg / c - g * g) + (bb / c - b * b)));
            return { r, g, b, sd };
        });

        let best = null;
        for (let skip = 0; skip < 4; skip++) {
            const set = corners.filter((_, i) => i !== skip);
            let spread = 0;
            for (let i = 0; i < 3; i++) {
                for (let j = i + 1; j < 3; j++) {
                    spread = Math.max(spread, Math.hypot(set[i].r - set[j].r, set[i].g - set[j].g, set[i].b - set[j].b));
                }
            }
            if (!best || spread < best.spread) best = { set, spread };
        }
        // Corners disagree strongly: busy or uneven background, give up.
        if (best.spread > 60) return null;

        const avg = key => best.set.reduce((s, c) => s + c[key], 0) / 3;
        const noise = avg('sd');
        return {
            r: avg('r'), g: avg('g'), b: avg('b'),
            threshold: Math.min(75, Math.max(24, 18 + noise * 2.5 + best.spread * 0.8))
        };
    }

    /*
     * A cast shadow has the background's hue, only darker, so it passes the
     * colour test as "coin". When the coin's own colour (sampled from the
     * middle of the first mask) is clearly different from the background -
     * gold or bronze on grey, white or black - such pixels are re-marked as
     * background. A silver coin on a grey cloth shares the background's hue,
     * so there the test is skipped rather than eat into the coin.
     */
    function markShadows(rgb, w, h, bg, isBg, outside) {
        const chroma = (r, g, b) => {
            const sum = r + g + b + 1;
            return [r / sum, g / sum];
        };
        const [bgR, bgG] = chroma(bg.r, bg.g, bg.b);
        const bgLum = bg.r * 0.299 + bg.g * 0.587 + bg.b * 0.114;

        let sx = 0, sy = 0, count = 0;
        for (let i = 0; i < w * h; i++) {
            if (!outside[i]) { sx += i % w; sy += (i / w) | 0; count++; }
        }
        if (count < w * h * 0.04) return false;
        const cx = sx / count, cy = sy / count;
        const reach = Math.sqrt(count / Math.PI) * 0.5;
        let cr = 0, cg = 0, cn = 0;
        for (let y = Math.max(0, Math.round(cy - reach)); y < Math.min(h, cy + reach); y++) {
            for (let x = Math.max(0, Math.round(cx - reach)); x < Math.min(w, cx + reach); x++) {
                const i = y * w + x;
                if (outside[i]) continue;
                const [r, g] = chroma(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
                cr += r; cg += g; cn++;
            }
        }
        if (!cn || Math.hypot(cr / cn - bgR, cg / cn - bgG) < 0.035) return false;

        let changed = false;
        for (let i = 0; i < w * h; i++) {
            if (isBg[i]) continue;
            const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
            const lum = r * 0.299 + g * 0.587 + b * 0.114;
            if (lum > bgLum * 1.03 || lum < bgLum * 0.12) continue;
            const [pr, pg] = chroma(r, g, b);
            // Dark pixels have unreliable hue; demand a closer match there.
            const tolerance = lum < 40 ? 0.012 : 0.02;
            if (Math.hypot(pr - bgR, pg - bgG) < tolerance) { isBg[i] = 1; changed = true; }
        }
        return changed;
    }

    function pickCoinComponent(inside, w, h) {
        const labels = new Int32Array(w * h).fill(-1);
        const stack = new Int32Array(w * h);
        let best = null;
        for (let start = 0; start < w * h; start++) {
            if (!inside[start] || labels[start] !== -1) continue;
            const id = start;
            let top = 0, count = 0, sx = 0, sy = 0;
            stack[top++] = start;
            labels[start] = id;
            while (top) {
                const i = stack[--top];
                const x = i % w, y = (i / w) | 0;
                count++; sx += x; sy += y;
                if (x > 0 && inside[i - 1] && labels[i - 1] === -1) { labels[i - 1] = id; stack[top++] = i - 1; }
                if (x < w - 1 && inside[i + 1] && labels[i + 1] === -1) { labels[i + 1] = id; stack[top++] = i + 1; }
                if (y > 0 && inside[i - w] && labels[i - w] === -1) { labels[i - w] = id; stack[top++] = i - w; }
                if (y < h - 1 && inside[i + w] && labels[i + w] === -1) { labels[i + w] = id; stack[top++] = i + w; }
            }
            const cx = sx / count, cy = sy / count;
            // Prefer large, central blobs.
            const off = Math.hypot((cx - w / 2) / w, (cy - h / 2) / h);
            const score = count * (1 - Math.min(0.8, off * 1.2));
            if (!best || score > best.score) best = { id, score, cx, cy };
        }
        if (!best) return null;
        const mask = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) mask[i] = labels[i] === best.id ? 1 : 0;
        return { mask, cx: best.cx, cy: best.cy };
    }

    /*
     * Edge radius for each angle: the furthest mask pixel along the ray, then
     * nudged inwards when the mask edge is soft (a cast shadow) but there is a
     * crisp luminance edge just inside it (the real rim of the coin). Spikes
     * are removed with a circular median and the profile lightly smoothed.
     */
    function traceOutline(mask, lum, w, h, cx, cy) {
        const N = OUTLINE_SAMPLES;
        const maxSteps = Math.hypot(w, h);
        const raw = new Float32Array(N);

        for (let k = 0; k < N; k++) {
            const a = (k / N) * Math.PI * 2;
            const dx = Math.cos(a), dy = -Math.sin(a);
            let last = 0;
            for (let r = 0; r < maxSteps; r += 0.5) {
                const x = Math.round(cx + dx * r), y = Math.round(cy + dy * r);
                if (x < 0 || y < 0 || x >= w || y >= h) break;
                if (mask[y * w + x]) last = r;
            }

            const grad = r => Math.abs(sampleGrey(lum, w, h, cx + dx * (r + 1.5), cy + dy * (r + 1.5)) -
                                       sampleGrey(lum, w, h, cx + dx * (r - 1.5), cy + dy * (r - 1.5)));
            let edgeStrength = 0;
            for (let r = last - 3; r <= last + 2; r += 0.5) edgeStrength = Math.max(edgeStrength, grad(r));
            let bestR = last, bestG = edgeStrength;
            for (let r = last * 0.88; r < last - 3; r += 0.5) {
                const g = grad(r);
                if (g > bestG) { bestG = g; bestR = r; }
            }
            raw[k] = bestG > edgeStrength * 2 && bestG > 18 ? bestR : last;
        }

        const sorted = Array.from(raw).sort((x, y) => x - y);
        const median = sorted[N >> 1];
        for (let k = 0; k < N; k++) raw[k] = Math.min(median * 1.15, Math.max(median * 0.82, raw[k]));

        const filtered = new Float32Array(N);
        const win = [];
        for (let k = 0; k < N; k++) {
            win.length = 0;
            for (let j = -5; j <= 5; j++) win.push(raw[(k + j + N) % N]);
            win.sort((x, y) => x - y);
            filtered[k] = win[5];
        }
        const smooth = new Float32Array(N);
        for (let k = 0; k < N; k++) {
            let s = 0;
            for (let j = -2; j <= 2; j++) s += filtered[(k + j + N) % N];
            smooth[k] = s / 5;
        }
        return smooth;
    }

    // Replace everything outside the coin with the colour just inside its
    // edge, so texture filtering never pulls background into the rim.
    function fillOutsideOutline(ctx, size, outline, inset) {
        const image = ctx.getImageData(0, 0, size, size);
        const d = image.data;
        const half = size / 2;
        let minOutline = 1;
        for (let k = 0; k < OUTLINE_SAMPLES; k++) minOutline = Math.min(minOutline, outline[k]);
        const safe = (minOutline - inset) * (minOutline - inset);

        for (let y = 0; y < size; y++) {
            const ny = 1 - (y + 0.5) / half;
            for (let x = 0; x < size; x++) {
                const nx = (x + 0.5) / half - 1;
                const rho2 = nx * nx + ny * ny;
                if (rho2 < safe) continue;
                const a = Math.atan2(ny, nx);
                const limit = outlineAt(outline, a) - inset;
                if (Math.sqrt(rho2) <= limit) continue;
                const sx = Math.min(size - 1, Math.max(0, Math.round((1 + limit * Math.cos(a)) * half - 0.5)));
                const sy = Math.min(size - 1, Math.max(0, Math.round((1 - limit * Math.sin(a)) * half - 0.5)));
                const s = (sy * size + sx) * 4, o = (y * size + x) * 4;
                d[o] = d[s]; d[o + 1] = d[s + 1]; d[o + 2] = d[s + 2]; d[o + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
    }

    function makePreview(texture, outline) {
        const size = 256;
        const c = makeCanvas(size, size);
        const ctx = c.getContext('2d');
        ctx.beginPath();
        for (let k = 0; k <= OUTLINE_SAMPLES; k++) {
            const a = (k / OUTLINE_SAMPLES) * Math.PI * 2;
            const r = outline[k % OUTLINE_SAMPLES] * size / 2;
            const x = size / 2 + r * Math.cos(a), y = size / 2 - r * Math.sin(a);
            if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(texture, 0, 0, size, size);
        return c.toDataURL('image/png');
    }

    // Classify the metal from the coin's average colour.
    function detectMetal(px, w, h, found) {
        let r = 0, g = 0, b = 0, c = 0;
        const r2 = Math.pow(Math.min(...found.radii) * 0.85, 2);
        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
                const dx = x - found.cx, dy = y - found.cy;
                if (dx * dx + dy * dy > r2) continue;
                const i = (y * w + x) * 4;
                r += px[i]; g += px[i + 1]; b += px[i + 2]; c++;
            }
        }
        if (!c) return 'bronze';
        r /= c * 255; g /= c * 255; b /= c * 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const sat = max ? (max - min) / max : 0;
        let hue = 0;
        if (max !== min) {
            if (max === r) hue = 60 * (((g - b) / (max - min)) % 6);
            else if (max === g) hue = 60 * ((b - r) / (max - min) + 2);
            else hue = 60 * ((r - g) / (max - min) + 4);
        }
        if (hue < 0) hue += 360;

        if (sat < 0.17) return 'silver';
        if (hue >= 36 && hue <= 62 && sat > 0.38 && max > 0.5) return 'gold';
        return 'bronze';
    }

    /* =================================================== relief estimation */

    /*
     * A photo carries no depth, so the height field is estimated from two
     * cues. On a coin the field is flat and smooth while everything struck
     * into it (portrait, legend, beads) is busy with detail, whether it
     * photographs light or dark: local detail energy marks the design as
     * raised. On top of that, local brightness (broad lighting removed)
     * lifts the worn, polished high points. A smoothed copy displaces the
     * geometry, the full resolution copy becomes the normal map.
     */
    function computeRelief(side) {
        if (side.relief) return side.relief;
        const size = 1024;
        const c = makeCanvas(size, size);
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(side.texture, 0, 0, size, size);
        const d = ctx.getImageData(0, 0, size, size).data;

        const lum = new Float32Array(size * size);
        for (let i = 0; i < size * size; i++) {
            lum[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
        }
        // An enlarged small photo carries JPEG blocks and noise, not detail:
        // smooth over roughly one source pixel.
        const fineRadius = Math.max(1, Math.min(6, Math.round(side.upscale * size / side.texture.width * 0.6)));
        const fine = boxBlur(lum, size, size, fineRadius, 2);
        const broad = boxBlur(lum, size, size, 90, 3);
        const tone = new Float32Array(size * size);
        for (let i = 0; i < size * size; i++) tone[i] = fine[i] - 0.7 * broad[i];

        // Detail energy: deviation from a ~1.5% neighbourhood, spread so the
        // inside of a letter or a smooth cheek is carried by its outline.
        const local = boxBlur(fine, size, size, 8, 2);
        const energy = new Float32Array(size * size);
        for (let i = 0; i < size * size; i++) energy[i] = Math.abs(fine[i] - local[i]);
        const design = boxBlur(energy, size, size, 7, 3);

        const toneN = normaliseInside(tone, size, side.outline);
        const designN = normaliseInside(design, size, side.outline);
        const height = new Float32Array(size * size);
        for (let i = 0; i < size * size; i++) height[i] = 0.6 * designN[i] + 0.4 * toneN[i];

        side.relief = {
            size,
            fine: height,
            coarse: boxBlur(height, size, size, 3, 2),
            normalCanvas: makeNormalMap(height, size)
        };
        return side.relief;
    }

    // Scale a field to 0..1 using percentiles taken inside the coin only.
    function normaliseInside(field, size, outline) {
        const samples = [];
        for (let y = 0; y < size; y += 4) {
            for (let x = 0; x < size; x += 4) {
                const nx = (x + 0.5) / (size / 2) - 1, ny = 1 - (y + 0.5) / (size / 2);
                if (Math.hypot(nx, ny) < outlineAt(outline, Math.atan2(ny, nx)) * 0.92) {
                    samples.push(field[y * size + x]);
                }
            }
        }
        samples.sort((a, b) => a - b);
        const lo = samples[Math.floor(samples.length * 0.03)] || 0;
        const hi = samples[Math.floor(samples.length * 0.97)] || 1;
        const span = Math.max(1e-6, hi - lo);
        const out = new Float32Array(field.length);
        for (let i = 0; i < field.length; i++) out[i] = Math.min(1, Math.max(0, (field[i] - lo) / span));
        return out;
    }

    function makeNormalMap(height, size) {
        const c = makeCanvas(size, size);
        const ctx = c.getContext('2d');
        const out = ctx.createImageData(size, size);
        const o = out.data;
        const strength = 5;
        for (let y = 0; y < size; y++) {
            const ym = Math.max(0, y - 1), yp = Math.min(size - 1, y + 1);
            for (let x = 0; x < size; x++) {
                const xm = Math.max(0, x - 1), xp = Math.min(size - 1, x + 1);
                // Canvas y runs down while texture v runs up, hence the sign of ny.
                const nx = -(height[y * size + xp] - height[y * size + xm]) * strength;
                const ny = (height[yp * size + x] - height[ym * size + x]) * strength;
                const len = Math.sqrt(nx * nx + ny * ny + 1);
                const i = (y * size + x) * 4;
                o[i] = (nx / len * 0.5 + 0.5) * 255;
                o[i + 1] = (ny / len * 0.5 + 0.5) * 255;
                o[i + 2] = (1 / len * 0.5 + 0.5) * 255;
                o[i + 3] = 255;
            }
        }
        ctx.putImageData(out, 0, 0);
        return c;
    }

    /* ========================================================= coin model */

    /*
     * How the reverse sits behind the obverse. Seen from behind, world angle φ
     * appears at π - φ; the extra rotation α is the one that makes the two
     * traced outlines agree. Near-round flans give no reliable signal, so the
     * reverse is then shown upright.
     */
    function alignReverse(obv, rev) {
        if (!obv.detected || !rev.detected) return 0;
        const N = OUTLINE_SAMPLES;
        const norm = arr => {
            let mean = 0;
            for (let k = 0; k < N; k++) mean += arr[k];
            mean /= N;
            const out = new Float32Array(N);
            let sd = 0;
            for (let k = 0; k < N; k++) { out[k] = arr[k] / mean - 1; sd += out[k] * out[k]; }
            return { v: out, sd: Math.sqrt(sd / N) };
        };
        const a = norm(obv.outline), b = norm(rev.outline);
        if (a.sd < 0.012 || b.sd < 0.012) return 0;

        const corrAt = shift => {
            let s = 0;
            for (let k = 0; k < N; k++) s += a.v[k] * b.v[((N / 2 - k + shift) % N + N) % N];
            return s / (N * a.sd * b.sd);
        };
        let bestShift = 0, best = -Infinity;
        for (let shift = 0; shift < N; shift++) {
            const c = corrAt(shift);
            if (c > best) { best = c; bestShift = shift; }
        }
        if (best < 0.6 || best - corrAt(0) < 0.08) return 0;
        return (bestShift / N) * Math.PI * 2;
    }

    function buildCoin(obv, rev, anisotropy) {
        const alpha = alignReverse(obv, rev);
        const obvRelief = computeRelief(obv);
        const revRelief = computeRelief(rev);

        // Shared flan shape: both traced outlines (reverse viewed from behind)
        // averaged; a side that was not detected does not vote.
        const shape = new Float32Array(OUTLINE_SAMPLES);
        for (let k = 0; k < OUTLINE_SAMPLES; k++) {
            const phi = (k / OUTLINE_SAMPLES) * Math.PI * 2;
            const o = outlineAt(obv.outline, phi);
            const r = outlineAt(rev.outline, Math.PI - phi + alpha);
            shape[k] = obv.detected && rev.detected ? (o + r) / 2 : obv.detected ? o : rev.detected ? r : 1;
        }
        let maxShape = 0;
        for (let k = 0; k < OUTLINE_SAMPLES; k++) maxShape = Math.max(maxShape, shape[k]);
        for (let k = 0; k < OUTLINE_SAMPLES; k++) shape[k] /= maxShape;

        const geometry = buildCoinGeometry({
            shape,
            front: { outline: obv.outline, inset: obv.edgeInset, height: obvRelief, angle: phi => phi },
            back: { outline: rev.outline, inset: rev.edgeInset, height: revRelief, angle: phi => Math.PI - phi + alpha }
        });

        // The obverse is usually the better-preserved, more typical side.
        const metalName = obv.detected || !rev.detected ? obv.metal : rev.metal;
        const metal = METALS[metalName] || METALS.bronze;
        const obvMap = colourTexture(obv.texture, anisotropy);
        const revMap = colourTexture(rev.texture, anisotropy);
        const obvNormal = normalTexture(obvRelief.normalCanvas, anisotropy);
        const revNormal = normalTexture(revRelief.normalCanvas, anisotropy);

        const face = (map, normalMap) => new THREE.MeshStandardMaterial({
            map, normalMap,
            normalScale: new THREE.Vector2(0.55, 0.55),
            metalness: metal.metalness,
            roughness: metal.roughness
        });
        const edge = new THREE.MeshStandardMaterial({
            map: colourTexture(makeEdgeTexture(obv, rev, alpha), anisotropy),
            metalness: metal.metalness,
            roughness: metal.rimRoughness
        });

        const mesh = new THREE.Mesh(geometry, [
            face(obvMap, obvNormal), face(revMap, revNormal), edge
        ]);
        mesh.userData.metal = metalName;
        return mesh;
    }

    // Average colour of the outer band of a face (just inside the edge) for
    // every degree: the metal and patina the edge would show.
    function ringColours(side) {
        if (side.ringColours) return side.ringColours;
        const size = 256;
        const c = makeCanvas(size, size);
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(side.texture, 0, 0, size, size);
        const d = ctx.getImageData(0, 0, size, size).data;
        const out = new Float32Array(OUTLINE_SAMPLES * 3);
        for (let k = 0; k < OUTLINE_SAMPLES; k++) {
            let r = 0, g = 0, bl = 0, n = 0;
            for (let da = -2; da <= 2; da++) {
                const a = ((k + da) / OUTLINE_SAMPLES) * Math.PI * 2;
                const edge = outlineAt(side.outline, a) * (1 - side.edgeInset);
                for (let f = 0.9; f <= 0.985; f += 0.0125) {
                    const x = Math.round((1 + edge * f * Math.cos(a)) * size / 2 - 0.5);
                    const y = Math.round((1 - edge * f * Math.sin(a)) * size / 2 - 0.5);
                    const i = (Math.min(size - 1, Math.max(0, y)) * size + Math.min(size - 1, Math.max(0, x))) * 4;
                    r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++;
                }
            }
            out[k * 3] = r / n; out[k * 3 + 1] = g / n; out[k * 3 + 2] = bl / n;
        }
        side.ringColours = out;
        return out;
    }

    /*
     * The edge of a struck flan is never photographed, so it is painted:
     * the colour of each face's outer band carried over the edge (front half
     * from the obverse, back half from the reverse), slightly darker since
     * dirt and toning collect there, with fine striations from the flan.
     */
    function makeEdgeTexture(obv, rev, alpha) {
        const W = 1024, H = 64;
        const front = ringColours(obv), back = ringColours(rev);
        const c = makeCanvas(W, H);
        const ctx = c.getContext('2d');
        const img = ctx.createImageData(W, H);
        const d = img.data;
        let seed = 7;
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const noise = new Float32Array(W);
        for (let x = 0; x < W; x++) noise[x] = rand();
        const streak = boxBlur(noise, W, 1, 2, 1);

        const colourAt = (cols, angle) => {
            const f = (((angle / (Math.PI * 2)) * OUTLINE_SAMPLES) % OUTLINE_SAMPLES + OUTLINE_SAMPLES) % OUTLINE_SAMPLES;
            const i = Math.floor(f), j = (i + 1) % OUTLINE_SAMPLES, k = f - i;
            return [0, 1, 2].map(ch => cols[i * 3 + ch] * (1 - k) + cols[j * 3 + ch] * k);
        };
        for (let x = 0; x < W; x++) {
            const phi = (x / W) * Math.PI * 2;
            const cf = colourAt(front, phi);
            const cb = colourAt(back, Math.PI - phi + alpha);
            for (let y = 0; y < H; y++) {
                const v = y / (H - 1);              // 0 = front face, 1 = reverse
                const mix = smoothstep(0.3, 0.7, v);
                // Darkest at the middle of the edge, furthest from the faces.
                const shade = (0.8 + 0.12 * Math.abs(v - 0.5) * 2) * (0.93 + streak[x] * 0.14);
                const i = (y * W + x) * 4;
                for (let ch = 0; ch < 3; ch++) d[i + ch] = (cf[ch] * (1 - mix) + cb[ch] * mix) * shade;
                d[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        return c;
    }

    /*
     * Geometry groups: 0 front face, 1 back face, 2 edge. Every face vertex at fraction s of the flan radius
     * samples its photo at fraction s of that photo's own traced outline, so
     * each photographed coin is stretched exactly onto the shared shape.
     */
    function buildCoinGeometry({ shape, front, back }) {
        const SEG = 256;            // around the coin
        const RINGS = 110;          // centre to edge on each face
        const EDGE_STEPS = 12;      // around the rounded edge (even)
        const b = EDGE_ROUNDING;

        const positions = [], uvs = [], indices = [];
        const groups = [];
        const weld = [];            // vertex pairs to share a normal

        // Uneven thickness, like a hand-struck flan; seeded by the shape so a
        // coin always gets the same edge.
        let seed = 0;
        for (let k = 0; k < OUTLINE_SAMPLES; k += 7) seed += shape[k] * (k + 1);
        const p1 = seed % (Math.PI * 2), p2 = (seed * 1.7) % (Math.PI * 2);
        const thickness = phi => HALF_THICKNESS * (1 + 0.07 * Math.sin(phi * 2 + p1) + 0.04 * Math.sin(phi * 3 + p2));
        const centreThickness = HALF_THICKNESS * 1.03;

        const uvFor = (side, angle, s) => {
            const r = s * outlineAt(side.outline, angle) * (1 - side.inset);
            return [0.5 + 0.5 * r * Math.cos(angle), 0.5 + 0.5 * r * Math.sin(angle)];
        };

        const addVertex = (x, y, z, u, v) => {
            positions.push(x, y, z);
            uvs.push(u, v);
            return positions.length / 3 - 1;
        };

        const faceTopZ = (t, phi) => centreThickness * (1 - t * t) + thickness(phi) * t * t;
        const falloff = t => 1 - smoothstep(0.86, 1, t);

        function buildFace(side, sign, materialIndex) {
            const start = indices.length;
            const ring = [];
            const centreUv = uvFor(side, 0, 0);
            const centreH = sampleHeight(side.height.coarse, side.height.size, centreUv[0], centreUv[1]);
            const centre = addVertex(0, 0, sign * (centreThickness + DEFAULT_RELIEF * (centreH - 0.35)), centreUv[0], centreUv[1]);

            for (let i = 1; i <= RINGS; i++) {
                const tt = i / RINGS;
                const s = tt * (1 - b);
                const row = [];
                for (let j = 0; j < SEG; j++) {
                    const phi = (j / SEG) * Math.PI * 2;
                    const radius = COIN_RADIUS * s * outlineAt(shape, phi);
                    const [u, v] = uvFor(side, side.angle(phi), s);
                    const hgt = sampleHeight(side.height.coarse, side.height.size, u, v);
                    const z = faceTopZ(tt, phi) + DEFAULT_RELIEF * (hgt - 0.35) * falloff(tt);
                    row.push(addVertex(radius * Math.cos(phi), radius * Math.sin(phi), sign * z, u, v));
                }
                ring.push(row);
            }

            const tri = (a, b2, c) => (sign > 0 ? indices.push(a, b2, c) : indices.push(a, c, b2));
            for (let j = 0; j < SEG; j++) tri(centre, ring[0][j], ring[0][(j + 1) % SEG]);
            for (let i = 0; i < RINGS - 1; i++) {
                for (let j = 0; j < SEG; j++) {
                    const jn = (j + 1) % SEG;
                    tri(ring[i][j], ring[i + 1][j], ring[i + 1][jn]);
                    tri(ring[i][j], ring[i + 1][jn], ring[i][jn]);
                }
            }
            groups.push([start, indices.length - start, materialIndex]);
            return ring[RINGS - 1];
        }

        // Rounded edge: a half ellipse from the front face out to the widest
        // point and back to the reverse. It has its own strip texture
        // (u = angle around the coin, v = front to back), see makeEdgeTexture.
        function buildEdge() {
            const start = indices.length;
            const rows = [];
            for (let k = 0; k <= EDGE_STEPS; k++) {
                const a = Math.PI / 2 - Math.PI * (k / EDGE_STEPS);
                const s = (1 - b) + b * Math.cos(a);
                const row = [];
                // One extra column closes the strip texture's seam.
                for (let j = 0; j <= SEG; j++) {
                    const phi = (j / SEG) * Math.PI * 2;
                    const radius = COIN_RADIUS * s * outlineAt(shape, phi);
                    row.push(addVertex(radius * Math.cos(phi), radius * Math.sin(phi), thickness(phi) * Math.sin(a),
                                       j / SEG, 1 - k / EDGE_STEPS));
                }
                rows.push(row);
            }
            for (let i = 0; i < EDGE_STEPS; i++) {
                for (let j = 0; j < SEG; j++) {
                    indices.push(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1]);
                    indices.push(rows[i][j], rows[i + 1][j + 1], rows[i][j + 1]);
                }
            }
            groups.push([start, indices.length - start, 2]);
            return rows;
        }

        const frontRim = buildFace(front, 1, 0);
        const backRim = buildFace(back, -1, 1);
        const edge = buildEdge();

        for (let j = 0; j <= SEG; j++) {
            weld.push([frontRim[j % SEG], edge[0][j]]);
            weld.push([backRim[j % SEG], edge[EDGE_STEPS][j]]);
        }
        for (let k = 0; k <= EDGE_STEPS; k++) weld.push([edge[k][0], edge[k][SEG]]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        groups.forEach(([s, c, m]) => geometry.addGroup(s, c, m));
        geometry.computeVertexNormals();

        // Seams between groups use separate vertices; share their normals so
        // the face rolls smoothly into the edge.
        // A vertex can sit in several pairs (the seam column of the edge
        // touches both faces), so pairs are merged into groups first.
        const normal = geometry.attributes.normal;
        const parent = new Map();
        const find = i => {
            while (parent.get(i) !== i) i = parent.get(i);
            return i;
        };
        weld.forEach(([i, j]) => {
            if (!parent.has(i)) parent.set(i, i);
            if (!parent.has(j)) parent.set(j, j);
            const ri = find(i), rj = find(j);
            if (ri !== rj) parent.set(rj, ri);
        });
        const sum = new Map();
        parent.forEach((_, i) => {
            const r = find(i);
            const acc = sum.get(r) || [0, 0, 0];
            acc[0] += normal.getX(i); acc[1] += normal.getY(i); acc[2] += normal.getZ(i);
            sum.set(r, acc);
        });
        parent.forEach((_, i) => {
            const [x, y, z] = sum.get(find(i));
            const len = Math.hypot(x, y, z) || 1;
            normal.setXYZ(i, x / len, y / len, z / len);
        });
        normal.needsUpdate = true;
        geometry.computeBoundingSphere();
        return geometry;
    }

    function colourTexture(canvas, anisotropy) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = anisotropy;
        return tex;
    }

    function normalTexture(canvas, anisotropy) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = anisotropy;
        return tex;
    }

    /* ============================================================= viewer */

    const LIGHTING = [
        {
            name: ['coin3d.light.studio', 'Studio light'],
            env: 1.0,
            lights: [
                { type: 'hemi', sky: 0xffffff, ground: 0x4a4436, intensity: 0.35 },
                { type: 'dir', color: 0xfff4e0, intensity: 1.5, pos: [3, 4, 6] },
                { type: 'dir', color: 0xffffff, intensity: 0.45, pos: [-5, -1, 3] }
            ]
        },
        {
            // Low-angle light from the upper left, as used to photograph
            // worn coins: it brings out the relief and the legends.
            name: ['coin3d.light.raking', 'Raking light'],
            env: 0.35,
            lights: [
                { type: 'ambient', color: 0xffffff, intensity: 0.08 },
                { type: 'dir', color: 0xfff1d8, intensity: 2.6, pos: [-6, 3, 1.4] },
                { type: 'dir', color: 0xdfe8ff, intensity: 0.2, pos: [5, -2, 3] }
            ]
        },
        {
            name: ['coin3d.light.soft', 'Soft light'],
            env: 1.35,
            lights: [
                { type: 'hemi', sky: 0xffffff, ground: 0x8a8070, intensity: 0.6 },
                { type: 'dir', color: 0xffffff, intensity: 0.6, pos: [0, 2, 6] }
            ]
        },
        {
            name: ['coin3d.light.museum', 'Museum display'],
            env: 0.5,
            lights: [
                { type: 'ambient', color: 0xffffff, intensity: 0.12 },
                { type: 'spot', color: 0xffe9c4, intensity: 2.2, pos: [2, 7, 5], angle: Math.PI / 7, penumbra: 0.45 },
                { type: 'dir', color: 0xcfe0ff, intensity: 0.3, pos: [-4, -3, 2] }
            ]
        }
    ];

    function createViewer(elements) {
        let renderer = null, scene, camera, controls, coinGroup, cameraRig, worldRig;
        let coin = null;
        let lightingIndex = 0;
        let visible = true;
        let flip = null;
        let controlsBar = null;
        let freeHeight = 1;         // share of the view height not under the bar
        let showToast = () => {};   // set up with the control bar
        let hintShown = false;

        function init() {
            renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setClearColor(0x000000, 0);
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;

            scene = new THREE.Scene();
            scene.environment = studioEnvironment(renderer);

            camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
            camera.position.set(0, 0, 10);
            scene.add(camera);          // lights ride on the camera, see setLighting

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.enablePan = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.2;

            coinGroup = new THREE.Group();
            scene.add(coinGroup);
            setLighting(0);

            if ('IntersectionObserver' in window) {
                new IntersectionObserver(entries => { visible = entries[0].isIntersecting; })
                    .observe(elements.container);
            }
            window.addEventListener('resize', resize);
            renderer.setAnimationLoop(frame);
        }

        function frame(time) {
            if (!visible || document.hidden) return;
            if (flip) {
                const p = Math.min(1, (time - flip.start) / 900);
                const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                coinGroup.rotation.y = flip.from + Math.PI * eased;
                if (p === 1) flip = null;
            }
            controls.update();
            renderer.render(scene, camera);
        }

        // Lights are attached to the camera: turning the coin under a fixed
        // lamp, which is how a coin is examined in the hand.
        function setLighting(index) {
            lightingIndex = index;
            if (cameraRig) camera.remove(cameraRig);
            if (worldRig) scene.remove(worldRig);
            cameraRig = new THREE.Group();
            worldRig = new THREE.Group();
            const preset = LIGHTING[index];
            preset.lights.forEach(spec => {
                let light;
                if (spec.type === 'hemi') light = new THREE.HemisphereLight(spec.sky, spec.ground, spec.intensity);
                else if (spec.type === 'ambient') light = new THREE.AmbientLight(spec.color, spec.intensity);
                else if (spec.type === 'spot') {
                    light = new THREE.SpotLight(spec.color, spec.intensity, 0, spec.angle, spec.penumbra);
                } else light = new THREE.DirectionalLight(spec.color, spec.intensity);
                // Positions are relative to the camera (camera looks down -z,
                // the coin sits about `distance` in front of it).
                if (spec.pos) light.position.set(spec.pos[0], spec.pos[1], spec.pos[2] - fitDistance());
                // A hemisphere light takes its direction from its world
                // position, so it stays in the scene with the sky overhead.
                (spec.type === 'hemi' ? worldRig : cameraRig).add(light);
            });
            camera.add(cameraRig);
            scene.add(worldRig);
            scene.traverse(obj => {
                if (obj.material) [].concat(obj.material).forEach(m => { m.envMapIntensity = preset.env; });
            });
            const btn = controlsBar && controlsBar.querySelector('[data-action="lighting"]');
            if (btn) {
                const label = `${t('coin3d.lighting', 'Lighting')}: ${t(preset.name[0], preset.name[1])}`;
                btn.title = `${label} (L)`;
                btn.setAttribute('aria-label', label);
            }
        }

        // Camera distance that frames the coin with a margin at any aspect.
        // Only the part of the view above the control bar counts.
        function fitDistance() {
            const aspect = camera ? camera.aspect : 1;
            const halfFov = THREE.MathUtils.degToRad((camera ? camera.fov : 32) / 2);
            return COIN_RADIUS / (0.82 * Math.tan(halfFov) * Math.min(freeHeight, aspect));
        }

        function resetView() {
            const d = fitDistance();
            camera.position.set(0, 0, d);
            controls.target.set(0, 0, 0);
            controls.minDistance = d * 0.4;
            controls.maxDistance = d * 2.2;
            controls.update();
        }

        function zoom(factor) {
            const offset = camera.position.clone().sub(controls.target);
            const len = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
            camera.position.copy(controls.target).add(offset.setLength(len));
        }

        function resize() {
            if (!renderer) return;
            const width = elements.container.clientWidth;
            const height = elements.container.clientHeight;
            if (!width || !height) return;
            const prevFit = fitDistance();
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            // Centre the coin in the space above the control bar by shifting
            // the projection up by half the bar's footprint.
            let barSpace = 0;
            if (controlsBar) {
                const box = elements.container.getBoundingClientRect();
                barSpace = Math.max(0, box.bottom - controlsBar.getBoundingClientRect().top + 8);
            }
            freeHeight = Math.max(0.5, (height - barSpace) / height);
            camera.setViewOffset(width, height, 0, barSpace / 2, width, height);
            camera.updateProjectionMatrix();
            // Keep the user's zoom level relative to the new framing.
            const ratio = camera.position.distanceTo(controls.target) / prevFit;
            const d = fitDistance();
            controls.minDistance = d * 0.4;
            controls.maxDistance = d * 2.2;
            camera.position.sub(controls.target).setLength(d * ratio).add(controls.target);
            setLighting(lightingIndex);
        }

        /*
         * Compact control bar: play/pause, flip, lighting and reset. Zoom has
         * no buttons - wheel, pinch and the +/- keys cover it. The bar keeps
         * itself out of the way:
         *   - dragging the coin pauses auto-rotation, which picks up again a
         *     few seconds after letting go (unless it was switched off);
         *   - reset only appears once the view has been moved or zoomed;
         *   - lighting and flip name what they switched to in a short toast;
         *   - on devices with a mouse the bar fades back when not in use;
         *   - double-click / double-tap flips, keys work once the viewer has
         *     focus (Space, F, L, R, +, -).
         */
        function addControls() {
            const icons = {
                pause: 'M14,19H18V5H14M6,19H10V5H6V19Z',
                play: 'M8,5.14V19.14L19,12.14L8,5.14Z',
                flip: 'M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z',
                lighting: 'M12,6A6,6 0 0,1 18,12C18,14.22 16.79,16.16 15,17.2V19A1,1 0 0,1 14,20H10A1,1 0 0,1 9,19V17.2C7.21,16.16 6,14.22 6,12A6,6 0 0,1 12,6M14,21V22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22V21H14M20,11H23V13H20V11M1,11H4V13H1V11M13,1V4H11V1H13M4.92,3.5L7.05,5.64L5.63,7.05L3.5,4.93L4.92,3.5M16.95,5.63L19.07,3.5L20.5,4.93L18.37,7.05L16.95,5.63Z',
                reset: 'M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z'
            };
            const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;

            controlsBar = document.createElement('div');
            controlsBar.className = 'model-controls';
            controlsBar.setAttribute('role', 'toolbar');
            controlsBar.setAttribute('aria-label', t('coin3d.controls', '3D view controls'));
            ['rotate', 'flip', 'lighting', 'reset'].forEach(action => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'control-btn';
                btn.dataset.action = action;
                controlsBar.appendChild(btn);
            });
            const buttons = {};
            controlsBar.querySelectorAll('button').forEach(b => { buttons[b.dataset.action] = b; });
            const label = (btn, text, key) => {
                btn.title = `${text} (${key})`;
                btn.setAttribute('aria-label', text);
            };
            buttons.flip.innerHTML = svg(icons.flip);
            label(buttons.flip, t('coin3d.flip', 'Flip coin'), 'F');
            buttons.lighting.innerHTML = svg(icons.lighting);
            buttons.reset.innerHTML = svg(icons.reset);
            label(buttons.reset, t('coin3d.reset', 'Reset view'), 'R');
            buttons.reset.hidden = true;

            const toast = document.createElement('div');
            toast.className = 'model-toast';
            toast.setAttribute('aria-live', 'polite');
            elements.container.append(controlsBar, toast);

            let toastTimer = null;
            showToast = (text, ms = 1400) => {
                toast.textContent = text;
                toast.classList.add('is-visible');
                clearTimeout(toastTimer);
                toastTimer = setTimeout(() => toast.classList.remove('is-visible'), ms);
            };

            // Auto-rotation: the user's choice, paused while they handle the coin.
            let rotateWanted = true;
            let resumeTimer = null;
            const syncRotate = () => {
                const on = rotateWanted;
                buttons.rotate.innerHTML = svg(on ? icons.pause : icons.play);
                buttons.rotate.setAttribute('aria-pressed', String(on));
                label(buttons.rotate, on ? t('coin3d.pause', 'Pause rotation') : t('coin3d.play', 'Rotate'), t('coin3d.keySpace', 'Space'));
            };
            const setRotate = on => {
                rotateWanted = on;
                clearTimeout(resumeTimer);
                controls.autoRotate = on;
                syncRotate();
            };
            syncRotate();

            const markMoved = () => { buttons.reset.hidden = false; };
            controls.addEventListener('start', () => {
                clearTimeout(resumeTimer);
                controls.autoRotate = false;
                markMoved();
            });
            controls.addEventListener('end', () => {
                clearTimeout(resumeTimer);
                if (rotateWanted) resumeTimer = setTimeout(() => { controls.autoRotate = rotateWanted; }, 3000);
            });
            // OrbitControls' wheel zoom does not fire start/end.
            renderer.domElement.addEventListener('wheel', markMoved, { passive: true });

            const doFlip = () => {
                if (flip) return;
                flip = { start: performance.now(), from: coinGroup.rotation.y };
                // Which face will be towards the viewer once the turn ends.
                const angle = coinGroup.rotation.y + Math.PI;
                const front = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
                const facing = front.dot(camera.position.clone().sub(controls.target)) > 0;
                showToast(facing ? t('coin3d.obverse', 'Obverse') : t('coin3d.reverse', 'Reverse'));
            };
            const nextLighting = () => {
                setLighting((lightingIndex + 1) % LIGHTING.length);
                const preset = LIGHTING[lightingIndex];
                showToast(t(preset.name[0], preset.name[1]));
            };
            const reset = () => {
                resetView();
                coinGroup.rotation.y = 0;
                flip = null;
                buttons.reset.hidden = true;
            };

            controlsBar.addEventListener('click', e => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                switch (btn.dataset.action) {
                    case 'rotate': setRotate(!rotateWanted); break;
                    case 'flip': doFlip(); break;
                    case 'lighting': nextLighting(); break;
                    case 'reset': reset(); break;
                }
            });

            renderer.domElement.addEventListener('dblclick', doFlip);

            const canvas = renderer.domElement;
            canvas.tabIndex = 0;
            canvas.setAttribute('aria-label', t('coin3d.viewer', '3D coin model. Drag to turn, scroll or pinch to zoom, double-click to flip.'));
            canvas.addEventListener('keydown', e => {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                const key = e.key.toLowerCase();
                if (key === ' ' || key === 'k') setRotate(!rotateWanted);
                else if (key === 'f') doFlip();
                else if (key === 'l') nextLighting();
                else if (key === 'r') reset();
                else if (key === '+' || key === '=') { zoom(0.85); markMoved(); }
                else if (key === '-' || key === '_') { zoom(1 / 0.85); markMoved(); }
                else return;
                e.preventDefault();
            });

            // Fade the bar when the pointer has left it alone for a while.
            let idleTimer = null;
            const wake = () => {
                controlsBar.classList.remove('is-idle');
                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => controlsBar.classList.add('is-idle'), 2500);
            };
            elements.container.addEventListener('pointermove', wake);
            elements.container.addEventListener('pointerdown', wake);
            wake();

            setLighting(lightingIndex);
        }

        function prepare() {
            if (renderer) return;
            init();
            addControls();
        }

        function show(mesh) {
            prepare();
            if (coin) {
                coinGroup.remove(coin);
                coin.geometry.dispose();
                [].concat(coin.material).forEach(m => {
                    ['map', 'normalMap'].forEach(k => m[k] && m[k].dispose());
                    m.dispose();
                });
            }
            coin = mesh;
            coinGroup.rotation.set(0, 0, 0);
            flip = null;
            coinGroup.add(coin);
            setLighting(lightingIndex);
            resize();
            resetView();
            controlsBar.querySelector('[data-action="reset"]').hidden = true;
            if (!hintShown) {
                hintShown = true;
                showToast(t('coin3d.hint', 'Drag to turn · scroll or pinch to zoom · double-click to flip'), 4500);
            }
        }

        return {
            prepare,
            show,
            resize,
            maxAnisotropy: () => Math.min(8, renderer.capabilities.getMaxAnisotropy())
        };
    }

    // A neutral photo studio for reflections: bright ceiling, darker floor and
    // a few soft boxes, so metal has something to mirror.
    function studioEnvironment(renderer) {
        const w = 1024, h = 512;
        const c = makeCanvas(w, h);
        const ctx = c.getContext('2d');
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#f4f1ea');
        sky.addColorStop(0.45, '#b9b3a8');
        sky.addColorStop(0.55, '#6d675e');
        sky.addColorStop(1, '#2a2723');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const box = (x, y, bw, bh, colour) => {
            const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(bw, bh));
            g.addColorStop(0, colour);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(x - bw, y - bh, bw * 2, bh * 2);
        };
        box(w * 0.25, h * 0.28, 120, 70, 'rgba(255,250,240,1)');
        box(w * 0.72, h * 0.22, 150, 60, 'rgba(255,255,255,0.95)');
        box(w * 0.5, h * 0.12, 220, 40, 'rgba(255,246,230,0.8)');
        box(w * 0.95, h * 0.4, 80, 60, 'rgba(255,236,200,0.6)');

        const tex = new THREE.CanvasTexture(c);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.encoding = THREE.sRGBEncoding;
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromEquirectangular(tex).texture;
        tex.dispose();
        pmrem.dispose();
        return env;
    }

    /* ============================================================ helpers */

    function makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    // Linear interpolation of a per-angle profile at any angle (radians).
    function outlineAt(outline, angle) {
        const N = outline.length;
        let f = (angle / (Math.PI * 2)) * N;
        f = ((f % N) + N) % N;
        const i = Math.floor(f), frac = f - i;
        return outline[i] * (1 - frac) + outline[(i + 1) % N] * frac;
    }

    function sampleHeight(field, size, u, v) {
        const x = Math.min(size - 1, Math.max(0, u * (size - 1)));
        const y = Math.min(size - 1, Math.max(0, (1 - v) * (size - 1)));
        return sampleGrey(field, size, size, x, y);
    }

    function sampleGrey(field, w, h, x, y) {
        x = Math.min(w - 1, Math.max(0, x));
        y = Math.min(h - 1, Math.max(0, y));
        const x0 = Math.floor(x), y0 = Math.floor(y);
        const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
        const fx = x - x0, fy = y - y0;
        const top = field[y0 * w + x0] * (1 - fx) + field[y0 * w + x1] * fx;
        const bottom = field[y1 * w + x0] * (1 - fx) + field[y1 * w + x1] * fx;
        return top * (1 - fy) + bottom * fy;
    }

    function smoothstep(e0, e1, x) {
        const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
        return k * k * (3 - 2 * k);
    }

    function blurRGB(px, w, h) {
        const out = new Float32Array(w * h * 3);
        for (let c = 0; c < 3; c++) {
            const ch = new Float32Array(w * h);
            for (let i = 0; i < w * h; i++) ch[i] = px[i * 4 + c];
            const b = boxBlur(ch, w, h, 1, 1);
            for (let i = 0; i < w * h; i++) out[i * 3 + c] = b[i];
        }
        return out;
    }

    function luminance(rgb, w, h) {
        const out = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) out[i] = rgb[i * 3] * 0.299 + rgb[i * 3 + 1] * 0.587 + rgb[i * 3 + 2] * 0.114;
        return out;
    }

    // Separable box blur with edge clamping; several passes approximate a
    // Gaussian. Cost does not depend on the radius.
    function boxBlur(src, w, h, radius, passes) {
        let a = Float32Array.from(src);
        let b = new Float32Array(w * h);
        const span = radius * 2 + 1;
        for (let p = 0; p < passes; p++) {
            for (let y = 0; y < h; y++) {
                const row = y * w;
                let sum = 0;
                for (let k = -radius; k <= radius; k++) sum += a[row + Math.min(w - 1, Math.max(0, k))];
                for (let x = 0; x < w; x++) {
                    b[row + x] = sum / span;
                    sum += a[row + Math.min(w - 1, x + radius + 1)] - a[row + Math.max(0, x - radius)];
                }
            }
            for (let x = 0; x < w; x++) {
                let sum = 0;
                for (let k = -radius; k <= radius; k++) sum += b[Math.min(h - 1, Math.max(0, k)) * w + x];
                for (let y = 0; y < h; y++) {
                    a[y * w + x] = sum / span;
                    sum += b[Math.min(h - 1, y + radius + 1) * w + x] - b[Math.max(0, y - radius) * w + x];
                }
            }
        }
        return a;
    }

    function floodFromBorder(passable, w, h) {
        const seen = new Uint8Array(w * h);
        const stack = new Int32Array(w * h);
        let top = 0;
        const push = i => { if (passable[i] && !seen[i]) { seen[i] = 1; stack[top++] = i; } };
        for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
        for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
        while (top) {
            const i = stack[--top];
            const x = i % w, y = (i / w) | 0;
            if (x > 0) push(i - 1);
            if (x < w - 1) push(i + 1);
            if (y > 0) push(i - w);
            if (y < h - 1) push(i + w);
        }
        return seen;
    }

    function fillHoles(mask, w, h) {
        const empty = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) empty[i] = mask[i] ? 0 : 1;
        const outside = floodFromBorder(empty, w, h);
        const out = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) out[i] = outside[i] ? 0 : 1;
        return out;
    }

    function erode(mask, w, h, r) {
        return morph(mask, w, h, r, true);
    }

    function dilate(mask, w, h, r) {
        return morph(mask, w, h, r, false);
    }

    // Square structuring element, done as two separable passes.
    function morph(mask, w, h, r, isErode) {
        const pass = (src, horizontal) => {
            const out = new Uint8Array(w * h);
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let v = isErode ? 1 : 0;
                    for (let k = -r; k <= r; k++) {
                        const xx = horizontal ? x + k : x, yy = horizontal ? y : y + k;
                        const inside = xx >= 0 && yy >= 0 && xx < w && yy < h ? src[yy * w + xx] : 0;
                        if (isErode && !inside) { v = 0; break; }
                        if (!isErode && inside) { v = 1; break; }
                    }
                    out[y * w + x] = v;
                }
            }
            return out;
        };
        return pass(pass(mask, true), false);
    }
})();
