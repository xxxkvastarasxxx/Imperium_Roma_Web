document.addEventListener("DOMContentLoaded", () => {
  const exportLink = document.getElementById("export-report");

  exportLink.addEventListener("click", async (e) => {
    e.preventDefault();

    // Check if required libraries are loaded
    if (!window.jspdf || !window.html2canvas) {
      alert("Required libraries not loaded. Please ensure jsPDF and html2canvas are included.");
      return;
    }

    // Validate that charts are fully loaded before proceeding
    const validateCharts = () => {
      const errors = [];
      
      // Check price chart
      const priceCanvas = document.querySelector(".trend-card canvas");
      if (!priceCanvas) {
        errors.push("Price chart canvas not found");
      } else if (priceCanvas.width === 0 || priceCanvas.height === 0) {
        errors.push(`Price chart not initialized (dimensions: ${priceCanvas.width}x${priceCanvas.height})`);
      }
      
      // Check market distribution chart
      const marketCanvas = document.querySelector(".distribution-card canvas");
      if (!marketCanvas) {
        errors.push("Market distribution chart canvas not found");
      } else if (marketCanvas.width === 0 || marketCanvas.height === 0) {
        errors.push(`Market distribution chart not initialized (dimensions: ${marketCanvas.width}x${marketCanvas.height})`);
      }
      
      return errors;
    };

    const chartErrors = validateCharts();
    if (chartErrors.length > 0) {
      console.error("Chart validation failed:", chartErrors);
      alert("Charts are not fully loaded yet. Please wait a moment and try again.\n\nIssues found:\n" + chartErrors.join("\n"));
      return;
    }

    console.log("All charts validated successfully, proceeding with export...");

    // Show professional loading indicator with progress
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "pdf-loading-indicator";
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Montserrat', Arial, sans-serif;
    `;
    loadingIndicator.innerHTML = `
      <div style="
        border: 4px solid rgba(255,204,0,0.3);
        border-top: 4px solid #ffcc00;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      "></div>
      <p id="loading-status" style="color: white; font-size: 16px; font-weight: 500; margin-bottom: 10px;">Preparing Report...</p>
      <p id="loading-progress" style="color: #ffcc00; font-size: 12px; font-weight: 400;">0%</p>
    `;
    
    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);
    document.body.appendChild(loadingIndicator);

    // Helper function to update loading status
    const updateLoadingStatus = (message, progress) => {
      const statusEl = document.getElementById('loading-status');
      const progressEl = document.getElementById('loading-progress');
      if (statusEl) statusEl.textContent = message;
      if (progressEl) progressEl.textContent = `${progress}%`;
    };

    try {
      updateLoadingStatus('Initializing PDF Generator...', 5);
      updateLoadingStatus('Initializing PDF Generator...', 5);

      // Get current date
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeFormatted = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Initialize jsPDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      // Constants
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      
      // Colors matching the design
      const black = [0, 0, 0];
      const gold = [255, 204, 0];
      const darkGray = [51, 51, 51];
      const lightGray = [128, 128, 128];
      const bgGray = [250, 250, 250];
      const white = [255, 255, 255];

      // Helper function for better canvas capture
      const captureElement = async (element, options = {}) => {
        if (!element) {
          throw new Error("Element not found");
        }

        // Wait a bit for any animations to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        const defaultOptions = {
          scale: 3,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          removeContainer: true,
          imageTimeout: 15000,
          letterRendering: true,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          onclone: (clonedDoc) => {
            // Ensure charts are visible in cloned document
            const chartCanvases = clonedDoc.querySelectorAll('canvas');
            chartCanvases.forEach(canvas => {
              canvas.style.display = 'block';
              canvas.style.visibility = 'visible';
            });
          }
        };

        const canvas = await html2canvas(element, { ...defaultOptions, ...options });
        return canvas.toDataURL("image/png", 0.95);
      };

      updateLoadingStatus('Creating Cover Page...', 10);

      let yPosition = margin;
      updateLoadingStatus('Creating Cover Page...', 10);

      /************************************************
       * COVER PAGE
       ************************************************/
      
      // Background
      pdf.setFillColor(...bgGray);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Top gold bar
      pdf.setFillColor(...gold);
      pdf.rect(0, 0, pageWidth, 8, 'F');
      
      yPosition = 80;
      
      // Main Title - "Marcus Aurelius Denarius"
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(32);
      pdf.setTextColor(...black);
      
      const titlePart1 = "Marcus Aurelius Denarius";
      const titlePart1Width = pdf.getStringUnitWidth(titlePart1) * 32 / pdf.internal.scaleFactor;
      pdf.text(titlePart1, (pageWidth - titlePart1Width) / 2, yPosition);
      
      yPosition += 45;
      
      // "Market Insights" in gold
      pdf.setFontSize(32);
      pdf.setTextColor(...gold);
      const titlePart2 = "Market Insights";
      const titlePart2Width = pdf.getStringUnitWidth(titlePart2) * 32 / pdf.internal.scaleFactor;
      pdf.text(titlePart2, (pageWidth - titlePart2Width) / 2, yPosition);
      
      yPosition += 45;
      
      // Subtitle
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.setTextColor(...lightGray);
      const subtitle = "Interactive analysis for RIC III Marcus Aurelius 171";
      const subtitleWidth = pdf.getStringUnitWidth(subtitle) * 13 / pdf.internal.scaleFactor;
      pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, yPosition);
      
      yPosition += 60;
      
      // Decorative gold line
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(3);
      pdf.line(margin + 80, yPosition, pageWidth - margin - 80, yPosition);
      
      yPosition += 40;
      
      // Report info box with enhanced styling
      pdf.setFillColor(...white);
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(2);
      pdf.roundedRect(margin + 20, yPosition, contentWidth - 40, 100, 8, 8, 'FD');
      
      // Add subtle shadow effect with gray border
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin + 22, yPosition + 2, contentWidth - 40, 100, 8, 8, 'S');
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...darkGray);
      
      const infoBoxX = margin + 40;
      pdf.text("Report Generated:", infoBoxX, yPosition + 28);
      pdf.text("Coin Reference:", infoBoxX, yPosition + 50);
      pdf.text("Analysis Period:", infoBoxX, yPosition + 72);
      
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...black);
      pdf.text(`${dateFormatted} at ${timeFormatted}`, infoBoxX + 150, yPosition + 28);
      pdf.text("RIC III Marcus Aurelius 171", infoBoxX + 150, yPosition + 50);
      pdf.text("2020 - 2025 (5 Year Overview)", infoBoxX + 150, yPosition + 72);
      
      yPosition += 130;
      
      // Professional disclaimer box
      pdf.setFillColor(255, 252, 240);
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(1);
      pdf.roundedRect(margin + 20, yPosition, contentWidth - 40, 60, 5, 5, 'FD');
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...gold);
      pdf.text("PROFESSIONAL MARKET ANALYSIS", margin + 40, yPosition + 20);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...darkGray);
      const disclaimerText = "This comprehensive report provides detailed market analysis, price trends, historical data, and investment insights based on authenticated numismatic sources.";
      const disclaimerLines = pdf.splitTextToSize(disclaimerText, contentWidth - 80);
      pdf.text(disclaimerLines, margin + 40, yPosition + 35);
      
      // Footer branding on cover
      const coverFooterY = pageHeight - 50;
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(2);
      pdf.line(margin, coverFooterY, pageWidth - margin, coverFooterY);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(...black);
      const brandText = "IMPERIUM ROMA";
      const brandWidth = pdf.getStringUnitWidth(brandText) * 14 / pdf.internal.scaleFactor;
      pdf.text(brandText, (pageWidth - brandWidth) / 2, coverFooterY + 20);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...lightGray);
      const tagline = "Professional Numismatic Market Analysis";
      const taglineWidth = pdf.getStringUnitWidth(tagline) * 9 / pdf.internal.scaleFactor;
      pdf.text(tagline, (pageWidth - taglineWidth) / 2, coverFooterY + 33);
      
      updateLoadingStatus('Capturing Price Trajectory...', 25);
      updateLoadingStatus('Capturing Price Trajectory...', 25);
      
      // New page for content
      pdf.addPage();
      
      // Reset background for content pages
      pdf.setFillColor(...white);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      yPosition = margin;

      /************************************************
       * PRICE TRAJECTORY CARD
       ************************************************/
      
      // Section Header with styling
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(...black);
      pdf.text("Price Trajectory Analysis", margin, yPosition);
      
      yPosition += 12;
      
      // Gold divider line with shadow
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(3);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 30;
      
      // Capture Price Chart with error handling
      const priceCard = document.querySelector(".trend-card");
      
      if (priceCard) {
        try {
          updateLoadingStatus('Rendering Price Chart...', 35);
          
          // Ensure chart is fully rendered by checking for canvas
          const chartCanvas = priceCard.querySelector('canvas');
          if (!chartCanvas) {
            throw new Error("Chart canvas not found");
          }
          
          console.log("Price chart canvas found:", chartCanvas);
          console.log("Canvas dimensions:", chartCanvas.width, "x", chartCanvas.height);
          
          // Check if canvas has valid dimensions
          if (chartCanvas.width === 0 || chartCanvas.height === 0) {
            throw new Error(`Canvas has invalid dimensions: ${chartCanvas.width}x${chartCanvas.height}. Chart may not be initialized yet.`);
          }
          
          // Ensure canvas is visible
          if (chartCanvas.offsetWidth === 0 || chartCanvas.offsetHeight === 0) {
            throw new Error("Canvas is not visible in the DOM");
          }
          
          let chartImage = null;
          
          // Try to get the chart directly from canvas using native API
          try {
            console.log("Using Canvas toDataURL method");
            chartImage = chartCanvas.toDataURL('image/png', 1.0);
            console.log("Successfully got chart image from Canvas API");
          } catch (e) {
            console.warn("Canvas toDataURL failed:", e);
            
            // Try html2canvas as fallback
            console.log("Falling back to html2canvas");
            await new Promise(resolve => setTimeout(resolve, 500));
            chartImage = await captureElement(priceCard, {
              windowWidth: priceCard.scrollWidth,
              windowHeight: priceCard.scrollHeight,
              ignoreElements: (element) => {
                return element.classList && element.classList.contains('chart-tooltip');
              }
            });
          }
          
          if (!chartImage || chartImage.length < 100) {
            throw new Error("Failed to capture chart image or image is empty");
          }
          
          // Calculate dimensions to fit width while maintaining aspect ratio
          const imgWidth = contentWidth - 20;
          const tempImg = new Image();
          tempImg.src = chartImage;
          
          await new Promise((resolve, reject) => {
            tempImg.onload = () => {
              console.log("Chart image loaded successfully:", tempImg.width, "x", tempImg.height);
              resolve();
            };
            tempImg.onerror = (e) => {
              console.error("Image load error:", e);
              reject(new Error("Failed to load captured image"));
            };
            setTimeout(() => reject(new Error('Image load timeout')), 5000);
          });
          
          const imgHeight = (tempImg.height / tempImg.width) * imgWidth;
          
          console.log("Adding chart to PDF at position:", yPosition, "with size:", imgWidth, "x", imgHeight);
          
          // Add white card background with shadow
          pdf.setFillColor(...white);
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(1);
          pdf.roundedRect(margin, yPosition, contentWidth, imgHeight + 30, 10, 10, 'FD');
          
          // Add inner shadow effect
          pdf.setDrawColor(240, 240, 240);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin + 2, yPosition + 2, contentWidth - 4, imgHeight + 26, 10, 10, 'S');
          
          // Add chart image with padding
          pdf.addImage(chartImage, "PNG", margin + 10, yPosition + 10, imgWidth, imgHeight);
          
          console.log("Chart added to PDF successfully");
          
          yPosition += imgHeight + 45;
          
          updateLoadingStatus('Extracting Market Data...', 50);
          
        } catch (err) {
          console.error("Could not render price chart:", err);
          console.error("Error details:", {
            message: err.message,
            stack: err.stack,
            priceCard: !!priceCard,
            canvas: !!priceCard?.querySelector('canvas'),
            canvasWidth: priceCard?.querySelector('canvas')?.width,
            canvasHeight: priceCard?.querySelector('canvas')?.height,
            canvasOffsetWidth: priceCard?.querySelector('canvas')?.offsetWidth,
            canvasOffsetHeight: priceCard?.querySelector('canvas')?.offsetHeight
          });
          
          // Fallback UI if chart fails
          pdf.setFillColor(250, 240, 240);
          pdf.setDrawColor(255, 200, 200);
          pdf.roundedRect(margin, yPosition, contentWidth, 120, 8, 8, 'FD');
          
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(11);
          pdf.setTextColor(...darkGray);
          pdf.text("⚠ Price chart could not be rendered", margin + 20, yPosition + 45);
          pdf.setFontSize(9);
          pdf.setTextColor(...lightGray);
          const errorLines = pdf.splitTextToSize("Error: " + err.message, contentWidth - 40);
          pdf.text(errorLines, margin + 20, yPosition + 65);
          pdf.text("Please wait for charts to fully load before exporting.", margin + 20, yPosition + 95);
          
          yPosition += 140;
        }
      } else {
        console.warn("Price card element not found");
        yPosition += 20;
      }
      
      // Extract and display key metrics
      const peakMarker = document.getElementById("peak-marker");
      const growthBadge = document.getElementById("growth-badge");
      const tradingVolume = document.getElementById("trading-volume");
      
      if (peakMarker || growthBadge || tradingVolume) {
        // Key Insights Box with enhanced styling
        pdf.setFillColor(255, 252, 235);
        pdf.setDrawColor(...gold);
        pdf.setLineWidth(2);
        pdf.roundedRect(margin, yPosition, contentWidth, 85, 8, 8, 'FD');
        
        // Inner border for depth
        pdf.setDrawColor(255, 245, 210);
        pdf.setLineWidth(1);
        pdf.roundedRect(margin + 3, yPosition + 3, contentWidth - 6, 79, 6, 6, 'S');
        
        // Header with icon
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(...gold);
        pdf.text("💡 Key Market Insights", margin + 20, yPosition + 25);
        
        // Separator line
        pdf.setDrawColor(...gold);
        pdf.setLineWidth(1);
        pdf.line(margin + 20, yPosition + 32, pageWidth - margin - 20, yPosition + 32);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(...darkGray);
        
        let insightY = yPosition + 48;
        const leftColumn = margin + 20;
        const rightColumn = margin + contentWidth / 2 + 10;
        
        if (peakMarker && peakMarker.textContent) {
          pdf.setTextColor(...gold);
          pdf.setFont("helvetica", "bold");
          pdf.text("●", leftColumn, insightY);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...black);
          const peakText = peakMarker.textContent.replace('📈', '').trim();
          pdf.text(peakText, leftColumn + 15, insightY);
          insightY += 18;
        }
        
        if (growthBadge && growthBadge.textContent) {
          pdf.setTextColor(...gold);
          pdf.setFont("helvetica", "bold");
          pdf.text("●", leftColumn, insightY);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...black);
          pdf.text(growthBadge.textContent, leftColumn + 15, insightY);
        }
        
        if (tradingVolume && tradingVolume.textContent) {
          // Trading volume in right column
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(...lightGray);
          pdf.text("TRADING VOLUME", rightColumn, yPosition + 48);
          
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.setTextColor(...gold);
          pdf.text(tradingVolume.textContent, rightColumn, yPosition + 68);
        }
        
        yPosition += 100;
      }

      updateLoadingStatus('Capturing Coin Specimen...', 60);
      updateLoadingStatus('Capturing Coin Specimen...', 60);

      // New page for coin and liquidity
      pdf.addPage();
      
      // Reset background
      pdf.setFillColor(...white);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      yPosition = margin;

      /************************************************
       * COIN SPOTLIGHT & MARKET LIQUIDITY
       ************************************************/
      
      // Section Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(...black);
      pdf.text("Specimen & Market Analysis", margin, yPosition);
      
      yPosition += 12;
      
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(3);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 30;
      
      // Two column layout
      const columnWidth = (contentWidth - 30) / 2;
      let maxColumnHeight = 0;
      
      // LEFT COLUMN - Coin Spotlight
      const coinCard = document.querySelector(".coin-spotlight");
      
      if (coinCard) {
        try {
          updateLoadingStatus('Rendering Coin Image...', 70);
          
          // Wait for any animations to complete
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const coinData = await captureElement(coinCard, {
            windowWidth: coinCard.scrollWidth,
            windowHeight: coinCard.scrollHeight
          });
          
          // Calculate to fit in column
          const coinWidth = columnWidth - 10;
          const tempImg = new Image();
          tempImg.src = coinData;
          
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            setTimeout(() => reject(new Error('Image load timeout')), 5000);
          });
          
          const coinHeight = (tempImg.height / tempImg.width) * coinWidth;
          maxColumnHeight = Math.max(maxColumnHeight, coinHeight);
          
          // Card background with enhanced styling
          pdf.setFillColor(...white);
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(1);
          pdf.roundedRect(margin, yPosition, columnWidth, coinHeight + 25, 10, 10, 'FD');
          
          // Shadow effect
          pdf.setDrawColor(240, 240, 240);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin + 2, yPosition + 2, columnWidth - 4, coinHeight + 21, 10, 10, 'S');
          
          pdf.addImage(coinData, "PNG", margin + 10, yPosition + 10, coinWidth - 10, coinHeight);
          
        } catch (err) {
          console.error("Could not render coin:", err);
          
          // Fallback
          pdf.setFillColor(250, 240, 240);
          pdf.setDrawColor(255, 200, 200);
          pdf.roundedRect(margin, yPosition, columnWidth, 200, 8, 8, 'FD');
          
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);
          pdf.setTextColor(...darkGray);
          pdf.text("⚠ Coin image unavailable", margin + 20, yPosition + 95);
          
          maxColumnHeight = 200;
        }
      }
      
      updateLoadingStatus('Capturing Market Distribution...', 80);
      
      // RIGHT COLUMN - Market Liquidity
      const liquidityCard = document.querySelector(".distribution-card");
      
      if (liquidityCard) {
        try {
          // Check for canvas element
          const chartCanvas = liquidityCard.querySelector('canvas');
          if (!chartCanvas) {
            throw new Error("Distribution chart canvas not found");
          }
          
          console.log("Liquidity chart canvas found:", chartCanvas);
          console.log("Canvas dimensions:", chartCanvas.width, "x", chartCanvas.height);
          
          // Validate canvas dimensions
          if (chartCanvas.width === 0 || chartCanvas.height === 0) {
            throw new Error(`Canvas has invalid dimensions: ${chartCanvas.width}x${chartCanvas.height}`);
          }
          
          let chartImage = null;
          
          // Try to get chart directly from canvas
          try {
            console.log("Using Canvas toDataURL for liquidity chart");
            chartImage = chartCanvas.toDataURL('image/png', 1.0);
            console.log("Successfully got liquidity chart from Canvas API");
          } catch (e) {
            console.warn("Canvas toDataURL failed for liquidity:", e);
            
            // Fallback to html2canvas
            console.log("Using html2canvas for liquidity chart");
            await new Promise(resolve => setTimeout(resolve, 300));
            chartImage = await captureElement(liquidityCard, {
              windowWidth: liquidityCard.scrollWidth,
              windowHeight: liquidityCard.scrollHeight
            });
          }
          
          if (!chartImage || chartImage.length < 100) {
            throw new Error("Failed to capture liquidity chart or image is empty");
          }
          
          const liquidityWidth = columnWidth - 10;
          const tempImg = new Image();
          tempImg.src = chartImage;
          
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            setTimeout(() => reject(new Error('Image load timeout')), 5000);
          });
          
          const liquidityHeight = (tempImg.height / tempImg.width) * liquidityWidth;
          maxColumnHeight = Math.max(maxColumnHeight, liquidityHeight);
          
          console.log("Adding liquidity chart to PDF");
          
          // Card background
          pdf.setFillColor(...white);
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(1);
          pdf.roundedRect(margin + columnWidth + 30, yPosition, columnWidth, liquidityHeight + 25, 10, 10, 'FD');
          
          // Shadow effect
          pdf.setDrawColor(240, 240, 240);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin + columnWidth + 32, yPosition + 2, columnWidth - 4, liquidityHeight + 21, 10, 10, 'S');
          
          pdf.addImage(chartImage, "PNG", margin + columnWidth + 40, yPosition + 10, liquidityWidth - 10, liquidityHeight);
          
          console.log("Liquidity chart added successfully");
          
        } catch (err) {
          console.error("Could not render liquidity chart:", err);
          console.error("Error details:", {
            message: err.message,
            canvas: !!liquidityCard?.querySelector('canvas'),
            canvasWidth: liquidityCard?.querySelector('canvas')?.width,
            canvasHeight: liquidityCard?.querySelector('canvas')?.height
          });
          
          // Fallback
          pdf.setFillColor(250, 240, 240);
          pdf.setDrawColor(255, 200, 200);
          pdf.roundedRect(margin + columnWidth + 30, yPosition, columnWidth, 200, 8, 8, 'FD');
          
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);
          pdf.setTextColor(...darkGray);
          pdf.text("⚠ Liquidity chart unavailable", margin + columnWidth + 50, yPosition + 95);
          
          maxColumnHeight = Math.max(maxColumnHeight, 200);
        }
      }
      
      yPosition += maxColumnHeight + 45;
      
      updateLoadingStatus('Adding Market Statistics...', 90);
      updateLoadingStatus('Adding Market Statistics...', 90);
      
      // Market Statistics Summary
      const currentMedian = document.getElementById("current-median");
      const certifiedExamples = document.getElementById("certified-examples");
      
      if (currentMedian || certifiedExamples) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(...black);
        pdf.text("Market Statistics Summary", margin, yPosition);
        
        yPosition += 25;
        
        // Stats cards with enhanced design
        const statCardWidth = (contentWidth - 30) / 2;
        const statCardHeight = 85;
        
        // Current Median Card
        if (currentMedian && currentMedian.textContent) {
          // Gold gradient-style background
          pdf.setFillColor(...white);
          pdf.setDrawColor(...gold);
          pdf.setLineWidth(2);
          pdf.roundedRect(margin, yPosition, statCardWidth, statCardHeight, 10, 10, 'FD');
          
          // Inner highlight
          pdf.setDrawColor(255, 240, 200);
          pdf.setLineWidth(1);
          pdf.roundedRect(margin + 3, yPosition + 3, statCardWidth - 6, statCardHeight - 6, 8, 8, 'S');
          
          // Label
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(...lightGray);
          pdf.text("CURRENT MEDIAN", margin + 20, yPosition + 25);
          
          // Value
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(28);
          pdf.setTextColor(...gold);
          pdf.text(currentMedian.textContent, margin + 20, yPosition + 53);
          
          // Description
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(...darkGray);
          pdf.text("Authenticated Market Price", margin + 20, yPosition + 70);
        }
        
        // Certified Examples Card
        if (certifiedExamples && certifiedExamples.textContent) {
          // Highlighted background
          pdf.setFillColor(255, 252, 235);
          pdf.setDrawColor(...gold);
          pdf.setLineWidth(2);
          pdf.roundedRect(margin + statCardWidth + 30, yPosition, statCardWidth, statCardHeight, 10, 10, 'FD');
          
          // Inner highlight
          pdf.setDrawColor(255, 245, 210);
          pdf.setLineWidth(1);
          pdf.roundedRect(margin + statCardWidth + 33, yPosition + 3, statCardWidth - 6, statCardHeight - 6, 8, 8, 'S');
          
          // Label
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(...lightGray);
          pdf.text("CERTIFIED EXAMPLES", margin + statCardWidth + 50, yPosition + 25);
          
          // Value
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(28);
          pdf.setTextColor(...black);
          pdf.text(certifiedExamples.textContent, margin + statCardWidth + 50, yPosition + 53);
          
          // Description
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(...darkGray);
          pdf.text("NGC/PCGS Certified Population", margin + statCardWidth + 50, yPosition + 70);
        }
        
        yPosition += statCardHeight + 30;
      }
      
      // Footer with branding on every page
      const addFooter = (pageNum, totalPages) => {
        const footerY = pageHeight - 45;
        
        // Gold divider line
        pdf.setDrawColor(...gold);
        pdf.setLineWidth(2);
        pdf.line(margin, footerY, pageWidth - margin, footerY);
        
        // Branding
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...black);
        pdf.text("IMPERIUM ROMA", margin, footerY + 18);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...lightGray);
        pdf.text("Professional Numismatic Market Analysis", margin, footerY + 30);
        
        // Page number
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...gold);
        const pageNumText = `Page ${pageNum} of ${totalPages}`;
        const pageNumWidth = pdf.getStringUnitWidth(pageNumText) * 9 / pdf.internal.scaleFactor;
        pdf.text(pageNumText, pageWidth - margin - pageNumWidth, footerY + 18);
        
        // Generated date
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...lightGray);
        const genDate = now.toLocaleDateString('en-US');
        const genDateWidth = pdf.getStringUnitWidth(genDate) * 7 / pdf.internal.scaleFactor;
        pdf.text(genDate, pageWidth - margin - genDateWidth, footerY + 30);
      };
      
      updateLoadingStatus('Finalizing PDF...', 95);
      
      // Add footers to all content pages (skip cover)
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i - 1, totalPages - 1);
      }
      
      updateLoadingStatus('Saving Document...', 98);
      
      // Save PDF with descriptive filename
      const filename = `Imperium_Roma_Marcus_Aurelius_Market_Report_${now.toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      updateLoadingStatus('Complete!', 100);
      
      // Brief success message
      setTimeout(() => {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 204, 0, 0.95);
          color: black;
          padding: 20px 40px;
          border-radius: 10px;
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 16px;
          font-weight: bold;
          z-index: 10001;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        successMsg.textContent = '✓ Report Downloaded Successfully!';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          successMsg.remove();
        }, 2000);
      }, 500);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      
      // Show detailed error message
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 50, 50, 0.95);
        color: white;
        padding: 30px 40px;
        border-radius: 10px;
        font-family: 'Montserrat', Arial, sans-serif;
        z-index: 10001;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        max-width: 400px;
        text-align: center;
      `;
      errorMsg.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">⚠ Export Failed</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">There was an error generating your report. Please try again.</p>
        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">${err.message || 'Unknown error'}</p>
      `;
      document.body.appendChild(errorMsg);
      
      setTimeout(() => {
        errorMsg.remove();
      }, 5000);
      
    } finally {
      // Remove loading indicator with fade-out
      setTimeout(() => {
        const loadingIndicator = document.getElementById('pdf-loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.style.transition = 'opacity 0.3s';
          loadingIndicator.style.opacity = '0';
          setTimeout(() => {
            loadingIndicator.remove();
          }, 300);
        }
        
        // Clean up spinner style
        const spinnerStyle = Array.from(document.querySelectorAll('style')).find(
          style => style.textContent.includes('@keyframes spin')
        );
        if (spinnerStyle) {
          spinnerStyle.remove();
        }
      }, 600);
    }
  });
});
