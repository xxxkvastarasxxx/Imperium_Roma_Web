document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const overlay = document.querySelector('.chart-overlay');
    const priceChartCanvas = document.getElementById('priceTrendChart');
    const marketChartCanvas = document.getElementById('marketComparisonChart');

    // Chart Configurations
    const chartOptions = {
        priceTrend: {
            type: 'line',
            data: {
                labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Average Price',
                    data: [850, 920, 1100, 1350, 1600, 1850],
                    borderColor: '#d4af37',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: { target: 'origin', above: 'rgba(212, 175, 55, 0.08)' },
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => `$${context.parsed.y}` } }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: '#f1f3f5' },
                        ticks: { callback: value => `$${value}` }
                    }
                }
            }
        },
        marketDistribution: {
            type: 'doughnut',
            data: {
                labels: ['Auctions', 'Private Sales'],
                datasets: [{
                    data: [65, 35],
                    backgroundColor: ['rgba(212, 175, 55, 0.8)', 'rgba(166, 124, 0, 0.8)'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed}%` } }
                },
                animation: { animateScale: true, animateRotate: true }
            }
        }
    };

    // Chart Instances
    const priceChart = new Chart(priceChartCanvas, chartOptions.priceTrend);
    const marketChart = new Chart(marketChartCanvas, chartOptions.marketDistribution);

    // Event Handlers
    const initEventListeners = () => {
        // Chart Interactions
        priceChartCanvas.addEventListener('click', handlePriceChartClick);
        overlay.addEventListener('click', handleOverlayClick);
        
        // Time Filters
        document.querySelectorAll('.time-filter button').forEach(btn => {
            btn.addEventListener('click', handleTimeFilterClick);
        });
    };

    const handlePriceChartClick = (e) => {
        const points = priceChart.getElementsAtEventForMode(e, 'nearest', { intersect: true });
        if (points.length) showYearDetails(points[0].index);
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    };

    const handleTimeFilterClick = (e) => {
        document.querySelectorAll('.time-filter button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    };

    // Data Functions
    const showYearDetails = (yearIndex) => {
        const auctionHouses = ['Heritage', 'CNG', 'Roma'];
        const year = priceChart.data.labels[yearIndex];
        const price = priceChart.data.datasets[0].data[yearIndex];
        
        overlay.querySelector('.overlay-content').innerHTML = `
            <h3>${year} Market Details</h3>
            <div class="price-details">
                <p>Average Price: $${price}</p>
                <p>Transactions: ${Math.floor(Math.random() * 50 + 20)}</p>
                <p>Top Auction House: ${auctionHouses[yearIndex % 3]}</p>
            </div>
        `;
        overlay.classList.add('active');
    };

    // Initialization
    initEventListeners();
});