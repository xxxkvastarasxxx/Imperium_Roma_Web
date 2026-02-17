/**
 * Newsletter Subscription Handler
 * Handles client-side validation and API communication for newsletter subscriptions
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNewsletter);
    } else {
        initNewsletter();
    }

    function initNewsletter() {
        const emailInput = document.getElementById('email-input');
        const subscribeBtn = document.getElementById('subscribe-btn');
        const form = document.querySelector('.newsletter-form');

        // Exit if elements don't exist on this page
        if (!emailInput || !subscribeBtn || !form) {
            return;
        }

        // Create message container if it doesn't exist
        let messageContainer = form.querySelector('.newsletter-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'newsletter-message';
            messageContainer.setAttribute('role', 'status');
            messageContainer.setAttribute('aria-live', 'polite');
            form.appendChild(messageContainer);
        }

        // Handle form submission
        form.addEventListener('submit', handleSubscribe);
        subscribeBtn.addEventListener('click', handleSubscribe);
    }

    async function handleSubscribe(e) {
        e.preventDefault();

        const emailInput = document.getElementById('email-input');
        const subscribeBtn = document.getElementById('subscribe-btn');
        const messageContainer = document.querySelector('.newsletter-message');
        const email = emailInput.value.trim();

        // Clear previous messages
        hideMessage(messageContainer);

        // Client-side validation
        if (!email) {
            showMessage(messageContainer, 'Please enter your email address', 'error');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showMessage(messageContainer, 'Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }

        // Disable button and show loading state
        const originalText = subscribeBtn.textContent;
        subscribeBtn.disabled = true;
        subscribeBtn.textContent = 'Sending...';
        subscribeBtn.classList.add('loading');

        try {
            // Send request to PHP proxy
            const response = await fetch('/subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            // Check if subscribe.php exists (not a 404 HTML page)
            if (!response.ok && response.status === 404) {
                showMessage(messageContainer, 'Newsletter service not configured. Please contact the administrator.', 'error');
                console.error('subscribe.php not found. Please upload it to your server root directory.');
                return;
            }

            // Check if response is JSON (not HTML error page)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                showMessage(messageContainer, 'Server configuration error. Please contact the administrator.', 'error');
                console.error('Expected JSON response, got:', contentType);
                console.error('Response indicates subscribe.php is missing or PHP is not enabled.');
                return;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                // Success
                showMessage(messageContainer, 'Thank you for subscribing!', 'success');
                emailInput.value = '';
                
                // Optional: Track subscription analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'newsletter_subscription', {
                        event_category: 'engagement',
                        event_label: 'footer_newsletter'
                    });
                }
            } else {
                // Error from server
                const errorMsg = data.error || 'Subscription failed. Please try again.';
                showMessage(messageContainer, errorMsg, 'error');
            }
        } catch (error) {
            // Network or other errors
            console.error('Newsletter subscription error:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.name,
                url: window.location.origin + '/subscribe.php'
            });
            
            // More specific error message
            let errorMessage = 'Network error. ';
            if (window.location.protocol === 'file:') {
                errorMessage += 'Please test on a web server, not from a local file.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Cannot reach subscribe.php. Please ensure the file is uploaded to your server.';
            } else {
                errorMessage += 'Please check your connection and try again.';
            }
            
            showMessage(messageContainer, errorMessage, 'error');
        } finally {
            // Re-enable button
            subscribeBtn.disabled = false;
            subscribeBtn.textContent = originalText;
            subscribeBtn.classList.remove('loading');
        }
    }

    function isValidEmail(email) {
        // Basic format check
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return false;
        }

        // Split email into parts
        const parts = email.split('@');
        if (parts.length !== 2) return false;

        const [localPart, domain] = parts;

        // Validate local part (before @)
        if (localPart.length < 1 || localPart.length > 64) return false;
        if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
        if (localPart.includes('..')) return false;

        // Validate domain
        if (domain.length < 4 || domain.length > 255) return false;
        if (domain.startsWith('-') || domain.endsWith('-')) return false;
        if (domain.startsWith('.') || domain.endsWith('.')) return false;
        if (domain.includes('..')) return false;

        // Extract TLD (top-level domain)
        const domainParts = domain.split('.');
        if (domainParts.length < 2) return false;
        
        const tld = domainParts[domainParts.length - 1].toLowerCase();
        const secondLevel = domainParts[domainParts.length - 2].toLowerCase();

        // Validate TLD (must be at least 2 characters and only letters)
        if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return false;
        
        // Check second-level domain is valid
        if (secondLevel.length < 2) return false;

        // Common valid TLDs (extend this list as needed)
        const commonTlds = [
            'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
            'co', 'io', 'ai', 'app', 'dev', 'me', 'us', 'uk',
            'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be',
            'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'cz',
            'jp', 'cn', 'in', 'br', 'mx', 'ar', 'cl', 'ru',
            'info', 'biz', 'name', 'pro', 'xyz', 'online',
            'store', 'shop', 'tech', 'site', 'website', 'space'
        ];

        // Warning for suspicious TLDs (but still allow them)
        if (!commonTlds.includes(tld)) {
            console.warn('Uncommon TLD detected:', tld);
        }

        // Block obvious fake/test domains
        const blockedDomains = [
            'test.com', 'example.com', 'example.org', 'example.net',
            'fake.com', 'invalid.com', 'dummy.com', 'temp.com',
            'localhost', '127.0.0.1'
        ];
        
        if (blockedDomains.includes(domain.toLowerCase())) {
            return false;
        }

        // Block disposable/temporary email services
        const disposableDomains = [
            'tempmail.com', '10minutemail.com', 'guerrillamail.com',
            'mailinator.com', 'maildrop.cc', 'throwaway.email',
            'temp-mail.org', 'fakeinbox.com', 'trashmail.com'
        ];
        
        if (disposableDomains.includes(domain.toLowerCase())) {
            return false;
        }

        // Check for suspicious patterns (all same character domains)
        if (/^([a-z])\1+\.([a-z])\1+$/.test(domain.toLowerCase())) {
            return false; // e.g., aaa.bbb
        }

        return true;
    }

    function showMessage(container, message, type) {
        if (!container) return;

        container.textContent = message;
        container.className = 'newsletter-message ' + type;
        container.style.display = 'block';

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                hideMessage(container);
            }, 5000);
        }
    }

    function hideMessage(container) {
        if (!container) return;
        
        container.style.display = 'none';
        container.textContent = '';
        container.className = 'newsletter-message';
    }
})();
