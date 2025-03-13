document.addEventListener("DOMContentLoaded", () => {
    const exportLink = document.getElementById("export-report");
    const chartContainer = document.querySelector(".analysis-grid");
    
    exportLink.addEventListener("click", async (e) => {
      e.preventDefault();
      
      if (!chartContainer) {
        console.warn("Chart container not found.");
        return;
      }
  
      // Get individual chart elements for separate captures
      const priceChart = document.querySelector(".trend-card");
      const coinSpotlight = document.querySelector(".coin-spotlight");
      const marketDistribution = document.querySelector(".distribution-card");
      
      // Current date and formatted timestamp
      const now = new Date();
      const dateFormatted = now.toISOString().split('T')[0];
      const timeFormatted = now.toLocaleTimeString();
      
      // Create PDF with slightly larger margins
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "px", 
        format: "a4",
        hotfixes: ["px_scaling"],
      });
      
      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      
      // Start PDF document
      let yPosition = margin;
      
      // ==== HEADER SECTION ====
      // Add Imperium Roma logo (placeholder - replace with actual logo path)
      const logoImg = new Image();
      logoImg.src = "/assets/images/imperium-roma-logo.png"; // Replace with your logo path
      
      // We'll add a fallback if the logo can't be loaded
      try {
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          // Set a timeout if the image takes too long
          setTimeout(reject, 1500);
        });
        
        // Add logo to PDF
        pdf.addImage(logoImg, "PNG", margin, yPosition, 50, 50);
        
      } catch (err) {
        console.warn("Could not load logo, using text instead");
        // Use text as fallback for logo
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(150, 120, 0); // Gold color
        pdf.text("IMPERIUM ROMA", margin, yPosition + 20);
      }
      
      // Add title to header (positioned to the right of the logo)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(44, 62, 80);
      pdf.text("Marcus Aurelius Denarius", margin + 70, yPosition + 20);
      
      // Add subtitle
      pdf.setFontSize(16);
      pdf.setTextColor(99, 110, 114);
      pdf.text("Market Analysis Report", margin + 70, yPosition + 40);
      
      // Add date & reference
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated: ${dateFormatted} at ${timeFormatted}`, margin, yPosition + 60);
      pdf.text("RIC III Marcus Aurelius 171", pageWidth - margin - 120, yPosition + 60);
      
      // Add divider line
      pdf.setDrawColor(212, 175, 55); // Gold color
      pdf.setLineWidth(1);
      pdf.line(margin, yPosition + 70, pageWidth - margin, yPosition + 70);
      
      // Move position down after header
      yPosition += 90;
      
      // ==== PRICE TRENDS SECTION ====
      // Add section title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(44, 62, 80);
      pdf.text("Price Trajectory Analysis", margin, yPosition);
      
      // Capture price chart
      const priceChartImg = await html2canvas(priceChart, { scale: 2 });
      const priceChartData = priceChartImg.toDataURL("image/png");
      
      // Calculate image dimensions to fit content width
      const priceChartRatio = priceChartImg.width / priceChartImg.height;
      const priceChartHeight = contentWidth / priceChartRatio;
      
      // Add price chart image
      yPosition += 15;
      pdf.addImage(priceChartData, "PNG", margin, yPosition, contentWidth, priceChartHeight);
      
      // Add insights text below the chart
      yPosition += priceChartHeight + 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text("Key Insights:", margin, yPosition);
      
      // Extract insights from DOM
      const peakMarker = document.getElementById("peak-marker");
      const growthBadge = document.getElementById("growth-badge");
      const peakText = peakMarker ? peakMarker.textContent : "Peak Value Identified";
      const growthText = growthBadge ? growthBadge.textContent : "Annual Growth Rate";
      
      yPosition += 15;
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(10);
      pdf.text(`• ${peakText}`, margin + 10, yPosition);
      yPosition += 15;
      pdf.text(`• ${growthText}`, margin + 10, yPosition);
      
      // Move to next page if needed
      if (yPosition > pageHeight - 150) {
        pdf.addPage();
        yPosition = margin;
      } else {
        yPosition += 30;
      }
      
      // ==== COIN DETAILS SECTION ====
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(44, 62, 80);
      pdf.text("Coin Details & Market Statistics", margin, yPosition);
      
      // Capture coin spotlight
      const coinImg = await html2canvas(coinSpotlight, { scale: 2 });
      const coinData = coinImg.toDataURL("image/png");
      
      // Calculate dimensions
      const coinRatio = coinImg.width / coinImg.height;
      const coinHeight = contentWidth / coinRatio;
      
      // Add coin image
      yPosition += 15;
      pdf.addImage(coinData, "PNG", margin, yPosition, contentWidth, coinHeight);
      
      // Extract coin data
      const currentMedian = document.getElementById("current-median");
      const certifiedExamples = document.getElementById("certified-examples");
      const medianValue = currentMedian ? currentMedian.textContent : "$1,850";
      const certifiedValue = certifiedExamples ? certifiedExamples.textContent : "154";
      
      // Add coin info
      yPosition += coinHeight + 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text("Market Statistics:", margin, yPosition);
      
      yPosition += 15;
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 15;
      pdf.text(`• Current Median Price: ${medianValue}`, margin + 10, yPosition);
      yPosition += 15;
      pdf.text(`• Certified Examples: ${certifiedValue}`, margin + 10, yPosition);
      yPosition += 15;
      pdf.text("• Specimen Quality: MS62-MS63 examples represent the majority of the market", margin + 10, yPosition);
      
      // Next page check
      if (yPosition > pageHeight - 150) {
        pdf.addPage();
        yPosition = margin;
      } else {
        yPosition += 30;
      }
      
      // ==== MARKET DISTRIBUTION SECTION ====
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(44, 62, 80);
      pdf.text("Market Liquidity Analysis", margin, yPosition);
      
      // Capture market distribution
      const marketImg = await html2canvas(marketDistribution, { scale: 2 });
      const marketData = marketImg.toDataURL("image/png");
      
      // Calculate dimensions
      const marketRatio = marketImg.width / marketImg.height;
      const marketHeight = contentWidth / marketRatio;
      
      // Add market chart
      yPosition += 15;
      pdf.addImage(marketData, "PNG", margin, yPosition, contentWidth, marketHeight);
      
      // Add market insights
      yPosition += marketHeight + 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text("Distribution Insights:", margin, yPosition);
      
      // Get distribution percentage
      const doughnutCenterLabel = document.getElementById("doughnut-center-label");
      const distributionPct = doughnutCenterLabel ? doughnutCenterLabel.textContent : "65%";
      
      yPosition += 15;
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 15;
      pdf.text(`• Auction Sales: ${distributionPct} of market volume`, margin + 10, yPosition);
      yPosition += 15;
      pdf.text(`• Private Sales: ${100 - parseInt(distributionPct)}% of market volume`, margin + 10, yPosition);
      yPosition += 15;
      pdf.text("• Market liquidity is considered STRONG for this issue", margin + 10, yPosition);
      
      // ==== FOOTER SECTION ====
      // Add footer to every page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.5);
        pdf.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
        
        // Footer text
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text("IMPERIUM ROMA • Ancient Numismatics Market Analysis", margin, pageHeight - 20);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 40, pageHeight - 20);
      }
      
      // Save the PDF
      pdf.save("Marcus_Aurelius_Denarius_Analysis.pdf");
    });
  });