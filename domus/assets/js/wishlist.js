/**
 * Domus Wishlist Management JavaScript
 * Backend-integrated version
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize with backend data passed from server
    const initialData = window.domusData || {};
    
    // Setup UI components
    initializeUI();
    
    // Set up wishlist view toggles
    setupViewToggles();
    
    // Initialize filter panel functionality
    initializeFilterPanel();
    
    // Set up wishlist item detail modal functionality
    setupItemDetailModal();
    
    // Set up pagination
    setupPagination();
    
    // Initialize search functionality
    setupSearch();
    
    // Setup add wishlist item form/modal
    setupAddWishForm();
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
    
    // Apply any active filters
    if (data.currentFilters && Object.keys(data.currentFilters).length > 0) {
        applyInitialFilters(data.currentFilters);
    }
    
    // If there are no wishlist items, show empty state
    const wishlistContainer = document.getElementById('wishlist-container');
    if (wishlistContainer && wishlistContainer.querySelectorAll('.wishlist-item:not(.loading-placeholder)').length === 0) {
        document.getElementById('empty-state').style.display = 'block';
    } else {
        document.getElementById('empty-state').style.display = 'none';
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
            
            // Add active filter pill
            const filterPill = createFilterPill(type, value);
            if (filterPill) {
                activeFiltersContainer.appendChild(filterPill);
            }
        });
    });
}

/**
 * Create a filter pill element
 */
function createFilterPill(type, value) {
    // Find the label text from the filter panel
    const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
    if (!checkbox) return null;
    
    const labelText = checkbox.closest('label').textContent.trim();
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Create the filter pill
    const filterPill = document.createElement('span');
    filterPill.className = 'active-filter-pill';
    filterPill.setAttribute('data-filter-type', type);
    filterPill.setAttribute('data-filter-value', value);
    filterPill.innerHTML = `${formattedType}: ${labelText} <span class="remove-filter"><i class="fas fa-times"></i></span>`;
    
    // Add event listener for removal
    filterPill.querySelector('.remove-filter').addEventListener('click', function() {
        // Uncheck the corresponding checkbox
        checkbox.checked = false;
        
        // Remove the pill
        filterPill.remove();
        
        // Reapply filters
        applyFilters();
    });
    
    return filterPill;
}

/**
 * Set up view toggle functionality (grid vs list view)
 */
function setupViewToggles() {
    const viewButtons = document.querySelectorAll('.btn-view-toggle');
    const wishlistContainer = document.getElementById('wishlist-container');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get view type from data attribute
            const viewType = this.getAttribute('data-view');
            
            // Update wishlist container class
            wishlistContainer.className = viewType === 'grid' ? 'wishlist-grid' : 'wishlist-grid list-view';
            
            // Save preference to local storage
            localStorage.setItem('wishlistViewPreference', viewType);
        });
    });
    
    // Load saved preference if available
    const savedView = localStorage.getItem('wishlistViewPreference');
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
            const isVisible = filterPanel.style.display === 'block';
            filterPanel.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    // Apply filters
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', function() {
            applyFilters();
            filterPanel.style.display = 'none';
        });
    }
    
    // Clear filters
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', function() {
            clearFilters();
        });
    }
    
    // Set up active filter pill removal
    const activeFiltersContainer = document.getElementById('active-filters');
    if (activeFiltersContainer) {
        activeFiltersContainer.addEventListener('click', function(e) {
            if (e.target.closest('.remove-filter')) {
                const filterPill = e.target.closest('.active-filter-pill');
                const type = filterPill.getAttribute('data-filter-type');
                const value = filterPill.getAttribute('data-filter-value');
                
                // Uncheck the corresponding checkbox
                const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
                
                // Remove the pill
                filterPill.remove();
                
                // Reapply filters
                applyFilters();
            }
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
    const searchInput = document.getElementById('wishlist-search');
    if (searchInput && searchInput.value.trim()) {
        params.q = searchInput.value.trim();
    }
    
    // Fetch wishlist items with filters
    fetchWishlistItems(params);
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
        sortSelect.value = 'priority-desc';
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
        priority: []
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
    
    // Add filter pills for each selected filter
    Object.keys(filters).forEach(type => {
        filters[type].forEach(value => {
            const filterPill = createFilterPill(type, value);
            if (filterPill) {
                activeFiltersContainer.appendChild(filterPill);
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
    const searchInput = document.getElementById('wishlist-search');
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
    const wishlistContainer = document.getElementById('wishlist-container');
    
    if (loadingPlaceholder) {
        loadingPlaceholder.style.display = show ? 'block' : 'none';
    }
    
    if (wishlistContainer) {
        const items = wishlistContainer.querySelectorAll('.wishlist-item:not(.loading-placeholder)');
        items.forEach(item => {
            item.style.opacity = show ? 0.5 : 1;
        });
    }
}

/**
 * Fetch wishlist items from API
 */
function fetchWishlistItems(params = {}) {
    const apiEndpoint = window.domusData?.apiEndpoints?.getWishlist || '/api/wishlist';
    
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
            // Update the UI with the new wishlist data
            updateWishlistDisplay(data.items);
            
            // Update pagination
            updatePagination(data.pagination);
            
            // Hide loading state
            showLoading(false);
            
            // Show empty state if no items
            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.style.display = data.items.length === 0 ? 'block' : 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching wishlist items:', error);
            
            // Hide loading state
            showLoading(false);
            
            // Show error message
            alert('Error loading wishlist. Please try again later.');
        });
}

/**
 * Update wishlist display with new data
 */
function updateWishlistDisplay(items) {
    const container = document.getElementById('wishlist-container');
    if (!container) return;
    
    // Remove existing items except loading placeholder
    const existingItems = container.querySelectorAll('.wishlist-item:not(.loading-placeholder)');
    existingItems.forEach(item => item.remove());
    
    // Get loading placeholder
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    
    // Create and append new wishlist item elements
    items.forEach(item => {
        const itemElement = createWishlistItemElement(item);
        if (loadingPlaceholder) {
            container.insertBefore(itemElement, loadingPlaceholder);
        } else {
            container.appendChild(itemElement);
        }
    });
}

/**
 * Create wishlist item element from data
 */
function createWishlistItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'wishlist-item';
    itemElement.setAttribute('data-wishlist-id', item.id);
    itemElement.setAttribute('data-era', item.era);
    itemElement.setAttribute('data-material', item.material);
    itemElement.setAttribute('data-denomination', item.denomination);
    itemElement.setAttribute('data-priority', item.priority);
    itemElement.setAttribute('data-date-added', item.dateAdded);
    
    // Create priority badge stars based on priority level
    const priorityStars = item.priority === 'high' 
        ? '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>' 
        : item.priority === 'medium' 
            ? '<i class="fas fa-star"></i><i class="fas fa-star"></i>' 
            : '<i class="fas fa-star"></i>';
    
    itemElement.innerHTML = `
        <div class="priority-badge priority-${item.priority}">
            ${priorityStars}
        </div>
        <div class="coin-images">
            <img src="${item.imageUrl || '/assets/images/coin-placeholder.jpg'}" alt="${item.title}" class="coin-image">
        </div>
        <div class="wishlist-info">
            <h3>${item.title}</h3>
            <div class="coin-meta">
                <span class="denomination">${item.materialDisplay} ${item.denominationDisplay}</span>
                <span class="year">${item.yearDisplay}</span>
            </div>
            <div class="coin-quick-data">
                <span class="coin-value">Est. ${item.estimatedValueDisplay}</span>
                <div class="availability-status ${item.isAvailable ? 'available' : ''}">
                    ${item.isAvailable ? '<i class="fas fa-check-circle"></i> Available' : '<i class="far fa-clock"></i> Watching'}
                </div>
            </div>
        </div>
        <div class="price-alert">
            <span class="max-price">Max: ${item.maxPriceDisplay}</span>
            <span class="alert-status">
                ${item.alertsEnabled ? '<i class="fas fa-bell"></i>' : '<i class="fas fa-bell-slash"></i>'}
            </span>
        </div>
        <div class="wishlist-actions">
            <button class="btn-view-wish" data-wishlist-id="${item.id}"><i class="fas fa-search-plus"></i></button>
            <button class="btn-edit-wish" data-wishlist-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="btn-mark-acquired" data-wishlist-id="${item.id}" title="Mark as Acquired"><i class="fas fa-check"></i></button>
            <button class="btn-remove-wish" data-wishlist-id="${item.id}" title="Remove from Wishlist"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    // Add event listeners
    const viewButton = itemElement.querySelector('.btn-view-wish');
    if (viewButton) {
        viewButton.addEventListener('click', function() {
            openWishItemDetail(item.id);
        });
    }
    
    const editButton = itemElement.querySelector('.btn-edit-wish');
    if (editButton) {
        editButton.addEventListener('click', function() {
            openWishItemEdit(item.id);
        });
    }
    
    const acquireButton = itemElement.querySelector('.btn-mark-acquired');
    if (acquireButton) {
        acquireButton.addEventListener('click', function() {
            markItemAsAcquired(item.id);
        });
    }
    
    const removeButton = itemElement.querySelector('.btn-remove-wish');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            removeWishlistItem(item.id);
        });
    }
    
    return itemElement;
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
            button.textContent = '...';
            button.className = 'page-ellipsis';
            button.disabled = true;
        } else {
            button.textContent = page;
            button.className = 'page-number';
            if (page === pagination.currentPage) {
            button.classList.add('active');
            }
            button.addEventListener('click', function() {
            goToPage(page);
            });
        }
        
        pageNumbersContainer.appendChild(button);
        });
        
        // Update results summary
        const resultsSummary = document.getElementById('results-summary');
        if (resultsSummary) {
        const start = ((pagination.currentPage - 1) * pagination.pageSize) + 1;
        const end = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
        resultsSummary.textContent = `Showing ${start}-${end} of ${pagination.totalItems} items`;
        }
    }

    /**
     * Navigate to specific page
     */
    function goToPage(page) {
        // Get current filters and params
        const filters = getSelectedFilters();
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
        params.page = page;
        
        // Add search query if exists
        const searchInput = document.getElementById('wishlist-search');
        if (searchInput && searchInput.value.trim()) {
        params.q = searchInput.value.trim();
        }
        
        // Fetch wishlist items with updated page
        fetchWishlistItems(params);
    }

    /**
     * Set up pagination functionality
     */
    function setupPagination() {
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        const itemsPerPage = document.getElementById('items-per-page');
        
        if (prevButton) {
        prevButton.addEventListener('click', function() {
            const currentPage = parseInt(document.querySelector('.page-number.active')?.textContent) || 1;
            if (currentPage > 1) {
            goToPage(currentPage - 1);
            }
        });
        }
        
        if (nextButton) {
        nextButton.addEventListener('click', function() {
            const currentPage = parseInt(document.querySelector('.page-number.active')?.textContent) || 1;
            const totalPages = parseInt(document.querySelectorAll('.page-number:not(.active)')?.length + 1) || 1;
            if (currentPage < totalPages) {
            goToPage(currentPage + 1);
            }
        });
        }
        
        if (itemsPerPage) {
        itemsPerPage.addEventListener('change', function() {
            applyFilters();
        });
        }
    }

    /**
     * Set up wishlist item detail modal functionality
     */
    function setupItemDetailModal() {
        const modal = document.getElementById('item-detail-modal');
        const closeButtons = document.querySelectorAll('.close-modal');
        
        if (modal) {
        // Close modal on close button click
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
            modal.style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
            modal.style.display = 'none';
            }
        });
        }
    }

    /**
     * Open wishlist item detail modal
     */
    function openWishItemDetail(itemId) {
        const modal = document.getElementById('item-detail-modal');
        const contentContainer = document.getElementById('item-detail-content');
        
        if (modal && contentContainer) {
        // Show loading spinner
        contentContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        // Show modal
        modal.style.display = 'block';
        
        // Fetch item details
        const apiEndpoint = window.domusData?.apiEndpoints?.getWishlistItem || '/api/wishlist/item/';
        fetch(`${apiEndpoint}${itemId}`)
            .then(response => response.json())
            .then(data => {
            // Update modal content with item details
            contentContainer.innerHTML = generateItemDetailHTML(data);
            
            // Setup action buttons in modal
            setupModalActionButtons(data);
            })
            .catch(error => {
            console.error('Error fetching item details:', error);
            contentContainer.innerHTML = '<div class="error-message">Failed to load item details. Please try again.</div>';
            });
        }
    }

    /**
     * Generate HTML for item detail modal
     */
    function generateItemDetailHTML(item) {
        return `
        <div class="item-detail-header">
            <h2>${item.title}</h2>
            <div class="priority-badge priority-${item.priority}">
            ${item.priority === 'high' ? 
              '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>' : 
              item.priority === 'medium' ? 
              '<i class="fas fa-star"></i><i class="fas fa-star"></i>' : 
              '<i class="fas fa-star"></i>'}
            </div>
        </div>
        <div class="item-detail-images">
            <div class="main-image">
            <img src="${item.imageUrl || '/assets/images/coin-placeholder.jpg'}" alt="${item.title}">
            </div>
            ${item.additionalImages ? 
              `<div class="thumbnail-images">
            ${item.additionalImages.map(img => `<img src="${img}" alt="${item.title} view">`).join('')}
               </div>` : ''}
        </div>
        <div class="item-detail-info">
            <div class="item-attributes">
            <div class="attribute">
                <span class="label">Era:</span>
                <span class="value">${item.eraDisplay}</span>
            </div>
            <div class="attribute">
                <span class="label">Material:</span>
                <span class="value">${item.materialDisplay}</span>
            </div>
            <div class="attribute">
                <span class="label">Denomination:</span>
                <span class="value">${item.denominationDisplay}</span>
            </div>
            <div class="attribute">
                <span class="label">Year:</span>
                <span class="value">${item.yearDisplay}</span>
            </div>
            <div class="attribute">
                <span class="label">Estimated Value:</span>
                <span class="value">${item.estimatedValueDisplay}</span>
            </div>
            <div class="attribute">
                <span class="label">Max Price Alert:</span>
                <span class="value">${item.maxPriceDisplay}</span>
            </div>
            <div class="attribute">
                <span class="label">Date Added:</span>
                <span class="value">${new Date(item.dateAdded).toLocaleDateString()}</span>
            </div>
            </div>
            <div class="item-description">
            <h3>Description</h3>
            <p>${item.description || 'No description available.'}</p>
            </div>
            ${item.notes ? 
              `<div class="item-notes">
            <h3>Notes</h3>
            <p>${item.notes}</p>
               </div>` : ''}
        </div>
        <div class="item-detail-actions">
            <button class="btn-primary btn-edit-wish" data-wishlist-id="${item.id}">
            <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-success btn-mark-acquired" data-wishlist-id="${item.id}">
            <i class="fas fa-check"></i> Mark as Acquired
            </button>
            <button class="btn-danger btn-remove-wish" data-wishlist-id="${item.id}">
            <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        `;
    }

    /**
     * Setup action buttons in modal
     */
    function setupModalActionButtons(item) {
        const editButton = document.querySelector('.item-detail-actions .btn-edit-wish');
        const acquireButton = document.querySelector('.item-detail-actions .btn-mark-acquired');
        const removeButton = document.querySelector('.item-detail-actions .btn-remove-wish');
        
        if (editButton) {
        editButton.addEventListener('click', function() {
            openWishItemEdit(item.id);
        });
        }
        
        if (acquireButton) {
        acquireButton.addEventListener('click', function() {
            markItemAsAcquired(item.id);
        });
        }
        
        if (removeButton) {
        removeButton.addEventListener('click', function() {
            removeWishlistItem(item.id);
        });
        }
    }

    /**
     * Open edit form for wishlist item
     */
    function openWishItemEdit(itemId) {
        const addWishModal = document.getElementById('add-wish-modal');
        const modalTitle = addWishModal.querySelector('.modal-title');
        const form = document.getElementById('add-wish-form');
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (addWishModal && form) {
        // Update modal title and button text for edit mode
        modalTitle.textContent = 'Edit Wishlist Item';
        submitButton.textContent = 'Update Item';
        
        // Show loading state
        form.classList.add('loading');
        
        // Fetch item data
        const apiEndpoint = window.domusData?.apiEndpoints?.getWishlistItem || '/api/wishlist/item/';
        fetch(`${apiEndpoint}${itemId}`)
            .then(response => response.json())
            .then(data => {
            // Populate form with item data
            form.elements['title'].value = data.title || '';
            form.elements['era'].value = data.era || '';
            form.elements['material'].value = data.material || '';
            form.elements['denomination'].value = data.denomination || '';
            form.elements['year'].value = data.year || '';
            form.elements['estimated-value'].value = data.estimatedValue || '';
            form.elements['max-price'].value = data.maxPrice || '';
            form.elements['priority'].value = data.priority || 'low';
            form.elements['description'].value = data.description || '';
            form.elements['notes'].value = data.notes || '';
            
            // Set item ID in a hidden field
            let itemIdField = form.elements['item-id'];
            if (!itemIdField) {
                itemIdField = document.createElement('input');
                itemIdField.type = 'hidden';
                itemIdField.name = 'item-id';
                form.appendChild(itemIdField);
            }
            itemIdField.value = itemId;
            
            // Remove loading state
            form.classList.remove('loading');
            
            // Show modal
            addWishModal.style.display = 'block';
            })
            .catch(error => {
            console.error('Error fetching item details for edit:', error);
            alert('Failed to load item details. Please try again.');
            });
        }
    }

    /**
     * Mark wishlist item as acquired
     */
    function markItemAsAcquired(itemId) {
        if (!confirm('Are you sure you want to mark this item as acquired? It will be moved to your collection.')) {
        return;
        }
        
        // Show loading state
        showLoading(true);
        
        // Send request to API
        const apiEndpoint = window.domusData?.apiEndpoints?.markAsAcquired || '/api/wishlist/acquire/';
        
        fetch(`${apiEndpoint}${itemId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
        })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            // Close modal if open
            const modal = document.getElementById('item-detail-modal');
            if (modal) {
            modal.style.display = 'none';
            }
            
            // Refresh the wishlist
            applyFilters();
            
            // Show success message
            alert('Item successfully moved to your collection!');
        } else {
            throw new Error(data.message || 'Failed to mark item as acquired');
        }
        })
        .catch(error => {
        console.error('Error marking item as acquired:', error);
        alert('Failed to mark item as acquired. Please try again.');
        showLoading(false);
        });
    }

    /**
     * Remove item from wishlist
     */
    function removeWishlistItem(itemId) {
        if (!confirm('Are you sure you want to remove this item from your wishlist?')) {
        return;
        }
        
        // Show loading state
        showLoading(true);
        
        // Send request to API
        const apiEndpoint = window.domusData?.apiEndpoints?.removeWishlist || '/api/wishlist/remove/';
        
        fetch(`${apiEndpoint}${itemId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        }
        })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            // Close modal if open
            const modal = document.getElementById('item-detail-modal');
            if (modal) {
            modal.style.display = 'none';
            }
            
            // Refresh the wishlist
            applyFilters();
            
            // Show success message
            alert('Item removed from wishlist!');
        } else {
            throw new Error(data.message || 'Failed to remove item');
        }
        })
        .catch(error => {
        console.error('Error removing wishlist item:', error);
        alert('Failed to remove item. Please try again.');
        showLoading(false);
        });
    }

    /**
     * Setup add wishlist item form/modal
     */
    function setupAddWishForm() {
        const addButton = document.getElementById('add-wish-button');
        const modal = document.getElementById('add-wish-modal');
        const form = document.getElementById('add-wish-form');
        const closeButtons = modal?.querySelectorAll('.close-modal');
        
        if (addButton && modal && form) {
        // Open modal on add button click
        addButton.addEventListener('click', function() {
            const modalTitle = modal.querySelector('.modal-title');
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Reset form
            form.reset();
            
            // Clear any hidden item ID field
            const itemIdField = form.elements['item-id'];
            if (itemIdField) {
            itemIdField.value = '';
            }
            
            // Set default title and button text for add mode
            modalTitle.textContent = 'Add to Wishlist';
            submitButton.textContent = 'Add Item';
            
            // Show modal
            modal.style.display = 'block';
        });
        
        // Close modal on close button click
        if (closeButtons) {
            closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                modal.style.display = 'none';
            });
            });
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
            modal.style.display = 'none';
            }
        });
        
        // Handle form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitWishlistForm(form);
        });
        }
    }

    /**
     * Submit wishlist form (add or edit)
     */
    function submitWishlistForm(form) {
        // Show loading state
        form.classList.add('submitting');
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
        submitButton.disabled = true;
        }
        
        // Get form data
        const formData = new FormData(form);
        const itemData = Object.fromEntries(formData.entries());
        
        // Determine if this is an add or edit operation
        const isEdit = formData.get('item-id') ? true : false;
        
        // Set up API endpoint and method
        const apiEndpoint = isEdit 
        ? (window.domusData?.apiEndpoints?.updateWishlist || '/api/wishlist/update/') 
        : (window.domusData?.apiEndpoints?.addWishlist || '/api/wishlist/add');
        
        const method = isEdit ? 'PUT' : 'POST';
        
        // Send request to API
        fetch(apiEndpoint + (isEdit ? formData.get('item-id') : ''), {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify(itemData)
        })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            // Close modal
            const modal = document.getElementById('add-wish-modal');
            if (modal) {
            modal.style.display = 'none';
            }
            
            // Refresh the wishlist
            applyFilters();
            
            // Show success message
            alert(isEdit ? 'Item updated successfully!' : 'Item added to wishlist!');
        } else {
            throw new Error(data.message || 'Form submission failed');
        }
        })
        .catch(error => {
        console.error('Error submitting wishlist form:', error);
        alert('Failed to save item. Please check your input and try again.');
        })
        .finally(() => {
        // Remove loading state
        form.classList.remove('submitting');
        if (submitButton) {
            submitButton.disabled = false;
        }
        });
    }