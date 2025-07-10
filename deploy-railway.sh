#!/bin/bash

# TRESR Shopify Backend - Railway Deployment Script
# This script prepares and guides you through Railway deployment

echo "🚀 TRESR Shopify Backend - Railway Deployment"
echo "============================================="

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial TRESR Shopify backend for Railway deployment"
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 You have uncommitted changes. Committing them now..."
    git add .
    git commit -m "Update: Prepare for Railway deployment"
fi

# Create production-ready .env.production template
cat > .env.production << 'EOF'
# Copy this to Railway environment variables
# DO NOT commit this file to Git!

# Shopify Configuration
SHOPIFY_API_KEY=your_actual_api_key
SHOPIFY_API_SECRET=your_actual_api_secret
SHOPIFY_WEBHOOK_SECRET=your_actual_webhook_secret
SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_actual_access_token

# Dynamic.xyz Configuration (UPDATED ENV ID)
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
DYNAMIC_API_KEY=your_dynamic_api_key

# Server Configuration
PORT=3001
NODE_ENV=production
APP_URL=https://your-app-name.up.railway.app

# Security (Generate these!)
JWT_SECRET=GENERATE_A_SECURE_RANDOM_STRING_HERE
ENCRYPTION_KEY=GENERATE_ANOTHER_SECURE_STRING_HERE

# Optional: External Services
# DATABASE_URL=mysql://user:pass@host:3306/db
# REDIS_URL=redis://user:pass@host:6379
EOF

echo "✅ Created .env.production template"

# Generate secure secrets
echo ""
echo "🔐 Generating secure secrets..."
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "⚠️  Save these secrets! You'll need them for Railway."

# Create a simple health check file if it doesn't exist
if [ ! -f "health-check.js" ]; then
cat > health-check.js << 'EOF'
// Simple health check endpoint
const http = require('http');

const checkHealth = () => {
  http.get('http://localhost:3001/health', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed');
      process.exit(0);
    } else {
      console.error('❌ Health check failed');
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error('❌ Health check error:', err.message);
    process.exit(1);
  });
};

// Wait for server to start
setTimeout(checkHealth, 5000);
EOF
fi

# Update CORS configuration for production
echo ""
echo "📝 Updating CORS configuration..."
cat > cors-config.js << 'EOF'
// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://becc05-b4.myshopify.com',
      'https://tresr.com',
      'https://www.tresr.com',
      'https://0xtresr.com',
      'https://www.0xtresr.com',
      'https://shopify-api.tresr.com', // Your custom domain
      'https://shopify.0xtresr.com'    // Alternative custom domain
    ];
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = corsOptions;
EOF

echo "✅ CORS configuration created"

# Create deployment checklist
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Railway Deployment Checklist

## Pre-Deployment
- [ ] All code committed to Git
- [ ] Environment variables ready
- [ ] Secure secrets generated
- [ ] CORS domains configured

## Railway Setup
- [ ] Create Railway account at https://railway.app
- [ ] Connect GitHub account
- [ ] Create new project from repo
- [ ] Add all environment variables
- [ ] Deploy triggered automatically

## Post-Deployment
- [ ] Check deployment logs
- [ ] Test /health endpoint
- [ ] Update Shopify theme URLs
- [ ] Test authentication flow
- [ ] Monitor for errors

## Production URLs
- Railway URL: https://your-app.up.railway.app
- Custom Domain: https://shopify-api.tresr.com (optional)

## Emergency Rollback
```bash
# In Railway dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "Redeploy"
```
EOF

echo "✅ Created deployment checklist"

# Final instructions
echo ""
echo "🎯 Next Steps:"
echo "============="
echo ""
echo "1. Push to GitHub:"
echo "   git remote add origin https://github.com/whoisjonray/tresr-shopify-backend"
echo "   git push -u origin main"
echo ""
echo "2. Go to https://railway.app and:"
echo "   - Sign in with GitHub"
echo "   - Create new project"
echo "   - Select your repository"
echo "   - Add environment variables from .env.production"
echo ""
echo "3. Your app will deploy automatically!"
echo ""
echo "4. Update your Shopify theme with the production URL"
echo ""
echo "📋 See DEPLOYMENT_CHECKLIST.md for detailed steps"
echo ""
echo "💰 Cost: $5/month (vs. current $800/month AWS)"
echo "🚀 Deployment time: ~2-3 minutes"
echo "🔒 SSL/HTTPS: Automatic"
echo ""
echo "Ready to deploy? Let's save TRESR $795/month! 🎉"