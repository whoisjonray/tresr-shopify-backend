# TRESR Backend Deployment Guide

## Current Status
✅ Backend running locally at http://localhost:3001
✅ Dynamic.xyz domain verified: auth.0xtresr.com
✅ Docker image built: tresr-shopify-backend
✅ All authentication routes tested and working

## Quick Deploy Options (Choose One)

### Option 1: Railway (Recommended - $5/month)
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select this repository
4. Railway will auto-detect Node.js
5. Add these environment variables:
   ```
   SHOPIFY_API_KEY=1b3b093c28fe7f098b32f6f6bb778a6b
   SHOPIFY_API_SECRET=946fac2004be392ff0cff7f2614eb60a
   SHOPIFY_ACCESS_TOKEN=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
   SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com
   DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
   JWT_SECRET=[generate a random string]
   ```
6. Deploy! You'll get a URL like: https://tresr-backend.up.railway.app

### Option 2: Render (Free Tier)
1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo
4. Use the `render.yaml` config file (already created)
5. Add environment variables in dashboard
6. Deploy! URL: https://tresr-backend.onrender.com

### Option 3: Vercel (Serverless)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Follow prompts to link project
4. Add environment variables in Vercel dashboard

## After Deployment

### 1. Update Shopify Theme
Replace all instances of `http://localhost:3001` with your production URL:

```bash
cd /Users/user/Documents/TRESR Shopify/tresr-vibes-theme
grep -r "localhost:3001" . --include="*.liquid"
# Update each file with production URL
```

### 2. Update CORS Origins
If needed, add your production domain to the CORS allowed origins in `server.js`

### 3. Test Authentication Flow
1. Go to https://auth.0xtresr.com/pages/login-test
2. Click "Login with Dynamic"
3. Should redirect to Dynamic.xyz
4. After auth, should redirect back with success

## Environment Variables Reference
```env
# Required for production
NODE_ENV=production
PORT=3001

# Shopify (from .env)
SHOPIFY_API_KEY=1b3b093c28fe7f098b32f6f6bb778a6b
SHOPIFY_API_SECRET=946fac2004be392ff0cff7f2614eb60a
SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com
SHOPIFY_ACCESS_TOKEN=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

# Dynamic.xyz
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423

# Security (generate new ones)
JWT_SECRET=[generate random 32+ chars]
ENCRYPTION_KEY=[generate random 32+ chars]

# Optional
DATABASE_URL=[if using external DB]
REDIS_URL=[if using Redis]
```

## Troubleshooting

### CORS Issues
Add your domain to allowed origins in `server.js`:
```javascript
const allowedOrigins = [
  'https://auth.0xtresr.com',
  'https://your-backend-url.com'
];
```

### Dynamic.xyz Redirect Issues
Ensure your callback URL matches exactly:
- Development: `http://localhost:9292/pages/auth-callback`
- Production: `https://auth.0xtresr.com/pages/auth-callback`

### Health Check
Test your deployment:
```bash
curl https://your-backend-url.com/health
```

## Next Steps
1. Deploy using one of the options above
2. Update theme with production URL
3. Test full authentication flow
4. Start building creator dashboard!