document.addEventListener('DOMContentLoaded', () => {
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.className = 'certificate-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-container">
        <div class="lightbox-content">
          <img src="" alt="Enlarged certificate" class="lightbox-image">
          <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
        </div>
      </div>
    `;
    document.body.appendChild(lightbox);
    
    // Get lightbox elements
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    
    // Add click event to magnify buttons
    const magnifyButtons = document.querySelectorAll('.magnify-btn');
    magnifyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const certificateCard = btn.closest('.certificate-card');
        const certificateImg = certificateCard?.querySelector('.certificate-img');
        
        if (certificateImg) {
          // Set the src of the lightbox image
          lightboxImage.src = certificateImg.src;
          
          // Show loading state
          lightboxImage.style.opacity = '0';
          lightbox.classList.add('active');
          
          // Once image is loaded, show it with animation
          lightboxImage.onload = () => {
            lightboxImage.style.opacity = '1';
          };
        }
      });
    });
    
    // Close lightbox when clicking close button
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-container')) {
        lightbox.classList.remove('active');
      }
    });
    
    // Close lightbox with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
      }
    });
  });