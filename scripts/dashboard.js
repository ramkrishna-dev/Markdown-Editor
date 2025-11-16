// Dashboard JavaScript
class DashboardManager {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.user = JSON.parse(localStorage.getItem('current_user') || '{}');
        this.token = localStorage.getItem('auth_token');
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.loadStatistics();
        this.loadRecentDocuments();
        this.loadActivity();
    }
    
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    window.authManager.logout();
                }
            });
        }
        
        // Profile button
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.openProfileModal();
            });
        }
        
        // Quick action buttons
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFileUpload();
            });
        }
        
        const templatesBtn = document.getElementById('templatesBtn');
        if (templatesBtn) {
            templatesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'editor.html?templates=true';
            });
        }
        
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCollaborationModal();
            });
        }
        
        const viewAllBtn = document.getElementById('viewAllBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'editor.html?documents=true';
            });
        }
    }
    
    async loadUserData() {
        try {
            const response = await window.authManager.makeAuthenticatedRequest('/auth/me');
            const userData = await response.json();
            
            // Update user profile section
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const userJoinDate = document.getElementById('userJoinDate');
            const userAvatar = document.getElementById('userAvatar');
            
            if (userName) userName.textContent = userData.username || 'User';
            if (userEmail) userEmail.textContent = userData.email || 'user@example.com';
            if (userJoinDate) {
                const joinDate = new Date(userData.created_at);
                userJoinDate.textContent = `Member since ${joinDate.toLocaleDateString()}`;
            }
            
            if (userAvatar && userData.avatar_url) {
                userAvatar.innerHTML = `<img src="${userData.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
            
            this.user = userData;
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }
    
    async loadStatistics() {
        try {
            const response = await window.authManager.makeAuthenticatedRequest('/analytics/user');
            const data = await response.json();
            
            const stats = data.stats || {};
            
            // Update statistics cards
            const totalDocuments = document.getElementById('totalDocuments');
            const totalViews = document.getElementById('totalViews');
            const sharedDocuments = document.getElementById('sharedDocuments');
            const lastActive = document.getElementById('lastActive');
            
            if (totalDocuments) totalDocuments.textContent = stats.total_documents || 0;
            if (totalViews) totalViews.textContent = stats.total_views || 0;
            if (sharedDocuments) sharedDocuments.textContent = '0'; // Would need separate API call
            if (lastActive) lastActive.textContent = 'Today'; // Would need activity tracking
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }
    
    async loadRecentDocuments() {
        try {
            const response = await window.authManager.makeAuthenticatedRequest('/documents?limit=5');
            const data = await response.json();
            
            const documentsList = document.getElementById('recentDocumentsList');
            if (!documentsList) return;
            
            if (data.documents && data.documents.length > 0) {
                documentsList.innerHTML = data.documents.map(doc => `
                    <div class="document-item" onclick="window.location.href='editor.html?id=${doc.id}'">
                        <div class="document-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="document-info">
                            <div class="document-title">${this.escapeHtml(doc.title)}</div>
                            <div class="document-meta">
                                ${this.formatDate(doc.updated_at)} • ${doc.word_count || 0} words
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                documentsList.innerHTML = `
                    <div class="text-center text-[var(--text-secondary)] py-8">
                        <i class="fas fa-file-alt text-4xl mb-4"></i>
                        <p>No documents yet. Create your first document!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load recent documents:', error);
        }
    }
    
    async loadActivity() {
        try {
            // This would be a new API endpoint for user activity
            const activities = [
                {
                    icon: 'fa-edit',
                    title: 'Document Updated',
                    time: '2 hours ago',
                    description: 'Updated "Project README.md"'
                },
                {
                    icon: 'fa-share',
                    title: 'Document Shared',
                    time: '5 hours ago',
                    description: 'Shared "Meeting Notes.md" with team'
                },
                {
                    icon: 'fa-plus',
                    title: 'Document Created',
                    time: '1 day ago',
                    description: 'Created "API Documentation.md"'
                },
                {
                    icon: 'fa-download',
                    title: 'Document Exported',
                    time: '2 days ago',
                    description: 'Exported "Blog Post.md" as PDF'
                }
            ];
            
            const activityList = document.getElementById('activityList');
            if (!activityList) return;
            
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                        <div class="text-sm text-[var(--text-secondary)]">${activity.description}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load activity:', error);
        }
    }
    
    handleFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    // Create new document with uploaded content
                    this.createDocumentFromUpload(file.name, content);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    async createDocumentFromUpload(filename, content) {
        try {
            const title = filename.replace(/\.(md|markdown|txt)$/i, '');
            const response = await window.authManager.makeAuthenticatedRequest('/documents', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    content,
                    is_public: false
                })
            });
            
            if (response.ok) {
                window.app.showToast('Document uploaded successfully!');
                setTimeout(() => {
                    window.location.href = 'editor.html';
                }, 1000);
            } else {
                const data = await response.json();
                window.app.showToast(data.error || 'Failed to upload document', 'error');
            }
        } catch (error) {
            console.error('Failed to create document from upload:', error);
            window.app.showToast('Failed to upload document', 'error');
        }
    }
    
    openProfileModal() {
        // Create modal for profile editing
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-md">
                <h3 class="text-xl font-bold text-white mb-4">Edit Profile</h3>
                <form id="profileForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-white mb-2">Username</label>
                        <input type="text" id="editUsername" value="${this.escapeHtml(this.user.username || '')}" 
                               class="w-full p-2 border border-[var(--border-color)] rounded bg-[var(--bg-primary)] text-white">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-white mb-2">Email</label>
                        <input type="email" id="editEmail" value="${this.escapeHtml(this.user.email || '')}" 
                               class="w-full p-2 border border-[var(--border-color)] rounded bg-[var(--bg-primary)] text-white">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-white mb-2">Bio</label>
                        <textarea id="editBio" rows="3" 
                                  class="w-full p-2 border border-[var(--border-color)] rounded bg-[var(--bg-primary)] text-white">${this.escapeHtml(this.user.bio || '')}</textarea>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 border border-[var(--border-color)] rounded text-white hover:bg-[var(--bg-tertiary)]">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)]">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#profileForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('editUsername').value;
            const email = document.getElementById('editEmail').value;
            const bio = document.getElementById('editBio').value;
            
            try {
                const response = await window.authManager.makeAuthenticatedRequest('/auth/profile', {
                    method: 'PUT',
                    body: JSON.stringify({ username, email, bio })
                });
                
                if (response.ok) {
                    window.app.showToast('Profile updated successfully!');
                    modal.remove();
                    this.loadUserData(); // Reload user data
                } else {
                    const data = await response.json();
                    window.app.showToast(data.error || 'Failed to update profile', 'error');
                }
            } catch (error) {
                console.error('Failed to update profile:', error);
                window.app.showToast('Failed to update profile', 'error');
            }
        });
        
        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    openCollaborationModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-md">
                <h3 class="text-xl font-bold text-white mb-4">Start Collaboration</h3>
                <p class="text-[var(--text-secondary)] mb-4">Share a document or create a new collaborative session</p>
                <div class="space-y-4">
                    <button onclick="window.location.href='editor.html?share=true'" 
                            class="w-full p-3 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)]">
                        <i class="fas fa-share mr-2"></i>
                        Share Existing Document
                    </button>
                    <button onclick="window.location.href='editor.html?collaborate=true'" 
                            class="w-full p-3 border border-[var(--border-color)] text-white rounded hover:bg-[var(--bg-tertiary)]">
                        <i class="fas fa-users mr-2"></i>
                        Start New Session
                    </button>
                </div>
                <button onclick="this.closest('.fixed').remove()" 
                        class="w-full p-2 text-[var(--text-secondary)] hover:text-white">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    if (!window.authManager.token) {
        window.location.href = 'login.html';
        return;
    }
    
    window.dashboardManager = new DashboardManager();
});