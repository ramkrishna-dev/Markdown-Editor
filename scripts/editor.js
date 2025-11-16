// Enhanced Markdown Editor with Advanced Features
class AdvancedMarkdownEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.readingTime = document.getElementById('readingTime');
        this.lineCount = document.getElementById('lineCount');
        this.paragraphCount = document.getElementById('paragraphCount');
        this.lastSaved = document.getElementById('lastSaved');
        
        // Autosave timer
        this.autosaveTimer = null;
        this.autosaveDelay = 1000;
        
        // Current document
        this.currentDocument = {
            id: null,
            title: 'Untitled Document',
            content: '',
            createdAt: null,
            updatedAt: null
        };
        
        // Templates
        this.templates = {
            readme: `# Project Title

A brief description of what this project does and who it's for.

## Installation

\`\`\`bash
npm install my-project
\`\`\`

## Usage

\`\`\`javascript
const myProject = require('my-project');
const result = myProject.doSomething();
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)`,
            
            'blog-post': `# Blog Post Title

> A compelling subtitle or hook

## Introduction

Start with an engaging introduction that captures the reader's attention and sets the context for your article.

## Main Point 1

Elaborate on your first key point with examples, data, or personal experiences.

## Main Point 2

Continue with your second major argument or insight.

## Conclusion

Summarize the key takeaways and provide a call to action or final thought.

---

*Tags: technology, programming, tutorial*`,
            
            documentation: `# API Documentation

## Overview

This document describes the API endpoints and usage examples.

## Authentication

All API requests require authentication using an API key.

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.example.com/v1/data
\`\`\`

## Endpoints

### GET /users

Retrieve a list of users.

**Parameters:**
- \`page\` (integer): Page number
- \`limit\` (integer): Number of results per page

**Response:**
\`\`\`json
{
  "users": [...],
  "total": 100,
  "page": 1
}
\`\`\`

### POST /users

Create a new user.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\``,
            
            'javascript-function': `// Function Description
function functionName(parameter1, parameter2) {
  // Validate input
  if (!parameter1 || !parameter2) {
    throw new Error('Missing required parameters');
  }
  
  // Process data
  const result = parameter1 + parameter2;
  
  // Return result
  return result;
}

// Usage example
try {
  const output = functionName('Hello', 'World');
  console.log(output);
} catch (error) {
  console.error(error.message);
}`,
            
            'api-endpoint': `## Endpoint Name

### Description
Brief description of what this endpoint does.

### Request
\`\`\`http
GET /api/v1/resource
\`\`\`

### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Resource identifier |
| format | string | No | Response format (json/xml) |

### Response
\`\`\`json
{
  "id": "123",
  "name": "Resource Name",
  "created_at": "2024-01-01T00:00:00Z"
}
\`\`\`

### Error Codes
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error`,
            
            'meeting-notes': `# Meeting Notes - [Date]

## Attendees
- [Name 1]
- [Name 2]
- [Name 3]

## Agenda
1. Topic 1
2. Topic 2
3. Topic 3

## Discussion & Decisions

### Topic 1
**Discussion:** [Notes about the discussion]
**Decision:** [Final decision made]
**Action Items:**
- [ ] Task 1 - Assigned to: [Name] - Due: [Date]
- [ ] Task 2 - Assigned to: [Name] - Due: [Date]

### Topic 2
**Discussion:** [Notes about the discussion]
**Decision:** [Final decision made]

## Next Meeting
**Date:** [Next meeting date]
**Time:** [Next meeting time]
**Location:** [Meeting location or link]

## Parking Lot
- [Topic for future discussion]
- [Additional notes]`,
            
            'todo-list': `# Todo List

## High Priority
- [ ] [Task description] - Due: [Date]
- [ ] [Task description] - Due: [Date]

## Medium Priority
- [ ] [Task description] - Due: [Date]
- [ ] [Task description] - Due: [Date]

## Low Priority
- [ ] [Task description] - Due: [Date]
- [ ] [Task description] - Due: [Date]

## Completed
- [x] [Completed task] - Completed: [Date]
- [x] [Another completed task] - Completed: [Date]

## Notes
[Additional notes or context about the tasks]`
        };
        
        this.init();
    }
    
    init() {
        this.setupMarked();
        this.loadFromStorage();
        this.setupEventListeners();
        this.updatePreview();
        this.updateStatistics();
        this.addToolbarAnimations();
        this.addEditorFocusEffects();
        this.setupAdvancedFeatures();
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
            this.updateStatistics();
            this.scheduleAutosave();
            this.updateTOC();
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
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearEditor());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareDocument());
        
        // Advanced feature buttons
        document.getElementById('documentsBtn').addEventListener('click', () => this.openDocumentManager());
        document.getElementById('templatesBtn').addEventListener('click', () => this.openTemplates());
        document.getElementById('findReplaceBtn').addEventListener('click', () => this.openFindReplace());
        document.getElementById('tocBtn').addEventListener('click', () => this.toggleTOC());
        
        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
        
        // Update last saved time every minute
        setInterval(() => {
            const timestamp = localStorage.getItem('markdown-timestamp');
            if (timestamp) {
                this.updateLastSaved(timestamp);
            }
        }, 60000);
    }
    
    // Setup advanced features
    setupAdvancedFeatures() {
        this.setupDocumentManager();
        this.setupFindReplace();
        this.setupTemplates();
        this.setupCommandPalette();
        this.setupFloatingActionButtons();
        this.setupModalOverlay();
    }
    
    // Document Manager
    setupDocumentManager() {
        const closeBtn = document.getElementById('closeDocumentsBtn');
        const newBtn = document.getElementById('newDocumentBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDocumentManager());
        }
        
        if (newBtn) {
            newBtn.addEventListener('click', () => this.createNewDocument());
        }
        
        this.loadDocuments();
    }
    
    openDocumentManager() {
        const manager = document.getElementById('documentManager');
        const overlay = document.getElementById('modalOverlay');
        if (manager) {
            manager.classList.add('active');
            if (overlay) overlay.classList.add('active');
            this.loadDocuments();
        }
    }
    
    closeDocumentManager() {
        const manager = document.getElementById('documentManager');
        const overlay = document.getElementById('modalOverlay');
        if (manager) {
            manager.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    }
    
    loadDocuments() {
        const documents = JSON.parse(localStorage.getItem('markdown-documents') || '[]');
        const list = document.getElementById('documentList');
        
        if (!list) return;
        
        list.innerHTML = '';
        
        documents.forEach(doc => {
            const item = document.createElement('div');
            item.className = 'document-item';
            if (doc.id === this.currentDocument.id) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <div class="document-item-title">${doc.title}</div>
                <div class="document-item-date">${new Date(doc.updatedAt).toLocaleDateString()}</div>
                <button class="document-item-delete" data-id="${doc.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.document-item-delete')) {
                    this.loadDocument(doc.id);
                }
            });
            
            const deleteBtn = item.querySelector('.document-item-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteDocument(doc.id);
            });
            
            list.appendChild(item);
        });
    }
    
    createNewDocument() {
        const title = prompt('Enter document title:');
        if (!title) return;
        
        const newDoc = {
            id: Date.now().toString(),
            title: title,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const documents = JSON.parse(localStorage.getItem('markdown-documents') || '[]');
        documents.push(newDoc);
        localStorage.setItem('markdown-documents', JSON.stringify(documents));
        
        this.loadDocument(newDoc.id);
        this.loadDocuments();
    }
    
    loadDocument(docId) {
        const documents = JSON.parse(localStorage.getItem('markdown-documents') || '[]');
        const doc = documents.find(d => d.id === docId);
        
        if (doc) {
            this.currentDocument = doc;
            this.editor.value = doc.content;
            this.updatePreview();
            this.updateStatistics();
            this.closeDocumentManager();
            
            // Update document title in UI
            document.title = `${doc.title} - Markdown Editor`;
        }
    }
    
    deleteDocument(docId) {
        if (!confirm('Are you sure you want to delete this document?')) return;
        
        let documents = JSON.parse(localStorage.getItem('markdown-documents') || '[]');
        documents = documents.filter(d => d.id !== docId);
        localStorage.setItem('markdown-documents', JSON.stringify(documents));
        
        if (docId === this.currentDocument.id) {
            this.currentDocument = {
                id: null,
                title: 'Untitled Document',
                content: '',
                createdAt: null,
                updatedAt: null
            };
            this.editor.value = '';
            this.updatePreview();
            this.updateStatistics();
        }
        
        this.loadDocuments();
    }
    
    // Find and Replace
    setupFindReplace() {
        const closeBtn = document.getElementById('closeFindReplaceBtn');
        const findNextBtn = document.getElementById('findNextBtn');
        const replaceBtn = document.getElementById('replaceBtn');
        const replaceAllBtn = document.getElementById('replaceAllBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeFindReplace());
        if (findNextBtn) findNextBtn.addEventListener('click', () => this.findNext());
        if (replaceBtn) replaceBtn.addEventListener('click', () => this.replace());
        if (replaceAllBtn) replaceAllBtn.addEventListener('click', () => this.replaceAll());
    }
    
    openFindReplace() {
        const findReplace = document.getElementById('findReplace');
        if (findReplace) {
            findReplace.classList.add('active');
            document.getElementById('findInput').focus();
        }
    }
    
    closeFindReplace() {
        const findReplace = document.getElementById('findReplace');
        if (findReplace) {
            findReplace.classList.remove('active');
        }
    }
    
    findNext() {
        const findText = document.getElementById('findInput').value;
        if (!findText) return;
        
        const content = this.editor.value;
        const currentIndex = this.editor.selectionStart;
        const foundIndex = content.indexOf(findText, currentIndex);
        
        if (foundIndex !== -1) {
            this.editor.setSelectionRange(foundIndex, foundIndex + findText.length);
            this.editor.focus();
        } else {
            // Search from beginning
            const firstIndex = content.indexOf(findText);
            if (firstIndex !== -1) {
                this.editor.setSelectionRange(firstIndex, firstIndex + findText.length);
                this.editor.focus();
            }
        }
    }
    
    replace() {
        const findText = document.getElementById('findInput').value;
        const replaceText = document.getElementById('replaceInput').value;
        
        if (!findText) return;
        
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        
        if (selectedText === findText) {
            const beforeText = this.editor.value.substring(0, start);
            const afterText = this.editor.value.substring(end);
            this.editor.value = beforeText + replaceText + afterText;
            this.editor.setSelectionRange(start, start + replaceText.length);
            this.updatePreview();
            this.updateStatistics();
            this.scheduleAutosave();
        }
    }
    
    replaceAll() {
        const findText = document.getElementById('findInput').value;
        const replaceText = document.getElementById('replaceInput').value;
        
        if (!findText) return;
        
        this.editor.value = this.editor.value.replaceAll(findText, replaceText);
        this.updatePreview();
        this.updateStatistics();
        this.scheduleAutosave();
    }
    
    // Templates
    setupTemplates() {
        const closeBtn = document.getElementById('closeTemplatesBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeTemplates());
        }
        
        // Template items
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => {
                const templateName = item.dataset.template;
                this.insertTemplate(templateName);
            });
        });
    }
    
    openTemplates() {
        const templates = document.getElementById('templatesPanel');
        const overlay = document.getElementById('modalOverlay');
        if (templates) {
            templates.classList.add('active');
            if (overlay) overlay.classList.add('active');
        }
    }
    
    closeTemplates() {
        const templates = document.getElementById('templatesPanel');
        const overlay = document.getElementById('modalOverlay');
        if (templates) {
            templates.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    }
    
    insertTemplate(templateName) {
        const template = this.templates[templateName];
        if (template) {
            this.editor.value = template;
            this.updatePreview();
            this.updateStatistics();
            this.scheduleAutosave();
            this.closeTemplates();
        }
    }
    
    // Command Palette
    setupCommandPalette() {
        const commandInput = document.getElementById('commandInput');
        const commandList = document.getElementById('commandList');
        
        if (!commandInput || !commandList) return;
        
        const commands = [
            { title: 'New Document', shortcut: 'Ctrl+N', action: () => this.createNewDocument() },
            { title: 'Open Documents', shortcut: 'Ctrl+D', action: () => this.openDocumentManager() },
            { title: 'Save Document', shortcut: 'Ctrl+S', action: () => this.saveToStorage() },
            { title: 'Export Markdown', shortcut: 'Ctrl+E', action: () => this.exportToFile() },
            { title: 'Export PDF', shortcut: 'Ctrl+P', action: () => this.exportToPDF() },
            { title: 'Find & Replace', shortcut: 'Ctrl+F', action: () => this.openFindReplace() },
            { title: 'Templates', shortcut: 'Ctrl+T', action: () => this.openTemplates() },
            { title: 'Toggle TOC', shortcut: 'Ctrl+O', action: () => this.toggleTOC() },
            { title: 'Share Document', shortcut: 'Ctrl+Shift+S', action: () => this.shareDocument() },
            { title: 'Clear Document', shortcut: 'Ctrl+Shift+D', action: () => this.clearEditor() }
        ];
        
        // Populate command list
        commands.forEach(cmd => {
            const item = document.createElement('div');
            item.className = 'command-palette-item';
            item.innerHTML = `
                <span class="command-palette-item-title">${cmd.title}</span>
                <span class="command-palette-item-shortcut">${cmd.shortcut}</span>
            `;
            item.addEventListener('click', () => {
                cmd.action();
                this.closeCommandPalette();
            });
            commandList.appendChild(item);
        });
        
        // Search functionality
        commandInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const items = commandList.querySelectorAll('.command-palette-item');
            
            items.forEach(item => {
                const title = item.querySelector('.command-palette-item-title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
        // Keyboard navigation
        let selectedIndex = -1;
        commandInput.addEventListener('keydown', (e) => {
            const items = Array.from(commandList.querySelectorAll('.command-palette-item:not([style*="display: none"])'));
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this.updateCommandSelection(items, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                this.updateCommandSelection(items, selectedIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    items[selectedIndex].click();
                }
            } else if (e.key === 'Escape') {
                this.closeCommandPalette();
            }
        });
    }
    
    updateCommandSelection(items, selectedIndex) {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }
    
    openCommandPalette() {
        const palette = document.getElementById('commandPalette');
        const overlay = document.getElementById('modalOverlay');
        if (palette) {
            palette.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.getElementById('commandInput').value = '';
            document.getElementById('commandInput').focus();
        }
    }
    
    closeCommandPalette() {
        const palette = document.getElementById('commandPalette');
        const overlay = document.getElementById('modalOverlay');
        if (palette) {
            palette.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    }
    
    // Floating Action Buttons
    setupFloatingActionButtons() {
        const fabBtn = document.getElementById('fabBtn');
        const fabMenu = document.getElementById('fabMenu');
        
        if (!fabBtn || !fabMenu) return;
        
        fabBtn.addEventListener('click', () => {
            fabMenu.classList.toggle('active');
        });
        
        // FAB menu items
        document.getElementById('fabDocuments').addEventListener('click', () => {
            this.openDocumentManager();
            fabMenu.classList.remove('active');
        });
        
        document.getElementById('fabTemplates').addEventListener('click', () => {
            this.openTemplates();
            fabMenu.classList.remove('active');
        });
        
        document.getElementById('fabFind').addEventListener('click', () => {
            this.openFindReplace();
            fabMenu.classList.remove('active');
        });
        
        document.getElementById('fabCommand').addEventListener('click', () => {
            this.openCommandPalette();
            fabMenu.classList.remove('active');
        });
    }
    
    // Modal Overlay
    setupModalOverlay() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeAllModals();
            });
        }
    }
    
    closeAllModals() {
        document.getElementById('documentManager').classList.remove('active');
        document.getElementById('findReplace').classList.remove('active');
        document.getElementById('templatesPanel').classList.remove('active');
        document.getElementById('commandPalette').classList.remove('active');
        document.getElementById('modalOverlay').classList.remove('active');
        document.getElementById('fabMenu').classList.remove('active');
    }
    
    // Table of Contents
    toggleTOC() {
        const tocPanel = document.getElementById('tocPanel');
        if (tocPanel) {
            if (tocPanel.style.display === 'none') {
                tocPanel.style.display = 'block';
                this.updateTOC();
            } else {
                tocPanel.style.display = 'none';
            }
        }
    }
    
    updateTOC() {
        const tocPanel = document.getElementById('tocPanel');
        if (!tocPanel || tocPanel.style.display === 'none') return;
        
        const content = this.editor.value;
        const headings = content.match(/^#{1,6}\s+(.+)$/gm) || [];
        const tocList = document.getElementById('tocList');
        
        if (!tocList) return;
        
        tocList.innerHTML = '';
        
        headings.forEach((heading, index) => {
            const level = heading.match(/^#+/)[0].length;
            const text = heading.replace(/^#+\s+/, '');
            const id = `heading-${index}`;
            
            const item = document.createElement('a');
            item.href = `#${id}`;
            item.className = `toc-item h${level}`;
            item.textContent = text;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // In a real implementation, this would scroll to the heading
                // For now, just close TOC
                this.toggleTOC();
            });
            
            tocList.appendChild(item);
        });
    }
    
    // Statistics
    updateStatistics() {
        const content = this.editor.value;
        
        // Character count
        const charCount = content.length;
        this.charCount.textContent = charCount;
        
        // Word count
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        this.wordCount.textContent = words;
        
        // Reading time (assuming 200 words per minute)
        const readingTime = Math.ceil(words / 200);
        this.readingTime.textContent = readingTime;
        
        // Line count
        const lines = content.split('\n').length;
        this.lineCount.textContent = lines;
        
        // Paragraph count
        const paragraphs = content.trim() ? content.trim().split(/\n\s*\n/).length : 0;
        this.paragraphCount.textContent = paragraphs;
    }
    
    // Export to PDF
    exportToPDF() {
        if (window.app) {
            window.app.showToast('PDF export feature requires additional setup', 'warning');
        }
        
        // In a real implementation, you would use a library like jsPDF or html2canvas
        // For now, we'll just show a message
        alert('PDF export would be implemented with a library like jsPDF or html2canvas');
    }
    
    // Share document
    shareDocument() {
        const content = this.editor.value;
        const shareData = {
            title: this.currentDocument.title,
            text: content.substring(0, 200) + '...',
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(content).then(() => {
                if (window.app) {
                    window.app.showToast('Document copied to clipboard');
                }
            });
        }
    }
    
    // Apply formatting (existing method)
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
        this.updateStatistics();
        this.scheduleAutosave();
    }
    
    // Handle keyboard shortcuts (enhanced)
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
                    this.toggleTOC();
                    break;
                    
                case 'd':
                    e.preventDefault();
                    this.openDocumentManager();
                    break;
                    
                case 'f':
                    e.preventDefault();
                    this.openFindReplace();
                    break;
                    
                case 't':
                    e.preventDefault();
                    this.openTemplates();
                    break;
                    
                case 'p':
                    e.preventDefault();
                    this.openCommandPalette();
                    break;
                    
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.shareDocument();
                    } else {
                        this.saveToStorage();
                    }
                    break;
                    
                case 'e':
                    e.preventDefault();
                    this.exportToFile();
                    break;
                    
                case 'n':
                    e.preventDefault();
                    this.createNewDocument();
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
                        
                    case 'D':
                        e.preventDefault();
                        this.clearEditor();
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
    
    // Schedule autosave
    scheduleAutosave() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
        
        this.autosaveTimer = setTimeout(() => {
            this.saveToStorage();
        }, this.autosaveDelay);
    }
    
    // Save content to localStorage (enhanced)
    saveToStorage() {
        try {
            const content = this.editor.value;
            const timestamp = new Date().toISOString();
            
            // Update current document
            this.currentDocument.content = content;
            this.currentDocument.updatedAt = timestamp;
            
            // Save to documents list
            let documents = JSON.parse(localStorage.getItem('markdown-documents') || '[]');
            
            if (this.currentDocument.id) {
                // Update existing document
                const index = documents.findIndex(d => d.id === this.currentDocument.id);
                if (index !== -1) {
                    documents[index] = this.currentDocument;
                }
            } else {
                // Create new document if content exists
                if (content.trim()) {
                    this.currentDocument.id = Date.now().toString();
                    this.currentDocument.title = this.generateDocumentTitle(content);
                    this.currentDocument.createdAt = timestamp;
                    documents.push(this.currentDocument);
                }
            }
            
            localStorage.setItem('markdown-documents', JSON.stringify(documents));
            localStorage.setItem('markdown-current-document', JSON.stringify(this.currentDocument));
            localStorage.setItem('markdown-timestamp', timestamp);
            
            this.updateLastSaved(timestamp);
            if (window.app) {
                window.app.showToast('Content saved successfully');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (window.app) {
                window.app.showToast('Error saving content', 'error');
            }
        }
    }
    
    // Load content from localStorage (enhanced)
    loadFromStorage() {
        try {
            // Load current document
            const currentDoc = JSON.parse(localStorage.getItem('markdown-current-document') || '{}');
            
            if (currentDoc.id) {
                this.currentDocument = currentDoc;
                this.editor.value = currentDoc.content || '';
                document.title = `${currentDoc.title} - Markdown Editor`;
            } else {
                // Fallback to old format
                const content = localStorage.getItem('markdown-content');
                const timestamp = localStorage.getItem('markdown-timestamp');
                
                if (content !== null) {
                    this.editor.value = content;
                    this.currentDocument.content = content;
                    this.currentDocument.updatedAt = timestamp;
                }
            }
            
            this.updateLastSaved(this.currentDocument.updatedAt);
        } catch (error) {
            console.error('Load error:', error);
        }
    }
    
    // Generate document title from content
    generateDocumentTitle(content) {
        const lines = content.split('\n');
        for (const line of lines) {
            const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
            if (headingMatch) {
                return headingMatch[1].trim();
            }
        }
        return 'Untitled Document';
    }
    
    // Update last saved timestamp display
    updateLastSaved(timestamp) {
        if (timestamp && window.app) {
            const timeText = window.app.formatTimestamp(timestamp);
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
            a.download = `${this.currentDocument.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            if (window.app) {
                window.app.showToast('File exported successfully');
            }
        } catch (error) {
            console.error('Export error:', error);
            if (window.app) {
                window.app.showToast('Error exporting file', 'error');
            }
        }
    }
    
    // Clear editor content
    clearEditor() {
        if (this.editor.value.trim() !== '') {
            if (confirm('Are you sure you want to clear all content? This action cannot be undone.')) {
                this.editor.value = '';
                this.updatePreview();
                this.updateStatistics();
                this.scheduleAutosave();
                if (window.app) {
                    window.app.showToast('Content cleared');
                }
            }
        }
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

// Initialize the advanced editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize editor if we're on the editor page
    if (document.getElementById('editor')) {
        window.advancedMarkdownEditor = new AdvancedMarkdownEditor();
    }
});