const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.dirname(process.env.DB_PATH || './database/markdown-editor.db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to database
const db = new sqlite3.Database(process.env.DB_PATH || './database/markdown-editor.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Create tables first
        createTables((err) => {
            if (err) {
                console.error('Error creating tables:', err);
                db.close();
                return;
            }
            
            // Create indexes for better performance
            createIndexes();
            
            // Insert default data
            insertDefaultData();
            
            console.log('Database initialization completed.');
            
            // Close connection
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed.');
                }
            });
        });
    }
});

// Create database tables
function createTables(callback) {
    console.log('Creating database tables...');
    
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
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
        )`,
        
        `CREATE TABLE IF NOT EXISTS documents (
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
            category_id TEXT,
            FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS document_versions (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT NOT NULL,
            change_summary TEXT,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS document_shares (
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
        )`,
        
        `CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#4C6EF5',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS document_tags (
            document_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (document_id, tag_id),
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT DEFAULT 'folder',
            color TEXT DEFAULT '#4C6EF5',
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS document_analytics (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            user_id TEXT,
            action TEXT NOT NULL CHECK (action IN ('view', 'edit', 'share', 'export')),
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`
    ];
    
    let completed = 0;
    const total = tables.length;
    
    tables.forEach((sql, index) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(`Error creating table ${index + 1}:`, err.message);
                return callback(err);
            }
            
            completed++;
            if (completed === total) {
                callback(null);
            }
        });
    });
}

// Create database indexes for performance
function createIndexes() {
    console.log('Creating database indexes...');
    
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id)',
        'CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title)',
        'CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id)',
        'CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token)',
        'CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id)',
        'CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id)',
        'CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags(tag_id)',
        'CREATE INDEX IF NOT EXISTS idx_document_analytics_document_id ON document_analytics(document_id)',
        'CREATE INDEX IF NOT EXISTS idx_document_analytics_user_id ON document_analytics(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash)',
        'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)'
    ];
    
    indexes.forEach((indexSql, index) => {
        db.run(indexSql, (err) => {
            if (err) {
                console.error(`Error creating index ${index + 1}:`, err.message);
            } else {
                console.log(`Index ${index + 1} created successfully.`);
            }
        });
    });
}

// Insert default data
function insertDefaultData() {
    console.log('Inserting default data...');
    
    // Insert default tags
    const defaultTags = [
        { name: 'Tutorial', color: '#10B981' },
        { name: 'Documentation', color: '#3B82F6' },
        { name: 'Blog', color: '#8B5CF6' },
        { name: 'Personal', color: '#EC4899' },
        { name: 'Work', color: '#F59E0B' },
        { name: 'Code', color: '#6366F1' },
        { name: 'Notes', color: '#84CC16' },
        { name: 'Project', color: '#06B6D4' },
        { name: 'Research', color: '#7C3AED' }
    ];
    
    defaultTags.forEach((tag, index) => {
        const tagId = `tag-${index + 1}`;
        db.run(
            'INSERT OR IGNORE INTO tags (id, name, color) VALUES (?, ?, ?)',
            [tagId, tag.name, tag.color],
            (err) => {
                if (err) {
                    console.error(`Error inserting tag ${tag.name}:`, err.message);
                } else {
                    console.log(`Tag "${tag.name}" inserted successfully.`);
                }
            }
        );
    });
    
    // Insert default categories
    const defaultCategories = [
        { name: 'Personal Notes', description: 'Personal thoughts and ideas', icon: 'user', color: '#EC4899' },
        { name: 'Work Projects', description: 'Work-related documents', icon: 'briefcase', color: '#3B82F6' },
        { name: 'Documentation', description: 'Technical documentation', icon: 'book', color: '#10B981' },
        { name: 'Blog Posts', description: 'Blog articles and posts', icon: 'edit', color: '#8B5CF6' },
        { name: 'Code Snippets', description: 'Useful code snippets', icon: 'code', color: '#6366F1' },
        { name: 'Meeting Notes', description: 'Meeting minutes and notes', icon: 'users', color: '#F59E0B' },
        { name: 'Research', description: 'Research materials and references', icon: 'search', color: '#7C3AED' },
        { name: 'Templates', description: 'Document templates', icon: 'copy', color: '#84CC16' }
    ];
    
    defaultCategories.forEach((category, index) => {
        const categoryId = `cat-${index + 1}`;
        const createdBy = 'system'; // System user ID
        
        db.run(
            'INSERT OR IGNORE INTO categories (id, name, description, icon, color, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [categoryId, category.name, category.description, category.icon, category.color, createdBy],
            (err) => {
                if (err) {
                    console.error(`Error inserting category ${category.name}:`, err.message);
                } else {
                    console.log(`Category "${category.name}" inserted successfully.`);
                }
            }
        );
    });
    
    // Create a default admin user (for development)
    const adminId = 'admin-001';
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.run(
        'INSERT OR IGNORE INTO users (id, username, email, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)',
        [adminId, 'admin', 'admin@example.com', hashedPassword, 1],
        (err) => {
            if (err) {
                console.error('Error creating admin user:', err.message);
            } else {
                console.log('Default admin user created (username: admin, password: admin123)');
            }
        }
    );
}