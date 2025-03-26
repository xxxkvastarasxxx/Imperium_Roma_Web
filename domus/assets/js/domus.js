/**
 * Domus Dashboard Application
 * Backend-integrated version with full UI support
 */

const DomusApp = (function() {
    'use strict';
    
    // App configuration
    const CONFIG = {
        apiEndpoint: '/api/v1',
        animationDuration: 300,
        chartColors: {
            eras: ['#ffcc00', '#e6b800', '#ccaa00', '#b39500', '#997f00'],
            materials: ['#ffcc00', '#e6e6e6', '#cd7f32', '#b87333', '#aaa9ad']
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
    
    // Data storage
    let appData = {
        user: null,
        stats: null,
        recentAcquisitions: null,
        notifications: null,
        eraDistribution: null,
        materialDistribution: null
    };
    
    /**
     * Initialize the application
     */
    function init() {
        console.log('Initializing Domus application...');
        
        try {
            // Check if server injected initial data
            checkServerData();
            
            // Cache DOM elements
            cacheDOM();
            
            // Show loading state if not using SSR
            if (!appData.user) {
                showLoadingState();
            }
            
            // Initialize functionality
            loadData()
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
     * Check if server included initial data in the page
     */
    function checkServerData() {
        if (window.domusInitialData) {
            appData = {
                ...appData,
                ...window.domusInitialData
            };
            
            console.log('Server-provided initial data detected');
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
        DOM.searchInput = document.querySelector('.search-box input');
        DOM.searchButton = document.querySelector('.search-box button');
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
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
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
     * Load all required data from backend
     */
    async function loadData() {
        try {
            // If we already have data from server-side rendering, use it
            if (appData.user && appData.stats) {
                // Update UI with existing data
                updateUIWithUserData(appData.user);
                updateUIWithStats(appData.stats);
                if (appData.recentAcquisitions) {
                    renderRecentAcquisitions(appData.recentAcquisitions);
                }
                if (appData.notifications) {
                    window.domusNotifications = appData.notifications;
                    updateNotificationBadge();
                }
                
                // No need for additional fetching
                return;
            }
            
            // Otherwise, fetch data from backend APIs
            await Promise.all([
                loadUserData(),
                loadDashboardStats(),
                loadRecentAcquisitions(),
                loadNotifications()
            ]);
            
        } catch (error) {
            console.error('Error loading data:', error);
            throw new Error('Failed to load required data');
        }
    }
    
    /**
     * Load and display user data
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async function loadUserData() {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/user/profile`);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const userData = await response.json();
            appData.user = userData;
            
            updateUIWithUserData(userData);
            return userData;
            
        } catch (error) {
            console.error('Failed to load user data:', error);
            
            // Fallback to mock data in development
            if (isDevelopment()) {
                console.warn('Using mock user data');
                const mockUserData = getMockUserData();
                appData.user = mockUserData;
                updateUIWithUserData(mockUserData);
                return mockUserData;
            } else {
                throw error;
            }
        }
    }
    
    /**
     * Update UI with user data
     * @param {Object} userData - User data object
     */
    function updateUIWithUserData(userData) {
        // Update basic user information with animation
        updateElementWithAnimation(DOM.userNickname, userData.nickname);
        updateElementWithAnimation(DOM.username, userData.nickname);
        updateElementWithAnimation(DOM.userRank, userData.rank);
        
        updateElementWithAnimation(DOM.profileNickname, userData.nickname);
        updateElementWithAnimation(DOM.profileTitle, userData.title);
        updateElementWithAnimation(DOM.profileJoinDate, `Member since: ${userData.joinDate}`);
        updateElementWithAnimation(DOM.profileDisplayName, userData.displayName);
        updateElementWithAnimation(DOM.profileEmail, userData.email);
        updateElementWithAnimation(DOM.profileLocation, userData.location);
        
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
    }
    
    /**
     * Load dashboard statistics
     * @returns {Promise} Promise that resolves with dashboard stats
     */
    async function loadDashboardStats() {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/dashboard/stats`);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const stats = await response.json();
            appData.stats = stats;
            
            updateUIWithStats(stats);
            return stats;
            
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            
            // Fallback to mock data in development
            if (isDevelopment()) {
                console.warn('Using mock stats data');
                const mockStats = getMockStatsData();
                appData.stats = mockStats;
                updateUIWithStats(mockStats);
                return mockStats;
            } else {
                throw error;
            }
        }
    }
    
    /**
     * Update UI with stats data
     * @param {Object} stats - Stats data object
     */
    function updateUIWithStats(stats) {
        // Update collection statistics with counter animation
        animateCounter(DOM.totalCoins, 0, stats.totalCoins, 1500);
        updateElementWithAnimation(DOM.collectionValue, stats.collectionValue);
        updateElementWithAnimation(DOM.rarestItem, stats.rarestItem);
        updateElementWithAnimation(DOM.oldestCoin, stats.oldestCoin);
        updateElementWithAnimation(DOM.profileCollectionSize, stats.collectionSize);
        updateElementWithAnimation(DOM.profileSpecialization, stats.specialization);
        
        // Update completion progress bar with animation
        animateProgressBar(DOM.completionProgress, stats.completionRate);
        
        // Save chart data for later
        appData.eraDistribution = stats.eraDistribution;
        appData.materialDistribution = stats.materialDistribution;
    }
    
    /**
     * Load recent acquisitions data
     * @returns {Promise} Promise that resolves with acquisitions data
     */
    async function loadRecentAcquisitions() {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/acquisitions/recent`);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const acquisitions = await response.json();
            appData.recentAcquisitions = acquisitions;
            
            renderRecentAcquisitions(acquisitions);
            return acquisitions;
            
        } catch (error) {
            console.error('Failed to load acquisitions:', error);
            
            // Fallback to mock data in development
            if (isDevelopment()) {
                console.warn('Using mock acquisitions data');
                const mockAcquisitions = getMockAcquisitionsData();
                appData.recentAcquisitions = mockAcquisitions;
                renderRecentAcquisitions(mockAcquisitions);
                return mockAcquisitions;
            } else {
                throw error;
            }
        }
    }
    
    /**
     * Load notifications data
     * @returns {Promise} Promise that resolves with notifications data
     */
    async function loadNotifications() {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/notifications`);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const notifications = await response.json();
            appData.notifications = notifications;
            
            // Store in global var for the notifications panel
            window.domusNotifications = notifications;
            
            // Update notification badge
            updateNotificationBadge();
            
            return notifications;
            
        } catch (error) {
            console.error('Failed to load notifications:', error);
            
            // Fallback to mock data in development
            if (isDevelopment()) {
                console.warn('Using mock notifications data');
                const mockNotifications = getMockNotificationsData();
                appData.notifications = mockNotifications;
                window.domusNotifications = mockNotifications;
                updateNotificationBadge();
                return mockNotifications;
            } else {
                throw error;
            }
        }
    }
    
    /**
     * Render recent acquisitions to the DOM
     * @param {Array} acquisitions - Array of acquisition objects
     */
    function renderRecentAcquisitions(acquisitions) {
        if (!DOM.acquisitionsTable) return;
        
        // Clear existing content
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
                        labels: appData.eraDistribution.map(item => item.name),
                        datasets: [{
                            data: appData.eraDistribution.map(item => item.count),
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
                        labels: appData.materialDistribution.map(item => item.name),
                        datasets: [{
                            data: appData.materialDistribution.map(item => item.count),
                            backgroundColor: CONFIG.chartColors.materials,
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
            
            // Search functionality
            if (DOM.searchInput && DOM.searchButton) {
                DOM.searchButton.addEventListener('click', handleSearch);
                DOM.searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        handleSearch();
                    }
                });
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
     * Handle search functionality
     */
    function handleSearch() {
        const searchQuery = DOM.searchInput.value.trim();
        
        if (!searchQuery) return;
        
        // Redirect to collection page with search query
        window.location.href = `/domus/collection/?q=${encodeURIComponent(searchQuery)}`;
    }
    
    /**
     * Handle edit profile button click
     */
    async function handleEditProfile() {
        showModalDialog({
            title: 'Edit Profile',
            content: `
                <div class="edit-profile-form">
                    <div class="form-group">
                        <label for="edit-display-name">Display Name</label>
                        <input type="text" id="edit-display-name" value="${appData.user.displayName}">
                    </div>
                    <div class="form-group">
                        <label for="edit-location">Location</label>
                        <input type="text" id="edit-location" value="${appData.user.location}">
                    </div>
                    <div class="form-group">
                        <label for="edit-specialization">Specialization</label>
                        <select id="edit-specialization">
                            <option value="republican" ${appData.user.specialization === 'Republican Era' ? 'selected' : ''}>Republican Era</option>
                            <option value="early-empire" ${appData.user.specialization === 'Early Empire' ? 'selected' : ''}>Early Empire</option>
                            <option value="high-empire" ${appData.user.specialization === 'High Empire' ? 'selected' : ''}>High Empire</option>
                            <option value="late-empire" ${appData.user.specialization === 'Late Empire' ? 'selected' : ''}>Late Empire</option>
                            <option value="byzantine" ${appData.user.specialization === 'Byzantine' ? 'selected' : ''}>Byzantine</option>
                        </select>
                    </div>
                </div>
            `,
            confirmText: 'Save Changes',
            cancelText: 'Cancel',
            onConfirm: async () => {
                const displayName = document.getElementById('edit-display-name').value;
                const location = document.getElementById('edit-location').value;
                const specializationSelect = document.getElementById('edit-specialization');
                const specializationValue = specializationSelect.value;
                const specializationText = specializationSelect.options[specializationSelect.selectedIndex].text;
                
                try {
                    // Show loading toast
                    showToast('Saving changes...', 'info');
                    
                    // Send update to API
                    const response = await fetch(`${CONFIG.apiEndpoint}/user/profile`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            displayName,
                            location,
                            specialization: specializationValue
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to update profile');
                    }
                    
                    // Update local data
                    appData.user.displayName = displayName;
                    appData.user.location = location;
                    appData.user.specialization = specializationText;
                    
                    // Update UI
                    updateElementWithAnimation(DOM.profileDisplayName, displayName);
                    updateElementWithAnimation(DOM.profileLocation, location);
                    updateElementWithAnimation(DOM.profileSpecialization, specializationText);
                    
                    showToast('Profile updated successfully!', 'success');
                    
                } catch (error) {
                    console.error('Error updating profile:', error);
                    showToast('Failed to update profile. Please try again.', 'error');
                }
            }
        });
    }
    
    /**
     * Handle avatar change button click
     */
    function handleAvatarChange() {
        // Create a hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Trigger the file selection dialog
        fileInput.click();
        
        // Handle file selection
        fileInput.addEventListener('change', async () => {
            if (fileInput.files && fileInput.files[0]) {
                try {
                    // Show preview dialog
                    showModalDialog({
                        title: 'Upload Profile Picture',
                        content: `
                            <div class="avatar-upload-form">
                                <div class="avatar-preview">
                                    <img src="${URL.createObjectURL(fileInput.files[0])}" alt="New Avatar Preview">
                                </div>
                                <div class="upload-actions">
                                    <p>Click "Upload" to use this as your new profile picture</p>
                                    <p class="file-note">Maximum size: 2MB. Formats: JPG, PNG</p>
                                </div>
                            </div>
                        `,
                        confirmText: 'Upload',
                        cancelText: 'Cancel',
                        onConfirm: async () => {
                            try {
                                showToast('Uploading profile picture...', 'info');
                                
                                // Create form data
                                const formData = new FormData();
                                formData.append('avatar', fileInput.files[0]);
                                
                                // Upload to server
                                const response = await fetch(`${CONFIG.apiEndpoint}/user/avatar`, {
                                    method: 'POST',
                                    body: formData
                                });
                                
                                if (!response.ok) {
                                    throw new Error('Failed to upload avatar');
                                }
                                
                                const result = await response.json();
                                
                                // Update avatar in UI
                                DOM.avatars.forEach(el => {
                                    el.src = result.avatarUrl;
                                    fadeIn(el, 500);
                                });
                                
                                // Update local data
                                appData.user.avatar = result.avatarUrl;
                                
                                showToast('Profile picture updated successfully!', 'success');
                                
                            } catch (error) {
                                console.error('Error uploading avatar:', error);
                                showToast('Failed to upload profile picture. Please try again.', 'error');
                            }
                        }
                    });
                    
                } catch (error) {
                    console.error('Error handling avatar:', error);
                    showToast('Error processing image. Please try a different file.', 'error');
                }
            }
            
            // Clean up
            document.body.removeChild(fileInput);
        });
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
        
        // Use notifications from app data
        const notifications = window.domusNotifications || [];
        
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
        
        // Check if there are notifications
        if (notifications.length === 0) {
            panelHTML += `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
        } else {
            // Generate notifications
            notifications.forEach((notification, index) => {
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
        }
        
        // Add footer HTML
        panelHTML += `
            </div>
            <div class="notifications-footer">
                <button class="btn-mark-all-read" ${notifications.length === 0 ? 'disabled' : ''}>Mark all as read</button>
                <a href="#notifications" class="view-all-link">View all notifications</a>
            </div>
        `;
        
        notificationsPanel.innerHTML = panelHTML;
        document.body.appendChild(notificationsPanel);
        
        // Animation for panel entrance
        setTimeout(() => {
            notificationsPanel.classList.add('active');
        }, 10);
        
        // Close button functionality
        const closeButton = notificationsPanel.querySelector('.close-notifications');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeNotificationsPanel(notificationsPanel);
            });
        }
        
        // Mark all as read functionality
        const markAllReadButton = notificationsPanel.querySelector('.btn-mark-all-read');
        if (markAllReadButton && !markAllReadButton.disabled) {
            markAllReadButton.addEventListener('click', async () => {
                try {
                    // Update on server
                    const response = await fetch(`${CONFIG.apiEndpoint}/notifications/read-all`, {
                        method: 'POST'
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to mark notifications as read');
                    }
                    
                    // Update UI
                    const unreadItems = notificationsPanel.querySelectorAll('.notification-item.unread');
                    unreadItems.forEach(item => {
                        const index = parseInt(item.getAttribute('data-index'));
                        if (!isNaN(index) && window.domusNotifications[index]) {
                            window.domusNotifications[index].read = true;
                        }
                        item.classList.remove('unread');
                    });
                    
                    // Update badge
                    updateNotificationBadge();
                    
                    showToast('All notifications marked as read', 'success');
                    
                } catch (error) {
                    console.error('Error marking notifications as read:', error);
                    showToast('Failed to mark notifications as read', 'error');
                }
            });
        }
        
        // Add click handler for individual notifications
        const notificationItems = notificationsPanel.querySelectorAll('.notification-item');
        notificationItems.forEach(item => {
            item.addEventListener('click', async () => {
                if (item.classList.contains('unread')) {
                    try {
                        const index = parseInt(item.getAttribute('data-index'));
                        if (isNaN(index) || !window.domusNotifications[index]) return;
                        
                        // Update on server
                        const response = await fetch(`${CONFIG.apiEndpoint}/notifications/${window.domusNotifications[index].id}/read`, {
                            method: 'POST'
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to mark notification as read');
                        }
                        
                        // Update local state
                        window.domusNotifications[index].read = true;
                        item.classList.remove('unread');
                        
                        // Update badge
                        updateNotificationBadge();
                        
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
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
        const hash = location.hash || '#dashboard';
        const targetSection = hash.substring(1);
        
        // Update navigation active state
        DOM.navLinks.forEach(link => {
            const parent = link.parentElement;
            if (parent) {
                if (link.getAttribute('href') === hash) {
                    parent.classList.add('active');
                } else {
                    parent.classList.remove('active');
                }
            }
        });
        
        // Update page title
        const activeLink = document.querySelector(`.sidebar-nav a[href="${hash}"]`);
        if (activeLink && DOM.headerTitle) {
            DOM.headerTitle.textContent = activeLink.textContent.trim();
        }
    }
    
    /**
     * Setup responsive behavior for mobile devices
     */
    function setupResponsiveBehavior() {
        // Create mobile toggle button if it doesn't exist
        if (!document.querySelector('.mobile-toggle') && window.innerWidth <= 768) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-toggle';
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.appendChild(mobileToggle);
            
            mobileToggle.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-open');
                
                // Toggle icon between bars and times
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    if (icon.classList.contains('fa-bars')) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    } else {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
            
            // Close sidebar when clicking on main content in mobile view
            DOM.mainContent.addEventListener('click', () => {
                if (document.body.classList.contains('sidebar-open')) {
                    document.body.classList.remove('sidebar-open');
                    
                    const icon = mobileToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
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
    
    /**
     * Check if running in development environment
     * @returns {boolean} True if in development environment
     */
    function isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }
    
    /**
     * Get mock user data for development
     * @returns {Object} Mock user data
     */
    function getMockUserData() {
        return {
            nickname: "xxxkvastarasxxx",
            rank: "Aureus Collector",
            title: "Senior Numismatist",
            displayName: "Roman Coin Enthusiast",
            email: "kvastaras@example.com",
            location: "London, England",
            joinDate: "January 2024",
            specialization: "Republican Era", 
            avatar: "/assets/images/team/Taras-Tymoshenko.jpg",
            preferences: {
                language: "English",
                currency: "GBP (£)",
                theme: "Dark Mode"
            }
        };
    }
    
    /**
     * Get mock stats data for development
     * @returns {Object} Mock stats data
     */
    function getMockStatsData() {
        return {
            totalCoins: 78,
            collectionValue: "14,250 €",
            rarestItem: "Brutus Aureus (42 BC)",
            oldestCoin: "Roman Republic Didrachm (280 BC)",
            collectionSize: "78 coins",
            specialization: "Republican Era",
            completionRate: 65,
            eraDistribution: [
                { name: "Republican", count: 20 },
                { name: "Early Empire", count: 35 },
                { name: "High Empire", count: 15 },
                { name: "Late Empire", count: 18 },
                { name: "Byzantine", count: 12 }
            ],
            materialDistribution: [
                { name: "Gold", count: 8 },
                { name: "Silver", count: 32 },
                { name: "Bronze", count: 25 },
                { name: "Copper", count: 10 },
                { name: "Billon", count: 3 }
            ]
        };
    }
    
    /**
     * Get mock acquisitions data for development
     * @returns {Array} Mock acquisitions data
     */
    function getMockAcquisitionsData() {
        return [
            {
                id: "acq-001",
                image: "/assets/images/FeaturedCoinsOTD/08.07.24.1.1.jpg",
                name: "Denarius",
                emperor: "Julius Caesar",
                period: "49-44 BCE",
                acquired: "2025-03-15",
                value: "980 €"
            },
            {
                id: "acq-002",
                image: "/assets/images/FeaturedCoinsOTD/08.07.24.2.1.jpg",
                name: "Aureus",
                emperor: "Augustus",
                period: "27 BCE - 14 CE",
                acquired: "2025-02-28",
                value: "3,500 €"
            },
            {
                id: "acq-003",
                image: "/assets/images/FeaturedCoinsOTD/08.07.24.3.1.jpg",
                name: "Sestertius",
                emperor: "Nero",
                period: "54-68 CE",
                acquired: "2025-01-20",
                value: "750 €"
            }
        ];
    }
    
    /**
     * Get mock notifications data for development
     * @returns {Array} Mock notifications data
     */
    function getMockNotificationsData() {
        return [
            {
                id: "notif-001",
                icon: 'fas fa-coins',
                title: 'New Auction Alert',
                message: 'A Republican Denarius matching your wishlist is now available',
                time: '2 hours ago',
                read: false
            },
            {
                id: "notif-002",
                icon: 'fas fa-star',
                title: 'Collection Milestone',
                message: 'Congratulations! You\'ve reached 75+ coins in your collection',
                time: '1 day ago',
                read: false
            },
            {
                id: "notif-003",
                icon: 'fas fa-book',
                title: 'New Research Available',
                message: 'New article published on Republican minting techniques',
                time: '3 days ago',
                read: false
            },
            {
                id: "notif-004",
                icon: 'fas fa-calendar',
                title: 'Event Reminder',
                message: 'Virtual coin exhibition starts tomorrow',
                time: '5 days ago',
                read: false
            }
        ];
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
})();