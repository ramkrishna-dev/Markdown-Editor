const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API routes
app.use('/api/', limiter);

// Static files
app.use(express.static(path.join(__dirname)));

// Database setup
const dbPath = process.env.DB_PATH || './database/markdown-editor.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar_url TEXT,
            bio TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_admin BOOLEAN DEFAULT 0,
            last_login DATETIME,
            preferences TEXT
        )
    `);

    // Documents table
    db.run(`
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT DEFAULT '',
            owner_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_public BOOLEAN DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            word_count INTEGER DEFAULT 0,
            reading_time INTEGER DEFAULT 0,
            FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Document versions table
    db.run(`
        CREATE TABLE IF NOT EXISTS document_versions (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT NOT NULL,
            change_summary TEXT,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Document shares table
    db.run(`
        CREATE TABLE IF NOT EXISTS document_shares (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            shared_with_user_id TEXT,
            share_token TEXT UNIQUE,
            permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            created_by TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (shared_with_user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Tags table
    db.run(`
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#4C6EF5',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Document tags junction table
    db.run(`
        CREATE TABLE IF NOT EXISTS document_tags (
            document_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (document_id, tag_id),
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
        )
    `);

    // Categories table
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT DEFAULT 'folder',
            color TEXT DEFAULT '#4C6EF5',
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Document analytics table
    db.run(`
        CREATE TABLE IF NOT EXISTS document_analytics (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            user_id TEXT,
            action TEXT NOT NULL CHECK (action IN ('view', 'edit', 'share', 'export')),
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        )
    `);

    // User sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    console.log('Database tables initialized successfully.');
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Helper functions
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return Math.ceil(words / wordsPerMinute);
}

function calculateWordCount(content) {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
}

// ============= AUTHENTICATION ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if user exists
        db.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email],
            (err, row) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (row) {
                    return res.status(409).json({ error: 'Username or email already exists' });
                }

                // Create user
                const userId = uuidv4();
                const hashedPassword = bcrypt.hashSync(password, 10);

                db.run(
                    `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
                    [userId, username, email, hashedPassword],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to create user' });
                        }

                        const token = generateToken({ id: userId, username, email });
                        res.status(201).json({
                            message: 'User created successfully',
                            token,
                            user: { id: userId, username, email }
                        });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username],
            (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user || !bcrypt.compareSync(password, user.password_hash)) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Update last login
                db.run(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                    [user.id]
                );

                const token = generateToken(user);
                res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        avatar_url: user.avatar_url,
                        is_admin: user.is_admin
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, username, email, avatar_url, bio, created_at, is_admin, preferences FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(user);
        }
    );
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
    try {
        const { username, email, bio, avatar_url, preferences } = req.body;
        const userId = req.user.id;

        db.run(
            `UPDATE users SET username = ?, email = ?, bio = ?, avatar_url = ?, preferences = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [username, email, bio, avatar_url, JSON.stringify(preferences), userId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update profile' });
                }
                res.json({ message: 'Profile updated successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============= DOCUMENT ROUTES =============

// Get all documents for user
app.get('/api/documents', authenticateToken, (req, res) => {
    const { page = 1, limit = 20, search, tags, category } = req.query;
    const offset = (page - 1) * limit;
    let query = `
        SELECT d.*, 
               GROUP_CONCAT(t.name) as tags,
               c.name as category_name
        FROM documents d
        LEFT JOIN document_tags dt ON d.id = dt.document_id
        LEFT JOIN tags t ON dt.tag_id = t.id
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.owner_id = ?
    `;
    const params = [req.user.id];

    if (search) {
        query += ' AND (d.title LIKE ? OR d.content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (tags) {
        const tagArray = tags.split(',');
        query += ` AND t.name IN (${tagArray.map(() => '?').join(',')})`;
        params.push(...tagArray);
    }

    query += ' GROUP BY d.id ORDER BY d.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, documents) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM documents WHERE owner_id = ?';
        let countParams = [req.user.id];
        
        if (search) {
            countQuery += ' AND (title LIKE ? OR content LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                documents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Get single document
app.get('/api/documents/:id', authenticateToken, (req, res) => {
    const documentId = req.params.id;

    db.get(
        `SELECT d.*, u.username as owner_username,
                GROUP_CONCAT(t.name) as tags
         FROM documents d
         JOIN users u ON d.owner_id = u.id
         LEFT JOIN document_tags dt ON d.id = dt.document_id
         LEFT JOIN tags t ON dt.tag_id = t.id
         WHERE d.id = ? AND (d.owner_id = ? OR d.is_public = 1)
         GROUP BY d.id`,
        [documentId, req.user.id],
        (err, document) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            // Log view analytics
            db.run(
                'INSERT INTO document_analytics (id, document_id, user_id, action) VALUES (?, ?, ?, ?)',
                [uuidv4(), documentId, req.user.id, 'view']
            );

            // Increment view count
            db.run(
                'UPDATE documents SET view_count = view_count + 1 WHERE id = ?',
                [documentId]
            );

            res.json(document);
        }
    );
});

// Create document
app.post('/api/documents', authenticateToken, (req, res) => {
    try {
        const { title, content, is_public = false, tags = [], category_id } = req.body;
        const documentId = uuidv4();
        const userId = req.user.id;
        const wordCount = calculateWordCount(content);
        const readingTime = calculateReadingTime(content);

        db.run(
            `INSERT INTO documents (id, title, content, owner_id, is_public, word_count, reading_time, category_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [documentId, title, content, userId, is_public, wordCount, readingTime, category_id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create document' });
                }

                // Add tags if provided
                if (tags.length > 0) {
                    const tagPromises = tags.map(tagName => {
                        return new Promise((resolve, reject) => {
                            // Find or create tag
                            db.get(
                                'SELECT id FROM tags WHERE name = ?',
                                [tagName],
                                (err, tag) => {
                                    if (err) return reject(err);
                                    
                                    if (tag) {
                                        resolve(tag.id);
                                    } else {
                                        const tagId = uuidv4();
                                        db.run(
                                            'INSERT INTO tags (id, name) VALUES (?, ?)',
                                            [tagId, tagName],
                                            () => resolve(tagId)
                                        );
                                    }
                                }
                            );
                        });
                    });

                    Promise.all(tagPromises).then(tagIds => {
                        tagIds.forEach(tagId => {
                            db.run(
                                'INSERT INTO document_tags (document_id, tag_id) VALUES (?, ?)',
                                [documentId, tagId]
                            );
                        });
                    });
                }

                // Log creation analytics
                db.run(
                    'INSERT INTO document_analytics (id, document_id, user_id, action) VALUES (?, ?, ?, ?)',
                    [uuidv4(), documentId, userId, 'create']
                );

                res.status(201).json({
                    message: 'Document created successfully',
                    document: {
                        id: documentId,
                        title,
                        content,
                        is_public,
                        word_count: wordCount,
                        reading_time: readingTime
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update document
app.put('/api/documents/:id', authenticateToken, (req, res) => {
    try {
        const { title, content, is_public, tags, category_id } = req.body;
        const documentId = req.params.id;
        const userId = req.user.id;
        const wordCount = calculateWordCount(content);
        const readingTime = calculateReadingTime(content);

        // Check ownership
        db.get(
            'SELECT owner_id FROM documents WHERE id = ?',
            [documentId],
            (err, doc) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!doc || doc.owner_id !== userId) {
                    return res.status(403).json({ error: 'Access denied' });
                }

                // Create version before updating
                db.get(
                    'SELECT MAX(version_number) as max_version FROM document_versions WHERE document_id = ?',
                    [documentId],
                    (err, versionResult) => {
                        const nextVersion = (versionResult?.max_version || 0) + 1;

                        db.run(
                            'INSERT INTO document_versions (id, document_id, version_number, content, created_by) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), documentId, nextVersion, content, userId]
                        );

                        // Update document
                        db.run(
                            `UPDATE documents SET title = ?, content = ?, is_public = ?, word_count = ?, 
                                    reading_time = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP 
                             WHERE id = ?`,
                            [title, content, is_public, wordCount, readingTime, category_id, documentId],
                            function(err) {
                                if (err) {
                                    return res.status(500).json({ error: 'Failed to update document' });
                                }

                                // Update tags
                                if (tags) {
                                    // Remove existing tags
                                    db.run(
                                        'DELETE FROM document_tags WHERE document_id = ?',
                                        [documentId]
                                    );

                                    // Add new tags
                                    tags.forEach(tagName => {
                                        db.get(
                                            'SELECT id FROM tags WHERE name = ?',
                                            [tagName],
                                            (err, tag) => {
                                                if (tag) {
                                                    db.run(
                                                        'INSERT INTO document_tags (document_id, tag_id) VALUES (?, ?)',
                                                        [documentId, tag.id]
                                                    );
                                                }
                                            }
                                        );
                                    });
                                }

                                // Log update analytics
                                db.run(
                                    'INSERT INTO document_analytics (id, document_id, user_id, action) VALUES (?, ?, ?, ?)',
                                    [uuidv4(), documentId, userId, 'edit']
                                );

                                res.json({ message: 'Document updated successfully' });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete document
app.delete('/api/documents/:id', authenticateToken, (req, res) => {
    const documentId = req.params.id;
    const userId = req.user.id;

    // Check ownership
    db.get(
        'SELECT owner_id FROM documents WHERE id = ?',
        [documentId],
        (err, doc) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!doc || doc.owner_id !== userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            db.run(
                'DELETE FROM documents WHERE id = ?',
                [documentId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to delete document' });
                    }

                    res.json({ message: 'Document deleted successfully' });
                }
            );
        }
    );
});

// ============= COLLABORATION ROUTES =============

// Share document
app.post('/api/documents/:id/share', authenticateToken, (req, res) => {
    try {
        const { permission_level = 'read', expires_at } = req.body;
        const documentId = req.params.id;
        const userId = req.user.id;
        const shareToken = uuidv4();

        // Check ownership
        db.get(
            'SELECT owner_id FROM documents WHERE id = ?',
            [documentId],
            (err, doc) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!doc || doc.owner_id !== userId) {
                    return res.status(403).json({ error: 'Access denied' });
                }

                db.run(
                    'INSERT INTO document_shares (id, document_id, share_token, permission_level, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), documentId, shareToken, permission_level, expires_at, userId],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to share document' });
                        }

                        res.json({
                            message: 'Document shared successfully',
                            share_token: shareToken,
                            share_url: `${req.protocol}://${req.get('host')}/shared/${shareToken}`
                        });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get shared document
app.get('/api/shared/:token', (req, res) => {
    const shareToken = req.params.token;

    db.get(
        `SELECT ds.*, d.title, d.content, d.created_at, d.updated_at,
                u.username as owner_username
         FROM document_shares ds
         JOIN documents d ON ds.document_id = d.id
         JOIN users u ON d.owner_id = u.id
         WHERE ds.share_token = ? 
         AND (ds.expires_at IS NULL OR ds.expires_at > CURRENT_TIMESTAMP)`,
        [shareToken],
        (err, share) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!share) {
                return res.status(404).json({ error: 'Shared document not found or expired' });
            }

            res.json(share);
        }
    );
});

// ============= SEARCH ROUTES =============

// Full-text search
app.get('/api/search', authenticateToken, (req, res) => {
    const { q: query, type = 'documents', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    let searchQuery;
    let params = [req.user.id, `%${query}%`, `%${query}%`, parseInt(limit), offset];

    if (type === 'documents') {
        searchQuery = `
            SELECT d.*, u.username as owner_username,
                   GROUP_CONCAT(t.name) as tags
            FROM documents d
            JOIN users u ON d.owner_id = u.id
            LEFT JOIN document_tags dt ON d.id = dt.document_id
            LEFT JOIN tags t ON dt.tag_id = t.id
            WHERE d.owner_id = ? 
            AND (d.title LIKE ? OR d.content LIKE ?)
            GROUP BY d.id
            ORDER BY d.updated_at DESC
            LIMIT ? OFFSET ?
        `;
    }

    db.all(searchQuery, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Search failed' });
        }

        res.json({
            query,
            type,
            results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    });
});

// ============= ANALYTICS ROUTES =============

// Get document analytics
app.get('/api/analytics/documents/:id', authenticateToken, (req, res) => {
    const documentId = req.params.id;
    const userId = req.user.id;

    // Check ownership
    db.get(
        'SELECT owner_id FROM documents WHERE id = ?',
        [documentId],
        (err, doc) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!doc || doc.owner_id !== userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            db.all(
                `SELECT action, COUNT(*) as count, DATE(created_at) as date
                 FROM document_analytics 
                 WHERE document_id = ?
                 GROUP BY action, DATE(created_at)
                 ORDER BY date DESC
                 LIMIT 30`,
                [documentId],
                (err, analytics) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({ analytics });
                }
            );
        }
    );
});

// Get user analytics
app.get('/api/analytics/user', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.all(
        `SELECT COUNT(*) as total_documents,
                SUM(view_count) as total_views,
                AVG(word_count) as avg_word_count
         FROM documents 
         WHERE owner_id = ?`,
        [userId],
        (err, stats) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ stats: stats[0] });
        }
    );
});

// ============= ADMIN ROUTES =============

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    db.all(
        'SELECT id, username, email, created_at, last_login, is_admin FROM users ORDER BY created_at DESC',
        (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ users });
        }
    );
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        server: 'Node.js/Express'
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// WebSocket setup for real-time collaboration
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('User connected to WebSocket');

    socket.on('join-document', (data) => {
        const { documentId, token } = data;
        
        // Verify token
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                socket.emit('error', { message: 'Invalid token' });
                return;
            }

            // Check if user has access to document
            db.get(
                `SELECT d.id FROM documents d
                 LEFT JOIN document_shares ds ON d.id = ds.document_id
                 WHERE d.id = ? AND (d.owner_id = ? OR ds.share_token = ?)
                 AND (ds.expires_at IS NULL OR ds.expires_at > CURRENT_TIMESTAMP)`,
                [documentId, user.id, token],
                (err, doc) => {
                    if (err || !doc) {
                        socket.emit('error', { message: 'Access denied' });
                        return;
                    }

                    socket.join(documentId);
                    socket.emit('joined-document', { documentId, user: { id: user.id, username: user.username } });
                }
            );
        });
    });

    socket.on('document-change', (data) => {
        const { documentId, content, token } = data;
        
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return;

            // Broadcast change to other users in the document room
            socket.to(documentId).emit('document-updated', {
                content,
                updatedBy: { id: user.id, username: user.username },
                timestamp: new Date().toISOString()
            });
        });
    });

    socket.on('cursor-position', (data) => {
        const { documentId, position, token } = data;
        
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return;

            socket.to(documentId).emit('cursor-update', {
                position,
                user: { id: user.id, username: user.username }
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from WebSocket');
    });
});

module.exports = app;