/**
 * Domus Wishlist Management JavaScript
 * Backend-integrated version
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize with backend data passed from server
    const initialData = window.domusData || {};
    
    // Populate dynamic filter options from backend data
    populateFilterOptions(initialData.filters);

    // Setup UI components based on initial data
    initializeUI(initialData);
    
    // Set up wishlist view toggles
    setupViewToggles();
    
    // Initialize filter panel functionality
    initializeFilterPanel();
    
    // Set up wishlist item detail modal functionality
    setupItemDetailModal();
    
    // Set up pagination controls and state
    setupPagination(initialData.pagination);
    
    // Initialize search functionality
    setupSearch();
    
    // Setup add wishlist item form/modal
    setupAddWishForm();

    // Initial fetch or use server-rendered data
    if (initialData.wishlistItems && initialData.wishlistItems.length > 0) {
        updateWishlistDisplay(initialData.wishlistItems);
        updatePagination(initialData.pagination); // Ensure pagination reflects initial items
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('pagination-container').style.display = initialData.pagination?.totalPages > 1 ? 'flex' : 'none';
    } else if (initialData.wishlistItems) { // Data loaded, but empty
         document.getElementById('empty-state').style.display = 'block';
         document.getElementById('wishlist-container').innerHTML = ''; // Clear any placeholders
         document.getElementById('pagination-container').style.display = 'none';
         document.getElementById('results-summary').textContent = '0 items found.';

    } else {
        // If items weren't injected, fetch them initially
        applyFilters(); 
    }
});

/**
 * Populate filter checkboxes from backend data
 */
function populateFilterOptions(filtersData) {
    if (!filtersData) return;

    const filterMappings = {
        eras: 'era-filters',
        materials: 'material-filters',
        denominations: 'denomination-filters'
        // Add other filter types if needed
    };

    Object.keys(filterMappings).forEach(filterType => {
        const containerId = filterMappings[filterType];
        const container = document.getElementById(containerId);
        const options = filtersData[filterType];

        if (container && options && Array.isArray(options)) {
            container.innerHTML = ''; // Clear existing options
            options.forEach(option => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = filterType.slice(0, -1); // e.g., 'eras' -> 'era'
                checkbox.value = option.value;
                checkbox.checked = option.selected || false; // Use selected flag from data
                checkbox.setAttribute('data-filter-id', option.id || `${checkbox.name}-${option.value}`);

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${option.label}`));
                container.appendChild(label);
            });
        }
    });
}


/**
 * Initialize UI with data from backend
 */
function initializeUI(data) {
    // Update user information
    if (data.user) {
        const nicknameEl = document.getElementById('user-nickname');
        const rankEl = document.getElementById('user-rank');
        const avatarEl = document.getElementById('user-avatar-small');

        if (nicknameEl) nicknameEl.textContent = data.user.nickname || 'User';
        if (rankEl) rankEl.textContent = data.user.rank || 'Collector';
        if (avatarEl && data.user.avatarUrl) {
            avatarEl.src = data.user.avatarUrl;
            avatarEl.alt = data.user.nickname || 'User Avatar';
        }
    }
    
    // Apply any active filters passed from backend
    if (data.currentFilters && Object.keys(data.currentFilters).length > 0) {
        applyInitialFilters(data.currentFilters);
        // Ensure filter button indicates active filters
         const filterButton = document.querySelector('.btn-filter');
         if (filterButton) filterButton.classList.add('has-filters');
    }

    // Set initial sort order
     const sortSelect = document.getElementById('sort-select');
     if (sortSelect && data.currentSort) { // Assuming backend can pass currentSort
         sortSelect.value = data.currentSort;
     }

     // Set initial page size
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect && data.pagination?.pageSize) {
        itemsPerPageSelect.value = data.pagination.pageSize;
    }

}

/**
 * Apply initial filters from backend data (check boxes and create pills)
 */
function applyInitialFilters(filters) {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';
    let hasActiveFilters = false;

    Object.keys(filters).forEach(type => {
        // Ensure filter value is an array
        const values = Array.isArray(filters[type]) ? filters[type] : [filters[type]];

        values.forEach(value => {
            // Find the checkbox and check it
            const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
            
            // Add active filter pill
            const filterPill = createFilterPill(type, value);
            if (filterPill) {
                activeFiltersContainer.appendChild(filterPill);
                hasActiveFilters = true;
            }
        });
    });
     // Update filter button visual state
    const filterButton = document.querySelector('.btn-filter');
    if (filterButton) {
        filterButton.classList.toggle('has-filters', hasActiveFilters);
    }
}

/**
 * Create a filter pill element for the active filters display
 */
function createFilterPill(type, value) {
    const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
    // Gracefully handle if checkbox not found (e.g., filter applied via URL but not in current options)
    const labelText = checkbox ? checkbox.closest('label')?.textContent.trim() : value; 
    
    // Heuristic for better display name if checkbox isn't found
     const formattedType = type.charAt(0).toUpperCase() + type.slice(1);

    const filterPill = document.createElement('span');
    filterPill.className = 'active-filter-pill';
    filterPill.setAttribute('data-filter-type', type);
    filterPill.setAttribute('data-filter-value', value);
    // Use labelText which might be the raw value if label wasn't found
    filterPill.innerHTML = `${formattedType}: ${labelText} <span class="remove-filter" role="button" aria-label="Remove filter"><i class="fas fa-times"></i></span>`;
    
    // Add event listener for removal
    filterPill.querySelector('.remove-filter').addEventListener('click', function() {
        // Uncheck the corresponding checkbox if it exists
        if (checkbox) {
            checkbox.checked = false;
        }
        
        // Remove the pill visually
        filterPill.remove();
        
        // Re-fetch data with updated filters
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
    if (!wishlistContainer || viewButtons.length === 0) return;

    // Load saved preference if available
    const savedView = localStorage.getItem('wishlistViewPreference') || 'grid'; // Default to grid
    
    viewButtons.forEach(button => {
         const viewType = button.getAttribute('data-view');
         // Set initial active state based on saved preference
         button.classList.toggle('active', viewType === savedView);

        button.addEventListener('click', function() {
            const currentView = this.getAttribute('data-view');
            // Remove active class from all buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update wishlist container class
            wishlistContainer.className = 'wishlist-grid'; // Base class
             if (currentView === 'list') {
                 wishlistContainer.classList.add('list-view');
             }
            
            // Save preference to local storage
            localStorage.setItem('wishlistViewPreference', currentView);
        });
    });

     // Apply the initial view based on saved preference
     wishlistContainer.className = 'wishlist-grid'; // Base class
     if (savedView === 'list') {
         wishlistContainer.classList.add('list-view');
     }
}

/**
 * Initialize filter panel show/hide and action buttons
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
            // Optional: Add ARIA attribute toggling
             filterButton.setAttribute('aria-expanded', !isVisible);
             filterPanel.setAttribute('aria-hidden', isVisible);
        });
         // Set initial ARIA state
         filterButton.setAttribute('aria-expanded', 'false');
         filterPanel.setAttribute('aria-hidden', 'true');
    }
    
    // Apply filters button
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', function() {
            applyFilters();
            if (filterPanel) filterPanel.style.display = 'none'; // Hide panel after applying
             if (filterButton) filterButton.setAttribute('aria-expanded', 'false');
             if (filterPanel) filterPanel.setAttribute('aria-hidden', 'true');
        });
    }
    
    // Clear filters button
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', function() {
            clearFilters();
             // Optionally hide panel after clearing
             // if (filterPanel) filterPanel.style.display = 'none'; 
             // if (filterButton) filterButton.setAttribute('aria-expanded', 'false');
             // if (filterPanel) filterPanel.setAttribute('aria-hidden', 'true');
        });
    }
}

/**
 * Get selected filters, build query parameters, and fetch new data
 */
function applyFilters() {
    showLoading(true);
    
    // Get all selected filters from checkboxes
    const filters = getSelectedFilters();
    
    // Update the display of active filter pills
    updateActiveFiltersDisplay(filters);
    
    // Build query parameters object
    const params = buildFilterParams(filters);
    
    // Add sort parameter
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        params.sort = sortSelect.value;
    }
    
    // Add pagination parameters (page size, reset to page 1)
    const itemsPerPage = document.getElementById('items-per-page');
    if (itemsPerPage) {
        params.pageSize = itemsPerPage.value;
    }
    params.page = 1; // Always reset to first page when filters/sort change
    
    // Add search query if present
    const searchInput = document.getElementById('wishlist-search');
    if (searchInput && searchInput.value.trim()) {
        params.q = searchInput.value.trim();
    }
    
    // Fetch wishlist items with the constructed parameters
    fetchWishlistItems(params);
}

/**
 * Build query parameters object from filters object
 */
function buildFilterParams(filters) {
    const params = {};
    Object.keys(filters).forEach(type => {
        if (filters[type].length > 0) {
            // Send filter values as comma-separated string
            params[type] = filters[type].join(',');
        }
    });
    return params;
}

/**
 * Clear all filters, reset UI elements, and fetch unfiltered data
 */
function clearFilters() {
    // Uncheck all filter checkboxes within the filter panel
    const checkboxes = document.querySelectorAll('#filter-panel .filter-options input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear the active filters display area
    const activeFiltersContainer = document.getElementById('active-filters');
    if (activeFiltersContainer) {
        activeFiltersContainer.innerHTML = '';
    }
    
    // Reset sort dropdown to its default value (e.g., first option)
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.selectedIndex = 0; // Or set to a specific default value like 'priority-desc'
    }

     // Clear search input
     const searchInput = document.getElementById('wishlist-search');
     if (searchInput) {
         searchInput.value = '';
     }
    
    // Update filter button visual state (remove 'has-filters' class)
    const filterButton = document.querySelector('.btn-filter');
    if (filterButton) {
        filterButton.classList.remove('has-filters');
    }
    
    // Re-fetch data with no filters applied (will use default sort and page 1)
    applyFilters();
}

/**
 * Get all selected filters from filter panel checkboxes
 */
function getSelectedFilters() {
    const filters = {
        era: [],
        material: [],
        denomination: [],
        priority: []
        // Add other filter types if they exist in your panel
    };
    
    // Select all checked checkboxes within the filter panel
    const checkedCheckboxes = document.querySelectorAll('#filter-panel .filter-options input[type="checkbox"]:checked');
    
    checkedCheckboxes.forEach(checkbox => {
        const type = checkbox.getAttribute('name'); // e.g., 'era', 'material'
        const value = checkbox.getAttribute('value');
        
        // Check if the filter type exists in our filters object
        if (filters.hasOwnProperty(type)) {
            filters[type].push(value);
        }
    });
    
    return filters;
}

/**
 * Update the display of active filter pills based on selected filters
 */
function updateActiveFiltersDisplay(filters) {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;
    
    activeFiltersContainer.innerHTML = ''; // Clear existing pills
    let hasFilters = false;
    
    Object.keys(filters).forEach(type => {
        filters[type].forEach(value => {
            const filterPill = createFilterPill(type, value);
            if (filterPill) {
                activeFiltersContainer.appendChild(filterPill);
                hasFilters = true;
            }
        });
    });
    
    // Toggle filter button appearance based on whether any filters are active
    const filterButton = document.querySelector('.btn-filter');
    if (filterButton) {
        filterButton.classList.toggle('has-filters', hasFilters);
    }
}

/**
 * Set up search input and button event listeners
 */
function setupSearch() {
    const searchInput = document.getElementById('wishlist-search');
    const searchButton = document.getElementById('search-button');
    
    if (searchButton && searchInput) {
        // Search on button click
        searchButton.addEventListener('click', function() {
            applyFilters(); // Re-use applyFilters to include search term
        });
        
        // Search on pressing Enter in the input field
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default form submission if it's inside a form
                applyFilters();
            }
        });
    }
}

/**
 * Show or hide loading indicators
 */
function showLoading(show) {
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    const wishlistContainer = document.getElementById('wishlist-container');
     const resultsSummary = document.getElementById('results-summary');

    // Toggle placeholder visibility
    if (loadingPlaceholder) {
        loadingPlaceholder.style.display = show ? 'block' : 'none';
    }
    
    // Dim existing items while loading new ones
    if (wishlistContainer) {
        // Only dim if we are showing the loading state
        wishlistContainer.style.opacity = show ? 0.5 : 1;
        // Ensure interactions are disabled while dimmed
         wishlistContainer.style.pointerEvents = show ? 'none' : 'auto';
    }

     // Optionally update results summary during load
     if (resultsSummary && show) {
         resultsSummary.textContent = 'Loading items...';
     }
}

/**
 * Fetch wishlist items from the backend API using provided parameters
 */
function fetchWishlistItems(params = {}) {
    const apiEndpoint = window.domusData?.apiEndpoints?.getWishlist;
    if (!apiEndpoint) {
        console.error("API endpoint for getWishlist is not defined.");
        showLoading(false); // Hide loading state
        alert('Configuration error: Cannot load wishlist.');
        return;
    }
    
    // Build query string from parameters object
    const queryString = new URLSearchParams(params).toString();
    const url = `${apiEndpoint}${queryString ? `?${queryString}` : ''}`;
    
    showLoading(true); // Show loading state before fetching
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                // Throw an error with status text if response is not OK
                throw new Error(`Network response was not ok: ${response.statusText} (status: ${response.status})`);
            }
            return response.json(); // Parse JSON body
        })
        .then(data => {
            // Validate expected data structure
             if (!data || !Array.isArray(data.items) || !data.pagination) {
                 throw new Error("Invalid data structure received from API.");
             }

            // Update the UI with the received wishlist items
            updateWishlistDisplay(data.items);
            
            // Update pagination controls based on received pagination data
            updatePagination(data.pagination);
            
            // Hide loading state
            showLoading(false);
            
            // Show or hide the empty state message based on item count
            const emptyState = document.getElementById('empty-state');
            const wishlistContainer = document.getElementById('wishlist-container');
             const paginationContainer = document.getElementById('pagination-container');

             if (emptyState && wishlistContainer && paginationContainer) {
                 const hasItems = data.items.length > 0;
                 emptyState.style.display = hasItems ? 'none' : 'block';
                 // Ensure container is visible if items exist, might be hidden by empty state logic
                 wishlistContainer.style.display = hasItems ? (document.querySelector('.btn-view-toggle.active')?.getAttribute('data-view') === 'list' ? 'block' : 'grid') : 'none';
                 // Show pagination only if there's more than one page
                paginationContainer.style.display = data.pagination.totalPages > 1 ? 'flex' : 'none';
             }
        })
        .catch(error => {
            console.error('Error fetching wishlist items:', error);
            showLoading(false); // Hide loading state on error
            
            // Display user-friendly error message
             const resultsSummary = document.getElementById('results-summary');
             if(resultsSummary) resultsSummary.textContent = 'Error loading wishlist.';
             // Consider showing error within the wishlist container itself
             const wishlistContainer = document.getElementById('wishlist-container');
             if(wishlistContainer) wishlistContainer.innerHTML = `<p class="error-message">Could not load wishlist items. Please try again later.</p>`;
             document.getElementById('empty-state').style.display = 'none'; // Hide empty state on error
             document.getElementById('pagination-container').style.display = 'none'; // Hide pagination on error
        });
}

/**
 * Update the wishlist display area with new item data
 */
function updateWishlistDisplay(items) {
    const container = document.getElementById('wishlist-container');
    if (!container) return;
    
    // Remove existing items (excluding the loading placeholder)
    const existingItems = container.querySelectorAll('.wishlist-item:not(.loading-placeholder)');
    existingItems.forEach(item => item.remove());
    
    // Get the loading placeholder element
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    
    // Create and append new wishlist item elements
    if (items && items.length > 0) {
        items.forEach(item => {
            const itemElement = createWishlistItemElement(item);
            if (itemElement) {
                // Insert before the placeholder if it exists, otherwise append
                if (loadingPlaceholder) {
                    container.insertBefore(itemElement, loadingPlaceholder);
                } else {
                    container.appendChild(itemElement);
                }
            }
        });
         // Ensure container is visible after adding items
         container.style.display = document.querySelector('.btn-view-toggle.active')?.getAttribute('data-view') === 'list' ? 'block' : 'grid';

    } else {
         // If no items, ensure the container itself might need hiding if empty state handles it
         // container.style.display = 'none'; // Or let empty state logic handle visibility
    }

}

/**
 * Create a DOM element for a single wishlist item
 */
function createWishlistItemElement(item) {
    if (!item || !item.id) return null; // Basic validation

    const itemElement = document.createElement('div');
    itemElement.className = 'wishlist-item';
    // Add data attributes for potential filtering/sorting on the client side (if needed) or just for context
    itemElement.setAttribute('data-wishlist-id', item.id);
    itemElement.setAttribute('data-era', item.era || ''); 
    itemElement.setAttribute('data-material', item.material || ''); 
    itemElement.setAttribute('data-denomination', item.denomination || ''); 
    itemElement.setAttribute('data-priority', item.priority || 'low');
    itemElement.setAttribute('data-date-added', item.dateAdded || '');
    
    // Determine priority stars based on priority level
    let priorityStars = '<i class="fas fa-star"></i>'; // Default to low (1 star)
    if (item.priority === 'high') {
        priorityStars = '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>'; // 3 stars
    } else if (item.priority === 'medium') {
        priorityStars = '<i class="fas fa-star"></i><i class="fas fa-star"></i>'; // 2 stars
    }
    
    // Availability text and icon
    const availabilityHTML = item.isAvailable 
        ? '<i class="fas fa-check-circle"></i> Available' 
        : '<i class="far fa-clock"></i> Watching';
        
    // Alert status icon
    const alertStatusHTML = item.alertsEnabled 
        ? '<i class="fas fa-bell"></i>' 
        : '<i class="fas fa-bell-slash"></i>';

    // Default image if none provided
    const imageUrl = item.imageUrl || '/assets/images/coin-placeholder.jpg';

    // Construct inner HTML using template literals for readability
    itemElement.innerHTML = `
        <div class="priority-badge priority-${item.priority || 'low'}">
            ${priorityStars}
        </div>
        <div class="coin-images">
            <img src="${imageUrl}" alt="${item.title || 'Coin image'}" class="coin-image">
        </div>
        <div class="wishlist-info">
            <h3>${item.title || 'Untitled Wish'}</h3>
            <div class="coin-meta">
                <span class="denomination">${item.materialDisplay || ''} ${item.denominationDisplay || ''}</span>
                <span class="year">${item.yearDisplay || ''}</span>
            </div>
            <div class="coin-quick-data">
                <span class="coin-value">Est. ${item.estimatedValueDisplay || '$?.??'}</span>
                <div class="availability-status ${item.isAvailable ? 'available' : ''}">
                    ${availabilityHTML}
                </div>
            </div>
        </div>
        <div class="price-alert">
            <span class="max-price">Max: ${item.maxPriceDisplay || 'N/A'}</span>
            <span class="alert-status" title="${item.alertsEnabled ? 'Alerts Enabled' : 'Alerts Disabled'}">
                ${alertStatusHTML}
            </span>
        </div>
        <div class="wishlist-actions">
            <button class="btn-view-wish" data-wishlist-id="${item.id}" title="View Details"><i class="fas fa-search-plus"></i></button>
            <button class="btn-edit-wish" data-wishlist-id="${item.id}" title="Edit Wish"><i class="fas fa-edit"></i></button>
            <button class="btn-mark-acquired" data-wishlist-id="${item.id}" title="Mark as Acquired"><i class="fas fa-check"></i></button>
            <button class="btn-remove-wish" data-wishlist-id="${item.id}" title="Remove from Wishlist"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    // --- Add Event Listeners to Buttons ---
    const viewButton = itemElement.querySelector('.btn-view-wish');
    if (viewButton) {
        viewButton.addEventListener('click', (e) => {
             e.stopPropagation(); // Prevent triggering clicks on parent elements
            openWishItemDetail(item.id);
        });
    }
    
    const editButton = itemElement.querySelector('.btn-edit-wish');
    if (editButton) {
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openWishItemEdit(item.id);
        });
    }
    
    const acquireButton = itemElement.querySelector('.btn-mark-acquired');
    if (acquireButton) {
        acquireButton.addEventListener('click', (e) => {
             e.stopPropagation();
            markItemAsAcquired(item.id, itemElement); // Pass element for potential visual feedback
        });
    }
    
    const removeButton = itemElement.querySelector('.btn-remove-wish');
    if (removeButton) {
        removeButton.addEventListener('click', (e) => {
             e.stopPropagation();
            removeWishlistItem(item.id, itemElement); // Pass element for potential visual feedback
        });
    }
    
    return itemElement;
}


/**
 * Update pagination controls based on API response
 */
function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination-container');
    const pageNumbersContainer = document.getElementById('page-numbers');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const resultsSummary = document.getElementById('results-summary');

    if (!pagination || !paginationContainer || !pageNumbersContainer || !prevButton || !nextButton) {
        // Hide pagination if data is missing or elements aren't found
        if(paginationContainer) paginationContainer.style.display = 'none';
         if(resultsSummary) resultsSummary.textContent = ''; // Clear summary
        return;
    }

    // Show/hide pagination container based on total pages
    paginationContainer.style.display = pagination.totalPages > 1 ? 'flex' : 'none';

    if (pagination.totalPages <= 1) {
         if(resultsSummary) {
            resultsSummary.textContent = `${pagination.totalItems || 0} item${pagination.totalItems !== 1 ? 's' : ''} found.`;
        }
        return; // No need to build page numbers if only one page
    }

    // Update previous/next button states
    prevButton.disabled = pagination.currentPage <= 1;
    nextButton.disabled = pagination.currentPage >= pagination.totalPages;
    prevButton.setAttribute('aria-disabled', prevButton.disabled);
    nextButton.setAttribute('aria-disabled', nextButton.disabled);

    // Clear existing page numbers
    pageNumbersContainer.innerHTML = '';

    // --- Generate Pagination Logic (Example: with Ellipsis) ---
    const maxPagesToShow = 5; // Adjust as needed (total buttons: first, last, current, ellipsis, etc.)
    const currentPage = pagination.currentPage;
    const totalPages = pagination.totalPages;
    let pages = [];

    if (totalPages <= maxPagesToShow) {
        // Show all pages if total is small enough
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Logic for handling ellipsis
        pages.push(1); // Always show first page

        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage > 3) {
            pages.push('...'); // Ellipsis before current page range
        }

        // Adjust range if near the beginning or end
         if (currentPage <= 2) {
             startPage = 2;
             endPage = Math.min(totalPages - 1, 3);
         } else if (currentPage >= totalPages - 1) {
             startPage = Math.max(2, totalPages - 2);
             endPage = totalPages - 1;
         }


        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push('...'); // Ellipsis after current page range
        }

        pages.push(totalPages); // Always show last page
    }

    // Create and append page number buttons
    pages.forEach(page => {
        const button = document.createElement('button');
        if (page === '...') {
            button.textContent = '...';
            button.className = 'page-ellipsis';
            button.disabled = true;
            button.setAttribute('aria-hidden', 'true'); // Hide from screen readers
        } else {
            button.textContent = page;
            button.className = 'page-number'; // Use 'page-number' consistently
            button.setAttribute('data-page', page);
             button.setAttribute('aria-label', `Go to page ${page}`);
            if (page === currentPage) {
                button.classList.add('active');
                button.setAttribute('aria-current', 'page'); // Mark current page
            }
            button.addEventListener('click', function() {
                goToPage(page);
            });
        }
        pageNumbersContainer.appendChild(button);
    });

    // Update results summary text
    if (resultsSummary) {
        const startItem = Math.min(((currentPage - 1) * pagination.pageSize) + 1, pagination.totalItems);
        const endItem = Math.min(currentPage * pagination.pageSize, pagination.totalItems);
         if (pagination.totalItems > 0) {
            resultsSummary.textContent = `Showing ${startItem}-${endItem} of ${pagination.totalItems} items`;
         } else {
             resultsSummary.textContent = '0 items found.';
         }
    }
}


/**
 * Navigate to a specific page number
 */
function goToPage(page) {
    if (typeof page !== 'number' || page < 1) return;

    // Get current filters and parameters to maintain state
    const filters = getSelectedFilters();
    const params = buildFilterParams(filters);
    
    // Add current sort order
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        params.sort = sortSelect.value;
    }
    
    // Add current page size
    const itemsPerPage = document.getElementById('items-per-page');
    if (itemsPerPage) {
        params.pageSize = itemsPerPage.value;
    }
    
    // Add current search query if exists
    const searchInput = document.getElementById('wishlist-search');
    if (searchInput && searchInput.value.trim()) {
        params.q = searchInput.value.trim();
    }

    // Set the target page number
    params.page = page;
    
    // Fetch wishlist items for the target page
    fetchWishlistItems(params);

     // Optional: Scroll to top of list after page change
     const wishlistContainer = document.getElementById('wishlist-container');
     if (wishlistContainer) {
         wishlistContainer.scrollIntoView({ behavior: 'smooth' });
     }
}

/**
 * Set up event listeners for pagination controls (prev, next, page size)
 */
function setupPagination(initialPagination) {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            // Find current active page button to determine current page number
            const currentPageElement = document.querySelector('#page-numbers .page-number.active');
            const currentPage = currentPageElement ? parseInt(currentPageElement.getAttribute('data-page')) : 1;
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            const currentPageElement = document.querySelector('#page-numbers .page-number.active');
            const currentPage = currentPageElement ? parseInt(currentPageElement.getAttribute('data-page')) : 1;
            // Need total pages to check boundary - get from last page button or pagination data if stored
             const lastPageElement = document.querySelector('#page-numbers .page-number:last-child:not(.page-ellipsis)');
             const totalPages = lastPageElement ? parseInt(lastPageElement.getAttribute('data-page')) : currentPage; // Estimate if needed

            // A better way is to store totalPages from the last API response if possible
            // For now, assume the button's disabled state is correct
            if (!nextButton.disabled) { // Check if button is enabled
                 goToPage(currentPage + 1);
            }
        });
    }
    
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function() {
            // When page size changes, re-apply filters which resets to page 1
            applyFilters(); 
        });
        // Set initial value from data if provided
         if (initialPagination?.pageSize) {
             itemsPerPageSelect.value = initialPagination.pageSize;
         }
    }

     // Initial update based on provided data
     if (initialPagination) {
         updatePagination(initialPagination);
     }
}


/**
 * Set up event listeners for item detail modal (closing)
 */
function setupItemDetailModal() {
    const modal = document.getElementById('item-detail-modal');
    if (!modal) return;

    const closeButtons = modal.querySelectorAll('.close-modal');
    
    // Close modal on close button(s) click
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    // Close modal when clicking on the background overlay
    modal.addEventListener('click', function(event) {
        if (event.target === modal) { // Check if the click is directly on the modal background
            modal.style.display = 'none';
        }
    });

     // Close modal on Escape key press
     document.addEventListener('keydown', function(event) {
         if (event.key === 'Escape' && modal.style.display === 'block') {
             modal.style.display = 'none';
         }
     });
}

/**
 * Fetch item details and open the item detail modal
 */
function openWishItemDetail(itemId) {
    const modal = document.getElementById('item-detail-modal');
    const contentContainer = document.getElementById('item-detail-content');
    
    if (!modal || !contentContainer) {
        console.error("Item detail modal elements not found.");
        return;
    }

    // Show loading state inside the modal content area
    contentContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    // Display the modal
    modal.style.display = 'block';
    
    // Fetch item details from the API
    const baseApiEndpoint = window.domusData?.apiEndpoints?.getWishlistItem;
    if (!baseApiEndpoint) {
         console.error("API endpoint for getWishlistItem not defined.");
         contentContainer.innerHTML = '<div class="error-message">Configuration error. Cannot load item details.</div>';
         return;
    }
    const apiEndpoint = baseApiEndpoint.replace(':id', itemId); // Replace placeholder

    fetch(apiEndpoint)
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
             if (!data || !data.item) { // Assuming API returns { item: {...} }
                 throw new Error("Invalid item data received from API.");
             }
            // Generate HTML for the item details and update modal content
            contentContainer.innerHTML = generateItemDetailHTML(data.item);
            
            // Set up event listeners for action buttons inside the modal
            setupModalActionButtons(data.item);
        })
        .catch(error => {
            console.error('Error fetching item details:', error);
            // Display error message inside the modal content area
            contentContainer.innerHTML = '<div class="error-message">Failed to load item details. Please try again later.</div>';
        });
}


/**
 * Generate HTML content for the item detail modal
 */
function generateItemDetailHTML(item) {
    if (!item) return '<p class="error-message">Item data is missing.</p>';

     // Determine priority stars
     let priorityStars = '<i class="fas fa-star"></i>'; // Default low
     if (item.priority === 'high') priorityStars = '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>';
     else if (item.priority === 'medium') priorityStars = '<i class="fas fa-star"></i><i class="fas fa-star"></i>';

    // Safely format date
    let dateAddedFormatted = 'N/A';
    if (item.dateAdded) {
        try {
            dateAddedFormatted = new Date(item.dateAdded).toLocaleDateString();
        } catch (e) {
            console.error("Error formatting dateAdded:", item.dateAdded, e);
        }
    }

     // Handle optional fields gracefully
     const descriptionHTML = item.description ? `<p>${item.description.replace(/\n/g, '<br>')}</p>` : '<p>No description available.</p>';
     const notesHTML = item.notes ? `<div class="item-notes"><h3>Notes</h3><p>${item.notes.replace(/\n/g, '<br>')}</p></div>` : '';
     const mainImageUrl = item.imageUrl || '/assets/images/coin-placeholder.jpg';
     const additionalImagesHTML = item.additionalImages && item.additionalImages.length > 0
         ? `<div class="thumbnail-images">
              ${item.additionalImages.map(img => `<img src="${img}" alt="${item.title || 'Coin'} view" loading="lazy">`).join('')}
            </div>`
         : '';


    return `
        <div class="item-detail-header">
            <h2>${item.title || 'Wishlist Item'}</h2>
            <div class="priority-badge priority-${item.priority || 'low'}" title="Priority: ${item.priority || 'low'}">
                ${priorityStars}
            </div>
        </div>
        <div class="item-detail-body">
            <div class="item-detail-gallery">
                 <div class="main-image">
                    <img src="${mainImageUrl}" alt="${item.title || 'Coin image'}">
                 </div>
                 ${additionalImagesHTML}
            </div>
            <div class="item-detail-info">
                <h3>Details</h3>
                <div class="item-attributes">
                    <div class="attribute"><span class="label">Era:</span> <span class="value">${item.eraDisplay || 'N/A'}</span></div>
                    <div class="attribute"><span class="label">Material:</span> <span class="value">${item.materialDisplay || 'N/A'}</span></div>
                    <div class="attribute"><span class="label">Denomination:</span> <span class="value">${item.denominationDisplay || 'N/A'}</span></div>
                    <div class="attribute"><span class="label">Year:</span> <span class="value">${item.yearDisplay || 'N/A'}</span></div>
                    <div class="attribute"><span class="label">Est. Value:</span> <span class="value">${item.estimatedValueDisplay || 'N/A'}</span></div>
                    <div class="attribute"><span class="label">Max Price Alert:</span> <span class="value">${item.maxPriceDisplay || 'N/A'} ${item.alertsEnabled ? '<i class="fas fa-bell" title="Alerts Enabled"></i>' : '<i class="fas fa-bell-slash" title="Alerts Disabled"></i>'}</span></div>
                    <div class="attribute"><span class="label">Date Added:</span> <span class="value">${dateAddedFormatted}</span></div>
                     <div class="attribute"><span class="label">Status:</span> <span class="value ${item.isAvailable ? 'available' : ''}">${item.isAvailable ? '<i class="fas fa-check-circle"></i> Available' : '<i class="far fa-clock"></i> Watching'}</span></div>
                </div>
                 <div class="item-description">
                    <h3>Description</h3>
                    ${descriptionHTML}
                 </div>
                ${notesHTML}
            </div>
        </div>
        <div class="item-detail-actions">
            <button class="btn btn-primary btn-edit-wish" data-wishlist-id="${item.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-success btn-mark-acquired" data-wishlist-id="${item.id}">
                <i class="fas fa-check"></i> Mark as Acquired
            </button>
            <button class="btn btn-danger btn-remove-wish" data-wishlist-id="${item.id}">
                <i class="fas fa-trash"></i> Remove
            </button>
             <button class="btn btn-secondary close-modal-button">Close</button> <!-- Added close button -->
        </div>
    `;
}


/**
 * Set up event listeners for action buttons within the item detail modal
 */
function setupModalActionButtons(item) {
    if (!item || !item.id) return;

    const modal = document.getElementById('item-detail-modal');
    if (!modal) return;

    const editButton = modal.querySelector(`.item-detail-actions .btn-edit-wish[data-wishlist-id="${item.id}"]`);
    const acquireButton = modal.querySelector(`.item-detail-actions .btn-mark-acquired[data-wishlist-id="${item.id}"]`);
    const removeButton = modal.querySelector(`.item-detail-actions .btn-remove-wish[data-wishlist-id="${item.id}"]`);
     const closeButton = modal.querySelector('.item-detail-actions .close-modal-button'); // Find the new close button


    if (editButton) {
        editButton.addEventListener('click', function() {
            // Close the detail modal before opening the edit modal
            modal.style.display = 'none';
            openWishItemEdit(item.id);
        });
    }
    
    if (acquireButton) {
        acquireButton.addEventListener('click', function() {
            // Pass the modal itself to potentially close it on success
            markItemAsAcquired(item.id, null, modal); 
        });
    }
    
    if (removeButton) {
        removeButton.addEventListener('click', function() {
             // Pass the modal itself to potentially close it on success
            removeWishlistItem(item.id, null, modal);
        });
    }

     if (closeButton) {
         closeButton.addEventListener('click', function() {
             modal.style.display = 'none';
         });
     }
}


/**
 * Fetch item data and populate the add/edit form modal for editing
 */
function openWishItemEdit(itemId) {
    const addWishModal = document.getElementById('add-wish-modal');
    if (!addWishModal) { console.error("Add/Edit modal not found."); return; }

    const modalTitle = addWishModal.querySelector('.modal-title');
    const form = document.getElementById('add-wish-form');
    const submitButton = form?.querySelector('button[type="submit"]');
    
    if (!form || !modalTitle || !submitButton) {
        console.error("Required elements within Add/Edit modal not found.");
        return;
    }

    // Configure modal for "Edit" mode
    modalTitle.textContent = 'Edit Wishlist Item';
    submitButton.textContent = 'Update Item';
    form.classList.add('loading'); // Indicate loading state
    submitButton.disabled = true; // Disable submit while loading

    // Clear previous hidden ID just in case
    const existingItemIdField = form.elements['item-id'];
     if (existingItemIdField) {
         existingItemIdField.value = '';
     }

    // Fetch item data from API
    const baseApiEndpoint = window.domusData?.apiEndpoints?.getWishlistItem;
     if (!baseApiEndpoint) {
          console.error("API endpoint for getWishlistItem not defined.");
          alert('Configuration error: Cannot load item details for editing.');
          form.classList.remove('loading');
          submitButton.disabled = false;
          return;
     }
    const apiEndpoint = baseApiEndpoint.replace(':id', itemId);

    fetch(apiEndpoint)
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
             if (!data || !data.item) {
                 throw new Error("Invalid item data received for editing.");
             }
             const itemData = data.item;

            // Populate form fields with the fetched item data
            form.elements['title'].value = itemData.title || '';
            form.elements['era'].value = itemData.era || '';
            form.elements['material'].value = itemData.material || '';
            form.elements['denomination'].value = itemData.denomination || '';
            form.elements['year'].value = itemData.year || '';
            // Ensure numeric fields handle potential string values from API or nulls
            form.elements['estimated-value'].value = itemData.estimatedValue != null ? Number(itemData.estimatedValue) : '';
            form.elements['max-price'].value = itemData.maxPrice != null ? Number(itemData.maxPrice) : '';
            form.elements['priority'].value = itemData.priority || 'low';
            form.elements['description'].value = itemData.description || '';
            form.elements['notes'].value = itemData.notes || '';
            
            // Set the item ID in a hidden field (create if doesn't exist)
            let itemIdField = form.elements['item-id'];
            if (!itemIdField) {
                itemIdField = document.createElement('input');
                itemIdField.type = 'hidden';
                itemIdField.name = 'item-id';
                form.appendChild(itemIdField); // Append inside the form
            }
            itemIdField.value = itemId; // Set the ID for the update operation
            
            // Remove loading state and enable submit
            form.classList.remove('loading');
            submitButton.disabled = false;
            
            // Display the modal
            addWishModal.style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching item details for edit:', error);
            alert('Failed to load item details for editing. Please try again.');
            form.classList.remove('loading'); // Ensure loading state is removed on error
            submitButton.disabled = false; // Re-enable button on error
             // Optionally close the modal or show error within it
             // addWishModal.style.display = 'none'; 
        });
}


/**
 * Send request to mark an item as acquired
 * @param {string} itemId - The ID of the item to mark.
 * @param {HTMLElement|null} itemElement - Optional DOM element for visual feedback.
 * @param {HTMLElement|null} modalToClose - Optional modal element to close on success.
 */
function markItemAsAcquired(itemId, itemElement = null, modalToClose = null) {
    if (!confirm('Are you sure you want to mark this item as acquired? It will be moved to your collection and removed from the wishlist.')) {
        return; // User cancelled
    }
    
    // Optional: Provide immediate visual feedback
    if (itemElement) {
        itemElement.style.opacity = '0.5';
        itemElement.style.pointerEvents = 'none'; // Disable further interaction
    } else {
        // If no specific element, show global loading state
        showLoading(true);
    }
    
    const baseApiEndpoint = window.domusData?.apiEndpoints?.markAsAcquired;
     if (!baseApiEndpoint) {
         console.error("API endpoint for markAsAcquired not defined.");
         alert('Configuration error: Cannot mark item as acquired.');
         if (itemElement) { // Revert visual feedback
             itemElement.style.opacity = '1';
             itemElement.style.pointerEvents = 'auto';
         } else {
             showLoading(false);
         }
         return;
     }
    const apiEndpoint = baseApiEndpoint.replace(':id', itemId);

    // Get CSRF token if needed by your backend
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const headers = {
        'Content-Type': 'application/json',
        // Add CSRF token header if it exists
        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }) 
    };

    fetch(apiEndpoint, {
        method: 'POST', // Typically POST for actions like this
        headers: headers
        // No body needed if the action is identified by the URL
    })
    .then(response => {
        // Check if response is OK, otherwise parse error JSON if possible
         if (!response.ok) {
             return response.json().then(err => { throw new Error(err.message || `Failed with status: ${response.statusText}`); });
         }
         return response.json(); // Assuming success returns JSON like { success: true, message: "..." }
    })
    .then(data => {
        if (data.success) {
            // Close the detail modal if it was passed and is open
            if (modalToClose && modalToClose.style.display === 'block') {
                modalToClose.style.display = 'none';
            }
            
            // Refresh the wishlist view to remove the item
            // Using applyFilters() re-fetches data based on current filters/sort/page
            applyFilters(); 
            
            // Show a success message to the user
            // Consider using a less intrusive notification system than alert()
            alert('Item successfully marked as acquired and moved to your collection!');
        } else {
            // Handle cases where API returns success: false or specific error message
            throw new Error(data.message || 'The server indicated the operation failed.');
        }
    })
    .catch(error => {
        console.error('Error marking item as acquired:', error);
        alert(`Failed to mark item as acquired: ${error.message}. Please try again.`);
        // Revert visual feedback on error
        if (itemElement) {
            itemElement.style.opacity = '1';
            itemElement.style.pointerEvents = 'auto';
        } else {
            showLoading(false); // Hide global loading state
        }
    });
}


/**
 * Send request to remove an item from the wishlist
 * @param {string} itemId - The ID of the item to remove.
 * @param {HTMLElement|null} itemElement - Optional DOM element for visual feedback.
 * @param {HTMLElement|null} modalToClose - Optional modal element to close on success.
 */
function removeWishlistItem(itemId, itemElement = null, modalToClose = null) {
    if (!confirm('Are you sure you want to permanently remove this item from your wishlist?')) {
        return; // User cancelled
    }
    
     // Optional: Provide immediate visual feedback
    if (itemElement) {
        itemElement.style.opacity = '0.5';
        itemElement.style.pointerEvents = 'none';
    } else {
        showLoading(true); // Show global loading state
    }

    const baseApiEndpoint = window.domusData?.apiEndpoints?.deleteWishlistItem; // Corrected key
     if (!baseApiEndpoint) {
         console.error("API endpoint for deleteWishlistItem not defined.");
         alert('Configuration error: Cannot remove item.');
         if (itemElement) { // Revert visual feedback
             itemElement.style.opacity = '1';
             itemElement.style.pointerEvents = 'auto';
         } else {
             showLoading(false);
         }
         return;
     }
    const apiEndpoint = baseApiEndpoint.replace(':id', itemId);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const headers = {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
    };

    fetch(apiEndpoint, {
        method: 'DELETE', // Use DELETE method for removal
        headers: headers
    })
     .then(response => {
         if (!response.ok) {
              // Attempt to parse error message from JSON response, fallback to status text
              return response.json().catch(() => null).then(err => { // Catch potential JSON parsing errors
                  throw new Error(err?.message || `Failed with status: ${response.statusText}`);
              });
         }
          // Check for empty response body on success (common for DELETE)
          // Or parse JSON if success response includes data
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
              return response.json();
          } else {
              return { success: true }; // Assume success if response is OK and not JSON
          }
     })
    .then(data => {
        // Ensure data exists and indicates success, even if it was inferred
         if (data && data.success !== false) { // Check for explicit failure
            // Close the detail modal if it was passed
            if (modalToClose && modalToClose.style.display === 'block') {
                modalToClose.style.display = 'none';
            }
            
            // Refresh the wishlist view
            applyFilters();
            
            alert('Item successfully removed from wishlist!');
        } else {
             // Handle explicit failure message from API
            throw new Error(data?.message || 'The server indicated the removal failed.');
        }
    })
    .catch(error => {
        console.error('Error removing wishlist item:', error);
        alert(`Failed to remove item: ${error.message}. Please try again.`);
        // Revert visual feedback on error
        if (itemElement) {
            itemElement.style.opacity = '1';
            itemElement.style.pointerEvents = 'auto';
        } else {
            showLoading(false); // Hide global loading state
        }
    });
}


/**
 * Set up the add wishlist item button and modal functionality
 */
function setupAddWishForm() {
    const addButton = document.getElementById('add-wish-button');
    const emptyStateAddButton = document.getElementById('empty-add-wish-btn');
    const modal = document.getElementById('add-wish-modal');
    
    if (!modal) { console.error("Add/Edit modal not found."); return; }

    const form = document.getElementById('add-wish-form');
    const closeButtons = modal.querySelectorAll('.close-modal, .form-actions .btn-secondary'); // Target specific close triggers
    const modalTitle = modal.querySelector('.modal-title');
    const submitButton = form?.querySelector('button[type="submit"]');

    const openAddModal = function() {
        if (!form || !modalTitle || !submitButton) {
             console.error("Required elements within Add/Edit modal not found for Add operation.");
             return;
         }
        // Reset form fields to default values
        form.reset(); 
        
        // Clear any hidden item ID field left over from an edit operation
        const itemIdField = form.elements['item-id'];
        if (itemIdField) {
            itemIdField.value = ''; // Ensure it's empty for 'add' mode
        }
        
        // Configure modal for "Add" mode
        modalTitle.textContent = 'Add New Wishlist Item';
        submitButton.textContent = 'Add Item';
        submitButton.disabled = false; // Ensure button is enabled
         form.classList.remove('loading', 'submitting'); // Clear any lingering state classes

        // Display the modal
        modal.style.display = 'block';
         // Focus the first input field for better UX
         const firstInput = form.querySelector('input:not([type="hidden"]), select, textarea');
         if(firstInput) firstInput.focus();
    };

    // Open modal on header add button click
    if (addButton) {
        addButton.addEventListener('click', openAddModal);
    }
    // Open modal on empty state add button click
    if (emptyStateAddButton) {
        emptyStateAddButton.addEventListener('click', openAddModal);
    }
    
    // Close modal on close button(s) click
    if (closeButtons) {
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        });
    }
    
    // Close modal when clicking outside the modal content
    modal.addEventListener('click', function(event) {
        if (event.target === modal) { // Check if click is directly on the modal background
            modal.style.display = 'none';
        }
    });

     // Close modal on Escape key press
     document.addEventListener('keydown', function(event) {
         if (event.key === 'Escape' && modal.style.display === 'block') {
             modal.style.display = 'none';
         }
     });
    
    // Handle form submission via the submit event
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default HTML form submission
            submitWishlistForm(form); // Call the function to handle API submission
        });
    }
}


/**
 * Handle the submission of the add/edit wishlist form
 */
function submitWishlistForm(form) {
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    
    // Indicate submission state
    form.classList.add('submitting');
    if (submitButton) {
        submitButton.disabled = true;
        // Optional: Change button text during submission
         const originalButtonText = submitButton.textContent;
         submitButton.textContent = 'Saving...';
    }
    
    // Get form data using FormData API
    const formData = new FormData(form);
    // Convert FormData to a plain JavaScript object for JSON stringification
     // Note: FormData doesn't include disabled fields or the submit button itself
    const itemData = {};
     formData.forEach((value, key) => {
         // Basic handling for potential numeric fields if needed, though backend should validate
         // const numericFields = ['estimated-value', 'max-price'];
         // itemData[key] = numericFields.includes(key) && value !== '' ? Number(value) : value;
         itemData[key] = value; 
     });

    // Determine if it's an ADD or EDIT operation based on hidden item-id field
    const itemId = formData.get('item-id');
    const isEdit = itemId && itemId !== '';
    
    // Select the appropriate API endpoint and HTTP method
    let apiEndpoint = isEdit 
        ? window.domusData?.apiEndpoints?.updateWishlistItem 
        : window.domusData?.apiEndpoints?.addWishlistItem;
    const method = isEdit ? 'PUT' : 'POST';

     // Check if endpoint is defined
     if (!apiEndpoint) {
         console.error(`API endpoint for ${isEdit ? 'update' : 'add'} WishlistItem not defined.`);
         alert('Configuration error: Cannot save item.');
         form.classList.remove('submitting');
         if (submitButton) {
             submitButton.disabled = false;
             submitButton.textContent = originalButtonText; // Restore button text
         }
         return;
     }

    // Replace :id placeholder if editing
    if (isEdit) {
        apiEndpoint = apiEndpoint.replace(':id', itemId);
         // Remove item-id from the data payload itself if backend doesn't expect it in body for PUT
         // delete itemData['item-id']; 
    } else {
         // Ensure item-id is not sent for POST if it somehow exists
         delete itemData['item-id'];
    }


    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // Indicate we expect JSON back
        ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
    };

    // Send the request to the API
    fetch(apiEndpoint, {
        method: method,
        headers: headers,
        body: JSON.stringify(itemData) // Send data as JSON string
    })
    .then(response => {
         // Check response status and parse JSON, throwing error if not OK
         if (!response.ok) {
              return response.json().catch(() => null).then(err => {
                  // Construct a meaningful error message
                  const message = err?.message || (err && Object.values(err).join(', ')) || `Request failed with status ${response.status}`;
                  throw new Error(message);
              });
         }
         return response.json(); // Parse success JSON
    })
    .then(data => {
        if (data.success) {
            // Close the add/edit modal on success
            const modal = document.getElementById('add-wish-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Refresh the wishlist display to show the new/updated item
            // applyFilters() re-fetches based on current settings
            applyFilters(); 
            
            // Show success message
            alert(isEdit ? 'Item updated successfully!' : 'Item added successfully to wishlist!');
        } else {
            // Handle cases where API returns success: false or specific error messages
            throw new Error(data.message || 'Server indicated the save operation failed.');
        }
    })
    .catch(error => {
        console.error('Error submitting wishlist form:', error);
        // Display a user-friendly error message, potentially incorporating the error details
        alert(`Failed to save item: ${error.message}. Please check your input and try again.`);
    })
    .finally(() => {
        // Always remove submitting state and re-enable button, regardless of success/failure
        form.classList.remove('submitting');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText; // Restore original button text
        }
    });
}