document.addEventListener("DOMContentLoaded", async function() {
    const highlightsSection = document.querySelector('.auction-highlights');
    const carousel = document.getElementById('auction-carousel');
    const carouselTrack = document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.carousel-control.prev');
    const nextBtn = document.querySelector('.carousel-control.next');
    if (!carouselTrack) return;

    // Accessibility attributes
    if (highlightsSection) {
        highlightsSection.setAttribute('aria-label', 'Auction highlights');
    }
    carouselTrack.setAttribute('aria-live', 'polite');

    async function loadAuctionItems() {
        try {
            const response = await fetch('/assets/data/auctionItems.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Помилка завантаження JSON:', error);
            return [];
        }
    }

    function getItemsPerView() {
        const w = window.innerWidth;
        if (w < 640) return 2;
        if (w < 992) return 3;
        if (w < 1200) return 4;
        return 5;
    }

    let itemsPerView = getItemsPerView();
    let currentIndex = 0;
    let autoTimer = null;

    // On small screens we want native horizontal scroll with visible movement
    const isScrollMode = () => window.matchMedia('(max-width: 1024px)').matches;
    let lastScrollMode = isScrollMode();

    // ---- Endless scroll (mobile/tablet only) -----------------------------
    // On small screens the track is a native horizontal scroller. To make it
    // wrap, the list is rendered LOOP_COPIES times and scrollLeft is silently
    // re-centred whenever the user crosses into an outer copy, so the first
    // coin follows the last one and vice versa.
    /* Seven copies. The re-centre is deferred until scrolling stops (see
       onLoopScroll), so what matters is how far one fling can travel before it
       runs out of strip and forces a mid-fling wrap - which is the stutter you
       feel on a real phone. Simulated over 6000 flings of 200-3000px:

           copies=3   8 cards runway   wraps mid-fling on 215% of flings
           copies=5  18 cards runway   7.0%
           copies=7  28 cards runway   0.0%   <-
           copies=9  38 cards runway   0.0%   (no further gain)

       Cost is 70 cards in the DOM, all reusing the same 10 cached images. */
    const LOOP_COPIES = 7;
    let loopSetWidth = 0;
    let settleTimer = null;
    // Long enough that a fling's tail does not look like a stop, short enough
    // that the re-centre lands before the next gesture starts.
    const SETTLE_MS = 140;

    function buildCard(item, isClone) {
        const el = document.createElement('div');
        el.className = 'auction-item';
        el.innerHTML = `
                <div class="item-content">
                    <div class="image-wrap">
                        <a class="image-link" href="${item.link}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
                            <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async">
                        </a>
                        <span class="price-badge">${item.price || ''}</span>
                    </div>
                    <div class="item-details">
                        <h2 class="item-title" title="${item.title}">${item.title}</h2>
                        <p class="item-desc">${item.description || ''}</p>
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="view-details-btn">View details</a>
                    </div>
                </div>
            `;
        // Lot photos are hotlinked from an external auction host, so a missing
        // or failed image is routine. Left alone the browser draws its own
        // broken-image glyph over the tile; dropping the <img> lets the neutral
        // .image-wrap background stand in instead. The link stays clickable,
        // and nothing is lost for assistive tech — .image-link is already
        // aria-hidden, with the real title in .item-title below.
        const wrap = el.querySelector('.image-wrap');
        const img = wrap && wrap.querySelector('img');
        if (img) {
            const drop = function () {
                img.remove();
                wrap.classList.add('is-empty');
            };
            if (!item.image) {
                drop();
            } else {
                img.addEventListener('error', drop, { once: true });
                // A clone built from an already-failed cached image can finish
                // before the listener above exists, and then never fires.
                if (img.complete && img.naturalWidth === 0) drop();
            }
        }

        if (isClone) {
            // Duplicates exist only to make the scroll endless: keep them out of
            // the accessibility tree and the tab order so the list still reads
            // as the real number of lots.
            el.setAttribute('aria-hidden', 'true');
            el.querySelectorAll('a').forEach((a) => { a.tabIndex = -1; });
        }
        return el;
    }

    // Jump without animating. `behavior: 'instant'` overrides the stylesheet's
    // `scroll-behavior: smooth`; toggling an inline style around the assignment
    // is not reliable, and if smooth wins the wrap glides visibly backwards.
    function scrollInstant(left) {
        if (typeof carouselTrack.scrollTo === 'function') {
            carouselTrack.scrollTo({ left: left, behavior: 'instant' });
        } else {
            carouselTrack.scrollLeft = left;
        }
    }

    /* Re-centre the strip, but ONLY once scrolling has completely stopped.

       Touch scrolling runs on the compositor thread. Writing scrollLeft from
       the main thread mid-fling cancels the momentum outright on iOS Safari
       and stutters on Android Chrome - and while a finger is still down it
       yanks the content out from under it. Desktop devtools emulation scrolls
       with a mouse and has no fling physics, which is why this only ever
       showed up on real hardware.

       Deferring is safe because the content repeats every S and there are
       LOOP_COPIES of it: from the centre there is roughly 2.5 sets of runway
       in each direction, so no single fling can reach the real end of the
       scroller before we get a chance to re-centre. */
    function recentreLoop() {
        settleTimer = null;
        if (!loopSetWidth) return;
        const S = loopSetWidth;
        const mid = S * (LOOP_COPIES / 2);
        const drift = carouselTrack.scrollLeft - mid;
        if (Math.abs(drift) > S) {
            const sets = Math.trunc(drift / S);
            scrollInstant(carouselTrack.scrollLeft - sets * S);
        }
    }

    function onLoopScroll() {
        // Safety valve. Deferring to settle assumes a fling cannot outrun the
        // strip, which holds for normal gestures but not for a very hard flick.
        // If one gets within half a set of either real end, re-centre now even
        // though it costs the momentum: a lost fling is a far smaller glitch
        // than slamming into the end of the scroller and stopping dead.
        if (loopSetWidth) {
            const x = carouselTrack.scrollLeft;
            const max = carouselTrack.scrollWidth - carouselTrack.clientWidth;
            if (x < loopSetWidth * 0.5 || x > max - loopSetWidth * 0.5) {
                recentreLoop();
                return;
            }
        }
        // Otherwise each scroll event pushes the settle check further out; it
        // only fires once the scroller has been quiet for SETTLE_MS.
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(recentreLoop, SETTLE_MS);
    }

    function teardownLoop() {
        carouselTrack.removeEventListener('scroll', onLoopScroll);
        carouselTrack.removeEventListener('scrollend', recentreLoop);
        if (settleTimer) {
            clearTimeout(settleTimer);
            settleTimer = null;
        }
        loopSetWidth = 0;
    }

    function setupLoop() {
        teardownLoop();
        // Measure after layout, so the geometry reflects the cards just added.
        requestAnimationFrame(() => {
            if (!isScrollMode()) return;
            const cards = carouselTrack.children;
            const perCopy = auctionItems.length;
            if (cards.length < perCopy * LOOP_COPIES) return;
            // One set = the gap between the starts of copies 2 and 3. Two traps
            // this avoids: scrollWidth / LOOP_COPIES folds in the track's
            // horizontal padding and one missing gap, and anchoring on cards[0]
            // inherits the -5px `:first-child` margin that still applies between
            // 769 and 1024px. Either one drifts the content sideways every wrap.
            const setWidth = cards[perCopy * 2].offsetLeft - cards[perCopy].offsetLeft;
            // Needs a screenful of slack either side, otherwise wrapping would
            // fight the scroller's own clamping at 0 and at max.
            if (!(setWidth > carouselTrack.clientWidth)) return;
            loopSetWidth = setWidth;
            // Rest at the centre of the three copies, so there is half a set of
            // slack in both directions before anything needs to wrap.
            scrollInstant(setWidth * (LOOP_COPIES / 2));
            carouselTrack.addEventListener('scroll', onLoopScroll, { passive: true });
            // Where supported this is an exact "scrolling has stopped" signal,
            // so the re-centre happens sooner than the timeout fallback. Both
            // may fire; recentreLoop is idempotent.
            if ('onscrollend' in window) {
                carouselTrack.addEventListener('scrollend', recentreLoop);
            }
        });
    }

    function loadCarouselItems() {
        teardownLoop();
        if (!Array.isArray(auctionItems) || auctionItems.length === 0) {
            carouselTrack.innerHTML = '<div style="color:#fff;opacity:.8;text-align:center;width:100%">No highlights available right now.</div>';
            return;
        }
        carouselTrack.innerHTML = '';
        const scroll = isScrollMode();
        // In scroll mode render every item so the user can slide through them,
        // repeated LOOP_COPIES times to give the wrap-around room to work.
        const count = scroll ? auctionItems.length : itemsPerView;
        const copies = scroll ? LOOP_COPIES : 1;
        for (let c = 0; c < copies; c++) {
            for (let i = 0; i < count; i++) {
                const item = auctionItems[(currentIndex + i) % auctionItems.length];
                carouselTrack.appendChild(buildCard(item, scroll && c !== 1));
            }
        }
        if (scroll) setupLoop();
    }

    // One card plus the gap, measured rather than assumed: the gap differs per
    // breakpoint (18 / 15 / 12px).
    function cardStep() {
        const items = carouselTrack.querySelectorAll('.auction-item');
        if (!items.length) return 0;
        if (items.length > 1) {
            return items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
        }
        return items[0].getBoundingClientRect().width;
    }

    window.nextSlide = function() {
        // In scroll mode the scroller is the source of truth, so nudge it along
        // instead of re-rendering, which would discard the scroll position and
        // defeat the wrap-around.
        if (isScrollMode()) {
            carouselTrack.scrollBy({ left: cardStep(), behavior: 'smooth' });
            return;
        }
        currentIndex = (currentIndex + 1) % auctionItems.length;
        loadCarouselItems();
    };

    window.prevSlide = function() {
        if (isScrollMode()) {
            carouselTrack.scrollBy({ left: -cardStep(), behavior: 'smooth' });
            return;
        }
        currentIndex = (currentIndex - 1 + auctionItems.length) % auctionItems.length;
        loadCarouselItems();
    };

    auctionItems = await loadAuctionItems();
    loadCarouselItems();

    // Auto-advance controls
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function startAutoAdvance() {
        if (prefersReducedMotion) return;
        if (isScrollMode()) return; // don't auto-advance in native scroll mode
        stopAutoAdvance();
        autoTimer = setInterval(() => nextSlide(), 10000);
    }
    function stopAutoAdvance() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    // Pause on hover/focus
    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoAdvance);
        carousel.addEventListener('mouseleave', startAutoAdvance);
        carousel.addEventListener('focusin', stopAutoAdvance);
        carousel.addEventListener('focusout', startAutoAdvance);
    }

    // Start auto if visible
    if (!prefersReducedMotion) startAutoAdvance();

    // Pause when off-screen
    if ('IntersectionObserver' in window && highlightsSection) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) startAutoAdvance();
                else stopAutoAdvance();
            });
        }, { threshold: 0.2 });
        io.observe(highlightsSection);
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!highlightsSection) return;
        const rect = highlightsSection.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });

    // Bind controls without relying on inline onclick
    if (prevBtn) prevBtn.addEventListener('click', () => prevSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => nextSlide());

    // Responsive updates (items per view + mode switching)
    let resizeTimeout;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Mobile browsers fire resize when the URL bar collapses during a
            // scroll. That is a height-only change; re-rendering there would
            // reset the carousel under the user's finger mid-swipe.
            if (window.innerWidth === lastWidth) return;
            lastWidth = window.innerWidth;

            const newCount = getItemsPerView();
            const nowScrollMode = isScrollMode();
            const countChanged = newCount !== itemsPerView;
            const modeChanged = nowScrollMode !== lastScrollMode;

            if (countChanged) {
                itemsPerView = newCount;
            }

            // If mode changed, reset index and (re)bind touch handlers appropriately
            if (modeChanged) {
                lastScrollMode = nowScrollMode;
                currentIndex = 0;
                toggleTouchHandlers();
            }

            if (modeChanged || (countChanged && !nowScrollMode)) {
                loadCarouselItems();
            } else if (nowScrollMode) {
                // Same items, new card widths - just re-measure the wrap point.
                setupLoop();
            }

            // Manage auto-advance based on mode
            stopAutoAdvance();
            startAutoAdvance();
        }, 150);
    });

    // Basic swipe support
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    const swipeThreshold = 40; // px

    function onTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        touchMoved = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
    function onTouchMove(e) {
        if (!e.touches || e.touches.length === 0) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
            // horizontal swipe intent
            touchMoved = true;
            // In scroll mode, allow native horizontal scrolling so the user sees movement
            if (!isScrollMode()) {
                e.preventDefault();
            }
        }
    }
    function onTouchEnd(e) {
        if (!touchMoved) return;
        const dx = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0) - touchStartX;
        if (dx > swipeThreshold) prevSlide();
        else if (dx < -swipeThreshold) nextSlide();
    }
    // Bind/unbind touch handlers depending on mode
    let touchBound = false;
    function bindTouch() {
        if (touchBound || !carouselTrack) return;
        carouselTrack.addEventListener('touchstart', onTouchStart, { passive: false });
        carouselTrack.addEventListener('touchmove', onTouchMove, { passive: false });
        carouselTrack.addEventListener('touchend', onTouchEnd);
        touchBound = true;
    }
    function unbindTouch() {
        if (!touchBound || !carouselTrack) return;
        carouselTrack.removeEventListener('touchstart', onTouchStart, { passive: false });
        carouselTrack.removeEventListener('touchmove', onTouchMove, { passive: false });
        carouselTrack.removeEventListener('touchend', onTouchEnd);
        touchBound = false;
    }
    function toggleTouchHandlers() {
        if (isScrollMode()) unbindTouch();
        else bindTouch();
    }
    toggleTouchHandlers();
});
