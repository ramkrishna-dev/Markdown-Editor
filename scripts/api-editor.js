// Enhanced API-based Markdown Editor
class APIMarkdownEditor {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('current_user') || '{}');
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.currentDocument = null;
        this.socket = null;
        this.collaborators = new Map();
        
        // Autosave timer
        this.autosaveTimer = null;
        this.autosaveDelay = 2000; // 2 seconds for API
        
        this.init();
    }
    
    init() {
        this.checkAuth();
        this.setupMarked();
        this.setupEventListeners();
        this.loadDocumentFromURL();
        this.setupWebSocket();
        this.addToolbarAnimations();
        this.addEditorFocusEffects();
    }
    
    checkAuth() {
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    setupMarked() {
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('Highlight.js error:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            },
            langPrefix: 'hljs language-',
            breaks: true,
            gfm: true,
            tables: true,
            sanitize: false,
            smartLists: true,
            smartypants: true
        });
    }
    
    setupEventListeners() {
        // Editor input events
        this.editor.addEventListener('input', () => {
            this.updatePreview();
            this.scheduleAutosave();
            this.broadcastChange();
        });
        
        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.applyFormatting(action);
            });
        });
        
        // Header buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDocument());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToFile());
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearEditor());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareDocument());
        document.getElementById('documentsBtn').addEventListener('click', () => this.openDocumentManager());
        document.getElementById('templatesBtn').addEventListener('click', () => this.openTemplates());
        document.getElementById('findReplaceBtn').addEventListener('click', () => this.openFindReplace());
        document.getElementById('tocBtn').addEventListener('click', () => this.toggleTOC());
        
        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Cursor position tracking for collaboration
        this.editor.addEventListener('selectionchange', () => {
            this.broadcastCursorPosition();
        });
        
        this.editor.addEventListener('click', () => {
            this.broadcastCursorPosition();
        });
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveDocument();
        });
    }
    
    setupWebSocket() {
        this.socket = io('http://localhost:3000', {
            auth: {
                token: this.token
            }
        });
        
        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });
        
        this.socket.on('joined-document', (data) => {
            console.log('Joined document:', data);
            this.showCollaboratorNotification(data.user);
        });
        
        this.socket.on('document-updated', (data) => {
            if (data.updatedBy.id !== this.user.id) {
                this.showCollaborationIndicator(data);
                // Apply remote changes
                this.applyRemoteChanges(data.content, data.updatedBy);
            }
        });
        
        this.socket.on('cursor-update', (data) => {
            if (data.user.id !== this.user.id) {
                this.showRemoteCursor(data);
            }
        });
        
        this.socket.on('error', (data) => {
            console.error('WebSocket error:', data.message);
            window.app.showToast(data.message, 'error');
        });
    }
    
    async loadDocumentFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const documentId = urlParams.get('id');
        
        if (documentId) {
            await this.loadDocument(documentId);
        } else {
            // Create new document
            await this.createNewDocument();
        }
    }
    
    async loadDocument(documentId) {
        try {
            const response = await this.makeAuthenticatedRequest(`/documents/${documentId}`);
            const document = await response.json();
            
            if (response.ok) {
                this.currentDocument = document;
                this.editor.value = document.content || '';
                document.title = `${document.title} - Markdown Editor Pro`;
                this.updatePreview();
                this.joinDocument(documentId);
            } else {
                window.app.showToast('Failed to load document', 'error');
                await this.createNewDocument();
            }
        } catch (error) {
            console.error('Failed to load document:', error);
            await this.createNewDocument();
        }
    }
    
    async createNewDocument() {
        try {
            const response = await this.makeAuthenticatedRequest('/documents', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'Untitled Document',
                    content: '',
                    is_public: false
                })
            });
            
            const document = await response.json();
            
            if (response.ok) {
                this.currentDocument = document.document;
                this.editor.value = '';
                document.title = `${this.currentDocument.title} - Markdown Editor Pro`;
                this.updatePreview();
                this.joinDocument(this.currentDocument.id);
                
                // Update URL without page reload
                const newURL = `${window.location.origin}${window.location.pathname}?id=${this.currentDocument.id}`;
                window.history.replaceState({}, '', newURL);
            } else {
                window.app.showToast('Failed to create document', 'error');
            }
        } catch (error) {
            console.error('Failed to create document:', error);
            window.app.showToast('Failed to create document', 'error');
        }
    }
    
    joinDocument(documentId) {
        if (this.socket && this.token) {
            this.socket.emit('join-document', {
                documentId,
                token: this.token
            });
        }
    }
    
    async saveDocument() {
        if (!this.currentDocument) return;
        
        try {
            const response = await this.makeAuthenticatedRequest(`/documents/${this.currentDocument.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: this.currentDocument.title,
                    content: this.editor.value,
                    is_public: this.currentDocument.is_public || false
                })
            });
            
            if (response.ok) {
                window.app.showToast('Document saved successfully');
            } else {
                const data = await response.json();
                window.app.showToast(data.error || 'Failed to save document', 'error');
            }
        } catch (error) {
            console.error('Failed to save document:', error);
            window.app.showToast('Failed to save document', 'error');
        }
    }
    
    scheduleAutosave() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
        
        this.autosaveTimer = setTimeout(() => {
            this.saveDocument();
        }, this.autosaveDelay);
    }
    
    broadcastChange() {
        if (this.socket && this.currentDocument) {
            this.socket.emit('document-change', {
                documentId: this.currentDocument.id,
                content: this.editor.value,
                token: this.token
            });
        }
    }
    
    broadcastCursorPosition() {
        if (this.socket && this.currentDocument) {
            const position = this.editor.selectionStart;
            this.socket.emit('cursor-position', {
                documentId: this.currentDocument.id,
                position,
                token: this.token
            });
        }
    }
    
    showCollaborationIndicator(data) {
        // Show notification about remote changes
        const indicator = document.createElement('div');
        indicator.className = 'fixed top-20 right-4 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg z-50';
        indicator.innerHTML = `
            <i class="fas fa-users mr-2"></i>
            ${data.updatedBy.username} is editing...
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 3000);
    }
    
    showRemoteCursor(data) {
        // In a real implementation, this would show cursor position
        console.log(`Remote cursor from ${data.user.username}:`, data.position);
    }
    
    showCollaboratorNotification(user) {
        window.app.showToast(`${user.username} joined the document`, 'success');
    }
    
    applyRemoteChanges(content, updatedBy) {
        // Preserve cursor position
        const cursorPos = this.editor.selectionStart;
        const scrollTop = this.editor.scrollTop;
        
        // Apply changes
        this.editor.value = content;
        
        // Restore cursor position
        this.editor.setSelectionRange(cursorPos, cursorPos);
        this.editor.scrollTop = scrollTop;
        
        this.updatePreview();
    }
    
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.token) {
            window.location.href = 'login.html';
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
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
                window.location.href = 'login.html';
                return;
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    // Existing methods from previous editor.js
    applyFormatting(action) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        const beforeText = this.editor.value.substring(0, start);
        const afterText = this.editor.value.substring(end);
        
        let formattedText = '';
        let cursorOffset = 0;
        
        switch (action) {
            case 'bold':
                formattedText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? 0 : -10;
                break;
                
            case 'italic':
                formattedText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? 0 : -11;
                break;
                
            case 'heading':
                formattedText = `## ${selectedText || 'Heading'}`;
                cursorOffset = selectedText ? 0 : -8;
                break;
                
            case 'ul':
                formattedText = `- ${selectedText || 'List item'}`;
                cursorOffset = selectedText ? 0 : -10;
                break;
                
            case 'ol':
                formattedText = `1. ${selectedText || 'List item'}`;
                cursorOffset = selectedText ? 0 : -10;
                break;
                
            case 'quote':
                formattedText = `> ${selectedText || 'Quote'}`;
                cursorOffset = selectedText ? 0 : -6;
                break;
                
            case 'code':
                formattedText = `\`${selectedText || 'code'}\``;
                cursorOffset = selectedText ? 0 : -5;
                break;
                
            case 'codeblock':
                formattedText = `\`\`\`${selectedText ? '' : 'javascript'}\n${selectedText || '// Your code here'}\n\`\`\``;
                cursorOffset = selectedText ? -4 : -25;
                break;
                
            case 'link':
                formattedText = `[${selectedText || 'Link text'}](${selectedText ? '' : 'https://example.com'})`;
                cursorOffset = selectedText ? -1 : -26;
                break;
                
            case 'image':
                formattedText = `![${selectedText || 'Alt text'}](${selectedText ? '' : 'https://example.com/image.jpg'})`;
                cursorOffset = selectedText ? -1 : -32;
                break;
                
            case 'table':
                formattedText = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |`;
                cursorOffset = -58;
                break;
                
            case 'hr':
                formattedText = '\n---\n';
                cursorOffset = -2;
                break;
                
            default:
                return;
        }
        
        // Update editor content
        this.editor.value = beforeText + formattedText + afterText;
        
        // Set cursor position
        const newCursorPos = start + formattedText.length + cursorOffset;
        this.editor.setSelectionRange(newCursorPos, newCursorPos);
        
        // Focus editor and update
        this.editor.focus();
        this.updatePreview();
        this.scheduleAutosave();
    }
    
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.applyFormatting('bold');
                    break;
                    
                case 'i':
                    e.preventDefault();
                    this.applyFormatting('italic');
                    break;
                    
                case 'h':
                    e.preventDefault();
                    this.applyFormatting('heading');
                    break;
                    
                case 'u':
                    e.preventDefault();
                    this.applyFormatting('ul');
                    break;
                    
                case 'o':
                    e.preventDefault();
                    this.applyFormatting('ol');
                    break;
                    
                case 'q':
                    e.preventDefault();
                    this.applyFormatting('quote');
                    break;
                    
                case 'k':
                    e.preventDefault();
                    this.applyFormatting('link');
                    break;
                    
                case 't':
                    e.preventDefault();
                    this.applyFormatting('table');
                    break;
                    
                case 'r':
                    e.preventDefault();
                    this.applyFormatting('hr');
                    break;
                    
                case 's':
                    e.preventDefault();
                    this.saveDocument();
                    break;
                    
                case '`':
                    e.preventDefault();
                    this.applyFormatting('code');
                    break;
            }
            
            // Handle Shift combinations
            if (e.shiftKey) {
                switch (e.key) {
                    case 'C':
                        e.preventDefault();
                        this.applyFormatting('codeblock');
                        break;
                        
                    case 'I':
                        e.preventDefault();
                        this.applyFormatting('image');
                        break;
                }
            }
        }
        
        // Handle Tab key for list indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            this.handleTabIndentation(!e.shiftKey);
        }
    }
    
    handleTabIndentation(indent) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const lines = this.editor.value.split('\n');
        
        // Find the line numbers that are selected
        let startLine = 0;
        let endLine = 0;
        let charCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (charCount + lines[i].length + 1 > start) {
                startLine = i;
                break;
            }
            charCount += lines[i].length + 1;
        }
        
        charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            if (charCount + lines[i].length + 1 > end) {
                endLine = i;
                break;
            }
            charCount += lines[i].length + 1;
        }
        
        // Apply indentation
        for (let i = startLine; i <= endLine; i++) {
            if (indent) {
                // Add two spaces for indentation
                lines[i] = '  ' + lines[i];
            } else {
                // Remove two spaces if present
                lines[i] = lines[i].replace(/^  /, '');
            }
        }
        
        // Update editor content
        this.editor.value = lines.join('\n');
        this.editor.focus();
        this.updatePreview();
        this.scheduleAutosave();
    }
    
    updatePreview() {
        const markdownText = this.editor.value;
        
        // Add loading animation
        this.animatePreviewUpdate();
        
        if (markdownText.trim() === '') {
            setTimeout(() => {
                this.preview.innerHTML = `
                    <div class="text-[var(--text-secondary)] text-center mt-12">
                        <i class="fas fa-markdown text-6xl mb-6 text-[var(--accent-primary)]"></i>
                        <p class="text-lg">Your Markdown preview will appear here...</p>
                    </div>
                `;
            }, 150);
        } else {
            setTimeout(() => {
                try {
                    const html = marked.parse(markdownText);
                    this.preview.innerHTML = html;
                    
                    // Re-highlight code blocks after updating preview
                    this.preview.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                    
                    // Add fade-in animation to new content
                    this.preview.querySelectorAll('h1, h2, h3, p, ul, ol, blockquote, table').forEach((el, index) => {
                        el.style.opacity = '0';
                        el.style.transform = 'translateY(10px)';
                        el.style.transition = 'all 0.3s ease';
                        
                        setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, index * 50);
                    });
                } catch (error) {
                    console.error('Markdown parsing error:', error);
                    this.preview.innerHTML = `<div class="text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-4">Error parsing Markdown: ${error.message}</div>`;
                }
            }, 150);
        }
    }
    
    animatePreviewUpdate() {
        this.preview.style.opacity = '0.7';
        this.preview.style.transform = 'scale(0.98)';
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.preview.style.transition = 'all 0.3s ease';
                this.preview.style.opacity = '1';
                this.preview.style.transform = 'scale(1)';
            }, 50);
        });
    }
    
    addToolbarAnimations() {
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('mouseenter', (e) => {
                // Add ripple effect
                const ripple = document.createElement('span');
                ripple.style.position = 'absolute';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.background = 'rgba(255, 255, 255, 0.3)';
                ripple.style.borderRadius = '50%';
                ripple.style.transform = 'translate(-50%, -50%)';
                ripple.style.pointerEvents = 'none';
                ripple.style.animation = 'ripple 0.6s ease-out';
                
                const rect = btn.getBoundingClientRect();
                ripple.style.left = `${e.clientX - rect.left}px`;
                ripple.style.top = `${e.clientY - rect.top}px`;
                
                btn.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
    
    addEditorFocusEffects() {
        this.editor.addEventListener('focus', () => {
            this.editor.parentElement.classList.add('ring-2', 'ring-[#4C6EF5]', 'ring-opacity-50');
        });
        
        this.editor.addEventListener('blur', () => {
            this.editor.parentElement.classList.remove('ring-2', 'ring-[#4C6EF5]', 'ring-opacity-50');
        });
    }
    
    async exportToFile() {
        if (!this.currentDocument) return;
        
        try {
            const content = this.editor.value;
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentDocument.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            window.app.showToast('File exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            window.app.showToast('Error exporting file', 'error');
        }
    }
    
    exportToPDF() {
        window.app.showToast('PDF export feature requires additional setup', 'warning');
    }
    
    async shareDocument() {
        if (!this.currentDocument) return;
        
        try {
            const response = await this.makeAuthenticatedRequest(`/documents/${this.currentDocument.id}/share`, {
                method: 'POST',
                body: JSON.stringify({
                    permission_level: 'write'
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Copy share URL to clipboard
                navigator.clipboard.writeText(data.share_url).then(() => {
                    window.app.showToast('Share link copied to clipboard!');
                });
            } else {
                window.app.showToast(data.error || 'Failed to share document', 'error');
            }
        } catch (error) {
            console.error('Share error:', error);
            window.app.showToast('Error sharing document', 'error');
        }
    }
    
    clearEditor() {
        if (this.editor.value.trim() !== '') {
            if (confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
                this.editor.value = '';
                this.updatePreview();
                this.scheduleAutosave();
                window.app.showToast('Content cleared');
            }
        }
    }
    
    openDocumentManager() {
        window.location.href = 'dashboard.html';
    }
    
    openTemplates() {
        // Open templates modal
        window.app.showToast('Templates feature coming soon!', 'warning');
    }
    
    openFindReplace() {
        // Open find/replace modal
        window.app.showToast('Find & replace feature coming soon!', 'warning');
    }
    
    toggleTOC() {
        // Toggle table of contents
        window.app.showToast('TOC feature coming soon!', 'warning');
    }
}

// Initialize API-based editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize editor if we're on the editor page
    if (document.getElementById('editor')) {
        window.apiMarkdownEditor = new APIMarkdownEditor();
    }
});