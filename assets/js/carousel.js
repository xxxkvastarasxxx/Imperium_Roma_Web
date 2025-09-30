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

    function loadCarouselItems() {
        if (!Array.isArray(auctionItems) || auctionItems.length === 0) {
            carouselTrack.innerHTML = '<div style="color:#fff;opacity:.8;text-align:center;width:100%">No highlights available right now.</div>';
            return;
        }
        carouselTrack.innerHTML = '';
        for (let i = 0; i < itemsPerView; i++) {
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

    // Responsive items per view
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newCount = getItemsPerView();
            if (newCount !== itemsPerView) {
                itemsPerView = newCount;
                // Ensure currentIndex is valid
                currentIndex = currentIndex % Math.max(auctionItems.length, 1);
                loadCarouselItems();
            }
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
            e.preventDefault();
        }
    }
    function onTouchEnd(e) {
        if (!touchMoved) return;
        const dx = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0) - touchStartX;
        if (dx > swipeThreshold) prevSlide();
        else if (dx < -swipeThreshold) nextSlide();
    }
    if (carouselTrack) {
        carouselTrack.addEventListener('touchstart', onTouchStart, { passive: false });
        carouselTrack.addEventListener('touchmove', onTouchMove, { passive: false });
        carouselTrack.addEventListener('touchend', onTouchEnd);
    }
});
