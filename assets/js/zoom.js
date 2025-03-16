/**
 * Certificate authentication lightbox functionality
 * Handles certificate image zoom and interactive viewing
 */
document.addEventListener('DOMContentLoaded', () => {
  // Create lightbox element only if it doesn't exist yet
  if (!document.querySelector('.certificate-lightbox')) {
    const lightboxTemplate = `
      <div class="certificate-lightbox" role="dialog" aria-modal="true" aria-label="Certificate preview">
        <div class="lightbox-container">
          <div class="lightbox-content">
            <img src="" alt="Enlarged certificate" class="lightbox-image">
            <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', lightboxTemplate);
  }
  
  // Cache DOM elements for better performance
  const lightbox = document.querySelector('.certificate-lightbox');
  const lightboxImage = lightbox.querySelector('.lightbox-image');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  
  // Add click event to magnify buttons using event delegation
  document.addEventListener('click', (e) => {
    if (e.target.closest('.magnify-btn')) {
      e.preventDefault();
      
      const certificateCard = e.target.closest('.certificate-card');
      const certificateImg = certificateCard?.querySelector('.certificate-img');
      
      if (certificateImg) {
        // Set the src and alt of the lightbox image
        lightboxImage.src = certificateImg.src;
        lightboxImage.alt = certificateImg.alt;
        
        // Show loading state
        lightboxImage.style.opacity = '0';
        lightbox.classList.add('active');
        
        // Once image is loaded, show it with animation
        if (lightboxImage.complete) {
          lightboxImage.style.opacity = '1';
        } else {
          lightboxImage.onload = () => {
            lightboxImage.style.opacity = '1';
          };
        }
      }
    }
  });
  
  // Add subtle hover effects to certificate cards
  const certificateCards = document.querySelectorAll('.certificate-card');
  
  certificateCards.forEach(card => {
    // Use throttling for better performance with mousemove
    let lastExecution = 0;
    const throttleMs = 20; // limit to 50 updates per second
    
    card.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastExecution < throttleMs) return;
      lastExecution = now;
      
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = (e.clientX - left) / width;
      const y = (e.clientY - top) / height;
      
      // Limit the rotation amount
      const rotateY = (x - 0.5) * 10; // -5 to +5 degrees
      const rotateX = (0.5 - y) * 10; // -5 to +5 degrees
      
      // Use requestAnimationFrame for smooth animation
      requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    });
    
    card.addEventListener('mouseleave', () => {
      // Use CSS transition for smooth reset
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
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