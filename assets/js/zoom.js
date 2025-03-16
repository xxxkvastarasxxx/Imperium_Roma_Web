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
  
  // Add subtle hover effects to certificate card (3D rotation)
  const certificateCards = document.querySelectorAll('.certificate-card');
  
  certificateCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = (e.clientX - left) / width;
      const y = (e.clientY - top) / height;
      
      // Limit the rotation amount
      const rotateY = (x - 0.5) * 10; // -5 to +5 degrees
      const rotateX = (0.5 - y) * 10; // -5 to +5 degrees
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
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