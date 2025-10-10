document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const overlay = document.querySelector('.chart-overlay');
    const overlayContent = overlay.querySelector('.overlay-content');
    const priceChartCanvas = document.getElementById('priceTrendChart');
    const marketChartCanvas = document.getElementById('marketComparisonChart');
    const timeFilterButtons = document.querySelectorAll('.time-filter button');
  
    // Elements to be updated dynamically
    const currentMedianEl = document.getElementById('current-median');
    const certifiedExamplesEl = document.getElementById('certified-examples');
    const doughnutCenterLabel = document.getElementById('doughnut-center-label');
    const peakMarkerEl = document.getElementById('peak-marker');
    const growthBadgeEl = document.getElementById('growth-badge');
    const tradingVolumeEl = document.getElementById('trading-volume');
    const activityBarEl = document.getElementById('activity-bar');
  
    // Helper to format values with a custom currency symbol
    const formatCurrency = (val) => `₴${val}`;
  
    // Compute median from an array of numbers
    function computeMedian(dataArray) {
      if (!dataArray.length) return 0;
      const sorted = [...dataArray].sort((a, b) => a - b);
      const midIndex = Math.floor(sorted.length / 2);
      return (sorted.length % 2 === 0)
        ? (sorted[midIndex - 1] + sorted[midIndex]) / 2
        : sorted[midIndex];
    }
  
    // Compute the maximum value and its index from a numeric array
    function computePeak(dataArray) {
      if (!dataArray.length) return { peakValue: 0, peakIndex: 0 };
      let maxVal = dataArray[0];
      let maxIndex = 0;
      dataArray.forEach((val, idx) => {
        if (val > maxVal) {
          maxVal = val;
          maxIndex = idx;
        }
      });
      return { peakValue: maxVal, peakIndex: maxIndex };
    }
  
    // Compute Year-over-Year growth as a simple percentage
    function computeYoYGrowth(dataArray) {
      if (dataArray.length < 2) return 0;
      const first = dataArray[0];
      const last = dataArray[dataArray.length - 1];
      return ((last - first) / first) * 100;
    }
  
    // Compute market liquidity data by combining auctions and private data
    // For demonstration, this function returns [auctionRatio, privateRatio] based on the total volume
    function computeMarketLiquidity(auctionVolume, privateVolume) {
      const total = auctionVolume + privateVolume;
      if (total === 0) return [50, 50]; // fallback if no volume
      const auctionPct = Math.round((auctionVolume / total) * 100);
      const privatePct = 100 - auctionPct;
      return [auctionPct, privatePct];
    }
  
    // Base chart configuration
    const baseChartConfig = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    };
  
    // Merged chart configurations
    const chartOptions = {
      priceTrend: {
        ...baseChartConfig,
        type: 'line',
        data: {
          labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
          datasets: [{
            label: 'Average Price',
            data: [670, 820, 708, 934, 980, 1100],
            borderColor: '#ffcc00',
            borderWidth: 3,
            tension: 0.42, // smoother curve
            fill: {
              target: 'origin',
              above: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
                gradient.addColorStop(0, 'rgba(255, 204, 0, 0.28)');
                gradient.addColorStop(0.5, 'rgba(255, 204, 0, 0.12)');
                gradient.addColorStop(1, 'rgba(255, 204, 0, 0.02)');
                return gradient;
              }
            },
            // Show points on hover with elegant markers
            pointRadius: 0,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#ffcc00',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
            // Add subtle shadow to the line
            shadowOffsetX: 0,
            shadowOffsetY: 4,
            shadowBlur: 12,
            shadowColor: 'rgba(255, 204, 0, 0.25)'
          }]
        },
        options: {
          ...baseChartConfig.plugins,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            ...baseChartConfig.plugins,
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              titleColor: '#ffcc00',
              bodyColor: '#fff',
              borderColor: '#ffcc00',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              titleFont: { size: 13, weight: '600' },
              bodyFont: { size: 14, weight: 'bold' },
              callbacks: {
                title: (items) => items[0].label,
                label: (context) => formatCurrency(context.parsed.y)
              }
            }
          },
          scales: {
            x: { 
              grid: { 
                display: true,
                color: 'rgba(0, 0, 0, 0.03)',
                lineWidth: 1
              }, 
              ticks: { 
                color: '#666',
                font: { size: 11, weight: '500' },
                padding: 8
              },
              border: { display: false }
            },
            y: {
              grid: { 
                color: 'rgba(0, 0, 0, 0.06)',
                lineWidth: 1,
                drawBorder: false
              },
              ticks: {
                color: '#666',
                font: { size: 11, weight: '500' },
                padding: 10,
                callback: (value) => formatCurrency(value)
              },
              border: { display: false }
            }
          },
          animation: {
            duration: 1200,
            easing: 'easeInOutQuart'
          }
        }
      },
      marketDistribution: {
        ...baseChartConfig,
        type: 'doughnut',
        data: {
          labels: ['Auctions', 'Private Sales'],
          datasets: [{
            data: [65, 35],
            backgroundColor: ['#ffcc00', 'rgba(0,0,0,0.15)'],
            borderWidth: 0,
            // Keep segments within the ring on hover (no outward pop-out)
            hoverOffset: 0,
            // Reduce overall radius so there is safe space for tooltips within canvas
            radius: '92%'
          }]
        },
        options: {
          cutout: '75%',
          // Add internal padding so tooltips have room inside the canvas
          layout: { padding: 24 },
      // Only activate hover when the pointer is inside the ring area
      interaction: { mode: 'nearest', intersect: true },
          plugins: {
            ...baseChartConfig.plugins,
            tooltip: {
        position: 'nearest',
        padding: 8,
        caretPadding: 6,
        displayColors: false,
              callbacks: {
                label: (context) => `${context.label}: ${context.parsed}%`
              }
            }
          },
          animation: { animateScale: true, animateRotate: true }
        }
      }
    };
  
    // Create chart instances
    const priceChart = new Chart(priceChartCanvas, chartOptions.priceTrend);
    const marketChart = new Chart(marketChartCanvas, chartOptions.marketDistribution);
  
    // Data sets for each time range (price chart + liquidity volumes)
    const dataRanges = {
      '5Y': {
        labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
        data: [670, 820, 708, 934, 980, 1100],
        certified: 154,
        // sample volumes for auctions vs private
        auctionVolume: 65,
        privateVolume: 35,
        tradingActivity: 78,
        activityLabel: 'High Activity'
      },
      '3Y': {
        labels: ['2023', '2024', '2025'],
        data: [934, 980, 1100],
        certified: 97,
        auctionVolume: 42,
        privateVolume: 58,
        tradingActivity: 65,
        activityLabel: 'Moderate Activity'
      },
      '1Y': {
        labels: ['2024', '2025'],
        data: [980, 1100],
        certified: 45,
        auctionVolume: 33,
        privateVolume: 67,
        tradingActivity: 85,
        activityLabel: 'Very High Activity'
      }
    };
  
    // Event Handlers
    function initEventListeners() {
      priceChartCanvas.addEventListener('click', handlePriceChartClick);
      overlay.addEventListener('click', handleOverlayClick);
  
      timeFilterButtons.forEach(btn => {
        btn.addEventListener('click', handleTimeFilterClick);
      });
  
      marketChartCanvas.addEventListener('mouseenter', handleDoughnutHover);
      marketChartCanvas.addEventListener('mouseleave', handleDoughnutLeave);
    }
  
    function handlePriceChartClick(e) {
      const points = priceChart.getElementsAtEventForMode(e, 'nearest', { intersect: true });
      if (points.length) {
        showYearDetails(points[0].index);
      }
    }
  
    function handleOverlayClick(e) {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    }
  
    function handleTimeFilterClick(e) {
      timeFilterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
  
      const range = e.target.dataset.range;
      updatePriceData(range);
    }
  
    function updatePriceData(range) {
      // Get the data config for this range or default to '5Y'
      const { labels, data, certified, auctionVolume, privateVolume, tradingActivity, activityLabel } = dataRanges[range] || dataRanges['5Y'];
  
      // Update price chart with smooth animation
      priceChart.data.labels = labels;
      priceChart.data.datasets[0].data = data;
      priceChart.update('active'); // 'active' mode for smooth transitions
  
      // Update Certified Examples
      certifiedExamplesEl.textContent = certified;
      certifiedExamplesEl.setAttribute('data-value', certified);
  
      // Update Trading Volume indicator
      if (tradingVolumeEl && activityBarEl) {
        tradingVolumeEl.textContent = activityLabel;
        activityBarEl.style.width = tradingActivity + '%';
      }
  
      // Calculate new median
      const medianValue = computeMedian(data);
      currentMedianEl.textContent = formatCurrency(medianValue);
      currentMedianEl.setAttribute('data-value', medianValue);
  
      // Compute and display new peak
      const { peakValue, peakIndex } = computePeak(data);
      if (peakMarkerEl) {
        const peakYear = labels[peakIndex];
        peakMarkerEl.textContent = `📈 ${peakYear} Peak Value`;
        // Optionally show the peak value too: peakMarkerEl.title = formatCurrency(peakValue);
      }
  
      // Compute and display YoY growth
      const yoyGrowth = computeYoYGrowth(data);
      if (growthBadgeEl) {
        const sign = yoyGrowth >= 0 ? '+' : '';
        growthBadgeEl.textContent = `${sign}${Math.round(yoyGrowth)}% YoY Growth`;
      }
  
      // Recompute and update market liquidity (3rd graph)
      const [auctionPct, privatePct] = computeMarketLiquidity(auctionVolume, privateVolume);
      marketChart.data.datasets[0].data = [auctionPct, privatePct];
      marketChart.update();
  
      // Update the doughnut center label or other elements
      doughnutCenterLabel.textContent = `${auctionPct}%`;
    }
  
    // Show overlay details when a data point is clicked on the line chart
    function showYearDetails(yearIndex) {
      const auctionHouses = ['Heritage', 'CNG', 'Roma'];
      const year = priceChart.data.labels[yearIndex];
      const price = priceChart.data.datasets[0].data[yearIndex];
  
      overlayContent.innerHTML = `
        <h3>${year} Market Details</h3>
        <div class="price-details">
          <p>Average Price: ${formatCurrency(price)}</p>
          <p>Transactions: ${Math.floor(Math.random() * 50 + 20)}</p>
          <p>Top Auction House: ${auctionHouses[yearIndex % 3]}</p>
        </div>
      `;
      overlay.classList.add('active');
    }
  
    // Initialize default range data and event listeners
    updatePriceData('5Y');
    initEventListeners();
  });
