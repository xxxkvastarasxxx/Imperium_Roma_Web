document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            const tabId = `${btn.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Password toggle functionality
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            // Toggle password visibility
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Password strength meter
    const passwordInput = document.getElementById('signup-password');
    const meterSections = document.querySelectorAll('.meter-section');
    const strengthText = document.querySelector('.strength-text');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            
            // Reset all meter sections
            meterSections.forEach(section => {
                section.style.backgroundColor = '#1a1a1a';
            });
            
            // Update meter based on strength
            for (let i = 0; i < strength.score; i++) {
                if (meterSections[i]) {
                    meterSections[i].style.backgroundColor = getStrengthColor(strength.score);
                }
            }
            
            // Update strength text
            strengthText.textContent = strength.message;
            strengthText.style.color = getStrengthColor(strength.score);
        });
    }
    
    function calculatePasswordStrength(password) {
        // Password length check
        const length = password.length;
        
        // Initialize score
        let score = 0;
        let message = "Password strength";
        
        if (length === 0) {
            return { score: 0, message: "Password strength" };
        } else if (length < 6) {
            score = 1;
            message = "Very weak";
        } else {
            // Start with a base score based on length
            score = Math.min(2 + Math.floor(length / 3), 4);
            
            // Check for various password components
            const hasLowercase = /[a-z]/.test(password);
            const hasUppercase = /[A-Z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
            
            // Add points for complexity
            const complexity = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars]
                .filter(Boolean).length;
            
            // Adjust score based on complexity
            score = Math.min(score, complexity + 1);
            
            // Set appropriate message
            switch (score) {
                case 1: 
                    message = "Very weak"; 
                    break;
                case 2: 
                    message = "Weak"; 
                    break;
                case 3: 
                    message = "Medium"; 
                    break;
                case 4: 
                    message = "Strong"; 
                    break;
            }
        }
        
        return { score, message };
    }
    
    function getStrengthColor(score) {
        switch (score) {
            case 0: 
                return '#1a1a1a'; // Default
            case 1: 
                return '#ff3b30'; // Red - Very weak
            case 2: 
                return '#ff9500'; // Orange - Weak
            case 3: 
                return '#ffcc00'; // Yellow - Medium
            case 4: 
                return '#34c759'; // Green - Strong
            default: 
                return '#1a1a1a';
        }
    }
    
    // Form submission handling
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            if (!username || !password) {
                showFormNotification(loginForm, 'Please fill in all fields', 'error');
                return;
            }
            
            // Simulate login success (would normally be handled by backend)
            simulateLoading(loginForm, 'Entering the Roman Empire...');
            
            // In a real application, you would send this data to your server
            console.log('Login attempt with:', { username, password });
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;
            const agreeTerms = document.getElementById('agree-terms').checked;
            
            if (!name || !username || !email || !password || !confirmPassword) {
                showFormNotification(signupForm, 'Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showFormNotification(signupForm, 'Passwords do not match', 'error');
                return;
            }
            
            if (!agreeTerms) {
                showFormNotification(signupForm, 'Please agree to terms and conditions', 'error');
                return;
            }
            
            // Simulate signup success
            simulateLoading(signupForm, 'Creating your Roman Domus...');
            
            // In a real application, you would send this data to your server
            console.log('Signup attempt with:', { name, username, email, password });
        });
    }
    
    // Confirm password validation
    const confirmInput = document.getElementById('signup-confirm');
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            const password = document.getElementById('signup-password').value;
            if (this.value && this.value !== password) {
                this.style.borderColor = '#ff3b30';
            } else if (this.value) {
                this.style.borderColor = '#34c759';
            } else {
                this.style.borderColor = '#1a1a1a';
            }
        });
    }
    
    // Helper functions
    function showFormNotification(form, message, type) {
        // Remove any existing notification
        const existingNotification = form.querySelector('.form-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
            <span>${message}</span>
        `;
        
        // Insert after the button
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.insertAdjacentElement('afterend', notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
    
    function simulateLoading(form, message) {
        // Disable form inputs and change button text
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        const inputs = form.querySelectorAll('input, button');
        
        inputs.forEach(input => input.disabled = true);
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        
        // After 2 seconds, simulate success
        setTimeout(() => {
            inputs.forEach(input => input.disabled = false);
            submitBtn.innerHTML = originalText;
            showFormNotification(form, 'Success! Redirecting...', 'success');
            
            // Redirect after 1 more second (in a real app, this would navigate to dashboard)
            setTimeout(() => {
                window.location.href = '/domus/index.html';
            }, 1000);
        }, 2000);
    }

    // Add mouse shine effect
    const createShineEffect = () => {
        // Create shine element
        const shine = document.createElement('div');
        shine.className = 'mouse-shine';
        document.body.appendChild(shine);
        
        // Add CSS for shine effect with stronger visibility
        const shineStyle = document.createElement('style');
        shineStyle.textContent = `
            .mouse-shine {
                position: fixed;
                width: 180px;
                height: 180px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,204,0,0.3) 0%, rgba(255,204,0,0) 70%);
                pointer-events: none;
                z-index: 9999;
                mix-blend-mode: screen;
                transform: translate(-50%, -50%);
                filter: blur(5px);
                opacity: 1;
                /* Removed transition for instant movement */
            }
        `;
        document.head.appendChild(shineStyle);
        
        // Update shine position based on mouse movement - no delay or animation
        document.addEventListener('mousemove', (e) => {
            shine.style.left = e.clientX + 'px';
            shine.style.top = e.clientY + 'px';
            // Removed setTimeout animation for instant effect
        });
        
        // Hide shine effect on the auth container
        const authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            authContainer.addEventListener('mouseenter', () => {
                shine.style.opacity = '0';
            });
            
            authContainer.addEventListener('mouseleave', () => {
                shine.style.opacity = '1';
            });
        }
        
        // Enhanced effect over interactive elements - still immediate change
        const interactiveElements = document.querySelectorAll('button, a, input, .footer-logo img');
        interactiveElements.forEach(element => {
            // Skip if element is inside auth container
            if (element.closest('.auth-container')) return;
            
            element.addEventListener('mouseenter', () => {
                shine.style.width = '250px';
                shine.style.height = '250px';
                shine.style.background = 'radial-gradient(circle, rgba(255,204,0,0.4) 0%, rgba(255,204,0,0) 70%)';
                shine.style.filter = 'blur(3px) brightness(1.2)';
            });
            
            element.addEventListener('mouseleave', () => {
                shine.style.width = '180px';
                shine.style.height = '180px';
                shine.style.background = 'radial-gradient(circle, rgba(255,204,0,0.3) 0%, rgba(255,204,0,0) 70%)';
                shine.style.filter = 'blur(5px) brightness(1)';
            });
        });
    };

    // Initialize shine effect
    createShineEffect();
    
    // Add CSS for notifications created by JS
    const style = document.createElement('style');
    style.textContent = `
        .form-notification {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 15px;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 0.9rem;
            animation: slideIn 0.3s ease-out;
        }
        
        .form-notification.error {
            background-color: rgba(255, 59, 48, 0.1);
            border-left: 3px solid #ff3b30;
            color: #ff3b30;
        }
        
        .form-notification.success {
            background-color: rgba(52, 199, 89, 0.1);
            border-left: 3px solid #34c759;
            color: #34c759;
        }
        
        .form-notification.fade-out {
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.5s, transform 0.5s;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});