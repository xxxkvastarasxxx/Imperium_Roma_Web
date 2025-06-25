document.addEventListener('DOMContentLoaded', () => {
    if (window.coin3DGeneratorLoaded) return;
    window.coin3DGeneratorLoaded = true;

    // Load Three.js and dependencies
    loadDependencies(['https://cdnjs.cloudflare.com/ajax/libs/three.js/r132/three.min.js',
                      'https://cdn.jsdelivr.net/npm/three@0.132.0/examples/js/controls/OrbitControls.min.js'])
        .then(initCoin3DGenerator)
        .catch(err => {
            console.error("Failed to load dependencies:", err);
            alert("Failed to load required libraries. Please refresh the page.");
        });
});

function loadDependencies(urls) {
    return Promise.all(urls.map(url => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }));
}

function initCoin3DGenerator() {
    // Element references
    const elements = {
        obverseUpload: document.getElementById('obverseUpload'),
        reverseUpload: document.getElementById('reverseUpload'),
        obversePreview: document.getElementById('obversePreview'),
        reversePreview: document.getElementById('reversePreview'),
        generateBtn: document.getElementById('generateModel'),
        placeholder: document.getElementById('placeholder'),
        canvas: document.getElementById('coin3DCanvas'),
        container: document.getElementById('coin3DPreview')
    };
    
    // State variables
    const state = {
        obverseImage: null,
        reverseImage: null,
        isGenerating: false,
        autoRotate: true,
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        coin: null,
        lights: [] // Store lights for potential animation
    };

    // Initialize upload listeners
    setupUpload(elements.obverseUpload, elements.obversePreview, img => {
        state.obverseImage = img;
        updateGenerateButton();
    });
    
    setupUpload(elements.reverseUpload, elements.reversePreview, img => {
        state.reverseImage = img;
        updateGenerateButton();
    });
    
    // Toggle generate button based on uploads
    function updateGenerateButton() {
        elements.generateBtn.disabled = !(state.obverseImage && state.reverseImage);
    }
    
    // Generate button functionality
    elements.generateBtn.addEventListener('click', () => {
        if (!state.isGenerating && state.obverseImage && state.reverseImage) {
            generateCoin3DModel();
        }
    });
    
    // Handle file uploads
    function setupUpload(input, preview, callback) {
        input.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = event => {
                    const img = new Image();
                    img.onload = () => {
                        preview.style.backgroundImage = `url(${event.target.result})`;
                        preview.innerHTML = '';
                        callback(img);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        preview.addEventListener('click', () => input.click());
    }
    
    // Generate 3D model from images
    function generateCoin3DModel() {
        state.isGenerating = true;
        
        // Show loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="processing-text">Generating 3D model...</div>
        `;
        elements.container.appendChild(loadingOverlay);
        
        // Give time for UI updates before heavy processing
        setTimeout(() => {
            try {
                // Initialize Three.js scene
                initThreeJS();
                
                // Create coin from uploaded images
                createCoin();
                
                // Hide placeholder, show canvas
                elements.placeholder.classList.add('hidden');
                elements.canvas.classList.remove('hidden');
                
                // Add control buttons
                addControlButtons();
                
                // Force a resize to ensure proper rendering
                window.dispatchEvent(new Event('resize'));
            } catch (error) {
                console.error("Error generating coin:", error);
                alert("There was an error generating the 3D coin. Please try again.");
            }
            
            // Remove loading overlay
            loadingOverlay.remove();
            state.isGenerating = false;
        }, 100);
    }
    
    // Initialize Three.js environment
    function initThreeJS() {
        // Scene setup
        state.scene = new THREE.Scene();
        state.scene.background = new THREE.Color(0xf7f7f7);
        
        // Camera setup
        const aspect = elements.canvas.clientWidth / elements.canvas.clientHeight || 1;
        state.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        state.camera.position.z = 5;
        
        // Renderer setup with improved quality
        state.renderer = new THREE.WebGLRenderer({ 
            canvas: elements.canvas, 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        
        // Update renderer size
        updateRendererSize();
        
        // Enhanced renderer settings for better quality
        state.renderer.physicallyCorrectLights = true;
        state.renderer.outputEncoding = THREE.sRGBEncoding;
        state.renderer.shadowMap.enabled = true;
        state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        state.renderer.toneMappingExposure = 1.2;
        
        // Controls setup with better defaults
        state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
        state.controls.enableDamping = true;
        state.controls.dampingFactor = 0.1;
        state.controls.enableZoom = true;
        state.controls.autoRotate = state.autoRotate;
        state.controls.autoRotateSpeed = 1.5;
        state.controls.maxPolarAngle = Math.PI / 1.5;
        state.controls.minDistance = 3;
        state.controls.maxDistance = 10;
        
        // Enhanced lighting setup
        setupEnhancedLighting();
        
        // Start animation loop
        animate();
    }
    
    // Set up enhanced lighting for better visualization
    function setupEnhancedLighting() {
        // Clear any existing lights
        state.lights.forEach(light => state.scene.remove(light));
        state.lights = [];
        
        // Create subtle ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        state.scene.add(ambientLight);
        state.lights.push(ambientLight);
        
        // Main directional light (from front-top-right)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 20;
        mainLight.shadow.bias = -0.001;
        state.scene.add(mainLight);
        state.lights.push(mainLight);
        
        // Fill light (from front-bottom-left)
        const fillLight = new THREE.DirectionalLight(0xffffee, 0.7);
        fillLight.position.set(-5, -2, 5);
        state.scene.add(fillLight);
        state.lights.push(fillLight);
        
        // Rim light (from back)
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rimLight.position.set(0, 0, -10);
        state.scene.add(rimLight);
        state.lights.push(rimLight);
        
        // Top light for extra detail
        const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
        topLight.position.set(0, 10, 0);
        state.scene.add(topLight);
        state.lights.push(topLight);
        
        // Add point lights for specular highlights
        const pointLight1 = new THREE.PointLight(0xffddaa, 0.6, 10);
        pointLight1.position.set(2, 2, 3);
        state.scene.add(pointLight1);
        state.lights.push(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xaaddff, 0.4, 10);
        pointLight2.position.set(-2, 1, 3);
        state.scene.add(pointLight2);
        state.lights.push(pointLight2);
    }
    
    // Create coin with uploaded images
    function createCoin() {
        // Create textures from the uploaded images
        const obverseTexture = createTextureFromImage(state.obverseImage);
        const reverseTexture = createTextureFromImage(state.reverseImage);
        
        // Generate normal maps for added detail
        const obverseNormalMap = generateSimpleNormalMap(state.obverseImage);
        const reverseNormalMap = generateSimpleNormalMap(state.reverseImage);
        
        // Create a cylinder for the coin with more segments for smoother edges
        const geometry = new THREE.CylinderGeometry(2, 2, 0.2, 96, 2);
        
        // Create enhanced materials using the uploaded image textures
        const materials = [
            new THREE.MeshPhysicalMaterial({
                color: 0xd4c19c,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 0.5,
                clearcoat: 0.2,
                clearcoatRoughness: 0.4
            }), // Edge material with metallic finish
            new THREE.MeshStandardMaterial({
                map: reverseTexture,
                normalMap: reverseNormalMap,
                normalScale: new THREE.Vector2(0.5, 0.5),
                metalness: 0.7,
                roughness: 0.25,
                envMapIntensity: 0.5
            }), // Reverse (top) material
            new THREE.MeshStandardMaterial({
                map: obverseTexture,
                normalMap: obverseNormalMap,
                normalScale: new THREE.Vector2(0.5, 0.5),
                metalness: 0.7,
                roughness: 0.25,
                envMapIntensity: 0.5
            }) // Obverse (bottom) material
        ];
        
        // Create the coin mesh
        state.coin = new THREE.Mesh(geometry, materials);
        
        // Rotate to show face up
        state.coin.rotation.x = Math.PI / 2;
        
        // Enable shadows
        state.coin.castShadow = true;
        state.coin.receiveShadow = true;
        
        // Add to scene
        state.scene.add(state.coin);
        
    }
    
    // Create improved texture from uploaded image that perfectly fills the coin
    function createTextureFromImage(image) {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use power-of-two dimensions for better performance
        const size = Math.pow(2, Math.ceil(Math.log2(Math.max(image.width, image.height, 512))));
        canvas.width = size;
        canvas.height = size;
        
        // Fill background with coin-like color
        ctx.fillStyle = '#d4c19c';
        ctx.fillRect(0, 0, size, size);
        
        // Create perfect circle mask
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Draw image to fill the entire circular area (100%)
        // We'll use a different approach to fill the entire circle
        let x, y, drawWidth, drawHeight;
        
        if (image.width / image.height > 1) {
            // Image is wider than tall
            drawHeight = size;
            drawWidth = size * (image.width / image.height);
            x = (size - drawWidth) / 2;
            y = 0;
        } else {
            // Image is taller than wide
            drawWidth = size;
            drawHeight = size * (image.height / image.width);
            x = 0;
            y = (size - drawHeight) / 2;
        }
        
        // Draw image centered to fill the entire circle
        ctx.drawImage(image, x, y, drawWidth, drawHeight);
        
        // Add subtle vignette effect to blend edges
        addVignette(ctx, size);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 16; // Improve texture quality
        texture.encoding = THREE.sRGBEncoding; // Proper color space
        
        return texture;
    }
    
    // Add vignette effect to help blend image edges
    function addVignette(ctx, size) {
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, size / 2 * 0.7,
            size / 2, size / 2, size / 2
        );
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    }
    
    // Generate a simple normal map for added texture detail
    function generateSimpleNormalMap(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const size = Math.pow(2, Math.ceil(Math.log2(Math.max(image.width, image.height, 512))));
        canvas.width = size;
        canvas.height = size;
        
        // Draw the image
        ctx.drawImage(image, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        const normalMapData = new Uint8ClampedArray(data.length);
        
        // Simple edge detection for normal map effect
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const index = (y * size + x) * 4;
                
                // Sample neighboring pixels
                const left = getBrightness(data, index - 4);
                const right = getBrightness(data, index + 4);
                const top = getBrightness(data, index - size * 4);
                const bottom = getBrightness(data, index + size * 4);
                
                // Calculate normal vector (simplified)
                const dx = (right - left) * 2.0;
                const dy = (bottom - top) * 2.0;
                // Z component is fixed at 1.0 for our simplified normal map
                
                // Convert to RGB format (128,128,255 is flat)
                normalMapData[index] = Math.max(0, Math.min(255, 128 + dx * 127));
                normalMapData[index + 1] = Math.max(0, Math.min(255, 128 + dy * 127));
                normalMapData[index + 2] = Math.max(0, Math.min(255, 255 - (Math.abs(dx) + Math.abs(dy)) * 63));
                normalMapData[index + 3] = 255;
            }
        }
        
        const normalMapImage = new ImageData(normalMapData, size, size);
        ctx.putImageData(normalMapImage, 0, 0);
        
        const normalMap = new THREE.CanvasTexture(canvas);
        normalMap.anisotropy = 16;
        
        return normalMap;
    }
    
    // Helper function to calculate brightness
    function getBrightness(data, index) {
        return (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255;
    }
    
    // Add control buttons
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
            <button class="control-btn" id="zoomIn" title="Zoom In">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5A6.5,6.5 0 0,0 9.5,3A6.5,6.5 0 0,0 3,9.5A6.5,6.5 0 0,0 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.5L20.5,19L15.5,14M9.5,14C7,14 5,12 5,9.5C5,7 7,5 9.5,5C12,5 14,7 14,9.5C14,12 12,14 9.5,14M12,10H10V12H9V10H7V9H9V7H10V9H12V10Z" />
                </svg>
            </button>
            <button class="control-btn" id="zoomOut" title="Zoom Out">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5A6.5,6.5 0 0,0 9.5,3A6.5,6.5 0 0,0 3,9.5A6.5,6.5 0 0,0 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.5L20.5,19L15.5,14M9.5,14C7,14 5,12 5,9.5C5,7 7,5 9.5,5C12,5 14,7 14,9.5C14,12 12,14 9.5,14M7,9H12V10H7V9Z" />
                </svg>
            </button>
            <button class="control-btn" id="enhanceLighting" title="Enhance Lighting">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12,6A6,6 0 0,1 18,12C18,14.22 16.79,16.16 15,17.2V19A1,1 0 0,1 14,20H10A1,1 0 0,1 9,19V17.2C7.21,16.16 6,14.22 6,12A6,6 0 0,1 12,6M14,21V22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22V21H14M20,11H23V13H20V11M1,11H4V13H1V11M13,1V4H11V1H13M4.92,3.5L7.05,5.64L5.63,7.05L3.5,4.93L4.92,3.5M16.95,5.63L19.07,3.5L20.5,4.93L18.37,7.05L16.95,5.63Z" />
                </svg>
            </button>
        `;
        
        elements.container.appendChild(controlsDiv);
        
        // Add event listeners to buttons
        document.getElementById('rotateToggle').addEventListener('click', e => {
            state.autoRotate = !state.autoRotate;
            state.controls.autoRotate = state.autoRotate;
            e.currentTarget.classList.toggle('active');
        });
        
        document.getElementById('resetView').addEventListener('click', () => {
            state.camera.position.set(0, 0, 5);
            state.controls.target.set(0, 0, 0);
            state.controls.update();
        });
        
        document.getElementById('toggleSide').addEventListener('click', () => {
            if (!state.coin) return;
            
            // Smooth coin flip animation
            const duration = 1000; // milliseconds
            const start = performance.now();
            const initialRotation = state.coin.rotation.y;
            
            function flipAnimation(time) {
                const elapsed = time - start;
                const progress = Math.min(elapsed / duration, 1);
                
                // Enhanced easing for more realistic movement
                const eased = easeInOutBack(progress);
                state.coin.rotation.y = initialRotation + Math.PI * eased;
                
                if (progress < 1) {
                    requestAnimationFrame(flipAnimation);
                }
            }
            
            requestAnimationFrame(flipAnimation);
        });
        
        document.getElementById('zoomIn').addEventListener('click', () => {
            state.camera.position.z = Math.max(state.controls.minDistance, state.camera.position.z - 0.5);
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            state.camera.position.z = Math.min(state.controls.maxDistance, state.camera.position.z + 0.5);
        });
        
        // Cycle through different lighting presets
        let lightingMode = 0;
        document.getElementById('enhanceLighting').addEventListener('click', () => {
            lightingMode = (lightingMode + 1) % 4;
            
            switch(lightingMode) {
                case 0: // Standard
                    setupEnhancedLighting();
                    break;
                case 1: // Dramatic
                    setupDramaticLighting();
                    break;
                case 2: // Soft
                    setupSoftLighting();
                    break;
                case 3: // Museum
                    setupMuseumLighting();
                    break;
            }
        });
    }
    
    // Alternative lighting setups
    function setupDramaticLighting() {
        state.lights.forEach(light => state.scene.remove(light));
        state.lights = [];
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        state.scene.add(ambientLight);
        state.lights.push(ambientLight);
        
        const spotLight = new THREE.SpotLight(0xffffff, 1.5);
        spotLight.position.set(5, 10, 5);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.2;
        spotLight.decay = 1;
        spotLight.distance = 30;
        spotLight.castShadow = true;
        state.scene.add(spotLight);
        state.lights.push(spotLight);
        
        const rimLight = new THREE.DirectionalLight(0x9090ff, 0.5);
        rimLight.position.set(-5, -2, -5);
        state.scene.add(rimLight);
        state.lights.push(rimLight);
    }
    
    function setupSoftLighting() {
        state.lights.forEach(light => state.scene.remove(light));
        state.lights = [];
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        state.scene.add(ambientLight);
        state.lights.push(ambientLight);
        
        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
        state.scene.add(hemisphereLight);
        state.lights.push(hemisphereLight);
        
        const softLight = new THREE.DirectionalLight(0xffffff, 0.6);
            softLight.position.set(3, 3, 3);
            state.scene.add(softLight);
            state.lights.push(softLight);
            
            const fillLight = new THREE.DirectionalLight(0xffeedd, 0.4);
            fillLight.position.set(-3, 2, 1);
            state.scene.add(fillLight);
            state.lights.push(fillLight);
            }
            
            function setupMuseumLighting() {
            state.lights.forEach(light => state.scene.remove(light));
            state.lights = [];
            
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
            state.scene.add(ambientLight);
            state.lights.push(ambientLight);
            
            // Key light - simulates main museum spotlight
            const keyLight = new THREE.SpotLight(0xffffeb, 1);
            keyLight.position.set(5, 8, 5);
            keyLight.angle = Math.PI / 8;
            keyLight.penumbra = 0.3;
            keyLight.castShadow = true;
            state.scene.add(keyLight);
            state.lights.push(keyLight);
            
            // Fill light - softer light from another direction
            const fillLight = new THREE.SpotLight(0xffffee, 0.5);
            fillLight.position.set(-5, 5, 5);
            fillLight.angle = Math.PI / 6;
            fillLight.penumbra = 0.5;
            state.scene.add(fillLight);
            state.lights.push(fillLight);
            
            // Edge highlight
            const rimLight = new THREE.DirectionalLight(0xcceeff, 0.3);
            rimLight.position.set(0, 0, -10);
            state.scene.add(rimLight);
            state.lights.push(rimLight);
            }
            
            // Easing function for smooth animations
            function easeInOutBack(x) {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            
            return x < 0.5
              ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
              : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
            }
            
            // Animation loop
            function animate() {
            requestAnimationFrame(animate);
            
            // Update controls
            state.controls.update();
            
            // Render scene
            state.renderer.render(state.scene, state.camera);
            }
            
            // Update renderer size to match container
            function updateRendererSize() {
            if (!state.renderer) return;
            
            const width = elements.container.clientWidth;
            const height = elements.container.clientHeight;
            
            state.renderer.setSize(width, height);
            state.camera.aspect = width / height;
            state.camera.updateProjectionMatrix();
            }
            
            // Handle window resize
            window.addEventListener('resize', updateRendererSize);
        }