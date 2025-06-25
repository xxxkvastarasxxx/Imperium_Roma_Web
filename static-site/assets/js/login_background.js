document.addEventListener('DOMContentLoaded', function() {
    // Create canvas element for the background
    const backgroundContainer = document.querySelector('.background');
    const canvas = document.createElement('canvas');
    canvas.id = 'roman-background';
    backgroundContainer.appendChild(canvas);
    
    // Remove any static background images
    backgroundContainer.style.backgroundImage = 'none';
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full screen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Theme configuration
    const config = {
        baseColor: '#000000',
        accentColor: '#b8860b',
        lightColor: '#ffcc00',
        particleCount: Math.min(window.innerWidth / 3, 200),
        columnCount: 5,
        numeralCount: 20,
        laurelCount: 6
    };
    
    // Create Roman-themed particles
    const particles = [];
    const columns = [];
    const numerals = [];
    const laurels = [];
    
    // Roman numerals array
    const romanNumerals = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];

    // Cardinal directions for laurel leaves
    const directions = [
        { x: 1, y: 0 }, { x: 0.7, y: 0.7 }, { x: 0, y: 1 },
        { x: -0.7, y: 0.7 }, { x: -1, y: 0 }, { x: -0.7, y: -0.7 },
        { x: 0, y: -1 }, { x: 0.7, y: -0.7 }
    ];
    
    // Initialize background elements
    function initialize() {
        // Create shimmering particles (stars/dust)
        for (let i = 0; i < config.particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 0.5,
                color: Math.random() > 0.97 ? config.lightColor : '#ffffff',
                alpha: Math.random() * 0.5 + 0.1,
                speed: Math.random() * 0.2 + 0.1,
                pulse: 0,
                pulseSpeed: Math.random() * 0.02 + 0.01
            });
        }
        
        // Create Roman column silhouettes
        const columnWidth = canvas.width / (config.columnCount + 1);
        for (let i = 0; i < config.columnCount; i++) {
            columns.push({
                x: columnWidth * (i + 1),
                y: canvas.height,
                width: Math.min(120, canvas.width / 15),
                height: canvas.height * (0.5 + Math.random() * 0.4),
                capHeight: Math.min(60, canvas.width / 30),
                baseHeight: Math.min(40, canvas.width / 40),
                alpha: 0.1 + Math.random() * 0.1
            });
        }
        
        // Create floating Roman numerals
        for (let i = 0; i < config.numeralCount; i++) {
            numerals.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                text: romanNumerals[Math.floor(Math.random() * romanNumerals.length)],
                size: Math.floor(Math.random() * 30) + 14,
                alpha: Math.random() * 0.2 + 0.05,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01
            });
        }
        
        // Create laurel leaf clusters
        for (let i = 0; i < config.laurelCount; i++) {
            laurels.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 60 + 40,
                leaves: Math.floor(Math.random() * 4) + 6,
                alpha: Math.random() * 0.15 + 0.05,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.005
            });
        }
    }
    
    // Draw a Roman column
    function drawColumn(column) {
        ctx.save();
        ctx.globalAlpha = column.alpha;
        
        // Column base
        ctx.fillStyle = createColumnGradient(column.x, column.y, column.y - column.baseHeight);
        ctx.beginPath();
        ctx.moveTo(column.x - column.width * 0.6, column.y);
        ctx.lineTo(column.x + column.width * 0.6, column.y);
        ctx.lineTo(column.x + column.width / 2, column.y - column.baseHeight);
        ctx.lineTo(column.x - column.width / 2, column.y - column.baseHeight);
        ctx.closePath();
        ctx.fill();
        
        // Column shaft
        ctx.fillStyle = createColumnGradient(column.x, column.y - column.baseHeight, column.y - column.height + column.capHeight);
        ctx.beginPath();
        ctx.moveTo(column.x - column.width / 2, column.y - column.baseHeight);
        ctx.lineTo(column.x + column.width / 2, column.y - column.baseHeight);
        ctx.lineTo(column.x + column.width / 2, column.y - column.height + column.capHeight);
        ctx.lineTo(column.x - column.width / 2, column.y - column.height + column.capHeight);
        ctx.closePath();
        ctx.fill();
        
        // Column capital (top)
        ctx.fillStyle = createColumnGradient(column.x, column.y - column.height + column.capHeight, column.y - column.height);
        ctx.beginPath();
        ctx.moveTo(column.x - column.width / 2, column.y - column.height + column.capHeight);
        ctx.lineTo(column.x + column.width / 2, column.y - column.height + column.capHeight);
        ctx.lineTo(column.x + column.width * 0.6, column.y - column.height);
        ctx.lineTo(column.x - column.width * 0.6, column.y - column.height);
        ctx.closePath();
        ctx.fill();
        
        // Add subtle texture/fluting effect
        const flutingCount = 7;
        const flutingWidth = column.width / flutingCount;
        ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
        ctx.lineWidth = 1;
        
        for (let i = 1; i < flutingCount; i++) {
            const x = column.x - column.width / 2 + i * flutingWidth;
            ctx.beginPath();
            ctx.moveTo(x, column.y - column.baseHeight);
            ctx.lineTo(x, column.y - column.height + column.capHeight);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // Create gradient for columns
    function createColumnGradient(x, y1, y2) {
        const gradient = ctx.createLinearGradient(x, y1, x, y2);
        gradient.addColorStop(0, 'rgba(60, 60, 60, 0.6)');
        gradient.addColorStop(0.5, 'rgba(90, 90, 90, 0.6)');
        gradient.addColorStop(1, 'rgba(60, 60, 60, 0.6)');
        return gradient;
    }
    
    // Draw a Roman numeral
    function drawNumeral(numeral) {
        ctx.save();
        ctx.globalAlpha = numeral.alpha;
        ctx.translate(numeral.x, numeral.y);
        ctx.rotate(numeral.rotation);
        
        ctx.font = `${numeral.size}px 'Trajan Pro', 'Times New Roman', serif`;
        ctx.fillStyle = numeral.size > 30 ? 
            `rgba(184, 134, 11, ${numeral.alpha * 2})` : 
            `rgba(255, 255, 255, ${numeral.alpha * 2})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numeral.text, 0, 0);
        
        ctx.restore();
    }
    
    // Draw laurel leaf cluster
    function drawLaurel(laurel) {
        ctx.save();
        ctx.globalAlpha = laurel.alpha;
        ctx.translate(laurel.x, laurel.y);
        ctx.rotate(laurel.rotation);
        
        const leafLength = laurel.size * 0.6;
        const leafWidth = laurel.size * 0.1;
        
        // Draw each leaf
        for (let i = 0; i < laurel.leaves; i++) {
            const angle = (Math.PI * 2 / laurel.leaves) * i;
            
            // Left side leaf
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(laurel.size * 0.3, 0);
            
            // Draw curved leaf
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                leafLength * 0.5, -leafWidth * 2,
                leafLength, 0
            );
            ctx.quadraticCurveTo(
                leafLength * 0.5, leafWidth * 2,
                0, 0
            );
            
            // Create gradient for leaf
            const leafGradient = ctx.createLinearGradient(0, 0, leafLength, 0);
            leafGradient.addColorStop(0, 'rgba(58, 83, 17, 0.5)');
            leafGradient.addColorStop(1, 'rgba(76, 109, 22, 0.2)');
            
            ctx.fillStyle = leafGradient;
            ctx.fill();
            
            // Add leaf vein
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                leafLength * 0.5, 0,
                leafLength, 0
            );
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
            
            // Right side leaf (mirror of left)
            ctx.save();
            ctx.rotate(angle);
            ctx.scale(-1, 1);
            ctx.translate(laurel.size * 0.3, 0);
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                leafLength * 0.5, -leafWidth * 2,
                leafLength, 0
            );
            ctx.quadraticCurveTo(
                leafLength * 0.5, leafWidth * 2,
                0, 0
            );
            
            ctx.fillStyle = leafGradient;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                leafLength * 0.5, 0,
                leafLength, 0
            );
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    // Update and draw all elements
    function animate() {
        // Clear canvas with dark gradient
        const bgGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.8
        );
        bgGradient.addColorStop(0, '#0a0a0a');
        bgGradient.addColorStop(1, '#000000');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw subtle vignette effect
        const vignetteGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw all particles
        particles.forEach(particle => {
            // Update pulse animation
            particle.pulse += particle.pulseSpeed;
            if (particle.pulse > Math.PI * 2) {
                particle.pulse = 0;
            }
            
            // Draw particle
            const currentAlpha = particle.alpha * (0.6 + Math.sin(particle.pulse) * 0.4);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = currentAlpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Move particle slightly
            particle.y -= particle.speed;
            
            // Reset particle when it goes off screen
            if (particle.y < -10) {
                particle.y = canvas.height + 10;
                particle.x = Math.random() * canvas.width;
            }
        });
        
        // Set global alpha back to 1
        ctx.globalAlpha = 1.0;
        
        // Draw columns
        columns.forEach(drawColumn);
        
        // Draw and update laurels
        laurels.forEach(laurel => {
            laurel.rotation += laurel.rotationSpeed;
            drawLaurel(laurel);
            
            // Move laurel slightly
            laurel.x += Math.sin(laurel.rotation * 0.5) * 0.2;
            laurel.y += Math.cos(laurel.rotation * 0.5) * 0.2;
            
            // Wrap around screen edges
            if (laurel.x < -laurel.size) laurel.x = canvas.width + laurel.size;
            if (laurel.x > canvas.width + laurel.size) laurel.x = -laurel.size;
            if (laurel.y < -laurel.size) laurel.y = canvas.height + laurel.size;
            if (laurel.y > canvas.height + laurel.size) laurel.y = -laurel.size;
        });
        
        // Draw and update numerals
        numerals.forEach(numeral => {
            numeral.rotation += numeral.rotationSpeed;
            numeral.x += numeral.speedX;
            numeral.y += numeral.speedY;
            
            // Wrap around screen edges
            if (numeral.x < 0) numeral.x = canvas.width;
            if (numeral.x > canvas.width) numeral.x = 0;
            if (numeral.y < 0) numeral.y = canvas.height;
            if (numeral.y > canvas.height) numeral.y = 0;
            
            drawNumeral(numeral);
        });
        
        // Draw interactive mouse effect when available
        if (mousePosition.x && mousePosition.y) {
            const radius = 100;
            const gradient = ctx.createRadialGradient(
                mousePosition.x, mousePosition.y, 0,
                mousePosition.x, mousePosition.y, radius
            );
            gradient.addColorStop(0, 'rgba(255, 204, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 204, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mousePosition.x, mousePosition.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        requestAnimationFrame(animate);
    }
    
    // Track mouse position for interactive effects
    const mousePosition = { x: null, y: null };
    
    canvas.addEventListener('mousemove', function(e) {
        mousePosition.x = e.clientX;
        mousePosition.y = e.clientY;
    });
    
    canvas.addEventListener('mouseleave', function() {
        mousePosition.x = null;
        mousePosition.y = null;
    });
    
    // Handle touch events for mobile
    canvas.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            mousePosition.x = e.touches[0].clientX;
            mousePosition.y = e.touches[0].clientY;
        }
    });
    
    canvas.addEventListener('touchend', function() {
        mousePosition.x = null;
        mousePosition.y = null;
    });
    
    // Add parallax effect to background
    window.addEventListener('deviceorientation', function(e) {
        if (e.beta && e.gamma) {
            const tiltX = e.gamma / 10; // Left/right tilt
            const tiltY = e.beta / 10;  // Front/back tilt
            
            // Apply subtle parallax to columns
            columns.forEach((column, index) => {
                const originalX = canvas.width / (config.columnCount + 1) * (index + 1);
                column.x = originalX + tiltX * 5;
            });
            
            // Apply parallax to particles
            particles.forEach(particle => {
                particle.x += tiltX * 0.1 * particle.speed;
                particle.y += tiltY * 0.1 * particle.speed;
            });
        }
    });
    
    // Initialize and start animation
    initialize();
    animate();
    
    // Add a DOMContentLoaded listener to connect to the login page
    document.addEventListener('DOMContentLoaded', function() {
        // Add special handling for auth container
        const authContainer = document.querySelector('.auth-container');
        
        if (authContainer) {
            // Add glow effect on hover
            authContainer.addEventListener('mouseenter', function() {
                columns.forEach(column => {
                    column.alpha *= 1.5;
                });
                
                particles.forEach(particle => {
                    if (Math.random() > 0.7) {
                        particle.color = config.lightColor;
                    }
                });
            });
            
            authContainer.addEventListener('mouseleave', function() {
                columns.forEach(column => {
                    column.alpha /= 1.5;
                });
                
                // Restore particles to original state gradually
                setTimeout(() => {
                    particles.forEach(particle => {
                        if (Math.random() > 0.97) {
                            particle.color = config.lightColor;
                        } else {
                            particle.color = '#ffffff';
                        }
                    });
                }, 1000);
            });
        }
    });
    
    // Add resize handling
    window.addEventListener('resize', function() {
        resizeCanvas();
        
        // Adjust particle count based on screen size
        const newParticleCount = Math.min(window.innerWidth / 3, 200);
        
        // Reset arrays
        particles.length = 0;
        columns.length = 0;
        numerals.length = 0;
        laurels.length = 0;
        
        // Update column count for smaller screens
        if (window.innerWidth < 768) {
            config.columnCount = 3;
        } else {
            config.columnCount = 5;
        }
        
        // Reinitialize with new dimensions
        initialize();
    });
});