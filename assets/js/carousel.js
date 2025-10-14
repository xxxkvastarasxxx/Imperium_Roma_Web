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

    function loadCarouselItems() {
        if (!Array.isArray(auctionItems) || auctionItems.length === 0) {
            carouselTrack.innerHTML = '<div style="color:#fff;opacity:.8;text-align:center;width:100%">No highlights available right now.</div>';
            return;
        }
        carouselTrack.innerHTML = '';
        // In scroll mode (mobile/tablet) render all items so the user can slide/scroll through them.
        const count = isScrollMode() ? auctionItems.length : itemsPerView;
        for (let i = 0; i < count; i++) {
            const item = auctionItems[(currentIndex + i) % auctionItems.length];
            const auctionItemDiv = document.createElement('div');
            auctionItemDiv.className = 'auction-item';
            auctionItemDiv.innerHTML = `
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
            carouselTrack.appendChild(auctionItemDiv);
        }
    }

    window.nextSlide = function() {
        currentIndex = (currentIndex + 1) % auctionItems.length;
        loadCarouselItems();
    };

    window.prevSlide = function() {
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
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newCount = getItemsPerView();
            const nowScrollMode = isScrollMode();

            if (newCount !== itemsPerView) {
                itemsPerView = newCount;
            }

            // If mode changed, reset index and (re)bind touch handlers appropriately
            if (nowScrollMode !== lastScrollMode) {
                lastScrollMode = nowScrollMode;
                currentIndex = 0;
                toggleTouchHandlers();
            }

            // Re-render for any layout change
            loadCarouselItems();

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
