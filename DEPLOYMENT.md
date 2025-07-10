# TRESR Shopify Backend Deployment Guide

## Quick Deployment (Railway - Recommended)

Railway offers the best balance of cost ($5/month), performance, and ease of deployment.

### Prerequisites
- GitHub account with access to your code
- Environment variables from `.env` file
- Domain for custom URL (optional)

### Step 1: Prepare for Deployment

1. **Commit your code to GitHub** (if not already):
```bash
cd /Users/user/Documents/TRESR Shopify/tresr-shopify-app
git init
git add .
git commit -m "Initial TRESR Shopify backend"
git remote add origin https://github.com/whoisjonray/tresr-shopify-backend
git push -u origin main
```

2. **Update Dynamic.xyz Environment ID** (IMPORTANT):
Update the `.env` file with the correct Dynamic environment ID:
```
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository** (tresr-shopify-backend)
5. **Railway will auto-detect Node.js and use the `railway.json` config**

### Step 3: Configure Environment Variables

In Railway dashboard:
1. Click on your deployed service
2. Go to "Variables" tab
3. Click "Raw Editor"
4. Paste all variables from your `.env` file:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_actual_api_key
SHOPIFY_API_SECRET=your_actual_api_secret
SHOPIFY_WEBHOOK_SECRET=your_actual_webhook_secret
SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_actual_access_token

# Dynamic.xyz Configuration
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
DYNAMIC_API_KEY=your_dynamic_api_key

# Server Configuration
PORT=3001
NODE_ENV=production
APP_URL=https://your-app-name.up.railway.app

# Security
JWT_SECRET=generate_a_secure_random_string
ENCRYPTION_KEY=generate_another_secure_string

# Optional: External Services
DATABASE_URL=mysql://user:pass@host:3306/db
REDIS_URL=redis://user:pass@host:6379
```

### Step 4: Set Up Custom Domain (Optional)

1. In Railway, go to Settings → Domains
2. Add custom domain: `shopify-api.tresr.com` or `shopify.0xtresr.com`
3. Add CNAME record in your DNS:
   ```
   Type: CNAME
   Name: shopify-api
   Value: your-app.up.railway.app
   ```

### Step 5: Update Shopify Theme

Update the backend URL in your theme files:

1. **Update `snippets/backend-config.liquid`**:
```liquid
{%- assign backend_url = 'https://your-app-name.up.railway.app' -%}
{%- comment -%} Or use custom domain {%- endcomment -%}
{%- assign backend_url = 'https://shopify-api.tresr.com' -%}
```

2. **Find and replace** all occurrences of `http://localhost:3001` with your production URL

3. **Push theme updates**:
```bash
cd /Users/user/Documents/TRESR Shopify/tresr-vibes-theme
shopify theme push --theme=179671597341 --allow-live
```

## Alternative Deployment Options

### Option 2: Render (Free Tier Available)

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: Add all variables from `.env`
5. Deploy

**Pros**: Free tier available
**Cons**: Free tier has cold starts, limited compute

### Option 3: Fly.io ($5/month)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
cd /Users/user/Documents/TRESR Shopify/tresr-shopify-app
flyctl launch --name tresr-shopify-backend
flyctl secrets set < .env
flyctl deploy
```

### Option 4: DigitalOcean App Platform ($5/month)

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Create new app from GitHub
3. Auto-detect Node.js settings
4. Add environment variables
5. Deploy

## Post-Deployment Checklist

- [ ] Backend is accessible at production URL
- [ ] `/health` endpoint returns 200 OK
- [ ] Environment variables are set correctly
- [ ] CORS is configured for your Shopify domain
- [ ] SSL certificate is active (automatic on all platforms)
- [ ] Theme is updated with production backend URL
- [ ] Test Dynamic.xyz authentication flow
- [ ] Test NFKEY discount validation
- [ ] Monitor logs for any errors

## Monitoring & Logs

### Railway
- Built-in logging in dashboard
- Metrics and observability included
- Set up alerts for errors

### Commands for logs:
```bash
# Railway CLI (optional)
railway logs

# Or view in Railway dashboard
```

## Security Checklist

- [ ] All sensitive environment variables are set
- [ ] JWT_SECRET is a strong random string
- [ ] CORS is restricted to your domains only
- [ ] Rate limiting is enabled (already in code)
- [ ] Helmet.js security headers active
- [ ] No sensitive data in logs

## Cost Summary

- **Railway**: $5/month (recommended)
- **Render**: Free tier or $7/month
- **Fly.io**: $5/month + usage
- **DigitalOcean**: $5/month

Total monthly backend cost: **$5** (vs. current $800/month AWS)

## Support & Troubleshooting

1. **CORS errors**: Update allowed origins in `server.js`
2. **Authentication fails**: Verify Dynamic.xyz environment ID
3. **Deployment fails**: Check Node version (requires 16+)
4. **Environment variables**: Double-check all are set in platform

## Next Steps

1. Deploy backend to Railway
2. Update theme with production URL
3. Test full authentication flow
4. Add monitoring/alerts
5. Document for team handoff