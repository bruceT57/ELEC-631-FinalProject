#!/bin/bash

# Deployment Preparation Script for Namecheap Stellar
# This script prepares your application for deployment

echo "=================================="
echo "Tutoring Tool - Deployment Preparation"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.production template..."
    cp .env.production .env
    echo "✓ .env file created"
    echo "⚠️  IMPORTANT: Edit .env file with your actual configuration before deploying!"
    echo ""
fi

# Install dependencies
echo "1. Installing dependencies..."
npm run install-all
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

# Build production
echo "2. Building for production..."
npm run build:production
if [ $? -ne 0 ]; then
    echo "❌ Failed to build production version"
    exit 1
fi
echo "✓ Production build complete"
echo ""

# Verify build outputs
echo "3. Verifying build outputs..."
if [ ! -d "backend/dist" ]; then
    echo "❌ Backend build not found (backend/dist)"
    exit 1
fi
if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend build not found (frontend/dist)"
    exit 1
fi
echo "✓ Build outputs verified"
echo ""

# Create uploads directory if it doesn't exist
if [ ! -d "backend/uploads" ]; then
    echo "4. Creating uploads directory..."
    mkdir -p backend/uploads
    echo "✓ Uploads directory created"
else
    echo "4. Uploads directory already exists"
fi
echo ""

# Create deployment package (optional)
echo "5. Create deployment ZIP? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Creating deployment ZIP..."
    zip -r tutoring-tool-deploy.zip . \
        -x "node_modules/*" \
        -x "*/node_modules/*" \
        -x ".git/*" \
        -x "*.log" \
        -x ".env.production" \
        -x "deploy.sh" \
        -x "*.md"

    if [ $? -eq 0 ]; then
        echo "✓ Deployment ZIP created: tutoring-tool-deploy.zip"
    else
        echo "❌ Failed to create deployment ZIP"
    fi
else
    echo "Skipping ZIP creation"
fi
echo ""

# Summary
echo "=================================="
echo "✓ Deployment Preparation Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Review and edit .env file with your configuration"
echo "2. Test locally: npm run start:production"
echo "3. Upload files to Namecheap cPanel"
echo "4. Follow NAMECHEAP_DEPLOYMENT.md for deployment steps"
echo ""
echo "Important files to upload:"
echo "  - production-server.js"
echo "  - .env (with your configuration)"
echo "  - backend/ (including dist/)"
echo "  - frontend/dist/"
echo "  - package.json"
echo "  - package-lock.json (if exists)"
echo ""
echo "See DEPLOYMENT_CHECKLIST.md for complete checklist"
echo "=================================="
