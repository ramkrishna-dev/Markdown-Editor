// Markdown Editor JavaScript Implementation
class MarkdownEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.charCount = document.getElementById('charCount');
        this.lastSaved = document.getElementById('lastSaved');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        // Autosave timer
        this.autosaveTimer = null;
        this.autosaveDelay = 1000; // 1 second
        
        this.init();
    }
    
    init() {
        this.setupMarked();
        this.loadFromStorage();
        this.setupEventListeners();
        this.updatePreview();
        this.updateCharCount();
        this.addToolbarAnimations();
        this.addEditorFocusEffects();
    }
    
    // Configure marked.js for GitHub-flavored Markdown
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
    
    // Setup all event listeners
    setupEventListeners() {
        // Editor input events
        this.editor.addEventListener('input', () => {
            this.updatePreview();
            this.updateCharCount();
            this.scheduleAutosave();
        });
        
        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.applyFormatting(action);
            });
        });
        
        // Header buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToStorage());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToFile());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearEditor());
        
        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
        
        // Handle paste events for better formatting
        this.editor.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.updatePreview();
                this.scheduleAutosave();
            }, 10);
        });
    }
    
    // Apply formatting to selected text
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
        this.updateCharCount();
        this.scheduleAutosave();
    }
    
    // Handle keyboard shortcuts
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
                    this.saveToStorage();
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
    
    // Handle Tab/Shift+Tab for list indentation
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
    
    // Update preview with rendered Markdown and smooth animations
    updatePreview() {
        const markdownText = this.editor.value;
        
        // Add loading animation
        this.animatePreviewUpdate();
        
        if (markdownText.trim() === '') {
            setTimeout(() => {
                this.preview.innerHTML = `
                    <div class="text-[#B0B0B0] text-center mt-12">
                        <i class="fas fa-markdown text-6xl mb-6 text-[#4C6EF5]"></i>
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
    
    // Update character count
    updateCharCount() {
        const count = this.editor.value.length;
        this.charCount.textContent = count;
    }
    
    // Schedule autosave
    scheduleAutosave() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
        
        this.autosaveTimer = setTimeout(() => {
            this.saveToStorage();
        }, this.autosaveDelay);
    }
    
    // Save content to localStorage
    saveToStorage() {
        try {
            const content = this.editor.value;
            const timestamp = new Date().toISOString();
            
            localStorage.setItem('markdown-content', content);
            localStorage.setItem('markdown-timestamp', timestamp);
            
            this.updateLastSaved(timestamp);
            this.showToast('Content saved successfully');
        } catch (error) {
            console.error('Save error:', error);
            this.showToast('Error saving content', 'error');
        }
    }
    
    // Load content from localStorage
    loadFromStorage() {
        try {
            const content = localStorage.getItem('markdown-content');
            const timestamp = localStorage.getItem('markdown-timestamp');
            
            if (content !== null) {
                this.editor.value = content;
                this.updateLastSaved(timestamp);
            }
        } catch (error) {
            console.error('Load error:', error);
        }
    }
    
    // Update last saved timestamp display
    updateLastSaved(timestamp) {
        if (timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            let timeText;
            if (diffMins < 1) {
                timeText = 'Just now';
            } else if (diffMins < 60) {
                timeText = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            } else {
                const hours = Math.floor(diffMins / 60);
                if (hours < 24) {
                    timeText = `${hours} hour${hours > 1 ? 's' : ''} ago`;
                } else {
                    timeText = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                }
            }
            
            this.lastSaved.textContent = `Last saved: ${timeText}`;
        } else {
            this.lastSaved.textContent = 'Never saved';
        }
    }
    
    // Export content to .md file
    exportToFile() {
        try {
            const content = this.editor.value;
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `markdown-${new Date().toISOString().slice(0, 10)}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.showToast('File exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting file', 'error');
        }
    }
    
    // Clear editor content
    clearEditor() {
        if (this.editor.value.trim() !== '') {
            if (confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
                this.editor.value = '';
                this.updatePreview();
                this.updateCharCount();
                this.scheduleAutosave();
                this.showToast('Content cleared');
            }
        }
    }
    
    // Show toast notification with enhanced animations
    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        
        // Reset classes
        this.toast.className = 'toast-notification fixed bottom-6 right-6 px-6 py-3 transform transition-all duration-300';
        
        // Set background gradient based on type
        if (type === 'error') {
            this.toast.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        } else if (type === 'warning') {
            this.toast.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            this.toast.style.background = 'linear-gradient(135deg, #4C6EF5 0%, #5C7CFA 100%)';
        }
        
        // Show toast with slide-up animation
        requestAnimationFrame(() => {
            this.toast.classList.remove('translate-y-20', 'opacity-0', 'scale-95');
            this.toast.classList.add('translate-y-0', 'opacity-100', 'scale-100');
        });
        
        // Hide after 3 seconds with slide-down animation
        setTimeout(() => {
            this.toast.classList.add('translate-y-20', 'opacity-0', 'scale-95');
            this.toast.classList.remove('translate-y-0', 'opacity-100', 'scale-100');
        }, 3000);
    }
    
    // Add smooth transition effects for toolbar buttons
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
    
    // Add smooth focus transitions for editor
    addEditorFocusEffects() {
        this.editor.addEventListener('focus', () => {
            this.editor.parentElement.classList.add('ring-2', 'ring-[#4C6EF5]', 'ring-opacity-50');
        });
        
        this.editor.addEventListener('blur', () => {
            this.editor.parentElement.classList.remove('ring-2', 'ring-[#4C6EF5]', 'ring-opacity-50');
        });
    }
    
    // Add smooth preview loading animation
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
}

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});

// Update last saved time every minute
setInterval(() => {
    const editor = new MarkdownEditor();
    const timestamp = localStorage.getItem('markdown-timestamp');
    if (timestamp) {
        editor.updateLastSaved(timestamp);
    }
}, 60000);