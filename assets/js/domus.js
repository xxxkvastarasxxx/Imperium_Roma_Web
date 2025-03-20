/**
 * domus.js - JavaScript for Roman Numismatic Personal Cabinet
 * 
 * Enhanced version with improved architecture, performance optimizations,
 * and better user experience features.
 * 
 * @version 2.0
 * @author GitHub Copilot
 * @last-updated 2025-03-20
 */

// Main application module using IIFE pattern
const DomusApp = (function() {
    'use strict';
    
    // App configuration
    const CONFIG = {
        apiEndpoint: '/api/v1', // For future implementation
        animationDuration: 300,
        chartColors: {
            eras: ['#ffcc00', '#e6b800', '#ccaa00', '#b39500', '#997f00'],
            materials: ['#ffcc00', '#e6b800', '#ccaa00', '#b39500', '#997f00']
        },
        chartOptions: {
            common: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            color: '#ffffff',
                            font: {
                                family: "'Lato', sans-serif",
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        font: {
                            size: 16,
                            family: "'Cinzel', serif",
                            weight: 'normal'
                        },
                        color: '#ffcc00',
                        padding: {
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            family: "'Cinzel', serif"
                        },
                        bodyFont: {
                            family: "'Lato', sans-serif"
                        },
                        borderColor: '#ffcc00',
                        borderWidth: 1
                    }
                }
            }
        }
    };
    
    // Chart instances storage
    let charts = {
        era: null,
        material: null
    };
    
    // Cache DOM elements for performance
    const DOM = {};
    
    /**
     * Initialize the application
     */
    function init() {
        console.log('Initializing Domus application...');
        
        try {
            // Cache DOM elements
            cacheDOM();
            
            // Show loading state
            showLoadingState();
            
            // Initialize functionality
            loadUserData()
                .then(() => {
                    setupCharts();
                    setupEventListeners();
                    updateActiveSection();
                    
                    // Add fade-in animation to main content
                    DOM.mainContent.classList.add('fade-in');
                    
                    // Hide loading overlay
                    hideLoadingState();
                })
                .catch(error => {
                    console.error('Initialization error:', error);
                    showErrorMessage('Failed to initialize the dashboard. Please try refreshing the page.');
                });
        } catch (error) {
            console.error('Fatal initialization error:', error);
            showErrorMessage('A critical error occurred. Please contact support if the problem persists.');
        }
    }
    
    /**
     * Cache DOM elements for better performance
     */
    function cacheDOM() {
        DOM.mainContent = document.querySelector('.domus-content');
        DOM.sidebar = document.querySelector('.domus-sidebar');
        DOM.navLinks = document.querySelectorAll('.sidebar-nav ul li a');
        DOM.headerTitle = document.querySelector('.header-title h1');
        DOM.username = document.getElementById('header-username');
        DOM.userNickname = document.getElementById('user-nickname');
        DOM.userRank = document.getElementById('user-rank');
        DOM.profileNickname = document.getElementById('profile-nickname');
        DOM.profileTitle = document.getElementById('profile-title');
        DOM.profileJoinDate = document.getElementById('profile-join-date');
        DOM.profileDisplayName = document.getElementById('profile-display-name');
        DOM.profileEmail = document.getElementById('profile-email');
        DOM.profileLocation = document.getElementById('profile-location');
        DOM.totalCoins = document.getElementById('total-coins');
        DOM.collectionValue = document.getElementById('collection-value');
        DOM.rarestItem = document.getElementById('rarest-item');
        DOM.oldestCoin = document.getElementById('oldest-coin');
        DOM.profileCollectionSize = document.getElementById('profile-collection-size');
        DOM.profileSpecialization = document.getElementById('profile-specialization');
        DOM.completionProgress = document.querySelector('.completion-progress');
        DOM.profileLanguage = document.getElementById('profile-language');
        DOM.profileCurrency = document.getElementById('profile-currency');
        DOM.profileTheme = document.getElementById('profile-theme');
        DOM.avatars = document.querySelectorAll('#user-avatar-small, #user-avatar-large');
        DOM.acquisitionsTable = document.getElementById('recent-acquisitions-body');
        DOM.eraChart = document.getElementById('era-chart-canvas');
        DOM.materialChart = document.getElementById('material-chart-canvas');
        DOM.chartPlaceholders = document.querySelectorAll('.chart-placeholder');
        DOM.editProfileBtn = document.querySelector('.btn-edit-profile');
        DOM.changeAvatarBtn = document.querySelector('.btn-change-avatar');
        DOM.notificationsBtn = document.querySelector('.btn-notifications');
        DOM.footer = document.querySelector('.domus-footer');
    }
    
    /**
     * Show loading state
     */
    function showLoadingState() {
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('loading-overlay')) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-coins fa-spin"></i>
                    <p>Loading your Domus...</p>
                </div>
            `;
            
            // Styling for loading overlay
            Object.assign(loadingOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '9999',
                transition: 'opacity 0.5s ease-in-out'
            });
            
            document.body.appendChild(loadingOverlay);
            
            // Style the spinner
            const spinner = loadingOverlay.querySelector('.loading-spinner');
            Object.assign(spinner.style, {
                textAlign: 'center',
                color: '#ffcc00'
            });
            
            // Style the icon
            const icon = spinner.querySelector('i');
            Object.assign(icon.style, {
                fontSize: '50px',
                marginBottom: '15px'
            });
            
            // Style the text
            const text = spinner.querySelector('p');
            Object.assign(text.style, {
                fontFamily: "'Cinzel', serif",
                fontSize: '20px',
                color: '#ffcc00'
            });
        }
    }
    
    /**
     * Hide loading state
     */
    function hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showErrorMessage(message) {
        hideLoadingState();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="error-content">
                <h3>Something went wrong</h3>
                <p>${message}</p>
            </div>
            <button class="error-close"><i class="fas fa-times"></i></button>
        `;
        
        // Style the error message
        Object.assign(errorDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid #ffcc00',
            borderRadius: '8px',
            padding: '15px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out forwards'
        });
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(errorDiv);
        
        // Close button functionality
        const closeBtn = errorDiv.querySelector('.error-close');
        closeBtn.addEventListener('click', () => {
            errorDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                errorDiv.remove();
            }, 300);
        });
        
        // Auto-close after 8 seconds
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                errorDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => {
                    errorDiv.remove();
                }, 300);
            }
        }, 8000);
    }
    
    /**
     * Load and display user data
     * In production, this would fetch data from your backend API
     * @returns {Promise} Promise that resolves when data is loaded
     */
    function loadUserData() {
        return new Promise((resolve, reject) => {
            try {
                // In production, this would be an API call like:
                // fetch(`${CONFIG.apiEndpoint}/user/profile`)
                //     .then(response => response.json())
                //     .then(userData => { ... })
                
                // Simulate network delay for demo
                setTimeout(() => {
                    // Mock user data (replace with API calls in production)
                    const userData = {
                        nickname: "xxxkvastarasxxx",
                        rank: "Aureus Collector",
                        title: "Senior Numismatist",
                        displayName: "Roman Coin Enthusiast",
                        email: "kvastaras@example.com",
                        location: "London, England",
                        joinDate: "January 2024",
                        avatar: "/assets/images/team/Taras-Tymoshenko.jpg", // Replace with actual user avatar path
                        
                        // Collection statistics
                        stats: {
                            totalCoins: 78,
                            collectionValue: "14,250 €",
                            rarestItem: "Brutus Aureus (42 BC)",
                            oldestCoin: "Roman Republic Didrachm (280 BC)",
                            collectionSize: "78 coins",
                            specialization: "Republican Era",
                            completionRate: 65
                        },
                        
                        // User preferences
                        preferences: {
                            language: "English",
                            currency: "GBP (£)",
                            theme: "Dark Mode"
                        }
                    };
                    
                    // Update user information with animation
                    updateElementWithAnimation(DOM.userNickname, userData.nickname);
                    updateElementWithAnimation(DOM.username, userData.nickname);
                    updateElementWithAnimation(DOM.userRank, userData.rank);
                    
                    updateElementWithAnimation(DOM.profileNickname, userData.nickname);
                    updateElementWithAnimation(DOM.profileTitle, userData.title);
                    updateElementWithAnimation(DOM.profileJoinDate, `Member since: ${userData.joinDate}`);
                    updateElementWithAnimation(DOM.profileDisplayName, userData.displayName);
                    updateElementWithAnimation(DOM.profileEmail, userData.email);
                    updateElementWithAnimation(DOM.profileLocation, userData.location);
                    
                    // Update collection statistics with counter animation
                    animateCounter(DOM.totalCoins, 0, userData.stats.totalCoins, 1500);
                    updateElementWithAnimation(DOM.collectionValue, userData.stats.collectionValue);
                    updateElementWithAnimation(DOM.rarestItem, userData.stats.rarestItem);
                    updateElementWithAnimation(DOM.oldestCoin, userData.stats.oldestCoin);
                    updateElementWithAnimation(DOM.profileCollectionSize, userData.stats.collectionSize);
                    updateElementWithAnimation(DOM.profileSpecialization, userData.stats.specialization);
                    
                    // Update completion progress bar with animation
                    animateProgressBar(DOM.completionProgress, userData.stats.completionRate);
                    
                    // Update preferences with animation
                    updateElementWithAnimation(DOM.profileLanguage, userData.preferences.language);
                    updateElementWithAnimation(DOM.profileCurrency, userData.preferences.currency);
                    updateElementWithAnimation(DOM.profileTheme, userData.preferences.theme);
                    
                    // Update avatars
                    DOM.avatars.forEach(el => {
                        el.src = userData.avatar;
                        el.alt = `${userData.nickname}'s Avatar`;
                        
                        // Add fade-in effect for avatar
                        el.style.opacity = 0;
                        el.onload = function() {
                            fadeIn(el, 500);
                        };
                    });
                    
                    // Load recent acquisitions
                    loadRecentAcquisitions();
                    
                    resolve();
                }, 1000); // Simulate 1s API delay
            } catch (error) {
                console.error('Error loading user data:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Update element with fade animation
     * @param {HTMLElement} element - Element to update
     * @param {string} newValue - New text value
     */
    function updateElementWithAnimation(element, newValue) {
        if (!element) return;
        
        // Fade out
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = 0;
        
        // Update value and fade in
        setTimeout(() => {
            element.textContent = newValue;
            element.style.opacity = 1;
        }, 300);
    }
    
    /**
     * Animate counter from start to end value
     * @param {HTMLElement} element - Element to update
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    function animateCounter(element, start, end, duration) {
        if (!element) return;
        
        let startTimestamp = null;
        const step = timestamp => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = end;
            }
        };
        window.requestAnimationFrame(step);
    }
    
    /**
     * Animate progress bar
     * @param {HTMLElement} element - Progress bar element
     * @param {number} percentage - Target percentage
     */
    function animateProgressBar(element, percentage) {
        if (!element) return;
        
        // Start from 0%
        element.style.width = '0%';
        element.textContent = '0%';
        
        // Animate to target percentage
        setTimeout(() => {
            element.style.transition = `width 1.5s ease-out`;
            element.style.width = `${percentage}%`;
            
            // Animate the percentage text
            const duration = 1500;
            let startTimestamp = null;
            
            const step = timestamp => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const value = Math.floor(progress * percentage);
                element.textContent = `${value}%`;
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    element.textContent = `${percentage}%`;
                }
            };
            window.requestAnimationFrame(step);
        }, 300);
    }
    
    /**
     * Fade in element
     * @param {HTMLElement} element - Element to fade in
     * @param {number} duration - Animation duration in ms
     */
    function fadeIn(element, duration) {
        if (!element) return;
        
        element.style.opacity = 0;
        element.style.transition = `opacity ${duration}ms ease`;
        
        // Force browser reflow
        void element.offsetWidth;
        
        element.style.opacity = 1;
    }
    
    /**
     * Load recent acquisitions data with improved DOM handling
     */
    function loadRecentAcquisitions() {
        try {
            // In production, fetch from API
            // fetch(`${CONFIG.apiEndpoint}/acquisitions/recent`)
            //     .then(response => response.json())
            //     .then(data => { ... })
            
            // Mock acquisitions data
            const acquisitions = [
                {
                    image: "/assets/images/FeaturedCoinsOTD/08.07.24.1.1.jpg",
                    name: "Denarius",
                    emperor: "Julius Caesar",
                    period: "49-44 BCE",
                    acquired: "2025-03-15",
                    value: "980 €"
                },
                {
                    image: "/assets/images/FeaturedCoinsOTD/08.07.24.2.1.jpg",
                    name: "Aureus",
                    emperor: "Augustus",
                    period: "27 BCE - 14 CE",
                    acquired: "2025-02-28",
                    value: "3,500 €"
                },
                {
                    image: "/assets/images/FeaturedCoinsOTD/08.07.24.3.1.jpg",
                    name: "Sestertius",
                    emperor: "Nero",
                    period: "54-68 CE",
                    acquired: "2025-01-20",
                    value: "750 €"
                }
            ];
            
            // Clear existing content
            if (DOM.acquisitionsTable) {
                DOM.acquisitionsTable.innerHTML = '';
                
                // Create document fragment for better performance
                const fragment = document.createDocumentFragment();
                
                // Add acquisition rows with staggered animations
                acquisitions.forEach((coin, index) => {
                    const row = document.createElement('tr');
                    
                    // Set initial style for animation
                    row.style.opacity = 0;
                    row.style.transform = 'translateY(20px)';
                    row.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    
                    row.innerHTML = `
                        <td>
                            <div class="coin-preview">
                                <img src="${coin.image}" alt="${coin.name}">
                                <span>${coin.name}</span>
                            </div>
                        </td>
                        <td>${coin.emperor}</td>
                        <td>${coin.period}</td>
                        <td>${formatDate(coin.acquired)}</td>
                        <td>${coin.value}</td>
                    `;
                    
                    fragment.appendChild(row);
                    
                    // Staggered animation
                    setTimeout(() => {
                        row.style.opacity = 1;
                        row.style.transform = 'translateY(0)';
                    }, 100 * (index + 1));
                });
                
                DOM.acquisitionsTable.appendChild(fragment);
            }
        } catch (error) {
            console.error('Error loading acquisitions:', error);
            showErrorMessage('Failed to load recent acquisitions. Please try again later.');
        }
    }
    
    /**
    /**
     * Setup charts using Chart.js with enhanced theming
     */
    function setupCharts() {
        try {
            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded. Please include the Chart.js library.');
                showErrorMessage('Chart.js library is missing. Please check your internet connection and refresh the page.');
                return;
            }
            
            // Remove loading placeholders
            DOM.chartPlaceholders.forEach(placeholder => {
                placeholder.style.opacity = 0;
                setTimeout(() => {
                    placeholder.remove();
                }, 300);
            });
            
            // Era distribution chart
            if (DOM.eraChart && DOM.eraChart instanceof HTMLCanvasElement) {
                const eraCtx = DOM.eraChart.getContext('2d');
                if (!eraCtx) {
                    console.error('Could not get 2D context from era chart canvas');
                    return;
                }
                
                // Deep clone common options
                const eraOptions = JSON.parse(JSON.stringify(CONFIG.chartOptions.common));
                
                // Add specific options
                eraOptions.plugins.title.text = 'Distribution by Time Period';
                
                charts.era = new Chart(eraCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Republican', 'Early Empire', 'High Empire', 'Late Empire', 'Byzantine'],
                        datasets: [{
                            data: [20, 35, 15, 18, 12],
                            backgroundColor: CONFIG.chartColors.eras,
                            borderColor: 'rgba(26, 26, 26, 0.8)',
                            borderWidth: 2,
                            hoverOffset: 8
                        }]
                    },
                    options: eraOptions
                });
                
                // Add animation effect
                DOM.eraChart.style.opacity = 0;
                setTimeout(() => {
                    DOM.eraChart.style.transition = 'opacity 1s ease';
                    DOM.eraChart.style.opacity = 1;
                }, 300);
            } else if (DOM.eraChart) {
                console.error('Era chart element is not a canvas element');
                showErrorMessage('Chart rendering failed. Please try refreshing the page.');
            }
            
            // Material distribution chart
            if (DOM.materialChart && DOM.materialChart instanceof HTMLCanvasElement) {
                const materialCtx = DOM.materialChart.getContext('2d');
                if (!materialCtx) {
                    console.error('Could not get 2D context from material chart canvas');
                    return;
                }
                
                // Deep clone common options
                const materialOptions = JSON.parse(JSON.stringify(CONFIG.chartOptions.common));
                
                // Add specific options
                materialOptions.plugins.title.text = 'Distribution by Material';
                materialOptions.cutout = '60%'; // Makes it a proper doughnut
                
                charts.material = new Chart(materialCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Gold', 'Silver', 'Bronze', 'Copper', 'Billon'],
                        datasets: [{
                            data: [8, 32, 25, 10, 3],
                            backgroundColor: [
                                '#ffcc00', // Gold - primary color
                                '#e6e6e6', // Silver
                                '#cd7f32', // Bronze
                                '#b87333', // Copper
                                '#aaa9ad'  // Billon
                            ],
                            borderColor: 'rgba(26, 26, 26, 0.8)',
                            borderWidth: 2,
                            hoverOffset: 8
                        }]
                    },
                    options: materialOptions
                });
                
                // Add animation effect
                DOM.materialChart.style.opacity = 0;
                setTimeout(() => {
                    DOM.materialChart.style.transition = 'opacity 1s ease';
                    DOM.materialChart.style.opacity = 1;
                }, 600); // Staggered timing
            } else if (DOM.materialChart) {
                console.error('Material chart element is not a canvas element');
                showErrorMessage('Chart rendering failed. Please try refreshing the page.');
            }
        } catch (error) {
            console.error('Error setting up charts:', error);
            showErrorMessage('Failed to load charts. Please try refreshing the page.');
        }
    }
    /**
     * Setup event listeners for interactive elements with improved handling
     */
    function setupEventListeners() {
        try {
            // Use event delegation for navigation menu
            const sidebarNav = document.querySelector('.sidebar-nav ul');
            if (sidebarNav) {
                sidebarNav.addEventListener('click', handleNavigation);
            }
            
            // Edit profile button handler
            if (DOM.editProfileBtn) {
                DOM.editProfileBtn.addEventListener('click', handleEditProfile);
            }
            
            // Change avatar button handler
            if (DOM.changeAvatarBtn) {
                DOM.changeAvatarBtn.addEventListener('click', handleAvatarChange);
            }
            
            // Notifications button handler
            if (DOM.notificationsBtn) {
                DOM.notificationsBtn.addEventListener('click', handleNotifications);
            }
            
            // Add window resize handler with debounce
            window.addEventListener('resize', debounce(handleWindowResize, 250));
            
            // Handle hash change events for navigation
            window.addEventListener('hashchange', updateActiveSection);
            
            // Setup responsive behavior for mobile
            setupResponsiveBehavior();
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }
    
    /**
     * Handle navigation clicks with event delegation
     * @param {Event} event - Click event
     */
    function handleNavigation(event) {
        // Find closest anchor element
        const link = event.target.closest('a');
        
        if (link && link.getAttribute('href').startsWith('#')) {
            event.preventDefault();
            
            const sectionId = link.getAttribute('href').substring(1);
            
            // Update URL hash without triggering scroll
            history.pushState(null, null, `#${sectionId}`);
            
            // Update UI
            updateActiveSection();
            
            // Add page transition effect
            const contentSections = document.querySelectorAll('section');
            contentSections.forEach(section => {
                section.style.opacity = 0;
                section.style.transform = 'translateY(20px)';
            });
            
            setTimeout(() => {
                contentSections.forEach(section => {
                    section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    section.style.opacity = 1;
                    section.style.transform = 'translateY(0)';
                });
            }, 100);
        }
    }
    
    /**
     * Handle edit profile button click
     */
    function handleEditProfile() {
        showModalDialog({
            title: 'Edit Profile',
            content: `
                <div class="edit-profile-form">
                    <div class="form-group">
                        <label for="edit-display-name">Display Name</label>
                        <input type="text" id="edit-display-name" value="Roman Coin Enthusiast">
                    </div>
                    <div class="form-group">
                        <label for="edit-location">Location</label>
                        <input type="text" id="edit-location" value="London, England">
                    </div>
                    <div class="form-group">
                        <label for="edit-specialization">Specialization</label>
                        <select id="edit-specialization">
                            <option value="republican" selected>Republican Era</option>
                            <option value="early-empire">Early Empire</option>
                            <option value="high-empire">High Empire</option>
                            <option value="late-empire">Late Empire</option>
                            <option value="byzantine">Byzantine</option>
                        </select>
                    </div>
                </div>
            `,
            confirmText: 'Save Changes',
            cancelText: 'Cancel',
            onConfirm: () => {
                // In production, would send updated data to server
                showToast('Profile updated successfully!', 'success');
                
                // Update display name with animation
                const newName = document.getElementById('edit-display-name').value;
                updateElementWithAnimation(DOM.profileDisplayName, newName);
                
                // Update location with animation
                const newLocation = document.getElementById('edit-location').value;
                updateElementWithAnimation(DOM.profileLocation, newLocation);
                
                // Update specialization with animation
                const specializationSelect = document.getElementById('edit-specialization');
                const newSpecialization = specializationSelect.options[specializationSelect.selectedIndex].text;
                updateElementWithAnimation(DOM.profileSpecialization, newSpecialization);
            }
        });
    }
    
    /**
     * Handle avatar change button click
     */
    function handleAvatarChange() {
        showModalDialog({
            title: 'Change Profile Picture',
            content: `
                <div class="avatar-upload-form">
                    <div class="avatar-preview">
                        <img src="${DOM.avatars[0].src}" alt="Current Avatar">
                    </div>
                    <div class="upload-actions">
                        <p>Select a new profile picture to upload</p>
                        <button class="btn-select-file"><i class="fas fa-upload"></i> Choose File</button>
                        <p class="file-note">Maximum size: 2MB. Formats: JPG, PNG</p>
                    </div>
                </div>
            `,
            confirmText: 'Upload',
            cancelText: 'Cancel',
            onConfirm: () => {
                // In production, would upload file to server
                showToast('Profile picture updated successfully!', 'success');
            }
        });
        
        // In a real implementation, you would handle file selection and preview here
        const selectButton = document.querySelector('.btn-select-file');
        if (selectButton) {
            selectButton.addEventListener('click', () => {
                // Simulate file selection (in production, would open real file dialog)
                showToast('File selection dialog would open here', 'info');
            });
        }
    }
    
    /**
     * Handle notifications button click
     */
    function handleNotifications() {
        // Check if panel already exists
        const existingPanel = document.querySelector('.notifications-panel');
        if (existingPanel) {
            existingPanel.classList.remove('active');
            setTimeout(() => {
                existingPanel.remove();
            }, 300);
            return;
        }
        
        // Use a persistent notifications array (create if it doesn't exist)
        if (!window.domusNotifications) {
            // Initialize with default notifications
            window.domusNotifications = [
                {
                    icon: 'fas fa-coins',
                    title: 'New Auction Alert',
                    message: 'A Republican Denarius matching your wishlist is now available',
                    time: '2 hours ago',
                    read: false
                },
                {
                    icon: 'fas fa-star',
                    title: 'Collection Milestone',
                    message: 'Congratulations! You\'ve reached 75+ coins in your collection',
                    time: '1 day ago',
                    read: false
                },
                {
                    icon: 'fas fa-book',
                    title: 'New Research Available',
                    message: 'New article published on Republican minting techniques',
                    time: '3 days ago',
                    read: false
                },
                {
                    icon: 'fas fa-calendar',
                    title: 'Event Reminder',
                    message: 'Virtual coin exhibition starts tomorrow',
                    time: '5 days ago',
                    read: false
                }
            ];
        }
        
        const notificationsPanel = document.createElement('div');
        notificationsPanel.className = 'notifications-panel';
        
        // Create header HTML
        let panelHTML = `
            <div class="notifications-header">
                <h3><i class="fas fa-bell"></i> Notifications</h3>
                <button class="close-notifications"><i class="fas fa-times"></i></button>
            </div>
            <div class="notifications-list">
        `;
        
        // Generate notifications based on the persistent state
        window.domusNotifications.forEach((notification, index) => {
            panelHTML += `
                <div class="notification-item${notification.read ? '' : ' unread'}" data-index="${index}">
                    <div class="notification-icon"><i class="${notification.icon}"></i></div>
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <span class="notification-time">${notification.time}</span>
                    </div>
                </div>
            `;
        });
        
        // Add footer HTML
        panelHTML += `
            </div>
            <div class="notifications-footer">
                <button class="btn-mark-all-read">Mark all as read</button>
                <a href="#notifications" class="view-all-link">View all notifications</a>
            </div>
        `;
        
        notificationsPanel.innerHTML = panelHTML;
        document.body.appendChild(notificationsPanel);
        
        // Animation for panel entrance
        setTimeout(() => {
            notificationsPanel.classList.add('active');
        }, 10);
        
        // Update notification badge count
        updateNotificationBadge();
        
        // Close button functionality
        const closeButton = notificationsPanel.querySelector('.close-notifications');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeNotificationsPanel(notificationsPanel);
            });
        }
        
        // Mark all as read functionality
        const markAllReadButton = notificationsPanel.querySelector('.btn-mark-all-read');
        if (markAllReadButton) {
            markAllReadButton.addEventListener('click', () => {
                const unreadItems = notificationsPanel.querySelectorAll('.notification-item.unread');
                unreadItems.forEach(item => {
                    const index = parseInt(item.getAttribute('data-index'));
                    if (!isNaN(index) && window.domusNotifications[index]) {
                        window.domusNotifications[index].read = true;
                    }
                    item.classList.remove('unread');
                });
                updateNotificationBadge();
                showToast('All notifications marked as read', 'success');
            });
        }
        
        // Add click handler for individual notifications
        const notificationItems = notificationsPanel.querySelectorAll('.notification-item');
        notificationItems.forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('unread')) {
                    const index = parseInt(item.getAttribute('data-index'));
                    if (!isNaN(index) && window.domusNotifications[index]) {
                        window.domusNotifications[index].read = true;
                    }
                    item.classList.remove('unread');
                    updateNotificationBadge();
                }
            });
        });
        
        // Close panel when clicking outside of it
        // Use setTimeout to avoid immediate closing when clicking the notifications button
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 10);
        
        function handleOutsideClick(event) {
            // Check if click is outside panel and not on the notifications button
            if (!notificationsPanel.contains(event.target) && 
                !DOM.notificationsBtn.contains(event.target)) {
                closeNotificationsPanel(notificationsPanel);
                document.removeEventListener('click', handleOutsideClick);
            }
        }
    }

    /**
     * Close the notifications panel with animation
     * @param {HTMLElement} panel - The notifications panel element
     */
    function closeNotificationsPanel(panel) {
        panel.classList.remove('active');
        setTimeout(() => {
            panel.remove();
        }, 300);
    }

    /**
     * Update notification badge count
     */
    function updateNotificationBadge() {
        // Count unread notifications from persistent storage
        const unreadCount = window.domusNotifications ? 
            window.domusNotifications.filter(n => !n.read).length : 0;
        
        // Get or create notification badge
        let badge = document.querySelector('.notification-badge');
        
        if (!badge && DOM.notificationsBtn) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            DOM.notificationsBtn.appendChild(badge);
        }
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
        
        /**
         * Handle window resize event
         */
        function handleWindowResize() {
            // Resize charts if they exist
            if (charts.era) {
                charts.era.resize();
            }
            if (charts.material) {
                charts.material.resize();
            }
        }
        
        /**
         * Update active section based on URL hash
         */
        function updateActiveSection() {
            const hash = location.hash || '#overview';
            const targetSection = hash.substring(1);
            
            // Update navigation active state
            DOM.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === hash) {
                    link.classList.add('active');
                }
            });
            
            // Update page title
            const activeLink = document.querySelector(`.sidebar-nav a[href="${hash}"]`);
            if (activeLink) {
                DOM.headerTitle.textContent = activeLink.textContent;
            }
            
            // Show active section, hide others
            document.querySelectorAll('main > section').forEach(section => {
                if (section.id === targetSection) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        }
        
        /**
         * Setup responsive behavior for mobile devices
         */
        function setupResponsiveBehavior() {
            const menuToggle = document.querySelector('.menu-toggle');
            if (menuToggle) {
                menuToggle.addEventListener('click', () => {
                    document.body.classList.toggle('sidebar-open');
                });
            }
        }
        
        /**
         * Format date string to readable format
         * @param {string} dateString - ISO date string
         * @returns {string} Formatted date
         */
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }
        
        /**
         * Debounce function to limit rapid function calls
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in ms
         * @returns {Function} Debounced function
         */
        function debounce(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    func.apply(context, args);
                }, wait);
            };
        }
        
        /**
         * Show modal dialog
         * @param {Object} options - Dialog options
         */
        function showModalDialog(options) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>${options.title}</h3>
                        <button class="modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-content">
                        ${options.content}
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel">${options.cancelText || 'Cancel'}</button>
                        <button class="btn-confirm">${options.confirmText || 'Confirm'}</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
            
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeModal());
            }
            
            const cancelBtn = modal.querySelector('.btn-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => closeModal());
            }
            
            const confirmBtn = modal.querySelector('.btn-confirm');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    if (typeof options.onConfirm === 'function') {
                        options.onConfirm();
                    }
                    closeModal();
                });
            }
            
            function closeModal() {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.remove();
                    document.body.style.overflow = '';
                }, 300);
            }
        }
        
        /**
         * Show toast notification
         * @param {string} message - Toast message
         * @param {string} type - Toast type (success, error, info)
         */
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icons = {
                success: '<i class="fas fa-check-circle"></i>',
                error: '<i class="fas fa-exclamation-circle"></i>',
                info: '<i class="fas fa-info-circle"></i>'
            };
            
            toast.innerHTML = `
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-content">${message}</div>
            `;
            
            if (!document.querySelector('.toast-container')) {
                const container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
            
            document.querySelector('.toast-container').appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('active');
                
                // Auto-remove toast after 4 seconds
                setTimeout(() => {
                    toast.classList.remove('active');
                    setTimeout(() => {
                        toast.remove();
                        const container = document.querySelector('.toast-container');
                        if (container && !container.hasChildNodes()) {
                            container.remove();
                        }
                    }, 300);
                }, 4000);
            }, 10);
        }
        
                // Initialize application when DOM is ready
                document.addEventListener('DOMContentLoaded', function() {
                    // Check if Chart.js is loaded - if not, load it dynamically
                    if (typeof Chart === 'undefined') {
                        console.log('Loading Chart.js dynamically...');
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
                        script.integrity = 'sha256-+8RZJua0aEWg+QVVKg4LEzETdBQ1KdPxJUZ4YLe9pso=';
                        script.crossOrigin = 'anonymous';
                        script.onload = function() {
                            // Initialize app after Chart.js loads
                            DomusApp.init();
                        };
                        document.head.appendChild(script);
                    } else {
                        DomusApp.init();
                    }
                });
                
            // Expose public methods
            return {
                init: init
            };
        })(); // End of IIFE