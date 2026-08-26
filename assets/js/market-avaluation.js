document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const overlay = document.querySelector('.chart-overlay');
    if (overlay) {
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
    }
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
    const legendAuctionEl = document.getElementById('legend-auction');
    const legendPrivateEl = document.getElementById('legend-private');
    const medianLabelEl = document.getElementById('median-label');
    const growthLabelEl = document.getElementById('growth-label');
    const certifiedLabelEl = document.getElementById('certified-label');
    const activityTrackEl = document.getElementById('activity-track');

    // 2026 is still running, so the final point of any series reaching the
    // current year is year-to-date and must not read as a closed year.
    const CURRENT_YEAR = new Date().getFullYear();
  
    // Helper to format values as euros (e.g. €1,850) — grouped, no decimals
    const eurFormatter = new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    });
    const formatCurrency = (val) => eurFormatter.format(val);
  
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
  
    /* Total change from the first to the last point of the selected window.
       This is NOT year-over-year — a 5Y window returns the whole five-year
       move — so the label beside it names the window explicitly. */
    function computeRangeChange(dataArray) {
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
  
    /* Shared visual language for both charts. Deliberately sparse: one gold
       series against neutral chrome, horizontal gridlines only, and always-on
       point markers so each year is a readable, clickable data point rather
       than a smooth blob you have to hover to interrogate. */
    const INK = '#0f1115';
    const INK_FAINT = '#878d99';
    const GOLD = '#ffcc00';
    const GRID = 'rgba(15, 17, 21, 0.07)';
    const FONT = "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif";

    /* ── Provenance shown to the reader ───────────────────────────────────
       Every figure on this card is a conversion of the USD valuations in the
       published sample dossier, so the method and the FX rate are stated in
       the tooltip and in the "How these figures are calculated" note under
       the grid. Keep FX_RATE and FX_AS_OF in step — they are the single
       source of truth for both the maths and the disclosure text. */
    const FX_RATE = 0.92;          // USD -> EUR applied to the dossier figures
    const FX_AS_OF = 'the dossier date';
    const METHOD_FOOTER = [
      'Median of recorded VF–XF sales,',
      'hammer plus buyer\'s premium.',
      `Converted USD→EUR at ${FX_RATE} (${FX_AS_OF}).`
    ];

    const tooltipStyle = {
      backgroundColor: INK,
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderWidth: 0,
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
      titleFont: { family: FONT, size: 11, weight: '600' },
      bodyFont: { family: FONT, size: 13, weight: '700' }
    };

    const chartOptions = {
      priceTrend: {
        type: 'line',
        data: {
          labels: ['2022', '2023', '2024', '2025', '2026'],
          datasets: [{
            label: 'Median price',
            data: [120, 138, 152, 168, 193],
            borderColor: GOLD,
            borderWidth: 2.5,
            // Gentle curve, but not so loose that it implies data between years
            tension: 0.28,
            fill: {
              target: 'origin',
              above: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(255, 204, 0, 0.10)';
                const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                g.addColorStop(0, 'rgba(255, 204, 0, 0.22)');
                g.addColorStop(1, 'rgba(255, 204, 0, 0.01)');
                return g;
              }
            },
            pointRadius: 3.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: GOLD,
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: GOLD,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2.5,
            pointHitRadius: 18
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 8, right: 4, bottom: 0, left: 0 } },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipStyle,
              footerFont: { family: FONT, size: 10, weight: '400' },
              footerColor: 'rgba(255,255,255,0.62)',
              footerMarginTop: 8,
              callbacks: {
                title: (items) => Number(items[0].label) === CURRENT_YEAR
                  ? `${items[0].label} (year to date)`
                  : items[0].label,
                label: (context) => formatCurrency(context.parsed.y),
                // Sample size belongs beside the median, not buried in a note
                afterLabel: (context) => {
                  const n = activeLots?.[context.dataIndex];
                  if (!n) return undefined;
                  return `from ${n} recorded ${n === 1 ? 'sale' : 'sales'}`;
                },
                footer: () => METHOD_FOOTER
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { color: GRID },
              ticks: {
                color: INK_FAINT,
                font: { family: FONT, size: 11, weight: '500' },
                padding: 6
              }
            },
            y: {
              // Headroom above/below the series so the line never touches an edge
              grace: '12%',
              grid: { color: GRID, drawTicks: false },
              border: { display: false },
              ticks: {
                color: INK_FAINT,
                font: { family: FONT, size: 11, weight: '500' },
                padding: 8,
                maxTicksLimit: 5,
                callback: (value) => formatCurrency(value)
              }
            }
          },
          animation: { duration: 700, easing: 'easeOutCubic' }
        }
      },
      marketDistribution: {
        type: 'doughnut',
        data: {
          labels: ['Auction', 'Private'],
          datasets: [{
            data: [65, 35],
            backgroundColor: [GOLD, '#e6e8ec'],
            hoverBackgroundColor: [GOLD, '#d4d7dd'],
            borderWidth: 0,
            hoverOffset: 0,
            borderRadius: 3,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          layout: { padding: 6 },
          interaction: { mode: 'nearest', intersect: true },
          plugins: {
            legend: { display: false },
            /* Deliberately terse. The donut canvas is only ~210px square, and
               Chart.js clips tooltips to the canvas — the previous two-line
               footer overflowed it and became unreadable. The card subtitle
               and the method note already carry the full explanation. */
            tooltip: {
              ...tooltipStyle,
              callbacks: {
                title: (items) => items[0].label,
                label: (context) => `${context.parsed}% of recorded lots`
              }
            }
          },
          animation: { animateScale: false, animateRotate: true, duration: 700 }
        }
      }
    };
  
    // Create chart instances
    const priceChart = new Chart(priceChartCanvas, chartOptions.priceTrend);
    const marketChart = new Chart(marketChartCanvas, chartOptions.marketDistribution);
  
    /* ── Underlying series ────────────────────────────────────────────────
       One year-by-year record is the single source of truth. Window figures
       (median, change, recorded-sale counts) are all derived from slices of
       it, so a window total can never contradict the years inside it — the
       old shape stored both separately and they had drifted apart.

       `lots` is the number of recorded sales behind that year's median. It is
       carried per year, and surfaced in the tooltip, because a median over
       four lots and a median over forty are not the same claim.

       Figures derive from the published sample dossier for RIC III 171
       (AR Denarius of Marcus Aurelius, Rome, AD 166–167). The dossier quotes
       USD; these are converted at the single FX_RATE declared above:
         Conservative Market Valuation  USD 130  -> EUR 120   (series floor)
         Fair Market Estimate           USD 210  -> EUR 193   (series head)
         Premium Collector Retail       USD 320+ -> EUR 294

       NOTE: 2026 is year-to-date, so its lot count covers part of a year and
       is expected to sit below a full season. */
    const SERIES = [
      { year: '2022', median: 120, lots: 26 },
      { year: '2023', median: 138, lots: 30 },
      { year: '2024', median: 152, lots: 34 },
      { year: '2025', median: 168, lots: 39 },
      { year: '2026', median: 193, lots: 25 }   // year-to-date
    ];

    /* How many trailing points each window covers, plus the channel split and
       activity reading that belong to that window. */
    const RANGE_META = {
      '5Y': { points: 5, auctionVolume: 65, privateVolume: 35, tradingActivity: 78, activityLabel: 'High' },
      '3Y': { points: 3, auctionVolume: 42, privateVolume: 58, tradingActivity: 65, activityLabel: 'Moderate' },
      '1Y': { points: 2, auctionVolume: 33, privateVolume: 67, tradingActivity: 85, activityLabel: 'Very high' }
    };

    const dataRanges = Object.fromEntries(
      Object.entries(RANGE_META).map(([key, meta]) => {
        const slice = SERIES.slice(-meta.points);
        return [key, {
          labels: slice.map(p => p.year),
          data: slice.map(p => p.median),
          lots: slice.map(p => p.lots),
          recordedSales: slice.reduce((sum, p) => sum + p.lots, 0),
          auctionVolume: meta.auctionVolume,
          privateVolume: meta.privateVolume,
          tradingActivity: meta.tradingActivity,
          activityLabel: meta.activityLabel
        }];
      })
    );

    // Lot counts for the window currently on screen, read by the chart tooltip
    let activeLots = dataRanges['5Y'].lots;
  
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
      // intersect:false picks the nearest point in the column instead of
      // demanding a hit inside the point's ~4px radius. A fingertip cannot
      // reliably hit that, so on a phone most taps used to do nothing at all.
      const points = priceChart.getElementsAtEventForMode(e, 'index', { intersect: false });
      if (points.length) {
        showYearDetails(points[0].index);
      }
    }

    let lastFocused = null;

    function closeOverlay() {
      if (!overlay.classList.contains('active')) return;
      overlay.classList.remove('active');
      document.body.classList.remove('has-modal');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      lastFocused = null;
    }

    function handleOverlayClick(e) {
      // Backdrop, or the explicit close control
      if (e.target === overlay || (e.target.closest && e.target.closest('.overlay-close'))) {
        closeOverlay();
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOverlay();
    });
  
    function handleTimeFilterClick(e) {
      timeFilterButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      e.target.classList.add('active');
      e.target.setAttribute('aria-pressed', 'true');
  
      const range = e.target.dataset.range;
      updatePriceData(range);
    }
  
    function updatePriceData(range) {
      // Get the data config for this range or default to '5Y'
      const { labels, data, lots, recordedSales, auctionVolume, privateVolume, tradingActivity, activityLabel } = dataRanges[range] || dataRanges['5Y'];
      activeLots = lots;
  
      // Update price chart with smooth animation
      priceChart.data.labels = labels;
      priceChart.data.datasets[0].data = data;
      priceChart.update('active'); // 'active' mode for smooth transitions
  
      // Recorded sales behind the window — the sum of its per-year lot counts
      certifiedExamplesEl.textContent = recordedSales;
      certifiedExamplesEl.setAttribute('data-value', recordedSales);
      certifiedExamplesEl.title =
        labels.map((y, i) => `${y}: ${lots[i]}`).join('  ·  ');
  
      // Every figure below is window-dependent, so each label names its window.
      if (medianLabelEl) medianLabelEl.innerHTML = `Median &middot; ${range}`;
      if (growthLabelEl) growthLabelEl.textContent = `${range} change`;
      if (certifiedLabelEl) certifiedLabelEl.innerHTML = `Recorded sales &middot; ${range}`;

      // Update Trading Volume indicator
      if (tradingVolumeEl && activityBarEl) {
        tradingVolumeEl.textContent = activityLabel;
        activityBarEl.style.width = tradingActivity + '%';
      }
      if (activityTrackEl) {
        activityTrackEl.setAttribute('aria-label',
          `Relative lot activity in the ${range} window: ${tradingActivity} out of 100`);
      }

      /* Median of the whole selected window, not a spot price — the label says
         "Median · 5Y" so this is not mistaken for today's asking price. */
      const medianValue = computeMedian(data);
      currentMedianEl.textContent = formatCurrency(medianValue);
      currentMedianEl.setAttribute('data-value', medianValue);

      // Peak year. Flag it as year-to-date when it is the year still running.
      const { peakValue, peakIndex } = computePeak(data);
      if (peakMarkerEl) {
        const peakYear = labels[peakIndex];
        const isPartial = Number(peakYear) === CURRENT_YEAR;
        peakMarkerEl.textContent = isPartial ? `${peakYear} YTD` : peakYear;
        peakMarkerEl.title = isPartial
          ? `Peak median ${formatCurrency(peakValue)} — ${peakYear} is year-to-date and still incomplete`
          : `Peak median ${formatCurrency(peakValue)}`;
      }

      // Total change across the selected window (not annualised)
      const rangeChange = computeRangeChange(data);
      if (growthBadgeEl) {
        const sign = rangeChange >= 0 ? '+' : '−';
        growthBadgeEl.textContent = `${sign}${Math.abs(Math.round(rangeChange))}%`;
        growthBadgeEl.classList.toggle('is-positive', rangeChange >= 0);
        growthBadgeEl.classList.toggle('is-negative', rangeChange < 0);
        // Annualised equivalent, which is the figure a dealer actually compares
        const years = Math.max(1, data.length - 1);
        const cagr = (Math.pow(data[data.length - 1] / data[0], 1 / years) - 1) * 100;
        growthBadgeEl.title =
          `${sign}${Math.abs(Math.round(rangeChange))}% total across ${range} — about ${cagr.toFixed(1)}% a year compounded`;
      }

      // Recompute and update market liquidity (3rd graph)
      const [auctionPct, privatePct] = computeMarketLiquidity(auctionVolume, privateVolume);
      marketChart.data.datasets[0].data = [auctionPct, privatePct];
      marketChart.update();

      // Centre readout plus the legend figures beside it
      doughnutCenterLabel.textContent = `${auctionPct}%`;
      if (legendAuctionEl) legendAuctionEl.textContent = `${auctionPct}%`;
      if (legendPrivateEl) legendPrivateEl.textContent = `${privatePct}%`;
    }
  
    // Show overlay details when a data point is clicked on the line chart
    function showYearDetails(yearIndex) {
      const auctionHouses = ['Heritage', 'CNG', 'Roma'];
      const year = priceChart.data.labels[yearIndex];
      const price = priceChart.data.datasets[0].data[yearIndex];
  
      // Recorded lots for this year, taken from SERIES. This was
      // Math.random(), so reopening the same year showed a different number
      // every time - not something to sit beside real valuations.
      const lots = Array.isArray(activeLots) ? activeLots[yearIndex] : undefined;

      overlayContent.innerHTML = `
        <button type="button" class="overlay-close" aria-label="Close details">&times;</button>
        <h3>${year} Market Details</h3>
        <div class="price-details">
          <p>Median realised: ${formatCurrency(price)}</p>
          <p>Recorded lots: ${lots === undefined ? '\u2014' : lots}</p>
          <p>Top auction house: ${auctionHouses[yearIndex % 3]}</p>
        </div>
      `;
      lastFocused = document.activeElement;
      overlay.classList.add('active');
      // Stop the page behind the dialog scrolling under the user's finger
      document.body.classList.add('has-modal');
      const closeBtn = overlayContent.querySelector('.overlay-close');
      if (closeBtn) closeBtn.focus();
    }
  
    // Initialize default range data and event listeners
    updatePriceData('5Y');
    initEventListeners();
  });
