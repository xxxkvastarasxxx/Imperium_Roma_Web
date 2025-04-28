/**
 * Domus Collection Management JavaScript
 * Backend-integrated version
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize with backend data passed from server
    const initialData = window.domusData || {};
    
    // Setup UI components
    initializeUI();
    
    // Set up collection view toggles
    setupViewToggles();
    
    // Initialize filter panel functionality
    initializeFilterPanel();
    
    // Set up coin detail modal functionality
    setupCoinDetailModal();
    
    // Set up pagination
    setupPagination();
    
    // Initialize search functionality
    setupSearch();
    
    // Setup add coin form
    setupAddCoinForm();
});

/**
 * Initialize UI with data from backend
 */
function initializeUI() {
    // This function will set up the initial state based on server-provided data
    const data = window.domusData || {};
    
    // Update user information
    if (data.user) {
        document.getElementById('user-nickname').textContent = data.user.nickname || 'User';
        document.getElementById('user-rank').textContent = data.user.rank || 'Collector';
        
        const userAvatar = document.getElementById('user-avatar-small');
        if (userAvatar && data.user.avatarUrl) {
            userAvatar.src = data.user.avatarUrl;
        }
    }
    
    // Update collection stats if available
    if (data.collection) {
        updateCollectionStats(data.collection);
    }
    
    // Apply any active filters
    if (data.currentFilters && Object.keys(data.currentFilters).length > 0) {
        applyInitialFilters(data.currentFilters);
    }
    
    // If there are no coins, show empty state
    const coinsContainer = document.getElementById('collection-container');
    if (coinsContainer && coinsContainer.children.length === 0) {
        document.getElementById('empty-state').style.display = 'block';
    }
}

/**
 * Apply initial filters from backend data
 */
function applyInitialFilters(filters) {
    const activeFiltersContainer = document.getElementById('active-filters');
    activeFiltersContainer.innerHTML = '';
    
    // Process each filter type
    Object.keys(filters).forEach(type => {
        filters[type].forEach(value => {
            // Find the checkbox and check it
            const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
            
            // Add active filter tag
            const filterTag = createFilterTag(type, value);
            if (filterTag) {
                activeFiltersContainer.appendChild(filterTag);
            }
        });
    });
}

/**
 * Create a filter tag element
 */
function createFilterTag(type, value) {
    // Find the label text from the filter panel
    const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
    if (!checkbox) return null;
    
    const labelText = checkbox.closest('label').textContent.trim();
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Create the filter tag
    const filterTag = document.createElement('span');
    filterTag.className = 'filter-tag';
    filterTag.setAttribute('data-filter-type', type);
    filterTag.setAttribute('data-filter-value', value);
    filterTag.innerHTML = `${formattedType}: ${labelText} <i class="fas fa-times"></i>`;
    
    // Add event listener for removal
    filterTag.querySelector('i').addEventListener('click', function() {
        // Uncheck the corresponding checkbox
        checkbox.checked = false;
        
        // Remove the tag
        filterTag.remove();
        
        // Reapply filters
        applyFilters();
    });
    
    return filterTag;
}

/**
 * Set up view toggle functionality (grid vs list view)
 */
function setupViewToggles() {
    const viewButtons = document.querySelectorAll('.btn-view-toggle');
    const collectionContainer = document.getElementById('collection-container');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get view type from data attribute
            const viewType = this.getAttribute('data-view');
            
            // Update collection container class
            collectionContainer.className = 'collection-' + viewType;
            
            // Save preference to local storage
            localStorage.setItem('collectionViewPreference', viewType);
        });
    });
    
    // Load saved preference if available
    const savedView = localStorage.getItem('collectionViewPreference');
    if (savedView) {
        const targetButton = document.querySelector(`.btn-view-toggle[data-view="${savedView}"]`);
        if (targetButton) {
            targetButton.click();
        }
    }
}

/**
 * Initialize filter panel functionality
 */
function initializeFilterPanel() {
    const filterButton = document.querySelector('.btn-filter');
    const filterPanel = document.getElementById('filter-panel');
    const applyFiltersButton = document.getElementById('apply-filters');
    const clearFiltersButton = document.getElementById('clear-filters');
    
    // Toggle filter panel visibility
    if (filterButton && filterPanel) {
        filterButton.addEventListener('click', function() {
            filterPanel.classList.toggle('visible');
        });
    }
    
    // Apply filters
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', function() {
            applyFilters();
            filterPanel.classList.remove('visible');
        });
    }
    
    // Clear filters
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', function() {
            clearFilters();
        });
    }
    
    // Set up active filter tag removal
    const activeFiltersContainer = document.getElementById('active-filters');
    if (activeFiltersContainer) {
        activeFiltersContainer.addEventListener('click', function(e) {
            if (e.target.tagName === 'I' && e.target.classList.contains('fa-times')) {
                const filterTag = e.target.parentNode;
                const type = filterTag.getAttribute('data-filter-type');
                const value = filterTag.getAttribute('data-filter-value');
                
                // Uncheck the corresponding checkbox
                const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
                
                // Remove the tag
                filterTag.remove();
                
                // Reapply filters
                applyFilters();
            }
        });
    }
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            clearFilters();
            document.getElementById('collection-search').value = '';
            loadCoins();
        });
    }
}

/**
 * Apply filters based on checkboxes and update UI
 */
function applyFilters() {
    // Show loading state
    showLoading(true);
    
    // Get all selected filters
    const filters = getSelectedFilters();
    
    // Update active filters display
    updateActiveFiltersDisplay(filters);
    
    // Build query parameters
    const params = buildFilterParams(filters);
    
    // Add sort parameter
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        params.sort = sortSelect.value;
    }
    
    // Add pagination parameters
    const itemsPerPage = document.getElementById('items-per-page');
    if (itemsPerPage) {
        params.pageSize = itemsPerPage.value;
    }
    params.page = 1; // Reset to first page when applying filters
    
    // Add search query if exists
    const searchInput = document.getElementById('collection-search');
    if (searchInput && searchInput.value.trim()) {
        params.q = searchInput.value.trim();
    }
    
    // Fetch coins with filters
    fetchCoins(params);
}

/**
 * Build query parameters from filter object
 */
function buildFilterParams(filters) {
    const params = {};
    
    Object.keys(filters).forEach(type => {
        if (filters[type].length > 0) {
            params[type] = filters[type].join(',');
        }
    });
    
    return params;
}

/**
 * Clear all filters and reset UI
 */
function clearFilters() {
    // Uncheck all filter checkboxes
    const checkboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear active filters display
    const activeFiltersContainer = document.getElementById('active-filters');
    if (activeFiltersContainer) {
        activeFiltersContainer.innerHTML = '';
    }
    
    // Reset sort to default
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = 'date-added-desc';
    }
    
    // Hide empty state if visible
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Apply empty filters to reset
    applyFilters();
}

/**
 * Get all selected filters from filter panel
 */
function getSelectedFilters() {
    const filters = {
        era: [],
        material: [],
        denomination: [],
        emperor: []
    };
    
    // Get all checked checkboxes
    const checkboxes = document.querySelectorAll('.filter-options input[type="checkbox"]:checked');
    
    // Group by filter type
    checkboxes.forEach(checkbox => {
        const type = checkbox.getAttribute('name');
        const value = checkbox.getAttribute('value');
        
        if (filters[type]) {
            filters[type].push(value);
        }
    });
    
    return filters;
}

/**
 * Update active filters display
 */
function updateActiveFiltersDisplay(filters) {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;
    
    activeFiltersContainer.innerHTML = '';
    
    let hasFilters = false;
    
    // Add filter tags for each selected filter
    Object.keys(filters).forEach(type => {
        filters[type].forEach(value => {
            const filterTag = createFilterTag(type, value);
            if (filterTag) {
                activeFiltersContainer.appendChild(filterTag);
                hasFilters = true;
            }
        });
    });
    
    // Toggle filter button appearance based on whether filters are active
    const filterButton = document.querySelector('.btn-filter');
    if (filterButton) {
        if (hasFilters) {
            filterButton.classList.add('has-filters');
        } else {
            filterButton.classList.remove('has-filters');
        }
    }
}

/**
 * Set up search functionality
 */
function setupSearch() {
    const searchInput = document.getElementById('collection-search');
    const searchButton = document.getElementById('search-button');
    
    if (searchButton && searchInput) {
        // Search button click
        searchButton.addEventListener('click', function() {
            applyFilters();
        });
        
        // Enter key in search box
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }
}

/**
 * Show loading state
 */
function showLoading(show) {
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    const collectionContainer = document.getElementById('collection-container');
    
    if (loadingPlaceholder) {
        loadingPlaceholder.style.display = show ? 'block' : 'none';
    }
    
    if (collectionContainer) {
        const items = collectionContainer.querySelectorAll('.coin-item:not(.loading-placeholder)');
        items.forEach(item => {
            item.style.opacity = show ? 0.5 : 1;
        });
    }
}

/**
 * Fetch coins from API
 */
function fetchCoins(params = {}) {
    const apiEndpoint = window.domusData?.apiEndpoints?.getCoins || '/api/coins';
    
    // Build query string
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    const url = `${apiEndpoint}${queryString ? `?${queryString}` : ''}`;
    
    // Show loading state
    showLoading(true);
    
    // Fetch data from API
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update the UI with the new coin data
            updateCoinsDisplay(data.coins);
            
            // Update pagination
            updatePagination(data.pagination);
            
            // Update collection stats
            updateCollectionStats(data.stats);
            
            // Hide loading state
            showLoading(false);
            
            // Show empty state if no coins
            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.style.display = data.coins.length === 0 ? 'block' : 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching coins:', error);
            
            // Hide loading state
            showLoading(false);
            
            // Show error message
            // You could add a toast notification system here
            alert('Error loading collection. Please try again later.');
        });
}

/**
 * Update coins display with new data
 */
function updateCoinsDisplay(coins) {
    const container = document.getElementById('collection-container');
    if (!container) return;
    
    // Remove existing coins except loading placeholder
    const existingCoins = container.querySelectorAll('.coin-item:not(.loading-placeholder)');
    existingCoins.forEach(coin => coin.remove());
    
    // Get loading placeholder
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    
    // Create and append new coin elements
    coins.forEach(coin => {
        const coinElement = createCoinElement(coin);
        if (loadingPlaceholder) {
            container.insertBefore(coinElement, loadingPlaceholder);
        } else {
            container.appendChild(coinElement);
        }
    });
}

/**
 * Create coin element from data
 */
function createCoinElement(coin) {
    const coinElement = document.createElement('div');
    coinElement.className = 'coin-item';
    coinElement.setAttribute('data-coin-id', coin.id);
    coinElement.setAttribute('data-era', coin.era);
    coinElement.setAttribute('data-material', coin.material);
    coinElement.setAttribute('data-denomination', coin.denomination);
    coinElement.setAttribute('data-emperor', coin.emperor || '');
    coinElement.setAttribute('data-year', coin.year || '');
    coinElement.setAttribute('data-value', coin.value || 0);
    coinElement.setAttribute('data-date-added', coin.dateAdded);
    
    coinElement.innerHTML = `
        <div class="coin-images">
            <img src="${coin.obverseImage}" alt="${coin.title} (Obverse)" class="coin-image obverse">
            <img src="${coin.reverseImage}" alt="${coin.title} (Reverse)" class="coin-image reverse">
        </div>
        <div class="coin-info">
            <h3>${coin.title}</h3>
            <div class="coin-meta">
                <span class="denomination">${coin.materialDisplay} ${coin.denominationDisplay}</span>
                <span class="year">${coin.yearDisplay}</span>
            </div>
            <div class="coin-quick-data">
                <span class="coin-value">${coin.valueDisplay}</span>
                <div class="coin-condition">${coin.condition}</div>
            </div>
        </div>
        <div class="coin-actions">
            <button class="btn-view-coin" data-coin-id="${coin.id}"><i class="fas fa-search-plus"></i></button>
            <button class="btn-edit-coin" data-coin-id="${coin.id}"><i class="fas fa-edit"></i></button>
        </div>
    `;
    
    // Add event listeners
    const viewButton = coinElement.querySelector('.btn-view-coin');
    if (viewButton) {
        viewButton.addEventListener('click', function() {
            openCoinDetail(coin.id);
        });
    }
    
    const editButton = coinElement.querySelector('.btn-edit-coin');
    if (editButton) {
        editButton.addEventListener('click', function() {
            openCoinEdit(coin.id);
        });
    }
    
    return coinElement;
}

/**
 * Update pagination UI with new data
 */
function updatePagination(pagination) {
    if (!pagination) return;
    
    const paginationContainer = document.getElementById('pagination-container');
    const pageNumbersContainer = document.getElementById('page-numbers');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (!paginationContainer || !pageNumbersContainer || !prevButton || !nextButton) return;
    
    // Update previous/next buttons
    prevButton.disabled = pagination.currentPage <= 1;
    nextButton.disabled = pagination.currentPage >= pagination.totalPages;
    
    // Clear existing page numbers
    pageNumbersContainer.innerHTML = '';
    
    // Generate new page numbers
    const pages = [];
    
    // Always include first page
    pages.push(1);
    
    // Calculate range around current page
    const rangeStart = Math.max(2, pagination.currentPage - 1);
    const rangeEnd = Math.min(pagination.totalPages - 1, pagination.currentPage + 1);
    
    // Add ellipsis if needed before range
    if (rangeStart > 2) {
        pages.push('...');
    }
    
    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
    }
    
    // Add ellipsis if needed after range
    if (rangeEnd < pagination.totalPages - 1) {
        pages.push('...');
    }
    
    // Add last page if more than one page
    if (pagination.totalPages > 1) {
        pages.push(pagination.totalPages);
    }
    
    // Create page buttons
    pages.forEach(page => {
        const button = document.createElement('button');
        
        if (page === '...') {
            button.className = 'page-ellipsis';
            button.textContent = '...';
            button.disabled = true;
        } else {
            button.className = `page-num ${page === pagination.currentPage ? 'active' : ''}`;
            button.textContent = page;
            button.setAttribute('data-page', page);
            
            // Add click handler
            button.addEventListener('click', function() {
                goToPage(page);
            });
        }
        
        pageNumbersContainer.appendChild(button);
    });
    
    // Update prev/next button handlers
    prevButton.onclick = function() {
        if (!this.disabled) {
            goToPage(pagination.currentPage - 1);
        }
    };
    
    nextButton.onclick = function() {
        if (!this.disabled) {
            goToPage(pagination.currentPage + 1);
        }
    };
    
    // Show/hide pagination container
    paginationContainer.style.display = pagination.totalPages > 1 ? 'flex' : 'none';
    
    // Update items per page select
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect && pagination.pageSize) {
        itemsPerPageSelect.value = pagination.pageSize;
        
        // Update handler
        itemsPerPageSelect.onchange = function() {
            // Reset to page 1 when changing page size
            const params = {
                pageSize: this.value,
                page: 1
            };
            
            // Add current filters
            const filters = getSelectedFilters();
            Object.assign(params, buildFilterParams(filters));
            
            // Add current sort
            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                params.sort = sortSelect.value;
            }
            
            // Add search query if exists
            const searchInput = document.getElementById('collection-search');
            if (searchInput && searchInput.value.trim()) {
                params.q = searchInput.value.trim();
            }
            
            // Fetch coins with new params
            fetchCoins(params);
        };
    }
}

/**
 * Go to specific page
 */
function goToPage(page) {
    // Build parameters
    const params = {
        page: page
    };
    
    // Add page size
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        params.pageSize = itemsPerPageSelect.value;
    }
    
    // Add current filters
    const filters = getSelectedFilters();
    Object.assign(params, buildFilterParams(filters));
    
    // Add current sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        params.sort = sortSelect.value;
    }
    
    // Add search query if exists
    const searchInput = document.getElementById('collection-search');
    if (searchInput && searchInput.value.trim()) {
        params.q = searchInput.value.trim();
    }
    
    // Fetch coins with new params
    fetchCoins(params);
}

/**
 * Update collection stats
 */
function updateCollectionStats(stats) {
    if (!stats) return;
    
    const countElement = document.getElementById('collection-count');
    const valueElement = document.getElementById('collection-total-value');
    
    if (countElement) {
        countElement.textContent = stats.totalCoins || 0;
    }
    
    if (valueElement) {
        valueElement.textContent = stats.totalValue || '0 €';
    }
}

/**
 * Set up coin detail modal
 */
function setupCoinDetailModal() {
    const modal = document.getElementById('coin-detail-modal');
    if (!modal) return;
    
    const closeButton = modal.querySelector('.modal-close');
    
    // Close modal when close button is clicked
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeModal(modal);
        });
    }
    
    // Close modal when clicking outside content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
    
    // Setup action buttons
    const editButton = document.getElementById('modal-edit-btn');
    if (editButton) {
        editButton.addEventListener('click', function() {
            const coinId = modal.getAttribute('data-coin-id');
            if (coinId) {
                closeModal(modal);
                openCoinEdit(coinId);
            }
        });
    }
    
    const showcaseButton = document.getElementById('modal-showcase-btn');
    if (showcaseButton) {
        showcaseButton.addEventListener('click', function() {
            const coinId = modal.getAttribute('data-coin-id');
            if (coinId) {
                toggleCoinShowcase(coinId);
            }
        });
    }
    
    const printButton = document.getElementById('modal-print-btn');
    if (printButton) {
        printButton.addEventListener('click', function() {
            printCoinDetails();
        });
    }
    
    // Setup zoom controls
    setupZoomControls();
}

/**
 * Set up coin zoom controls
 */
function setupZoomControls() {
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const rotate = document.getElementById('rotate-image');
    const mainImage = document.getElementById('modal-main-image');
    
    if (!zoomIn || !zoomOut || !rotate || !mainImage) return;
    
    let zoomLevel = 1;
    let rotation = 0;
    
    zoomIn.addEventListener('click', function() {
        zoomLevel = Math.min(zoomLevel + 0.25, 3);
        updateImageTransform();
    });
    
    zoomOut.addEventListener('click', function() {
        zoomLevel = Math.max(zoomLevel - 0.25, 1);
        updateImageTransform();
    });
    
    rotate.addEventListener('click', function() {
        rotation = (rotation + 90) % 360;
        updateImageTransform();
    });
    
    function updateImageTransform() {
        mainImage.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
    }
    
    // Reset transform when loading new coin
    const modal = document.getElementById('coin-detail-modal');
    if (modal) {
        modal.addEventListener('coinLoaded', function() {
            zoomLevel = 1;
            rotation = 0;
            updateImageTransform();
        });
    }
}

/**
 * Open coin detail modal
 */
function openCoinDetail(coinId) {
    const modal = document.getElementById('coin-detail-modal');
    if (!modal) return;
    
    // Store coin ID on modal
    modal.setAttribute('data-coin-id', coinId);
    
    // Show loading state
    const contentArea = document.getElementById('coin-detail-content');
    if (contentArea) {
        contentArea.innerHTML = '<div class="loading-spinner"></div>';
    }
    
    // Display modal
    modal.classList.add('visible');
    document.body.classList.add('modal-open');
    
    // Fetch coin details
    fetchCoinDetails(coinId);
}

/**
 * Fetch coin details from API
 */
function fetchCoinDetails(coinId) {
    const apiEndpoint = window.domusData?.apiEndpoints?.getCoinDetail?.replace(':id', coinId) || `/api/coins/${coinId}`;
    
    fetch(apiEndpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(coin => {
            updateCoinDetailModal(coin);
            
            // Trigger event for zoom controls to reset
            const modal = document.getElementById('coin-detail-modal');
            if (modal) {
                modal.dispatchEvent(new Event('coinLoaded'));
            }
        })
        .catch(error => {
            console.error('Error fetching coin details:', error);
            
            // Show error message in modal
            const contentArea = document.getElementById('coin-detail-content');
            if (contentArea) {
                contentArea.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading coin details. Please try again later.</p>
                    </div>
                `;
            }
        });
}

/**
 * Update coin detail modal with data
 */
function updateCoinDetailModal(coin) {
    // Update main image
    const mainImage = document.getElementById('modal-main-image');
    if (mainImage) {
        mainImage.src = coin.obverseImage;
        mainImage.alt = `${coin.title} (Obverse)`;
    }
    
    // Update thumbnails
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    if (thumbnailGallery) {
        thumbnailGallery.innerHTML = '';
        
        // Add obverse thumbnail
        const obverseThumbnail = document.createElement('img');
        obverseThumbnail.src = coin.obverseImage;
        obverseThumbnail.alt = 'Obverse';
        obverseThumbnail.className = 'thumbnail active';
        obverseThumbnail.addEventListener('click', function() {
            setMainImage(coin.obverseImage, `${coin.title} (Obverse)`);
            setActiveThumbnail(this);
        });
        thumbnailGallery.appendChild(obverseThumbnail);
        
        // Add reverse thumbnail
        const reverseThumbnail = document.createElement('img');
        reverseThumbnail.src = coin.reverseImage;
        reverseThumbnail.alt = 'Reverse';
        reverseThumbnail.className = 'thumbnail';
        reverseThumbnail.addEventListener('click', function() {
            setMainImage(coin.reverseImage, `${coin.title} (Reverse)`);
            setActiveThumbnail(this);
        });
        thumbnailGallery.appendChild(reverseThumbnail);
        
        // Add additional images if available
        if (coin.additionalImages && coin.additionalImages.length > 0) {
            coin.additionalImages.forEach((image, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = image.url;
                thumbnail.alt = image.label || `Additional View ${index + 1}`;
                thumbnail.className = 'thumbnail';
                thumbnail.addEventListener('click', function() {
                    setMainImage(image.url, image.label || `${coin.title} (Additional View)`);
                    setActiveThumbnail(this);
                });
                thumbnailGallery.appendChild(thumbnail);
            });
        }
    }
    
    // Update coin details
    const detailsContainer = document.getElementById('coin-detail-content');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <h2 id="modal-coin-title">${coin.title}</h2>
            
            <div class="detail-group">
                <label>Era:</label>
                <p>${coin.eraDisplay || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Emperor/Authority:</label>
                <p>${coin.emperorDisplay || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Date:</label>
                <p>${coin.yearDisplay || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Denomination:</label>
                <p>${coin.denominationDisplay || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Material:</label>
                <p>${coin.materialDisplay || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Weight:</label>
                <p>${coin.weight ? `${coin.weight}g` : 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Diameter:</label>
                <p>${coin.diameter ? `${coin.diameter}mm` : 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Mint:</label>
                <p>${coin.mintDisplay || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Reference:</label>
                <p>${coin.reference || 'No reference provided'}</p>
            </div>
            
            <div class="detail-group">
                <label>Condition:</label>
                <p>${coin.conditionDisplay || coin.condition || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <label>Value:</label>
                <p>${coin.valueDisplay || 'Not valued'}</p>
            </div>
            
            <div class="detail-group full-width">
                <label>Acquisition:</label>
                <p>${coin.acquisitionInfo || 'No acquisition information provided'}</p>
            </div>
            
            <div class="detail-group full-width">
                <label>Description:</label>
                <p>${coin.description || 'No description provided'}</p>
            </div>
            
            <div class="detail-group full-width">
                <label>Notes:</label>
                <p>${coin.notes || 'No additional notes'}</p>
            </div>
        `;
        
        // Update showcase button state
        const showcaseButton = document.getElementById('modal-showcase-btn');
        if (showcaseButton && coin.inShowcase) {
            showcaseButton.innerHTML = '<i class="fas fa-star"></i> Remove from Showcase';
            showcaseButton.classList.add('in-showcase');
        } else if (showcaseButton) {
            showcaseButton.innerHTML = '<i class="fas fa-star"></i> Add to Showcase';
            showcaseButton.classList.remove('in-showcase');
        }
    }
}

/**
 * Set main image in coin detail modal
 */
function setMainImage(src, alt) {
    const mainImage = document.getElementById('modal-main-image');
    if (!mainImage) return;
    
    mainImage.src = src;
    mainImage.alt = alt || 'Coin';
    
    // Reset zoom and rotation
    mainImage.style.transform = 'scale(1) rotate(0deg)';
}

/**
 * Set active thumbnail
 */
function setActiveThumbnail(thumbnail) {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });
    
    thumbnail.classList.add('active');
}

/**
 * Close modal
 */
function closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('visible');
    document.body.classList.remove('modal-open');
}

/**
 * Open coin edit form
 */
function openCoinEdit(coinId) {
    // This would open the edit form or modal for a specific coin
    console.log(`Opening edit form for coin ${coinId}`);
    
    // Redirect to edit page or show edit modal
    // window.location.href = `/collection/edit/${coinId}`;
    
    // Or show a modal with a form
    // showEditCoinModal(coinId);
    
    // For now, let's just alert
    alert(`Edit functionality for coin ${coinId} would open here`);
}

/**
 * Toggle coin in showcase
 */
function toggleCoinShowcase(coinId) {
    const showcaseButton = document.getElementById('modal-showcase-btn');
    const isCurrentlyInShowcase = showcaseButton.classList.contains('in-showcase');
    
    // API endpoint
    const apiEndpoint = window.domusData?.apiEndpoints?.updateCoin?.replace(':id', coinId) || `/api/coins/${coinId}`;
    
    // Show loading state
    if (showcaseButton) {
        showcaseButton.disabled = true;
        showcaseButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    // Update showcase status via API
    fetch(apiEndpoint, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inShowcase: !isCurrentlyInShowcase
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update button state
            if (showcaseButton) {
                showcaseButton.disabled = false;
                
                if (data.inShowcase) {
                    showcaseButton.innerHTML = '<i class="fas fa-star"></i> Remove from Showcase';
                    showcaseButton.classList.add('in-showcase');
                } else {
                    showcaseButton.innerHTML = '<i class="fas fa-star"></i> Add to Showcase';
                    showcaseButton.classList.remove('in-showcase');
                }
            }
        })
        .catch(error => {
            console.error('Error updating showcase status:', error);
            
            // Reset button state
            if (showcaseButton) {
                showcaseButton.disabled = false;
                showcaseButton.innerHTML = '<i class="fas fa-star"></i> ' + 
                    (isCurrentlyInShowcase ? 'Remove from Showcase' : 'Add to Showcase');
            }
            
            // Show error message
            alert('Error updating showcase status. Please try again later.');
        });
}

/**
 * Print coin details
 */
function printCoinDetails() {
    const modal = document.getElementById('coin-detail-modal');
    const coinId = modal ? modal.getAttribute('data-coin-id') : null;
    
    if (!coinId) return;
    
    // Open print-friendly version in new window
    const printWindow = window.open(`/collection/print/${coinId}`, '_blank');
    
    // If browser blocks popup, provide alternative
    if (!printWindow) {
        alert('Please allow popups to print coin details, or use the dedicated print page at: ' + 
              `/collection/print/${coinId}`);
    }
}

/**
 * Set up add coin form
 */
function setupAddCoinForm() {
    const addButton = document.getElementById('add-coin-btn');
    const modal = document.getElementById('add-coin-modal');
    const closeButton = modal ? modal.querySelector('.modal-close') : null;
    const cancelButton = document.getElementById('cancel-add-coin');
    const form = document.getElementById('add-coin-form');
    
    // Open modal on add button click
    if (addButton && modal) {
        addButton.addEventListener('click', function() {
            // Load form content
            loadAddCoinForm();
            
            // Show modal
            modal.classList.add('visible');
            document.body.classList.add('modal-open');
        });
    }
    
    // Close modal on close button click
    if (closeButton && modal) {
        closeButton.addEventListener('click', function() {
            closeModal(modal);
        });
    }
    
    // Close modal on cancel button click
    if (cancelButton && modal) {
        cancelButton.addEventListener('click', function() {
            closeModal(modal);
        });
    }
    
    // Close modal when clicking outside content
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    }
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            }
            
            // Submit form data
            const apiEndpoint = window.domusData?.apiEndpoints?.addCoin || '/api/coins';
            
            fetch(apiEndpoint, {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Close modal
                    closeModal(modal);
                    
                    // Refresh coin list
                    fetchCoins();
                    
                    // Show success message
                    alert('Coin added successfully!');
                })
                .catch(error => {
                    console.error('Error adding coin:', error);
                    
                    // Reset submit button
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = 'Add Coin';
                    }
                    
                    // Show error message
                    alert('Error adding coin. Please try again later.');
                });
        });
    }
}

/**
 * Load add coin form content
 */
function loadAddCoinForm() {
    const formContainer = document.getElementById('add-coin-form-content');
    if (!formContainer) return;
    
    // Load form fields dynamically
    // This would typically come from an API endpoint that provides form structure
    // For now, we'll use a static example
    
    formContainer.innerHTML = `
        <div class="form-grid">
            <div class="form-group">
                <label for="coin-title">Title/Name*</label>
                <input type="text" id="coin-title" name="title" required>
            </div>
            
            <div class="form-group">
                <label for="coin-era">Period*</label>
                <select id="coin-era" name="era" required>
                    <option value="">Select Period</option>
                    <option value="republic">Republican</option>
                    <option value="early-empire">Early Empire</option>
                    <option value="high-empire">High Empire</option>
                    <option value="late-empire">Late Empire</option>
                    <option value="byzantine">Byzantine</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="coin-emperor">Emperor/Authority</label>
                <select id="coin-emperor" name="emperor">
                    <option value="">Select Emperor</option>
                    <option value="augustus">Augustus</option>
                    <option value="tiberius">Tiberius</option>
                    <option value="trajan">Trajan</option>
                    <option value="hadrian">Hadrian</option>
                    <option value="marcus-aurelius">Marcus Aurelius</option>
                    <option value="constantine">Constantine</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="coin-year">Year/Period</label>
                <input type="text" id="coin-year" name="year" placeholder="e.g., 27 BCE - 14 CE">
            </div>
            
            <div class="form-group">
                <label for="coin-denomination">Denomination*</label>
                <select id="coin-denomination" name="denomination" required>
                    <option value="">Select Denomination</option>
                    <option value="aureus">Aureus</option>
                    <option value="denarius">Denarius</option>
                    <option value="sestertius">Sestertius</option>
                    <option value="as">As</option>
                    <option value="follis">Follis</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="coin-material">Material*</label>
                <select id="coin-material" name="material" required>
                    <option value="">Select Material</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                    <option value="copper">Copper</option>
                    <option value="billon">Billon</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="coin-weight">Weight (g)</label>
                <input type="number" id="coin-weight" name="weight" step="0.01">
            </div>
            
            <div class="form-group">
                <label for="coin-diameter">Diameter (mm)</label>
                <input type="number" id="coin-diameter" name="diameter" step="0.1">
            </div>
            
            <div class="form-group">
                <label for="coin-mint">Mint</label>
                <input type="text" id="coin-mint" name="mint">
            </div>
            
            <div class="form-group">
                <label for="coin-reference">Reference</label>
                <input type="text" id="coin-reference" name="reference" placeholder="e.g., RIC I Augustus 42a">
            </div>
            
            <div class="form-group">
                <label for="coin-condition">Condition</label>
                <select id="coin-condition" name="condition">
                    <option value="">Select Condition</option>
                    <option value="mint">Mint State</option>
                    <option value="extremely-fine">Extremely Fine</option>
                    <option value="very-fine">Very Fine</option>
                    <option value="fine">Fine</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="coin-value">Value (€)</label>
                <input type="number" id="coin-value" name="value" step="0.01">
            </div>
            
            <div class="form-group full-width">
                <label for="coin-acquisition">Acquisition Information</label>
                <textarea id="coin-acquisition" name="acquisitionInfo" rows="2"></textarea>
            </div>
            
            <div class="form-group full-width">
                <label for="coin-description">Description</label>
                <textarea id="coin-description" name="description" rows="3"></textarea>
            </div>
            
            <div class="form-group image-upload">
                <label for="obverse-image">Obverse Image*</label>
                <input type="file" id="obverse-image" name="obverseImage" accept="image/*" required>
                <div class="preview-container">
                    <img id="obverse-preview" alt="Obverse Preview">
                </div>
            </div>
            
            <div class="form-group image-upload">
                <label for="reverse-image">Reverse Image*</label>
                <input type="file" id="reverse-image" name="reverseImage" accept="image/*" required>
                <div class="preview-container">
                    <img id="reverse-preview" alt="Reverse Preview">
                </div>
            </div>
            
            <div class="form-group full-width">
                <label for="additional-images">Additional Images</label>
                <input type="file" id="additional-images" name="additionalImages" accept="image/*" multiple>
                <div id="additional-previews" class="additional-previews"></div>
            </div>
        </div>
        
        <div class="form-footer">
            <button type="button" id="cancel-add-coin" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Coin</button>
        </div>
    `;
    
    // Set up image preview functionality
    setupImagePreviews();
}

/**
 * Set up image previews for coin form
 */
function setupImagePreviews() {
    const obverseInput = document.getElementById('obverse-image');
    const reverseInput = document.getElementById('reverse-image');
    const additionalInput = document.getElementById('additional-images');
    
    if (obverseInput) {
        obverseInput.addEventListener('change', function() {
            previewImage(this, 'obverse-preview');
        });
    }
    
    if (reverseInput) {
        reverseInput.addEventListener('change', function() {
            previewImage(this, 'reverse-preview');
        });
    }
    
    if (additionalInput) {
        additionalInput.addEventListener('change', function() {
            previewMultipleImages(this, 'additional-previews');
        });
    }
}

/**
 * Preview single image
 */
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Preview multiple images
 */
function previewMultipleImages(input, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (input.files && input.files.length > 0) {
        for (let i = 0; i < input.files.length; i++) {
            const reader = new FileReader();
            const preview = document.createElement('img');
            preview.className = 'additional-preview';
            container.appendChild(preview);
            
            reader.onload = (function(preview) {
                return function(e) {
                    preview.src = e.target.result;
                };
            })(preview);
            
            reader.readAsDataURL(input.files[i]);
        }
    }
}

/**
 * Set up pagination functionality
 */
function setupPagination() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            applyFilters();
        });
    }
}