/**
 * Domus Settings Page JavaScript
 * Handles all interactive functionality for the Imperium Roma settings page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings functionality
    initSettings();
});

/**
 * Initialize all settings page functionality
 */
function initSettings() {
    initTabNavigation();
    initThemePreview();
    initToggleHandlers();
    initFormSubmissions();
    initPasswordValidation();
    initAccountDeletion();
    initTwoFactorAuth();
}

/**
 * Handle tab navigation between settings sections
 */
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const settingsSections = document.querySelectorAll('.settings-section');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            settingsSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding section
            this.classList.add('active');
            const targetSection = this.getAttribute('data-tab');
            document.getElementById(targetSection).classList.add('active');
            
            // Store current tab in local storage
            localStorage.setItem('domusActiveSettingsTab', targetSection);
        });
    });
    
    // Check if there's a stored tab preference
    const storedTab = localStorage.getItem('domusActiveSettingsTab');
    if (storedTab) {
        const targetButton = document.querySelector(`.tab-button[data-tab="${storedTab}"]`);
        if (targetButton) {
            targetButton.click();
        }
    }
}

/**
 * Handle theme preview functionality
 */
function initThemePreview() {
    const themeSelect = document.getElementById('theme-select');
    const themePreview = document.getElementById('theme-preview');
    
    if (themeSelect && themePreview) {
        // Update preview when theme selection changes
        themeSelect.addEventListener('change', function() {
            updateThemePreview(this.value);
        });
        
        // Initialize with current selection
        updateThemePreview(themeSelect.value);
    }
    
    function updateThemePreview(theme) {
        // Set data attribute for CSS styling
        themePreview.setAttribute('data-theme', theme);
        
        // Additional visual changes based on theme
        switch(theme) {
            case 'light':
                themePreview.querySelector('.preview-header').style.color = '#222';
                break;
            case 'dark':
                themePreview.querySelector('.preview-header').style.color = '#ffcc00';
                break;
            case 'imperial':
                themePreview.querySelector('.preview-header').style.color = '#ffcc00';
                break;
            case 'republican':
                themePreview.querySelector('.preview-header').style.color = '#c0c0c0';
                break;
            case 'system':
                // Check system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    themePreview.setAttribute('data-theme', 'dark');
                    themePreview.querySelector('.preview-header').style.color = '#ffcc00';
                } else {
                    themePreview.setAttribute('data-theme', 'light');
                    themePreview.querySelector('.preview-header').style.color = '#222';
                }
                break;
        }
    }
}

/**
 * Handle toggle switches behavior
 */
function initToggleHandlers() {
    // Two-Factor Authentication toggle
    const tfaToggle = document.getElementById('tfa-toggle');
    const tfaSetupSection = document.getElementById('tfa-setup-section');
    
    if (tfaToggle && tfaSetupSection) {
        tfaToggle.addEventListener('change', function() {
            if (this.checked) {
                tfaSetupSection.classList.remove('hidden');
                tfaSetupSection.classList.add('visible');
                showToast('Two-factor authentication enabled. Please complete setup.', 'info');
            } else {
                // Show confirmation before disabling 2FA
                if (tfaSetupSection.classList.contains('visible')) {
                    if (confirm('Are you sure you want to disable two-factor authentication? This will reduce your account security.')) {
                        tfaSetupSection.classList.remove('visible');
                        tfaSetupSection.classList.add('hidden');
                        showToast('Two-factor authentication disabled', 'warning');
                    } else {
                        this.checked = true;
                    }
                }
            }
        });
    }
}

/**
 * Handle form submissions
 */
function initFormSubmissions() {
    // Personal Info Form
    const personalInfoForm = document.getElementById('personal-info-form');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulate API call
            simulateLoading(this.querySelector('button[type="submit"]'));
            
            setTimeout(() => {
                // Update displayed user data in sidebar and header
                const displayName = document.getElementById('display-name').value;
                const userNicknameElements = document.querySelectorAll('[data-user-nickname]');
                userNicknameElements.forEach(el => {
                    el.textContent = displayName;
                });
                
                showToast('Personal information updated successfully', 'success');
            }, 1000);
        });
    }
    
    // Password Form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 8) {
                showToast('Password must be at least 8 characters long', 'error');
                return;
            }
            
            if (!/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
                showToast('Password must contain numbers and special characters', 'error');
                return;
            }
            
            // Simulate API call
            simulateLoading(this.querySelector('button[type="submit"]'));
            
            setTimeout(() => {
                showToast('Password updated successfully', 'success');
                this.reset();
            }, 1500);
        });
    }
    
    // Notification Settings
    const saveNotificationBtn = document.getElementById('save-notification-settings');
    if (saveNotificationBtn) {
        saveNotificationBtn.addEventListener('click', function() {
            // Simulate API call
            simulateLoading(this);
            
            setTimeout(() => {
                showToast('Notification preferences saved', 'success');
            }, 1000);
        });
    }
    
    // Display Settings
    const saveDisplayBtn = document.getElementById('save-display-settings');
    if (saveDisplayBtn) {
        saveDisplayBtn.addEventListener('click', function() {
            // Simulate API call
            simulateLoading(this);
            
            setTimeout(() => {
                const selectedTheme = document.getElementById('theme-select').value;
                document.documentElement.setAttribute('data-theme', selectedTheme);
                
                const fontSize = document.getElementById('font-size-select').value;
                document.documentElement.setAttribute('data-font-size', fontSize);
                
                showToast('Display settings saved', 'success');
            }, 1000);
        });
    }
    
    // Collection Settings
    const saveCollectionBtn = document.getElementById('save-collection-settings');
    if (saveCollectionBtn) {
        saveCollectionBtn.addEventListener('click', function() {
            // Simulate API call
            simulateLoading(this);
            
            setTimeout(() => {
                showToast('Collection settings saved', 'success');
            }, 1000);
        });
    }
}

/**
 * Handle password validation
 */
function initPasswordValidation() {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (newPasswordInput && confirmPasswordInput) {
        // Check password strength
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Simple password strength checker
            if (password.length === 0) {
                this.style.borderColor = '';
                return;
            }
            
            // Check password strength
            let strength = 0;
            if (password.length >= 8) strength += 1;
            if (password.match(/[A-Z]/)) strength += 1;
            if (password.match(/[0-9]/)) strength += 1;
            if (password.match(/[^A-Za-z0-9]/)) strength += 1;
            
            // Update visual feedback
            if (strength < 2) {
                this.style.borderColor = '#ff4747';
            } else if (strength === 2) {
                this.style.borderColor = '#ffaa00';
            } else if (strength === 3) {
                this.style.borderColor = '#ffcc00';
            } else {
                this.style.borderColor = '#4CAF50';
            }
        });
        
        // Check password match
        confirmPasswordInput.addEventListener('input', function() {
            const password = newPasswordInput.value;
            const confirmPassword = this.value;
            
            if (confirmPassword.length === 0) {
                this.style.borderColor = '';
                return;
            }
            
            if (password === confirmPassword) {
                this.style.borderColor = '#4CAF50';
            } else {
                this.style.borderColor = '#ff4747';
            }
        });
    }
}

/**
 * Handle account deletion functionality
 */
function initAccountDeletion() {
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            // Create and show modal
            showDeleteAccountModal();
        });
    }
    
    function showDeleteAccountModal() {
        // Create modal elements if they don't exist
        if (!document.getElementById('delete-account-modal')) {
            const modalHTML = `
                <div class="modal-overlay" id="delete-account-modal">
                    <div class="modal-container">
                        <div class="modal-header">
                            <h3 class="modal-title"><i class="fas fa-exclamation-triangle"></i> Delete Account</h3>
                            <button class="close-modal" id="close-modal"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <p>This action cannot be undone. All your data will be permanently deleted.</p>
                            <p>Please type "<b>DELETE MY ACCOUNT</b>" to confirm:</p>
                            <div class="confirmation-input">
                                <input type="text" id="delete-confirmation" placeholder="Type DELETE MY ACCOUNT">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-modal-cancel" id="cancel-delete">Cancel</button>
                            <button class="btn-confirm-delete" id="confirm-delete" disabled>Delete Account</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners
            const modal = document.getElementById('delete-account-modal');
            const closeBtn = document.getElementById('close-modal');
            const cancelBtn = document.getElementById('cancel-delete');
            const confirmInput = document.getElementById('delete-confirmation');
            const confirmBtn = document.getElementById('confirm-delete');
            
            const closeModal = () => {
                modal.classList.remove('active');
                setTimeout(() => {
                    confirmInput.value = '';
                    confirmBtn.disabled = true;
                }, 300);
            };
            
            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);
            
            confirmInput.addEventListener('input', function() {
                confirmBtn.disabled = this.value !== 'DELETE MY ACCOUNT';
            });
            
            confirmBtn.addEventListener('click', function() {
                // Simulate API call
                simulateLoading(this);
                
                setTimeout(() => {
                    closeModal();
                    showToast('Account successfully deleted. Redirecting to homepage...', 'info');
                    
                    // Simulate redirect after toast
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                }, 2000);
            });
        }
        
        // Show modal
        const modal = document.getElementById('delete-account-modal');
        modal.classList.add('active');
    }
}

/**
 * Handle two-factor authentication setup
 */
function initTwoFactorAuth() {
    const setupTfaBtn = document.getElementById('setup-tfa-btn');
    
    if (setupTfaBtn) {
        setupTfaBtn.addEventListener('click', function() {
            // In a real app, this would show a QR code and verification form
            showTfaSetupModal();
        });
    }
    
    function showTfaSetupModal() {
        // Create modal for 2FA setup if it doesn't exist
        if (!document.getElementById('tfa-setup-modal')) {
            const modalHTML = `
                <div class="modal-overlay" id="tfa-setup-modal">
                    <div class="modal-container">
                        <div class="modal-header">
                            <h3 class="modal-title"><i class="fas fa-shield-alt"></i> Set Up Two-Factor Authentication</h3>
                            <button class="close-modal" id="close-tfa-modal"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <p>Scan this QR code with your authenticator app:</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAD1ElEQVR4nO3dwW4UORBF0ZuF//9lshlpNOoQ4lTZdeo9ywoRXB9LJun1AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYLDXq/4D+LlPBpc37d9T/qbXp84I/KH+6/XuBEzvWjwhsZbz8zxO8Cck1aSfQo+QWMr5uZ4C8gpJNekn86MnVlKOKfzng5DIyeeoQ3KFxErKMYX/XBkSGTk/Z9eszpDc1ZTX98K/Q3L2d7ZPjs/3Z6/+w6Upv9hpt/47L1Tju3efKE0JyOmn1ts/92YQkjnST7jVTK7epKtDcvqE6770yJCBWUmfbS6zuvLzPgmJ7EJ9c/oEXP0UV4TkoXT1YhhlnQLpt+hXmLLUEzkhr21SDGadWAt5bRNiIOv0W8xrSw9Av0CDnN+bHoA+gQa5vzc9AL0CDfJ/b3oAegQaFPje9AD0BzQo9L3pAegNaFDwe9MD0BfQoPD3pgeQL9Cg+PemB5At0KDK96YHkCvQoNL3pgeQKdCg2vemB5An0KDq96YHkCXQoPr3pgeQI9CgifemB5Ah0KCp96YHoC/QoMn3pgegK9Cg6femB6An0KDp96YHoCPQoI33pgcwX6BBW+9ND2C2QIM235sewFyBBm2/Nz2AmQINGnFvegDzBBo05t70AOYINGjUvekB9Bdp0Kh70wPoLdSgUfemB9BXqEGj7k0PoKdgg0bdmx5AP8EGjbo3PYBegg0adW96AH0EGzTq3vQA+gg2aNS96QH0EGzQqHvTA6gXbNCoe9MDqBVs0Kh70wOoE2zQqHvTA6gRbNCoe9MDqBFs0Kh70wM4L9SgUfemB3BWqEGj7k0P4JxQg0bdmx7AG5/LDQo1aNS96QGcEWzQqHvTAzgj1KBR96YHcEawQaPuTQ/gjFCDRt2bHsAZwQaNujc9gDNCDRp1b3oAZ4QaNOre9ADOCDVo1L3pAZwRatC0e7/+pf5yvugP+M/pAZwRatC0e9MTOCPQoIn3pidwRqBBU+9NT+CMQIMm35uewBmBBk2/Nz2BM8INGn9vegJnhBs04t70BM4IN2jMvekJnBFu0Kh70xM4I9ygcfemJ3BGuEEj701P4Ixwg8bemx5AlXCDRt+bHkCVcING35seQJVwg0bfmx5AlXCDRt+bHkCVcING35seQJVwg0bfmx5AlXCDRt+bHkCVcING35seQJXvv96B/87pAVRZDDgtwSrhBo2+Nz2AKuEGjb43PYAq4QaNvjc9gCrhBo2+Nz2AKuEGjb43PYAq4QaNvjc9gCrhBo2+Nz2AKuEGjb43PYAq4QaNvjc9gCrhBo2+Nz2AKuEGjb43PYAq4QaNvjc9gCrhBo2+Nz0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjiD2BIBCRNFgbyAAAAAElFTkSuQmCC" alt="QR Code" style="width: 200px; height: 200px;">
                            </div>
                            <div class="form-group">
                                <label for="tfa-code">Enter verification code:</label>
                                <input type="text" id="tfa-code" maxlength="6" placeholder="6-digit code">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-modal-cancel" id="cancel-tfa">Cancel</button>
                            <button class="btn-primary" id="verify-tfa-code">Verify & Complete</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners
            const modal = document.getElementById('tfa-setup-modal');
            const closeBtn = document.getElementById('close-tfa-modal');
            const cancelBtn = document.getElementById('cancel-tfa');
            const verifyBtn = document.getElementById('verify-tfa-code');
            
            const closeModal = () => {
                modal.classList.remove('active');
            };
            
            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', function() {
                // Reset the toggle if setup is cancelled
                document.getElementById('tfa-toggle').checked = false;
                document.getElementById('tfa-setup-section').classList.add('hidden');
                closeModal();
            });
            
            verifyBtn.addEventListener('click', function() {
                const code = document.getElementById('tfa-code').value;
                
                // Simple validation
                if (code.length !== 6 || isNaN(code)) {
                    showToast('Please enter a valid 6-digit code', 'error');
                    return;
                }
                
                // Simulate verification
                simulateLoading(this);
                
                setTimeout(() => {
                    closeModal();
                    showToast('Two-factor authentication successfully set up', 'success');
                }, 1500);
            });
        }
        
        // Show modal
        const modal = document.getElementById('tfa-setup-modal');
        modal.classList.add('active');
    }
}

/**
 * Helper function to show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info, warning)
 */
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const container = document.querySelector('.toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon based on type
    let icon;
    switch(type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'exclamation-circle';
            break;
        case 'info':
            icon = 'info-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
        default:
            icon = 'bell';
    }
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
        <div class="toast-content">${message}</div>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('active');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            container.removeChild(toast);
        }, 
        300);
            }, 3000);
        }

        /**
         * Helper function to simulate loading state for buttons
         * @param {HTMLElement} button - The button to show loading state on
         */
        function simulateLoading(button) {
            const originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 1500);
        }