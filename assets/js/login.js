/**
 * login.js - Authentication Script for Roman Numismatic Portal
 * Handles login, signup forms, validation, and authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update time every minute
    setupTabs();
    setupFormValidation();
    setupPasswordToggle();
    setupPasswordStrength();
    
    // Prefill the login form with the current user's info if available
    if (localStorage.getItem('rememberedUser')) {
        const user = JSON.parse(localStorage.getItem('rememberedUser'));
        document.getElementById('login-username').value = user.username;
        document.getElementById('remember-me').checked = true;
    }
    
    // Auto-prefill the demo account
    const demoUser = "xxxkvastarasxxx";
    const demoUserInput = document.getElementById('login-username');
    
    if (demoUserInput.value === '') {
        demoUserInput.value = demoUser;
    }
});

/**
 * Update the current date and time display
 */
function updateDateTime() {
    const now = new Date();
    const formattedDateTime = formatDateTime(now);
    document.getElementById('current-date-time').textContent = formattedDateTime;
}

/**
 * Format date to YYYY-MM-DD HH:MM:SS
 */
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Setup tab navigation
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = `${this.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
            
            // Clear any error messages and form highlights when switching tabs
            clearValidationState();
        });
    });
}

/**
 * Clear validation state when switching tabs
 */
function clearValidationState() {
    const errorMessages = document.querySelectorAll('.error-message');
    const inputFields = document.querySelectorAll('input');
    
    errorMessages.forEach(msg => msg.remove());
    inputFields.forEach(input => input.classList.remove('input-error'));
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    // Login form validation
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;
            
            if (!validateLoginForm(username, password)) {
                return;
            }
            
            // Simulate login success
            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({ username }));
            } else {
                localStorage.removeItem('rememberedUser');
            }
            
            // Redirect to domus page after successful login
            showSuccessMessage(loginForm, 'Login successful! Redirecting to your Domus...');
            setTimeout(() => {
                window.location.href = 'domus.html';
            }, 1500);
        });
    }
    
    // Signup form validation
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const username = document.getElementById('signup-username').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;
            const agreeTerms = document.getElementById('agree-terms').checked;
            
            if (!validateSignupForm(name, username, email, password, confirmPassword, agreeTerms)) {
                return;
            }
            
            // Simulate registration success
            showSuccessMessage(signupForm, 'Account created successfully! Redirecting to your Domus...');
            setTimeout(() => {
                window.location.href = 'domus.html';
            }, 1500);
        });
    }
}

/**
 * Validate login form
 */
function validateLoginForm(username, password) {
    let isValid = true;
    
    if (!username) {
        showError('login-username', 'Username or email is required');
        isValid = false;
    }
    
    if (!password) {
        showError('login-password', 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate signup form
 */
function validateSignupForm(name, username, email, password, confirmPassword, agreeTerms) {
    let isValid = true;
    
    if (!name) {
        showError('signup-name', 'Full name is required');
        isValid = false;
    }
    
    if (!username) {
        showError('signup-username', 'Username is required');
        isValid = false;
    } else if (username.length < 3) {
        showError('signup-username', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    if (!email) {
        showError('signup-email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('signup-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showError('signup-password', 'Password is required');
        isValid = false;
    } else if (password.length < 8) {
        showError('signup-password', 'Password must be at least 8 characters');
        isValid = false;
    }
    
    if (!confirmPassword) {
        showError('signup-confirm', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('signup-confirm', 'Passwords do not match');
        isValid = false;
    }
    
    if (!agreeTerms) {
        showError('agree-terms', 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Show error message for form field
 */
function showError(inputId, message) {
    const inputElement = document.getElementById(inputId);
    inputElement.classList.add('input-error');
    
    // Remove any existing error message
    const existingError = inputElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    
    // Insert after input or its parent for checkbox
    if (inputElement.type === 'checkbox') {
        inputElement.parentElement.insertAdjacentElement('afterend', errorMessage);
    } else {
        inputElement.parentElement.insertAdjacentElement('afterend', errorMessage);
    }
    
    // Add input event listener to clear error on typing
    inputElement.addEventListener('input', function() {
        this.classList.remove('input-error');
        const errorMsg = this.parentElement.nextElementSibling;
        if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.remove();
        }
    });
    
    if (inputElement.type === 'checkbox') {
        inputElement.addEventListener('change', function() {
            if (this.checked) {
                this.classList.remove('input-error');
                const errorMsg = this.parentElement.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.remove();
                }
            }
        });
    }
}

/**
 * Show success message in form
 */
function showSuccessMessage(formElement, message) {
// Create success message element
const successMessage = document.createElement('div');
successMessage.className = 'success-message';
successMessage.textContent = message;

// Clear any existing error messages
const existingErrors = formElement.querySelectorAll('.error-message');
existingErrors.forEach(error => error.remove());

// Clear error highlighting on inputs
const inputFields = formElement.querySelectorAll('.input-error');
inputFields.forEach(input => input.classList.remove('input-error'));

// Add the success message to the form
formElement.appendChild(successMessage);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
return regex.test(email);
}

/**
 * Setup password visibility toggle
 */
function setupPasswordToggle() {
const passwordFields = document.querySelectorAll('.password-field');

passwordFields.forEach(field => {
    const passwordInput = field.querySelector('input[type="password"]');
    const toggleBtn = field.querySelector('.toggle-password');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('showing-password');
        });
    }
});
}

/**
 * Setup password strength indicator
 */
function setupPasswordStrength() {
const passwordInput = document.getElementById('signup-password');

if (passwordInput) {
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength-meter';
    passwordInput.parentElement.appendChild(strengthIndicator);
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        // Update strength indicator
        strengthIndicator.className = 'password-strength-meter';
        strengthIndicator.classList.add(getStrengthClass(strength));
        strengthIndicator.textContent = getStrengthText(strength);
    });
}
}

/**
 * Calculate password strength score (0-4)
 */
function calculatePasswordStrength(password) {
let score = 0;

if (!password || password.length < 6) return score;

if (password.length >= 8) score++;
if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
if (/\d/.test(password)) score++;
if (/[^a-zA-Z0-9]/.test(password)) score++;

return score;
}

/**
 * Get CSS class based on password strength
 */
function getStrengthClass(strength) {
const classes = ['very-weak', 'weak', 'medium', 'strong', 'very-strong'];
return classes[strength] || 'weak';
}

/**
 * Get text description based on password strength
 */
function getStrengthText(strength) {
const texts = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
return texts[strength] || 'Weak';
}
