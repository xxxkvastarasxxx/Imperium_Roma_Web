// Supabase via CDN
const supabase = window.supabase.createClient(
    'https://nodxtpjwgyjbghpaiajo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHh0cGp3Z3lqYmdocGFpYWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODg3MjEsImV4cCI6MjA1ODc2NDcyMX0.GX3liK9iN_kcug7OFh2EZUilNzVq2GxEblhidkUBOY0'
  )
  
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            btn.classList.add('active');
            const tabId = `${btn.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });

    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector('i');
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

    const passwordInput = document.getElementById('signup-password');
    const meterSections = document.querySelectorAll('.meter-section');
    const strengthText = document.querySelector('.strength-text');

    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            meterSections.forEach(section => {
                section.style.backgroundColor = '#1a1a1a';
            });
            for (let i = 0; i < strength.score; i++) {
                if (meterSections[i]) {
                    meterSections[i].style.backgroundColor = getStrengthColor(strength.score);
                }
            }
            strengthText.textContent = strength.message;
            strengthText.style.color = getStrengthColor(strength.score);
        });
    }

    function calculatePasswordStrength(password) {
        const length = password.length;
        let score = 0;
        let message = "Password strength";

        if (length === 0) {
            return { score: 0, message: "Password strength" };
        } else if (length < 6) {
            score = 1;
            message = "Very weak";
        } else {
            score = Math.min(2 + Math.floor(length / 3), 4);
            const hasLowercase = /[a-z]/.test(password);
            const hasUppercase = /[A-Z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
            const complexity = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
            score = Math.min(score, complexity + 1);
            switch (score) {
                case 1: message = "Very weak"; break;
                case 2: message = "Weak"; break;
                case 3: message = "Medium"; break;
                case 4: message = "Strong"; break;
            }
        }
        return { score, message };
    }

    function getStrengthColor(score) {
        switch (score) {
            case 0: return '#1a1a1a';
            case 1: return '#ff3b30';
            case 2: return '#ff9500';
            case 3: return '#ffcc00';
            case 4: return '#34c759';
            default: return '#1a1a1a';
        }
    }

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showFormNotification(loginForm, 'Please fill in all fields', 'error');
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                showFormNotification(loginForm, error.message, 'error');
            } else {
                window.location.href = '/check-profile';
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;
            const agreeTerms = document.getElementById('agree-terms').checked;

            if (!email || !password || !confirmPassword) {
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

            const { error } = await supabase.auth.signUp({ email, password });

            if (error) {
                showFormNotification(signupForm, error.message, 'error');
            } else {
                showFormNotification(signupForm, 'Check your email to confirm registration.', 'success');
            }
        });
    }

    document.querySelectorAll('.btn-social.google').forEach((btn) => {
        btn.addEventListener('click', async () => {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'http://localhost:5500/domus/check-profile'
                }
            });
        });
    });

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

    function showFormNotification(form, message, type) {
        const existingNotification = form.querySelector('.form-notification');
        if (existingNotification) existingNotification.remove();
        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
            <span>${message}</span>
        `;
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.insertAdjacentElement('afterend', notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    const createShineEffect = () => {
        const shine = document.createElement('div');
        shine.className = 'mouse-shine';
        document.body.appendChild(shine);
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
            }
        `;
        document.head.appendChild(shineStyle);
        document.addEventListener('mousemove', (e) => {
            shine.style.left = e.clientX + 'px';
            shine.style.top = e.clientY + 'px';
        });
        const authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            authContainer.addEventListener('mouseenter', () => {
                shine.style.opacity = '0';
            });
            authContainer.addEventListener('mouseleave', () => {
                shine.style.opacity = '1';
            });
        }
    }
    createShineEffect();
});
