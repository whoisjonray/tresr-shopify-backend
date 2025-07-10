# Railway Deployment Checklist for TRESR Shopify Backend

## ✅ Pre-Deployment Preparation (COMPLETED)
- [x] Git repository initialized
- [x] All code committed
- [x] Deployment scripts created
- [x] Production environment template created
- [x] CORS configuration updated
- [x] Health check endpoint added

## 📝 GitHub Repository Setup
1. Create new repository on GitHub:
   - Go to: https://github.com/new
   - Repository name: `tresr-shopify-backend`
   - Description: "TRESR Shopify Express backend with Dynamic.xyz integration"
   - Private repository (recommended)
   - Click "Create repository"

2. Push code to GitHub:
   ```bash
   cd "/Users/user/Documents/TRESR Shopify/tresr-shopify-app"
   git remote add origin https://github.com/whoisjonray/tresr-shopify-backend.git
   git branch -M main
   git push -u origin main
   ```

## 🚀 Railway Deployment Steps

### 1. Create Railway Project
- Go to: https://railway.app
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose `tresr-shopify-backend` repository
- Railway will automatically start deployment

### 2. Configure Environment Variables
Add these variables in Railway dashboard (Settings → Variables):

**Shopify Configuration:**
```
SHOPIFY_API_KEY=f4b5e8f4b9b25dd7a826e2b088e02a66
SHOPIFY_API_SECRET=7dc3e3b4e9f1f8b4e9f1f8b4e9f1f8b4
SHOPIFY_WEBHOOK_SECRET=whsec_3e3b4e9f1f8b4e9f1f8b4e9f1f8b4
SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_3e3b4e9f1f8b4e9f1f8b4e9f1f8b4
```

**Dynamic.xyz Configuration:**
```
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
DYNAMIC_API_KEY=[Get from Dynamic.xyz dashboard]
```

**Server Configuration:**
```
PORT=3001
NODE_ENV=production
APP_URL=https://tresr-shopify-backend.up.railway.app
```

**Security Secrets (GENERATE NEW ONES):**
```
JWT_SECRET=[Use generated value from deploy script]
ENCRYPTION_KEY=[Use generated value from deploy script]
```

### 3. Domain Configuration (Optional)
If you want a custom domain:
1. In Railway: Settings → Domains
2. Add custom domain: `shopify-api.tresr.com`
3. Update DNS records at your domain provider
4. Update APP_URL environment variable

## 🔧 Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://tresr-shopify-backend.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 2. Update Shopify Theme
Update the backend URL in theme files:

```bash
cd "/Users/user/Documents/TRESR Shopify/tresr-vibes-theme"

# Update backend configuration
grep -r "localhost:3001" . --include="*.liquid" --include="*.js"

# Replace with production URL:
# https://tresr-shopify-backend.up.railway.app
```

### 3. Theme Update Script
Create and run this script to update all theme files:

```bash
#!/bin/bash
# update-backend-url.sh

THEME_DIR="/Users/user/Documents/TRESR Shopify/tresr-vibes-theme"
OLD_URL="http://localhost:3001"
NEW_URL="https://tresr-shopify-backend.up.railway.app"

cd "$THEME_DIR"

# Update liquid files
find . -name "*.liquid" -type f -exec sed -i '' "s|$OLD_URL|$NEW_URL|g" {} +

# Update JavaScript files
find . -name "*.js" -type f -exec sed -i '' "s|$OLD_URL|$NEW_URL|g" {} +

echo "✅ Backend URL updated to: $NEW_URL"

# Push theme updates
shopify theme push --theme=179671597341 --allow-live
```

### 4. Test Authentication Flow
1. Visit: https://becc05-b4.myshopify.com/pages/login-test
2. Click "Login with Dynamic"
3. Complete authentication
4. Verify redirect back to store
5. Check customer creation in Shopify admin

## 🚨 Monitoring & Troubleshooting

### Railway Dashboard
- View logs: Railway dashboard → Deployments → View logs
- Monitor metrics: Railway dashboard → Metrics
- Check build status: Railway dashboard → Deployments

### Common Issues & Solutions

**CORS Errors:**
- Check allowed origins in `cors-config.js`
- Ensure production domains are included
- Restart deployment after changes

**Environment Variables:**
- Double-check all values in Railway
- No quotes needed in Railway UI
- Restart deployment after changes

**Build Failures:**
- Check package.json scripts
- Verify Node.js version compatibility
- Review build logs for errors

## 📊 Cost Savings
- Current AWS: $800/month
- Railway: $5/month
- **Monthly Savings: $795**
- **Annual Savings: $9,540**

## 🔄 Rollback Procedure
If deployment fails:
1. Go to Railway dashboard
2. Navigate to Deployments
3. Find last working deployment
4. Click "Redeploy"

## 📞 Support Contacts
- Railway Support: https://railway.app/help
- Railway Discord: https://discord.gg/railway
- TRESR Team: contact@tresr.com