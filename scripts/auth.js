// Authentication JavaScript
class AuthManager {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('current_user') || '{}');
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
            
            // Password strength checker
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('input', () => {
                    this.checkPasswordStrength(passwordInput.value);
                });
            }
        }
        
        // Forgot password
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    }
    
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        const messageContainer = document.getElementById('messageContainer');
        
        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtnText.textContent = 'Signing in...';
        
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('current_user', JSON.stringify(this.user));
                
                this.showMessage('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtnText.textContent = 'Sign In';
        }
    }
    
    async handleRegister() {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        const registerBtn = document.getElementById('registerBtn');
        const registerBtnText = document.getElementById('registerBtnText');
        const messageContainer = document.getElementById('messageContainer');
        
        // Validation
        if (!firstName || !lastName || !username || !email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 8) {
            this.showMessage('Password must be at least 8 characters', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (!terms) {
            this.showMessage('Please accept the terms of service', 'error');
            return;
        }
        
        // Show loading state
        registerBtn.disabled = true;
        registerBtnText.textContent = 'Creating account...';
        
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password,
                    firstName: `${firstName} ${lastName}`
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('current_user', JSON.stringify(this.user));
                
                this.showMessage('Account created successfully! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showMessage(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            registerBtn.disabled = false;
            registerBtnText.textContent = 'Create Account';
        }
    }
    
    handleForgotPassword() {
        const email = prompt('Enter your email address for password reset:');
        if (email) {
            this.showMessage(`Password reset link sent to ${email}`, 'success');
            // In a real implementation, this would call the API
        }
    }
    
    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrength');
        if (!strengthBar) return;
        
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Complexity checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        // Update strength bar
        strengthBar.className = 'password-strength';
        if (strength <= 2) {
            strengthBar.classList.add('weak');
        } else if (strength <= 4) {
            strengthBar.classList.add('medium');
        } else {
            strengthBar.classList.add('strong');
        }
    }
    
    showMessage(message, type = 'error') {
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        messageContainer.innerHTML = '';
        messageContainer.appendChild(messageDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    checkAuthStatus() {
        if (this.token && this.user.id) {
            // User is logged in, redirect to dashboard
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('register.html')) {
                window.location.href = 'dashboard.html';
            }
        }
    }
    
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        this.token = null;
        this.user = {};
        window.location.href = 'login.html';
    }
    
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.token) {
            this.logout();
            return;
        }
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(`${this.apiBase}${url}`, mergedOptions);
            
            if (response.status === 401 || response.status === 403) {
                this.logout();
                return;
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});