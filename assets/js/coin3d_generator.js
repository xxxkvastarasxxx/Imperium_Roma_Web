// Load required libraries
document.addEventListener('DOMContentLoaded', function() {
    // Check if the script is already loaded to avoid duplication
    if (window.coin3DGeneratorLoaded) return;
    window.coin3DGeneratorLoaded = true;
    
    // Load Three.js dynamically if not present
    if (typeof THREE === 'undefined') {
        const threeScript = document.createElement('script');
        threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        document.head.appendChild(threeScript);
        
        const orbitControlsScript = document.createElement('script');
        orbitControlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js';
        document.head.appendChild(orbitControlsScript);
        
        // Wait for scripts to load
        threeScript.onload = function() {
            orbitControlsScript.onload = initCoin3DGenerator;
        };
    } else {
        initCoin3DGenerator();
    }
});

function initCoin3DGenerator() {
    // Elements
    const obverseUpload = document.getElementById('obverseUpload');
    const reverseUpload = document.getElementById('reverseUpload');
    const obversePreview = document.getElementById('obversePreview');
    const reversePreview = document.getElementById('reversePreview');
    const generateBtn = document.getElementById('generateModel');
    const placeholder = document.getElementById('placeholder');
    const canvas = document.getElementById('coin3DCanvas');
    
    // State variables
    let obverseImage = null;
    let reverseImage = null;
    let scene, camera, renderer, controls;
    let coin, light;
    let isGenerating = false;
    let autoRotate = true;
    
    // Initialize upload listeners
    initializeUpload(obverseUpload, obversePreview, (img) => { obverseImage = img; updateGenerateButton(); });
    initializeUpload(reverseUpload, reversePreview, (img) => { reverseImage = img; updateGenerateButton(); });
    
    // Generate button click handler
    generateBtn.addEventListener('click', function() {
        if (obverseImage && reverseImage && !isGenerating) {
            generateCoin3DModel();
        }
    });
    
    // Function to handle file uploads
    function initializeUpload(input, preview, callback) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        // Display preview
                        preview.style.backgroundImage = `url(${e.target.result})`;
                        preview.innerHTML = '';
                        
                        // Call the callback with the image
                        callback(img);
                    };
                    img.src = e.target.result;
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Make the preview clickable to trigger file input
        preview.addEventListener('click', function() {
            input.click();
        });
    }
    
    // Enable/disable generate button based on uploads
    function updateGenerateButton() {
        generateBtn.disabled = !(obverseImage && reverseImage);
    }
    
    // Generate 3D model from images
    function generateCoin3DModel() {
        isGenerating = true;
        
        // Show loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="processing-text">Generating 3D model...</div>
        `;
        document.getElementById('coin3DPreview').appendChild(loadingOverlay);
        
        // Simulate processing time (in a real implementation, this would be server-side)
        setTimeout(() => {
            // Initialize Three.js scene
            initThreeJS();
            
            // Create coin geometry from images
            createCoinFromImages(obverseImage, reverseImage);
            
            // Hide placeholder, show canvas
            placeholder.classList.add('hidden');
            canvas.classList.remove('hidden');
            
            // Add controls to the scene
            addControlButtons();
            
            // Remove loading overlay
            loadingOverlay.remove();
            isGenerating = false;
        }, 2500); // Simulate processing time
    }
    
    // Initialize Three.js environment
    function initThreeJS() {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf7f7f7);
        
        // Camera setup
        camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.z = 5;
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Controls setup
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enableZoom = true;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.5;
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        // Point light
        light = new THREE.PointLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        scene.add(light);
        
        // Start animation loop
        animate();
    }
    
    // Create coin mesh with textures from uploaded images
    function createCoinFromImages(obverseImg, reverseImg) {
        // Create textures from images
        const obverseTexture = imageToTexture(obverseImg);
        const reverseTexture = imageToTexture(reverseImg);
        
        // Generate normal maps from textures (simulated)
        const obverseNormalMap = generateNormalMap(obverseImg);
        const reverseNormalMap = generateNormalMap(reverseImg);
        
        // Create coin geometry
        const geometry = new THREE.CylinderGeometry(2, 2, 0.2, 64);
        
        // Create materials for obverse and reverse sides
        const obverseMaterial = new THREE.MeshStandardMaterial({
            map: obverseTexture,
            normalMap: obverseNormalMap,
            normalScale: new THREE.Vector2(0.5, 0.5),
            metalness: 0.7,
            roughness: 0.3
        });
        
        const reverseMaterial = new THREE.MeshStandardMaterial({
            map: reverseTexture,
            normalMap: reverseNormalMap,
            normalScale: new THREE.Vector2(0.5, 0.5),
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Create edge material
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4c19c,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Create coin with different materials for each part
        const materials = [
            edgeMaterial,    // side
            reverseMaterial, // top
            obverseMaterial  // bottom
        ];
        
        coin = new THREE.Mesh(geometry, materials);
        
        // Rotate to show face up
        coin.rotation.x = Math.PI / 2;
        
        scene.add(coin);
    }
    
    // Convert image to Three.js texture
    function imageToTexture(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Make the canvas a power of 2 for Three.js
        const size = Math.pow(2, Math.ceil(Math.log2(Math.max(img.width, img.height))));
        canvas.width = size;
        canvas.height = size;
        
        // Fill with transparent background and draw the image centered
        ctx.clearRect(0, 0, size, size);
        
        // Handle circular coins
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        
        // Draw the image centered in the circular area
        const scale = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 16;
        
        return texture;
    }
    
    // Generate a normal map from an image (simplified simulation)
    function generateNormalMap(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Make the canvas a power of 2 for Three.js
        const size = Math.pow(2, Math.ceil(Math.log2(Math.max(img.width, img.height))));
        canvas.width = size;
        canvas.height = size;
        
        // Draw the image
        ctx.drawImage(img, 0, 0, size, size);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Simple edge detection for normal map effect
        // In a real implementation, this would use more sophisticated algorithms
        const normalMapData = new Uint8ClampedArray(data.length);
        
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const index = (y * size + x) * 4;
                
                // Get brightness values of neighboring pixels
                const left = getBrightness(data, index - 4);
                const right = getBrightness(data, index + 4);
                const up = getBrightness(data, index - size * 4);
                const down = getBrightness(data, index + size * 4);
                
                // Calculate normal vector components based on differences
                // This is a simplified sobel filter effect
                const dx = (right - left) / 2;
                const dy = (down - up) / 2;
                const dz = 1.0; // Fixed z component
                
                // Convert normal vector to RGB color
                normalMapData[index] = Math.floor(dx * 127) + 127;     // Red: X component
                normalMapData[index + 1] = Math.floor(dy * 127) + 127; // Green: Y component
                normalMapData[index + 2] = Math.floor(dz * 127);       // Blue: Z component
                normalMapData[index + 3] = 255; // Alpha
            }
        }
        
        // Create a new ImageData object with the normal map data
        const normalMapImageData = new ImageData(normalMapData, size, size);
        ctx.putImageData(normalMapImageData, 0, 0);
        
        // Create texture from the normal map canvas
        const normalMap = new THREE.CanvasTexture(canvas);
        normalMap.anisotropy = 16;
        
        return normalMap;
    }
    
    // Helper function to calculate brightness from RGB
    function getBrightness(data, index) {
        return (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255;
    }
    
    // Add control buttons for the 3D viewer
    function addControlButtons() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'model-controls';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="rotateToggle" title="Toggle Auto-Rotation">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.5,18.93 4.37,18.73L2.34,15.27C2.21,15.06 2.27,14.83 2.46,14.66L4.57,12.97C4.53,12.65 4.5,12.33 4.5,12C4.5,11.67 4.53,11.34 4.57,11L2.46,9.33C2.27,9.17 2.21,8.94 2.34,8.74L4.38,5.27C4.5,5.07 4.73,4.97 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.97 19.5,5.07 19.63,5.27L21.66,8.74C21.8,8.94 21.73,9.17 21.54,9.33L19.43,11C19.47,11.34 19.5,11.67 19.5,12C19.5,12.33 19.47,12.65 19.43,12.97L21.54,14.66C21.73,14.83 21.79,15.06 21.66,15.27L19.62,18.74C19.5,18.93 19.27,19.03 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z" />
                </svg>
            </button>
            <button class="control-btn" id="resetView" title="Reset View">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z" />
                </svg>
            </button>
            <button class="control-btn" id="toggleSide" title="Flip Coin">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z" />
                </svg>
            </button>
        `;
        
        document.getElementById('coin3DPreview').appendChild(controlsDiv);
        
        // Add event listeners
        document.getElementById('rotateToggle').addEventListener('click', function() {
            autoRotate = !autoRotate;
            controls.autoRotate = autoRotate;
            this.classList.toggle('active');
        });
        
        document.getElementById('resetView').addEventListener('click', function() {
            // Reset camera position
            camera.position.set(0, 0, 5);
            controls.target.set(0, 0, 0);
            controls.update();
        });
        
        document.getElementById('toggleSide').addEventListener('click', function() {
            // Flip the coin to see the other side
            if (coin) {
                // Animate the flip
                const duration = 1000; // milliseconds
                const start = performance.now();
                
                function flipAnimation(time) {
                    const elapsed = time - start;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Rotate around X axis
                    coin.rotation.y = Math.PI * progress;
                    
                    if (progress < 1) {
                        requestAnimationFrame(flipAnimation);
                    }
                }
                
                requestAnimationFrame(flipAnimation);
            }
        });
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        if (controls) {
            controls.update();
        }
        
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (camera && renderer) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    });
}