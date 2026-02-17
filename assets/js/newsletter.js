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
            showMessage(messageContainer, 'Network error. Please check your connection and try again.', 'error');
        } finally {
            // Re-enable button
            subscribeBtn.disabled = false;
            subscribeBtn.textContent = originalText;
            subscribeBtn.classList.remove('loading');
        }
    }

    function isValidEmail(email) {
        // RFC 5322 compliant email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
