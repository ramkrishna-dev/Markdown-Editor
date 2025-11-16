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
        this.updateServerStatus();
        this.checkServerConnection();
    }
    
    updateServerStatus() {
        const statusElement = document.getElementById('serverStatus');
        if (!statusElement) return;
        
        statusElement.innerHTML = `
            <i class="fas fa-spinner fa-spin mr-1"></i>
            Checking...
        `;
        
        this.checkServerConnection().then(isConnected => {
            if (isConnected) {
                statusElement.innerHTML = `
                    <i class="fas fa-check-circle mr-1"></i>
                    Online
                `;
                statusElement.className = 'text-xs px-2 py-1 rounded bg-green-500 text-white';
            } else {
                statusElement.innerHTML = `
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Offline
                `;
                statusElement.className = 'text-xs px-2 py-1 rounded bg-red-500 text-white';
            }
        }).catch(error => {
            statusElement.innerHTML = `
                <i class="fas fa-question-circle mr-1"></i>
                Unknown
            `;
            statusElement.className = 'text-xs px-2 py-1 rounded bg-yellow-500 text-white';
        });
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
            // Add timeout for slow connections
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });
            
            // Clear timeout if request completes
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                let errorMessage = 'Login failed';
                
                if (response.status === 401) {
                    errorMessage = 'Invalid username or password';
                } else if (response.status === 403) {
                    errorMessage = 'Account temporarily locked';
                } else if (response.status === 429) {
                    errorMessage = 'Too many login attempts. Please try again later';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later';
                }
                
                this.showMessage(errorMessage, 'error');
                return;
            }
            
            const data = await response.json();
            
            this.token = data.token;
            this.user = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('current_user', JSON.stringify(this.user));
            
            this.showMessage('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.name === 'AbortError') {
                this.showMessage('Request timeout. Please check your connection.', 'error');
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                this.showMessage('Unable to connect to server. Please check if the server is running.', 'error');
            } else {
                this.showMessage('Network error. Please try again.', 'error');
            }
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
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Username validation
        if (username.length < 3) {
            this.showMessage('Username must be at least 3 characters', 'error');
            return;
        }
        
        if (username.length > 20) {
            this.showMessage('Username must be less than 20 characters', 'error');
            return;
        }
        
        // Show loading state
        registerBtn.disabled = true;
        registerBtnText.textContent = 'Creating account...';
        
        try {
            // Add timeout for slow connections
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password,
                    firstName: `${firstName} ${lastName}`
                }),
                signal: controller.signal
            });
            
            // Clear timeout if request completes
            clearTimeout(timeoutId);
            
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
                let errorMessage = data.error || 'Registration failed';
                
                // Provide more specific error messages
                if (response.status === 409) {
                    errorMessage = 'Username or email already exists';
                } else if (response.status === 400) {
                    errorMessage = 'Invalid input data provided';
                } else if (response.status === 429) {
                    errorMessage = 'Too many registration attempts. Please try again later';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later';
                }
                
                this.showMessage(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.name === 'AbortError') {
                this.showMessage('Request timeout. Please check your connection and try again.', 'error');
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                this.showMessage('Unable to connect to server. Please check if the server is running.', 'error');
            } else {
                this.showMessage('Network error. Please try again.', 'error');
            }
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
    
    async checkServerConnection() {
        try {
            const response = await fetch(`${this.apiBase}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✅ Server connection is working');
                return true;
            } else {
                console.log('❌ Server connection failed');
                return false;
            }
        } catch (error) {
            console.log('❌ Cannot connect to server:', error.message);
            return false;
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