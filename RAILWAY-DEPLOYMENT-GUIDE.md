# Railway Deployment Guide for TRESR Shopify Backend

## Quick Deployment Steps

### 1. Login to Railway
```bash
railway login
```
This will open your browser for authentication.

### 2. Create New Project
```bash
cd /Users/user/Documents/Cursor\ Clients/TRESR\ Shopify/tresr-shopify-app
railway init
```
Select "Empty Project" when prompted.

### 3. Link to GitHub Repository
```bash
railway link
```
Or in Railway Dashboard:
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose: `whoisjonray/tresr-shopify-backend`

### 4. Set Environment Variables

Add these in Railway Dashboard or via CLI:

```bash
# Core Shopify Configuration
railway variables set SHOPIFY_API_KEY="your_api_key"
railway variables set SHOPIFY_API_SECRET="your_api_secret"
railway variables set SHOPIFY_WEBHOOK_SECRET="your_webhook_secret"
railway variables set SHOPIFY_STORE_DOMAIN="becc05-b4.myshopify.com"
railway variables set SHOPIFY_ACCESS_TOKEN="your_access_token"

# Dynamic.xyz Configuration
railway variables set DYNAMIC_ENV_ID="b17e8631-c1b7-45d5-95cf-151eb5246423"
railway variables set DYNAMIC_API_KEY="your_dynamic_api_key"

# Server Configuration
railway variables set PORT="3001"
railway variables set NODE_ENV="production"
railway variables set APP_URL="https://tresr-shopify-backend.up.railway.app"

# Security (Use the generated ones from script)
railway variables set JWT_SECRET="3dda204c3a439dbd47161d4120fcd45a0a802fe0c93f797a316a6af0edacb2cc"
railway variables set ENCRYPTION_KEY="084a6a06ffa90f9272d20840f0b480c225813895d7c96e0b481d4b9916b251ba"
```

### 5. Deploy
```bash
railway up
```

Or push to GitHub and it will auto-deploy:
```bash
git add .
git commit -m "Deploy to Railway"
git push origin master
```

## Alternative: Web Dashboard Deployment

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `whoisjonray/tresr-shopify-backend`
6. Add environment variables in Settings → Variables
7. Deploy will start automatically

## Verify Deployment

### Check deployment status:
```bash
railway logs
```

### Get your app URL:
```bash
railway open
```

### Test endpoints:
```bash
# Health check
curl https://tresr-shopify-backend.up.railway.app/health

# API status
curl https://tresr-shopify-backend.up.railway.app/api/status
```

## Update Shopify Theme

After successful deployment, update your theme files to use the new Railway URL:

```javascript
// Replace in theme files:
// OLD: http://localhost:3001
// NEW: https://tresr-shopify-backend.up.railway.app

// Example in theme.liquid:
const API_URL = 'https://tresr-shopify-backend.up.railway.app';
```

## Troubleshooting

### If deployment fails:
1. Check logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Check build logs in Railway dashboard

### If API calls fail:
1. Verify CORS configuration includes your Shopify domain
2. Check that all environment variables are set
3. Ensure SSL certificates are active (automatic on Railway)

### Rollback if needed:
```bash
# In Railway dashboard:
# Deployments → Select previous deployment → Redeploy
```

## Cost & Benefits

- **Cost**: $5/month (Hobby plan)
- **Previous AWS Cost**: ~$800/month
- **Savings**: $795/month
- **Features**:
  - Automatic SSL/HTTPS
  - GitHub integration
  - Auto-deploy on push
  - Built-in metrics
  - Easy rollback
  - 99.9% uptime SLA

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- TRESR Support: Contact your development team

## Next Steps

1. Monitor deployment in Railway dashboard
2. Set up custom domain (optional)
3. Configure monitoring alerts
4. Test all API endpoints
5. Update DNS if using custom domain