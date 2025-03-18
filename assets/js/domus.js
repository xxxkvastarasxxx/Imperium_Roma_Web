/**
 * domus.js - JavaScript for Roman Numismatic Personal Cabinet
 * 
 * This script manages user data, chart rendering, and interaction
 * for the Domus (personal cabinet) page.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dashboard
    loadUserData();
    setupCharts();
    setupEventListeners();
    
    // Update UI based on current section
    updateActiveSection();
});

/**
 * Load and display user data
 * In production, this would fetch data from your backend API
 */
function loadUserData() {
    // Mock user data (replace with API calls in production)
    const userData = {
        nickname: "xxxkvastarasxxx",
        rank: "Aureus Collector",
        title: "Senior Numismatist",
        displayName: "Roman Coin Enthusiast",
        email: "kvastaras@example.com",
        location: "Athens, Greece",
        joinDate: "January 2024",
        avatar: "default-avatar.jpg", // Replace with actual user avatar path
        
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
            currency: "EUR (€)",
            theme: "Light Mode"
        }
    };
    
    // Update user information throughout the UI
    document.getElementById('user-nickname').textContent = userData.nickname;
    document.getElementById('header-username').textContent = userData.nickname;
    document.getElementById('user-rank').textContent = userData.rank;
    
    document.getElementById('profile-nickname').textContent = userData.nickname;
    document.getElementById('profile-title').textContent = userData.title;
    document.getElementById('profile-join-date').textContent = `Member since: ${userData.joinDate}`;
    document.getElementById('profile-display-name').textContent = userData.displayName;
    document.getElementById('profile-email').textContent = userData.email;
    document.getElementById('profile-location').textContent = userData.location;
    
    // Update collection statistics
    document.getElementById('total-coins').textContent = userData.stats.totalCoins;
    document.getElementById('collection-value').textContent = userData.stats.collectionValue;
    document.getElementById('rarest-item').textContent = userData.stats.rarestItem;
    document.getElementById('oldest-coin').textContent = userData.stats.oldestCoin;
    document.getElementById('profile-collection-size').textContent = userData.stats.collectionSize;
    document.getElementById('profile-specialization').textContent = userData.stats.specialization;
    
    // Update completion progress bar
    const progressElement = document.querySelector('.completion-progress');
    progressElement.style.width = `${userData.stats.completionRate}%`;
    progressElement.textContent = `${userData.stats.completionRate}%`;
    
    // Update preferences
    document.getElementById('profile-language').textContent = userData.preferences.language;
    document.getElementById('profile-currency').textContent = userData.preferences.currency;
    document.getElementById('profile-theme').textContent = userData.preferences.theme;
    
    // Update avatars
    const avatarElements = document.querySelectorAll('#user-avatar-small, #user-avatar-large');
    avatarElements.forEach(el => {
        el.src = userData.avatar;
        el.alt = `${userData.nickname}'s Avatar`;
    });
    
    // Load recent acquisitions
    loadRecentAcquisitions();
}

/**
 * Load recent acquisitions data
 * In production, this would come from your backend API
 */
function loadRecentAcquisitions() {
    // Mock acquisitions data (replace with API call in production)
    const acquisitions = [
        {
            image: "coin-denarius.jpg",
            name: "Denarius",
            emperor: "Julius Caesar",
            period: "49-44 BCE",
            acquired: "2025-03-15",
            value: "980 €"
        },
        {
            image: "coin-aureus.jpg",
            name: "Aureus",
            emperor: "Augustus",
            period: "27 BCE - 14 CE",
            acquired: "2025-02-28",
            value: "3,500 €"
        },
        {
            image: "coin-sestertius.jpg",
            name: "Sestertius",
            emperor: "Nero",
            period: "54-68 CE",
            acquired: "2025-01-20",
            value: "750 €"
        }
    ];
    
    const tableBody = document.getElementById('recent-acquisitions-body');
    tableBody.innerHTML = ''; // Clear existing content
    
    // Add acquisition rows
    acquisitions.forEach(coin => {
        const row = document.createElement('tr');
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
        tableBody.appendChild(row);
    });
}

/**
 * Setup charts using Chart.js
 */
function setupCharts() {
    // Remove loading placeholders
    document.querySelectorAll('.chart-placeholder').forEach(placeholder => {
        placeholder.remove();
    });
    
    // Era distribution chart
    const eraCtx = document.getElementById('era-chart').getContext('2d');
    const eraChart = new Chart(eraCtx, {
        type: 'pie',
        data: {
            labels: ['Republican', 'Early Empire', 'High Empire', 'Late Empire', 'Byzantine'],
            datasets: [{
                data: [20, 35, 15, 18, 12],
                backgroundColor: [
                    '#8B0000', // Roman Red
                    '#DAA520', // Gold
                    '#556B2F', // Olive Green
                    '#964B00', // Bronze
                    '#483D8B'  // Dark Blue
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Distribution by Time Period',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    // Material distribution chart
    const materialCtx = document.getElementById('material-chart').getContext('2d');
    const materialChart = new Chart(materialCtx, {
        type: 'doughnut',
        data: {
            labels: ['Gold', 'Silver', 'Bronze', 'Copper', 'Billon'],
            datasets: [{
                data: [8, 32, 25, 10, 3],
                backgroundColor: [
                    '#DAA520', // Gold
                    '#C0C0C0', // Silver
                    '#CD7F32', // Bronze
                    '#B87333', // Copper
                    '#AAA9AD'  // Billon
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Distribution by Material',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

/**
 * Setup event listeners for interactive elements
 */
function setupEventListeners() {
    // Navigation menu click handler
    const navLinks = document.querySelectorAll('.sidebar-nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default if it's a placeholder link
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                // Update active state
                document.querySelectorAll('.sidebar-nav ul li').forEach(item => {
                    item.classList.remove('active');
                });
                this.closest('li').classList.add('active');
                
                // Update header title
                const sectionTitle = this.textContent.trim();
                document.querySelector('.header-title h1').textContent = sectionTitle;
                
                // In a real app, you would load the appropriate section content here
                toggleSectionVisibility(this.getAttribute('href').substring(1));
            }
        });
    });
    
    // Edit profile button handler
    const editProfileBtn = document.querySelector('.btn-edit-profile');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            alert('Edit profile functionality would open here');
            // In production, this would open a modal or navigate to edit page
        });
    }
    
    // Change avatar button handler
    const changeAvatarBtn = document.querySelector('.btn-change-avatar');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            alert('Avatar upload functionality would open here');
            // In production, this would open a file picker dialog
        });
    }
    
    // Notifications button handler
    const notificationsBtn = document.querySelector('.btn-notifications');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', function() {
            alert('Notifications panel would open here');
            // In production, this would toggle a notifications dropdown
        });
    }
    
    // Handle responsive sidebar toggle (for mobile)
    setupResponsiveBehavior();
}

/**
 * Handle responsive behavior for mobile devices
 */
function setupResponsiveBehavior() {
    // Create a toggle button for mobile sidebar
    if (window.innerWidth <= 768) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.top = '15px';
        toggleBtn.style.left = '15px';
        toggleBtn.style.zIndex = '200';
        toggleBtn.style.background = 'var(--primary-color)';
        toggleBtn.style.color = 'white';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '5px';
        toggleBtn.style.width = '40px';
        toggleBtn.style.height = '40px';
        
        document.body.appendChild(toggleBtn);
        
        toggleBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.domus-sidebar');
            sidebar.classList.toggle('expanded');
            
            if (sidebar.classList.contains('expanded')) {
                sidebar.style.width = '250px';
                document.querySelector('.domus-content').style.marginLeft = '250px';
                document.querySelector('.domus-footer').style.marginLeft = '250px';
                
                // Show text elements
                document.querySelectorAll('.sidebar-header h2, .latin-subtitle, .user-quick-info, .sidebar-nav ul li a span, .sidebar-footer a span').forEach(el => {
                    el.style.display = 'block';
                });
            } else {
                sidebar.style.width = 'var(--sidebar-width)';
                document.querySelector('.domus-content').style.marginLeft = 'var(--sidebar-width)';
                document.querySelector('.domus-footer').style.marginLeft = 'var(--sidebar-width)';
                
                // Hide text elements
                document.querySelectorAll('.sidebar-header h2, .latin-subtitle, .user-quick-info, .sidebar-nav ul li a span, .sidebar-footer a span').forEach(el => {
                    el.style.display = 'none';
                });
                            }
                        });
                    }
                    
                    // Handle window resize events
                    window.addEventListener('resize', function() {
                        const sidebar = document.querySelector('.domus-sidebar');
                        
                        if (window.innerWidth > 768) {
                            // Reset sidebar to default state on larger screens
                            sidebar.style.width = 'var(--sidebar-width)';
                            document.querySelector('.domus-content').style.marginLeft = 'var(--sidebar-width)';
                            document.querySelector('.domus-footer').style.marginLeft = 'var(--sidebar-width)';
                            
                            // Hide text elements in collapsed state
                            document.querySelectorAll('.sidebar-header h2, .latin-subtitle, .user-quick-info, .sidebar-nav ul li a span, .sidebar-footer a span').forEach(el => {
                                el.style.display = 'none';
                            });
                            
                            // Remove expanded class if present
                            sidebar.classList.remove('expanded');
                        } else {
                            // Ensure mobile toggle button is visible
                            let toggleBtn = document.querySelector('.mobile-sidebar-toggle');
                            if (!toggleBtn) {
                                setupResponsiveBehavior();
                            }
                        }
                    });
                }

                /**
                 * Toggle visibility of different sections
                 * @param {string} sectionId - ID of section to show
                 */
                function toggleSectionVisibility(sectionId) {
                    // Hide all sections
                    document.querySelectorAll('.section').forEach(section => {
                        section.style.display = 'none';
                    });
                    
                    // Show the selected section
                    const targetSection = document.getElementById(sectionId);
                    if (targetSection) {
                        targetSection.style.display = 'block';
                    }
                }

                /**
                 * Update UI based on current section
                 */
                function updateActiveSection() {
                    // Get current hash or default to 'dashboard'
                    const currentSection = window.location.hash.substring(1) || 'dashboard';
                    
                    // Update active state in menu
                    document.querySelectorAll('.sidebar-nav ul li').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    const activeLink = document.querySelector(`.sidebar-nav ul li a[href="#${currentSection}"]`);
                    if (activeLink) {
                        activeLink.closest('li').classList.add('active');
                        
                        // Update header title
                        const sectionTitle = activeLink.textContent.trim();
                        document.querySelector('.header-title h1').textContent = sectionTitle;
                    }
                    
                    // Show appropriate section
                    toggleSectionVisibility(currentSection);
                }

                /**
                 * Format date for display
                 * @param {string} dateStr - Date string in YYYY-MM-DD format
                 * @return {string} Formatted date
                 */
                function formatDate(dateStr) {
                    const date = new Date(dateStr);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return date.toLocaleDateString('en-US', options);
                }
