#!/bin/bash

# Markdown Editor Pro - Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Markdown Editor Pro - Deployment Script${NC}"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Display current versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}npm: $NPM_VERSION${NC}"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Initialize database if it doesn't exist
if [ ! -f "database/markdown-editor.db" ]; then
    echo -e "${YELLOW}🗄️ Initializing database...${NC}"
    npm run init-db
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database initialized successfully${NC}"
    else
        echo -e "${RED}❌ Failed to initialize database${NC}"
        exit 1
    fi
fi

# Check environment
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}🏭 Production mode detected${NC}"
    
    # Check for required environment variables
    if [ -z "$JWT_SECRET" ]; then
        echo -e "${RED}❌ JWT_SECRET environment variable is required for production${NC}"
        exit 1
    fi
    
    if [ -z "$DB_PATH" ]; then
        echo -e "${RED}❌ DB_PATH environment variable is required for production${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Production environment validated${NC}"
else
    echo -e "${BLUE}🔧 Development mode${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Starting server...${NC}"
echo "=================================="

# Start the server
if [ "$NODE_ENV" = "production" ]; then
    # Production start
    npm start
else
    # Development start with nodemon
    npm run dev
fi

# Check if server started successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Server started successfully!${NC}"
    echo -e "${BLUE}📱 Frontend: http://localhost:8000${NC}"
    echo -e "${BLUE}🔌 API: http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}💡 Default admin credentials:${NC}"
    echo -e "${YELLOW}   Username: admin${NC}"
    echo -e "${YELLOW}   Password: admin123${NC}"
    echo ""
    echo -e "${GREEN}📚 Press Ctrl+C to stop the server${NC}"
else
    echo -e "${RED}❌ Failed to start server${NC}"
    exit 1
fi