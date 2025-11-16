# Markdown Editor Pro

A professional-grade, full-stack Markdown editor with user authentication, real-time collaboration, and advanced features.

## 🚀 Features

### Core Editor Features
- **Live Markdown Preview** - Real-time rendering as you type
- **GitHub-Flavored Markdown** - Full GFM support including tables, strikethrough, task lists
- **Syntax Highlighting** - Beautiful code highlighting with Highlight.js
- **Formatting Toolbar** - Quick access to all formatting options
- **Keyboard Shortcuts** - Comprehensive keyboard shortcuts for power users
- **Auto-save** - Automatic saving to prevent data loss
- **Export Options** - Export to Markdown, PDF (framework ready)
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### User System & Authentication
- **User Registration** - Secure account creation with validation
- **Login System** - JWT-based authentication with session management
- **Profile Management** - Edit user information, avatar, bio, preferences
- **Password Security** - Bcrypt hashing with strength validation
- **Session Management** - Secure session handling with expiration

### Document Management
- **Cloud Storage** - All documents stored in SQLite database
- **Document Organization** - Categories and tags for better organization
- **Version History** - Complete document versioning with change tracking
- **Search & Filter** - Full-text search across all documents
- **Document Analytics** - View counts, reading time, word statistics
- **Bulk Operations** - Multiple document management capabilities

### Collaboration Features
- **Real-time Collaboration** - WebSocket-based live editing
- **Document Sharing** - Share documents with permission levels
- **User Presence** - See who's currently viewing/editing
- **Cursor Tracking** - Real-time cursor position sharing
- **Comment System** - Framework ready for document comments
- **Permission Levels** - Read, write, admin permissions

### Advanced Features
- **Templates System** - Pre-built templates for various document types
- **Command Palette** - Quick command access (Cmd/Ctrl+P)
- **Table of Contents** - Auto-generated TOC from headings
- **Dark/Light Themes** - Beautiful theme switching with persistence
- **Statistics Dashboard** - Comprehensive user and document analytics
- **Admin Panel** - User management and system administration
- **API Integration** - RESTful API for third-party integrations

## 🛠 Technology Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **SQLite** - Lightweight, file-based database
- **Socket.io** - Real-time WebSocket communication
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing and security
- **Helmet** - Security middleware
- **Rate Limiting** - API protection against abuse

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **TailwindCSS** - Utility-first CSS framework
- **Marked.js** - Markdown parsing and rendering
- **Highlight.js** - Code syntax highlighting
- **Font Awesome** - Icon library
- **Web APIs** - Modern browser features utilization

### Database Schema
- **Users Table** - User accounts, profiles, preferences
- **Documents Table** - Document storage with metadata
- **Document Versions** - Complete version history
- **Document Shares** - Sharing permissions and tokens
- **Tags Table** - Document tagging system
- **Categories Table** - Document organization
- **Analytics Table** - Usage tracking and insights
- **Sessions Table** - User session management

## 📁 Project Structure

```
Markdown-Editor-Pro/
├── server.js                 # Express server with API routes
├── package.json              # Node.js dependencies and scripts
├── .env                     # Environment variables
├── database/
│   └── markdown-editor.db   # SQLite database file
├── scripts/
│   ├── init-db.js          # Database initialization
│   ├── auth.js             # Authentication management
│   ├── main.js             # Shared frontend utilities
│   ├── dashboard.js         # Dashboard functionality
│   └── api-editor.js        # API-based editor logic
├── assets/
│   └── css/
│       └── style.css       # Custom styles and themes
├── index.html               # Landing page
├── login.html              # User login page
├── register.html           # User registration page
├── dashboard.html          # User dashboard
├── editor.html             # Advanced editor interface
├── docs.html              # Documentation
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Markdown-Editor-Pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize database**
   ```bash
   npm run init-db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:8000
   - API: http://localhost:3000
   - Default admin: username: `admin`, password: `admin123`

### Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

## 🔐 Authentication

### User Registration
- Email validation and uniqueness checking
- Password strength requirements (min 8 characters)
- Username availability checking
- Automatic user profile creation

### Login System
- JWT-based authentication
- Secure session management
- Remember me functionality
- Automatic token refresh

### Security Features
- Password hashing with Bcrypt
- Rate limiting on API endpoints
- CORS protection
- SQL injection prevention
- XSS protection with Helmet

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "is_admin": false
  }
}
```

### Document Endpoints

#### GET /api/documents
Get all documents for authenticated user with pagination and filtering.

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `search` - Search query
- `tags` - Comma-separated tag names
- `category` - Category filter

#### POST /api/documents
Create a new document.

**Request:**
```json
{
  "title": "My Document",
  "content": "# Hello World\n\nThis is my document.",
  "is_public": false,
  "tags": ["tutorial", "markdown"],
  "category_id": "cat-1"
}
```

#### PUT /api/documents/:id
Update an existing document.

#### DELETE /api/documents/:id
Delete a document (requires ownership).

### Collaboration Endpoints

#### POST /api/documents/:id/share
Share a document with specific permissions.

**Request:**
```json
{
  "permission_level": "write",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### GET /api/shared/:token
Access a shared document via token.

### WebSocket Events

#### join-document
Join a document for real-time collaboration.

#### document-change
Broadcast document changes to all collaborators.

#### cursor-position
Share cursor position with other users.

## 🎨 Frontend Features

### Editor Interface
- Split-pane layout (editor + preview)
- Responsive design for all devices
- Dark/light theme switching
- Formatting toolbar with icons
- Real-time collaboration indicators
- Auto-save status display
- Character and word count
- Reading time estimation

### Dashboard
- User profile management
- Document statistics
- Recent documents list
- Activity feed
- Quick action buttons
- Analytics overview

### Authentication Pages
- Modern login interface
- Registration with validation
- Password strength indicator
- Terms and conditions
- Forgot password functionality

## 🔧 Configuration

### Environment Variables
Create a `.env` file with:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
DB_PATH=./database/markdown-editor.db
CORS_ORIGIN=http://localhost:8000
```

### Database Configuration
The application uses SQLite with the following optimized schema:
- Indexed tables for fast queries
- Foreign key constraints for data integrity
- Automatic cleanup of expired sessions
- Full-text search capabilities

## 🚀 Deployment

### Production Setup
1. **Set environment variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   DB_PATH=/var/data/markdown-editor.db
   CORS_ORIGIN=https://your-domain.com
   ```

2. **Build and start**
   ```bash
   npm install --production
   npm start
   ```

3. **Reverse proxy setup** (nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
       }
       
       location / {
           root /path/to/markdown-editor;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 🧪 Testing

### Running Tests
```bash
npm test                    # Run unit tests
npm run test:api          # Test API endpoints
npm run test:integration    # Integration tests
```

### API Testing Examples
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Create document (with token)
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Test Document","content":"# Test\n\nThis is a test."}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Update documentation for changes
- Test all functionality

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the FAQ section

---

**Built with ❤️ using modern web technologies**