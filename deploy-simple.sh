#!/bin/bash

# Simple deployment script for TRESR backend
# Can be used with any VPS or cloud service

echo "🚀 TRESR Backend Deployment Guide"
echo "================================="

# Build the Docker image
echo "✅ Docker image built: tresr-shopify-backend"

# Option 1: Deploy to Railway (Recommended - $5/month)
echo -e "\n📦 Option 1: Deploy to Railway (Recommended)"
echo "1. Go to https://railway.app"
echo "2. Sign in with GitHub"
echo "3. Create new project from GitHub repo"
echo "4. Add environment variables from .env"
echo "5. Deploy will happen automatically"

# Option 2: Deploy to Render (Free tier available)
echo -e "\n📦 Option 2: Deploy to Render (Free tier)"
echo "1. Go to https://render.com"
echo "2. Create new Web Service"
echo "3. Connect GitHub repo"
echo "4. Set build command: npm install"
echo "5. Set start command: node server.js"
echo "6. Add environment variables"

# Option 3: Deploy to Fly.io (Free tier + $5/month)
echo -e "\n📦 Option 3: Deploy to Fly.io"
echo "1. Install flyctl: curl -L https://fly.io/install.sh | sh"
echo "2. Run: flyctl launch"
echo "3. Run: flyctl secrets set --app tresr-backend < .env"
echo "4. Run: flyctl deploy"

# Option 4: Deploy to Digital Ocean App Platform
echo -e "\n📦 Option 4: Digital Ocean App Platform ($5/month)"
echo "1. Go to https://cloud.digitalocean.com/apps"
echo "2. Create new app from GitHub"
echo "3. Auto-detect Node.js app"
echo "4. Add environment variables"
echo "5. Deploy"

# Create docker-compose for local testing
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: tresr-shopify-backend:latest
    ports:
      - "80:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - tresr-network

networks:
  tresr-network:
    driver: bridge
EOF

echo -e "\n✅ Created docker-compose.prod.yml for production"

# Update Shopify theme with production URL
echo -e "\n📝 After deployment, update your Shopify theme:"
echo "1. Replace 'http://localhost:3001' with your production URL"
echo "2. Update CORS origins in server.js if needed"
echo "3. Test authentication flow"

echo -e "\n🎯 Quick Deploy Instructions:"
echo "For fastest deployment, use Railway or Render:"
echo "- Both support automatic GitHub deployments"
echo "- Both handle SSL certificates automatically"
echo "- Both support environment variables"
echo "- Railway has better performance ($5/month)"
echo "- Render has a free tier (with limitations)"

echo -e "\n💡 Next Steps:"
echo "1. Choose a platform above"
echo "2. Deploy the backend"
echo "3. Update theme with production URL"
echo "4. Test Dynamic.xyz authentication"