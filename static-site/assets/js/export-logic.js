document.addEventListener("DOMContentLoaded", () => {
  const exportLink = document.getElementById("export-report");
  const chartContainer = document.querySelector(".analysis-grid");

  exportLink.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!chartContainer) {
      console.warn("Chart container not found.");
      return;
    }

    // Separate references for different chart elements
    const priceChart = document.querySelector(".trend-card");
    const coinSpotlight = document.querySelector(".coin-spotlight");
    // Will be used in the Market Liquidity Analysis section
    const marketDistribution = document.querySelector(".distribution-card");

    // Prepare date/time
    const now = new Date();
    const dateFormatted = now.toISOString().split('T')[0];
    const timeFormatted = now.toLocaleTimeString();

    // Check if required libraries are loaded
    if (!window.jspdf || !window.html2canvas) {
      alert("Required libraries not loaded. Please ensure jsPDF and html2canvas are included.");
      return;
    }

    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "export-loading";
    loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <p>Generating detailed report...</p>
    `;
    document.body.appendChild(loadingIndicator);

    try {
      // Initialize jsPDF with professional settings
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
        hotfixes: ["px_scaling"],
        compress: true,
      });

      // Dimensions and spacing constants
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      const lineSpacing = 15;
      const primaryColor = [44, 62, 80]; // Dark blue
      const accentColor = [212, 175, 55]; // Gold
      const subtitleColor = [99, 110, 114]; // Gray blue
      const textColor = [60, 60, 60]; // Dark gray
      const lightTextColor = [128, 128, 128]; // Light gray
      
      // Helper functions for consistent styling
      const styles = {
        sectionTitle: () => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(14);
          pdf.setTextColor(...primaryColor);
        },
        
        subSectionTitle: () => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(...textColor);
        },
        
        bodyText: () => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(...textColor);
        },
        
        noteText: () => {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(9);
          pdf.setTextColor(...lightTextColor);
        },
        
        sectionDivider: (y, fullWidth = true) => {
          pdf.setDrawColor(...accentColor);
          pdf.setLineWidth(0.5);
          
          const startX = margin;
          const endX = fullWidth ? pageWidth - margin : startX + contentWidth / 2;
          
          pdf.line(startX, y, endX, y);
          return y + lineSpacing * 0.8;
        },
        
        bulletPoint: (text, x, y) => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(...textColor);
          
          // Draw bullet point
          pdf.circle(x, y - 2.5, 1.2, 'F');
          pdf.text(text, x + 8, y);
          
          return y + lineSpacing;
        },
        
        addGoldAccentBox: (x, y, width, height) => {
          // Add gold accent background
          pdf.setFillColor(250, 242, 215); // Light gold background
          pdf.rect(x, y, width, height, 'F');
          
          // Add gold border
          pdf.setDrawColor(...accentColor);
          pdf.setLineWidth(1);
          pdf.rect(x, y, width, height, 'S');
        }
      };
      
      let yPosition = margin;
      
      /************************************************
       * COVER PAGE
       ************************************************/
      // Background tint for cover page
      pdf.setFillColor(250, 250, 250);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Header accent bar
      pdf.setFillColor(...accentColor);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      
      // Add logo
      const logoImg = new Image();
      logoImg.src = "/assets/images/imperium-roma-logo.png";

      try {
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(() => reject(new Error("Logo loading timed out")), 1500);
        });
        
        // Center logo
        const logoWidth = 80;
        const logoHeight = 80;
        const logoX = (pageWidth - logoWidth) / 2;
        
        pdf.addImage(logoImg, "PNG", logoX, margin + 20, logoWidth, logoHeight);
        yPosition = margin + 120;
      } catch (err) {
        console.warn("Could not load logo, using text instead:", err);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(24);
        pdf.setTextColor(...accentColor);
        
        // Center text
        const text = "IMPERIUM ROMA";
        const textWidth = pdf.getStringUnitWidth(text) * 24 / pdf.internal.scaleFactor;
        const textX = (pageWidth - textWidth) / 2;
        
        pdf.text(text, textX, margin + 60);
        yPosition = margin + 90;
      }

      // Title with box decoration
      const titleText = "Marcus Aurelius Denarius";
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(...primaryColor);
      
      // Measure and center title
      const titleWidth = pdf.getStringUnitWidth(titleText) * 24 / pdf.internal.scaleFactor;
      const titleX = (pageWidth - titleWidth) / 2;
      
      // Add decorative box
      const boxPadding = 20;
      const boxHeight = 40;
      styles.addGoldAccentBox(
        titleX - boxPadding, 
        yPosition - 5, 
        titleWidth + (boxPadding * 2), 
        boxHeight
      );
      
      pdf.text(titleText, titleX, yPosition + boxHeight/2);
      yPosition += boxHeight + 30;

      // Subtitle
      const subtitleText = "Market Analysis Report";
      pdf.setFontSize(18);
      pdf.setTextColor(...subtitleColor);
      
      // Measure and center subtitle
      const subtitleWidth = pdf.getStringUnitWidth(subtitleText) * 18 / pdf.internal.scaleFactor;
      const subtitleX = (pageWidth - subtitleWidth) / 2;
      
      pdf.text(subtitleText, subtitleX, yPosition);
      yPosition += lineSpacing * 3;
      
      // Add decorative coin image if available
      try {
        const coinImg = await html2canvas(coinSpotlight, { 
          scale: 2,
          backgroundColor: null
        });
        const coinData = coinImg.toDataURL("image/png");
        
        // Place coin image centrally
        const coinImgWidth = 200;
        const coinImgHeight = 200;
        const coinImgX = (pageWidth - coinImgWidth) / 2;
        
        pdf.addImage(coinData, "PNG", coinImgX, yPosition, coinImgWidth, coinImgHeight);
        yPosition += coinImgHeight + lineSpacing;
      } catch (err) {
        console.warn("Could not add coin image to cover:", err);
        yPosition += 100; // Add space anyway
      }
      
      // Date and reference with elegantly styled box
      const dateBoxY = pageHeight - 100;
      const dateBoxHeight = 60;
      
      styles.addGoldAccentBox(margin, dateBoxY, contentWidth, dateBoxHeight);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...textColor);
      
      pdf.text("Report Date:", margin + 15, dateBoxY + 20);
      pdf.text("Reference:", margin + 15, dateBoxY + 40);
      
      pdf.setFont("helvetica", "bold");
      pdf.text(`${dateFormatted} at ${timeFormatted}`, margin + 100, dateBoxY + 20);
      pdf.text("RIC III Marcus Aurelius 171", margin + 100, dateBoxY + 40);
      
      // Add page
      pdf.addPage();
      yPosition = margin;

      /************************************************
       * TABLE OF CONTENTS
       ************************************************/
      styles.sectionTitle();
      pdf.text("Table of Contents", margin, yPosition);
      yPosition = styles.sectionDivider(yPosition + lineSpacing * 0.5);
      
      const tocEntries = [
        { title: "Numismatic Details", page: 3 },
        { title: "Price Trajectory Analysis", page: 4 },
        { title: "Market Statistics", page: 5 },
        { title: "Market Liquidity Analysis", page: 6 },
        { title: "Historical Context", page: 7 }
      ];
      
      // TOC entries with dot leaders
      tocEntries.forEach((entry, index) => {
        const entryY = yPosition + (index * lineSpacing * 1.5);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.setTextColor(...textColor);
        pdf.text(entry.title, margin, entryY);
        
        // Add dot leaders
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...accentColor);
        const pageNumX = pageWidth - margin - 20;
        pdf.text(entry.page.toString(), pageNumX, entryY);
        
        // Draw dot leader line
        const startX = margin + pdf.getStringUnitWidth(entry.title) * 12 / pdf.internal.scaleFactor + 10;
        const endX = pageNumX - 10;
        
        pdf.setDrawColor(...lightTextColor);
        pdf.setLineWidth(0.2);
        
        for (let x = startX; x < endX; x += 4) {
          pdf.line(x, entryY - 2, x + 1, entryY - 2);
        }
      });
      
      yPosition += tocEntries.length * lineSpacing * 1.5 + lineSpacing * 2;
      
      // Add instruction note
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      pdf.setTextColor(...lightTextColor);
      
      const noteText = "This report provides detailed analysis of the Marcus Aurelius Denarius coin's market performance, " + 
                       "historical context, and investment prospects based on current market data.";
      const noteLines = pdf.splitTextToSize(noteText, contentWidth);
      
      pdf.text(noteLines, margin, yPosition);
      
      // Add page
      pdf.addPage();
      yPosition = margin;

      /************************************************
       * NUMISMATIC DETAILS SECTION
       ************************************************/
      styles.sectionTitle();
      pdf.text("Numismatic Details", margin, yPosition);
      yPosition = styles.sectionDivider(yPosition + lineSpacing * 0.5);
      
      // Function to add heading and information with improved styling
      const addDetailSection = (title, details, x, y, width) => {
        let posY = y;
        
        // Add background for the section
        pdf.setFillColor(250, 250, 250);
        const sectionHeight = lineSpacing * (0.8 + details.length * 1.2) + 15;
        pdf.roundedRect(x, posY, width, sectionHeight, 3, 3, 'F');
        
        // Add title bar
        pdf.setFillColor(...accentColor);
        pdf.setDrawColor(...accentColor);
        pdf.roundedRect(x, posY, width, lineSpacing * 1.2, 3, 3, 'FD');
        
        // Title text
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text(title, x + 8, posY + lineSpacing * 0.8);
        posY += lineSpacing * 1.5;
        
        // Content with alternating background
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        pdf.setTextColor(...textColor);
        
        details.forEach((detail, index) => {
          const [label, value] = detail;
          
          // Subtle alternating background
          if (index % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(x + 3, posY - lineSpacing * 0.6, width - 6, lineSpacing * 1.1, 'F');
          }
          
          pdf.setFont("helvetica", "bold");
          pdf.text(label + ":", x + 8, posY);
          
          pdf.setFont("helvetica", "normal");
          pdf.text(value, x + 70, posY);
          posY += lineSpacing * 1.1;
        });
        
        return posY + lineSpacing * 0.3;
      };

      // Calculate dimensions for two-column layout
      const columnWidth = (contentWidth / 2) - 10;
      const leftColumn = margin;
      const rightColumn = margin + columnWidth + 20;
      
      // Left Column - Basic Information with styled card
      const basicDetails = [
        ["Date Range", "166 CE–167 CE"],
        ["Denomination", "Denarius"],
        ["Material", "Silver"],
        ["Manufacture", "Struck"]
      ];
      
      // Add basic info
      let leftY = addDetailSection("Basic Information", basicDetails, leftColumn, yPosition, columnWidth);
      
      // Left Column - Authority Information
      const authorityDetails = [
        ["Authority", "Marcus Aurelius"],
        ["Dynasty", "Nerva-Antonine Dynasty"],
        ["State", "Roman Empire"],
        ["Mint", "Rome"],
        ["Region", "Europe--Italy--Latium"]
      ];
      
      // Add some spacing between sections
      leftY += lineSpacing * 0.5;
      
      // Add authority info
      leftY = addDetailSection("Authority", authorityDetails, leftColumn, leftY, columnWidth);
      
      // Right Column - Obverse Details
      const obverseDetails = [
        ["Legend", "M ANTONINVS AVG ARM PARTH MAX"],
        ["Type", "Head of Marcus Aurelius, laureate, right"],
        ["Portrait", "Marcus Aurelius"]
      ];
      
      let rightY = addDetailSection("Obverse", obverseDetails, rightColumn, yPosition, columnWidth);
      
      // Right Column - Reverse Details
      const reverseDetails = [
        ["Legend", "TR P XXI IMP IIII COS III"],
        ["Type", "Aequitas, draped, standing left, holding scales"],
        ["", "in right hand and cornucopiae in left hand"],
        ["Deity", "Aequitas"]
      ];
      
      // Add some spacing between sections
      rightY += lineSpacing * 0.5;
      
      // Add reverse info
      rightY = addDetailSection("Reverse", reverseDetails, rightColumn, rightY, columnWidth);
      
      // Update Y position for next section
      yPosition = Math.max(leftY, rightY) + lineSpacing;
      
      // Add illustration caption
      if (yPosition < pageHeight - 100) {
        // Add image caption
        try {
          // Try to get a specific image if available
          const obverseImg = document.querySelector(".coin-obverse-img");
          const reverseImg = document.querySelector(".coin-reverse-img");
          
          if (obverseImg && reverseImg) {
            const obverseCanvas = await html2canvas(obverseImg, { scale: 2 });
            const reverseCanvas = await html2canvas(reverseImg, { scale: 2 });
            
            const imgWidth = 80;
            const imgHeight = 80;
            const obverseX = pageWidth / 2 - imgWidth - 20;
            const reverseX = pageWidth / 2 + 20;
            
            pdf.addImage(obverseCanvas.toDataURL(), "PNG", obverseX, yPosition, imgWidth, imgHeight);
            pdf.addImage(reverseCanvas.toDataURL(), "PNG", reverseX, yPosition, imgWidth, imgHeight);
            
            // Add captions
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(8);
            pdf.setTextColor(...lightTextColor);
            
            const obverseCaptionWidth = pdf.getStringUnitWidth("Obverse") * 8 / pdf.internal.scaleFactor;
            const reverseCaptionWidth = pdf.getStringUnitWidth("Reverse") * 8 / pdf.internal.scaleFactor;
            
            pdf.text("Obverse", obverseX + (imgWidth - obverseCaptionWidth)/2, yPosition + imgHeight + 10);
            pdf.text("Reverse", reverseX + (imgWidth - reverseCaptionWidth)/2, yPosition + imgHeight + 10);
            
            yPosition += imgHeight + 30;
          }
        } catch (err) {
          console.warn("Could not add coin illustrations", err);
        }
      }

      // Add page break
      pdf.addPage();
      yPosition = margin;

      /************************************************
       * PRICE TRENDS SECTION
       ************************************************/
      styles.sectionTitle();
      pdf.text("Price Trajectory Analysis", margin, yPosition);
      yPosition = styles.sectionDivider(yPosition + lineSpacing * 0.5);
      
      // Add background for chart
      styles.addGoldAccentBox(margin - 5, yPosition - 5, contentWidth + 10, 220);

      // Capture Price Chart
      try {
        const priceChartImg = await html2canvas(priceChart, { 
          scale: 2,
          backgroundColor: null,
          logging: false
        });
        const priceChartData = priceChartImg.toDataURL("image/png");
        
        // Maintain aspect ratio but fit within box
        const maxChartHeight = 210;
        const priceChartRatio = priceChartImg.width / priceChartImg.height;
        const priceChartHeight = Math.min(maxChartHeight, contentWidth / priceChartRatio);
        const priceChartWidth = priceChartHeight * priceChartRatio;
        
        // Center the chart
        const chartX = margin + (contentWidth - priceChartWidth) / 2;
        
        // Add image
        pdf.addImage(priceChartData, "PNG", chartX, yPosition, priceChartWidth, priceChartHeight);
        yPosition += priceChartHeight + lineSpacing;
      } catch (err) {
        console.warn("Could not render price chart", err);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.setTextColor(...lightTextColor);
        pdf.text("[Price chart could not be rendered]", margin, yPosition + 100);
        yPosition += 200;
      }
      
      // Insights section with styled box
      yPosition += lineSpacing;
      styles.subSectionTitle();
      pdf.text("Key Market Insights", margin, yPosition);
      yPosition = styles.sectionDivider(yPosition + lineSpacing * 0.5, false);

      // Create insights box with shadow effect
      const insightsBoxX = margin;
      const insightsBoxY = yPosition;
      const insightsBoxWidth = contentWidth;
      const insightsBoxHeight = 100;
      
      // Shadow effect
      pdf.setFillColor(230, 230, 230);
      pdf.roundedRect(insightsBoxX + 3, insightsBoxY + 3, insightsBoxWidth, insightsBoxHeight, 3, 3, 'F');
      
      // Main box
      pdf.setFillColor(252, 252, 252);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(insightsBoxX, insightsBoxY, insightsBoxWidth, insightsBoxHeight, 3, 3, 'FD');
      
      // Extract insights
      const peakMarker = document.getElementById("peak-marker");
      const growthBadge = document.getElementById("growth-badge");
      const volatilityIndicator = document.getElementById("volatility-indicator");
      
      const peakText = peakMarker ? peakMarker.textContent : "Peak Value: $2,450 (December 2024)";
      const growthText = growthBadge ? growthBadge.textContent : "Annual Growth Rate: +8.2%";
      const volatilityText = volatilityIndicator ? volatilityIndicator.textContent : "Market Volatility: Moderate";
      
      // Add insights as bullet points with icons
      yPosition = insightsBoxY + 20;
      
      // Function to add insight with icon
      const addInsight = (text, y, icon) => {
        // Add circular background for icon
        pdf.setFillColor(...accentColor);
        pdf.circle(margin + 15, y - 2.5, 6, 'F');
        
        // Add icon (using simple characters as placeholders)
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text(icon, margin + 15 - 2.5, y);
        
        // Add insight text
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...textColor);
        pdf.text(text, margin + 35, y);
        
        return y + lineSpacing * 1.5;
      };
      
      yPosition = addInsight(peakText, yPosition, "↑");
      yPosition = addInsight(growthText, yPosition, "%");
      yPosition = addInsight(volatilityText, yPosition, "~");
      
      // Add market recommendation
      yPosition = insightsBoxY + insightsBoxHeight + lineSpacing;
      
      pdf.setFillColor(240, 246, 250);
      pdf.setDrawColor(180, 210, 230);
      pdf.roundedRect(margin, yPosition, contentWidth, 40, 3, 3, 'FD');
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(40, 80, 150);
      pdf.text("Market Recommendation:", margin + 15, yPosition + 17);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("Strong buy recommendation for collectors. Price stability observed in Q1 2025.", 
              margin + 160, yPosition + 17);
      
      // Add page
      pdf.addPage();
      yPosition = margin;

      /************************************************
       * COIN DETAILS & MARKET STATISTICS
       ************************************************/
      styles.sectionTitle();
      pdf.text("Coin Details & Market Statistics", margin, yPosition);
      yPosition = styles.sectionDivider(yPosition + lineSpacing * 0.5);

      // Capture coin spotlight
      try {
        const coinImg = await html2canvas(coinSpotlight, { 
          scale: 2,
          backgroundColor: null,
          logging: false
        });
        const coinData = coinImg.toDataURL("image/png");
        
        // Calculate dimensions
        const maxImgHeight = 180;
        const coinRatio = coinImg.width / coinImg.height;
        const coinHeight = Math.min(maxImgHeight, contentWidth / coinRatio);
        const coinWidth = coinHeight * coinRatio;
        
        // Center the image
        const coinX = margin + (contentWidth - coinWidth) / 2;
        
        // Add decorative frame with shadow
        pdf.setFillColor(230, 230, 230);
        pdf.rect(coinX + 3, yPosition + 3, coinWidth, coinHeight, 'F');
        
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...accentColor);
        pdf.setLineWidth(1);
        pdf.rect(coinX, yPosition, coinWidth, coinHeight, 'FD');
        
        pdf.addImage(coinData, "PNG", coinX, yPosition, coinWidth, coinHeight);
        yPosition += coinHeight + lineSpacing * 2;
      } catch (err) {
        console.warn("Could not render coin spotlight", err);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.setTextColor(...lightTextColor);
        pdf.text("[Coin image could not be rendered]", margin, yPosition + 80);
        yPosition += 160;
      }

      // Statistics cards in a row
      styles.subSectionTitle();
      pdf.text("Market Statistics", margin, yPosition);
      yPosition = styles.sectionDivider(yPosition + lineSpacing * 0.5);
      
      // Extract coin data
      const currentMedian = document.getElementById("current-median");
      const certifiedExamples = document.getElementById("certified-examples");
      const medianValue = currentMedian ? currentMedian.textContent : "$1,850";
      const certifiedValue = certifiedExamples ? certifiedExamples.textContent : "154";
      
      // Create three statistic cards in a row
      const cardWidth = contentWidth / 3 - 10;
      const cardHeight = 80;
      
      // Function to create a stat card
      const createStatCard = (x, y, title, value, subtext) => {
        // Card background with gradient effect
        pdf.setFillColor(252, 252, 252);
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'FD');
        
        // Add top accent
        pdf.setFillColor(...accentColor);
        pdf.rect(x, y, cardWidth, 5, 'F');
        
        // Card title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...lightTextColor);
        pdf.text(title, x + 10, y + 20);
        
        // Value (large)
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(...primaryColor);
        
        // Center the value
        const valueWidth = pdf.getStringUnitWidth(value) * 18 / pdf.internal.scaleFactor;
        const valueX = x + (cardWidth - valueWidth) / 2;
        
        pdf.text(value, valueX, y + 45);
        
        // Subtext
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...lightTextColor);
        
        // Center the subtext
        const subtextWidth = pdf.getStringUnitWidth(subtext) * 8 / pdf.internal.scaleFactor;
        const subtextX = x + (cardWidth - subtextWidth) / 2;
        
        pdf.text(subtext, subtextX, y + 65);
      };
      
      // Create three stat cards
      createStatCard(margin, yPosition, "MEDIAN PRICE", medianValue, "Current Market Value");
      createStatCard(margin + cardWidth + 10, yPosition, "CERTIFIED EXAMPLES", certifiedValue, "NGC/PCGS Population");
      createStatCard(margin + (cardWidth + 10) * 2, yPosition, "MARKET RANK", "Top 15%", "Among Antonine Denarii");
      yPosition += cardHeight + lineSpacing * 2;
      
      // Add market distribution chart if available
      try {
        if (marketDistribution) {
          const distributionImg = await html2canvas(marketDistribution, {
            scale: 2,
            backgroundColor: null,
            logging: false
          });
          
          const distWidth = 200;
          const distHeight = 150;
          const distX = margin + contentWidth - distWidth;
          
          pdf.addImage(distributionImg.toDataURL(), "PNG", distX, yPosition - cardHeight, distWidth, distHeight);
        }
      } catch (err) {
        console.warn("Could not render market distribution chart", err);
      }
      
      // Quality distribution chart (text-based)
      styles.subSectionTitle();
      pdf.text("Specimen Quality Distribution", margin, yPosition);
      yPosition = styles.sectionDivider(yPosition + lineSpacing * 0.5);
      
      // Simple bar chart for quality distribution
      const qualities = ["MS65+", "MS64", "MS63", "MS62", "MS61", "AU"];
      const percentages = [5, 12, 38, 25, 15, 5];
      const barMaxWidth = contentWidth - 100;
      const barHeight = 12;
      const barSpacing = 20;
      
      // Draw bars for each quality level
      qualities.forEach((quality, index) => {
        const y = yPosition + (barSpacing * index);
        const barWidth = (percentages[index] / 100) * barMaxWidth;
        
        // Label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(...textColor);
        pdf.text(quality, margin, y + barHeight/2);
        
        // Bar background
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin + 40, y, barMaxWidth, barHeight, 'F');
        
        // Bar value
        pdf.setFillColor(...accentColor);
        pdf.rect(margin + 40, y, barWidth, barHeight, 'F');
        
        // Percentage
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...textColor);
        pdf.text(`${percentages[index]}%`, margin + 40 + barWidth + 5, y + barHeight/2);
      });
      
            // Update yPosition after the chart
            yPosition += qualities.length * barSpacing + lineSpacing;
            
            // Add remaining sections here...
      
            // Save the PDF with a professional filename
            pdf.save(`Imperium_Roma_Marcus_Aurelius_Report_${dateFormatted}.pdf`);
            
          } catch (err) {
            console.error("Error generating PDF report:", err);
            alert("There was an error generating your report. Please try again.");
          } finally {
            // Remove loading indicator
            const loadingIndicator = document.querySelector(".export-loading");
            if (loadingIndicator) {
              loadingIndicator.remove();
            }
          }
        });
      });
