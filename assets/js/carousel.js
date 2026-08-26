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
    const LOOP_COPIES = 3;
    let loopSetWidth = 0;
    let loopQueued = false;

    function buildCard(item, isClone) {
        const el = document.createElement('div');
        el.className = 'auction-item';
        el.innerHTML = `
                <div class="item-content">
                    <div class="image-wrap">
                        <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async">
                        <span class="price-badge">${item.price || ''}</span>
                    </div>
                    <div class="item-details">
                        <h2 class="item-title" title="${item.title}">${item.title}</h2>
                        <p class="item-desc">${item.description || ''}</p>
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="view-details-btn">View details</a>
                    </div>
                </div>
            `;
        if (isClone) {
            // Duplicates exist only to make the scroll endless: keep them out of
            // the accessibility tree and the tab order so the list still reads
            // as the real number of lots.
            el.setAttribute('aria-hidden', 'true');
            el.querySelectorAll('a').forEach((a) => { a.tabIndex = -1; });
        }
        return el;
    }

    // Shift scrollLeft with the smooth animation suppressed, so the wrap is
    // invisible rather than animating all the way back.
    function jumpBy(delta) {
        if (!delta) return;
        const prev = carouselTrack.style.scrollBehavior;
        carouselTrack.style.scrollBehavior = 'auto';
        carouselTrack.scrollLeft += delta;
        carouselTrack.style.scrollBehavior = prev || '';
    }

    function onLoopScroll() {
        if (loopQueued) return;
        loopQueued = true;
        requestAnimationFrame(() => {
            loopQueued = false;
            if (!loopSetWidth) return;
            const x = carouselTrack.scrollLeft;
            if (x >= loopSetWidth * 2 || x < loopSetWidth) {
                // Normalise instead of shifting by exactly one set: a fast fling
                // can cross more than a whole copy within a single frame, and a
                // one-set shift would leave it out of range until the next event.
                const wrapped = loopSetWidth
                    + (((x - loopSetWidth) % loopSetWidth) + loopSetWidth) % loopSetWidth;
                jumpBy(wrapped - x);
            }
        });
    }

    function teardownLoop() {
        carouselTrack.removeEventListener('scroll', onLoopScroll);
        loopSetWidth = 0;
    }

    function setupLoop() {
        teardownLoop();
        // Measure after layout, so the geometry reflects the cards just added.
        requestAnimationFrame(() => {
            if (!isScrollMode()) return;
            const cards = carouselTrack.children;
            const perCopy = auctionItems.length;
            if (cards.length < perCopy * 3) return;
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
            jumpBy(setWidth - carouselTrack.scrollLeft); // start in the middle copy
            carouselTrack.addEventListener('scroll', onLoopScroll, { passive: true });
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
