// Shared JavaScript functionality for Markdown Editor Web App

class App {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupMobileMenu();
        this.setupActiveNavigation();
        this.setupSmoothScrolling();
        this.setupAnimations();
        this.setupThemeSwitcher();
        this.checkAuthentication();
    }
    
    checkAuthentication() {
        const token = localStorage.getItem('auth_token');
        const currentPage = window.location.pathname;
        
        // Redirect to login if not authenticated and not on auth pages
        if (!token && !currentPage.includes('login.html') && !currentPage.includes('register.html')) {
            // Don't redirect if on home or docs pages (public access)
            if (currentPage.includes('editor.html') || currentPage.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
        
        // Redirect to dashboard if authenticated and on auth pages
        if (token && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
            window.location.href = 'dashboard.html';
        }
    }
    
    // Mobile menu toggle
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.getElementById('navLinks');
        
        if (mobileMenuToggle && navLinks) {
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                
                // Toggle icon
                const icon = mobileMenuToggle.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
            
            // Close menu when clicking on a link
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                });
            });
        }
    }
    
    // Set active navigation based on current page
    setupActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                (currentPage === 'index.html' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
    
    // Smooth scrolling for anchor links
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    // Setup intersection observer for animations
    setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe elements with animation classes
        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
    
    // Utility function to show toast notifications
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        
        // Reset classes
        toast.className = 'fixed bottom-6 right-6 px-6 py-3 transform transition-all duration-300';
        
        // Set background gradient based on type
        if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        } else if (type === 'warning') {
            toast.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #4C6EF5 0%, #5C7CFA 100%)';
        }
        
        toast.style.color = 'white';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 4px 12px rgba(76, 110, 245, 0.4)';
        
        // Show toast with slide-up animation
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-20', 'opacity-0', 'scale-95');
            toast.classList.add('translate-y-0', 'opacity-100', 'scale-100');
        });
        
        // Hide after 3 seconds with slide-down animation
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0', 'scale-95');
            toast.classList.remove('translate-y-0', 'opacity-100', 'scale-100');
        }, 3000);
    }
    
    // Format timestamp for display
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Never saved';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else {
            const hours = Math.floor(diffMins / 60);
            if (hours < 24) {
                return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            }
        }
    }
    
    // Debounce function for performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle function for performance optimization
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Theme switcher functionality
    setupThemeSwitcher() {
        const themeSwitcher = document.getElementById('themeSwitcher');
        const themeIcon = document.getElementById('themeIcon');
        
        if (!themeSwitcher || !themeIcon) return;
        
        // Load saved theme or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        
        themeSwitcher.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        // Update highlight.js theme
        const highlightLink = document.querySelector('link[href*="highlight.js"]');
        if (highlightLink) {
            if (theme === 'light') {
                highlightLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
            } else {
                highlightLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Export for use in other scripts
window.App = App;