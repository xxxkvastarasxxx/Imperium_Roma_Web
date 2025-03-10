document.addEventListener("DOMContentLoaded", async function() {
    const carouselTrack = document.querySelector('.carousel-track');
    if (!carouselTrack) return;

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

    const itemsPerView = 5;
    let currentIndex = 0;

    function loadCarouselItems() {
        carouselTrack.innerHTML = '';
        for (let i = 0; i < itemsPerView; i++) {
            const item = auctionItems[(currentIndex + i) % auctionItems.length];
            const auctionItemDiv = document.createElement('div');
            auctionItemDiv.className = 'auction-item';
            auctionItemDiv.innerHTML = `
                <div class="item-content">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="item-details">
                        <h2>${item.title}</h2>
                        <p>${item.description}</p>
                        <p><strong>Price: ${item.price}</strong></p>
                        <a href="${item.link}" target="_blank" class="view-details-btn">View Details</a>
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

    // Автовідтворення
    setInterval(() => {
        nextSlide();
    }, 10000);
});
