# DNS Setup Complete for TRESR Shopify Backend

## ✅ DNS Records Status

The following DNS records are already configured in AWS Route 53 for tresr.com (Hosted Zone ID: Z01956281XPMP1YPCXQPF):

### 1. vibes.tresr.com
- **Type**: CNAME
- **Target**: tresr-shopify-backend.up.railway.app
- **TTL**: 300 seconds
- **Status**: ✅ Active and working

### 2. auth.tresr.com  
- **Type**: CNAME
- **Target**: tresr-shopify-backend.up.railway.app
- **TTL**: 300 seconds
- **Status**: ✅ Active and working

## 🔄 Configuration Updates Made

### 1. Updated Files
- **cors-config.js**: Added vibes.tresr.com and auth.tresr.com to allowed origins
- **update-theme-backend-url.sh**: Changed default URL to https://vibes.tresr.com
- **RAILWAY_DEPLOYMENT_CHECKLIST.md**: Updated all references to use vibes.tresr.com

### 2. Environment Variables to Update in Railway
When deploying to Railway, set:
```
APP_URL=https://vibes.tresr.com
```

## 🚀 Next Steps

### 1. Update Theme Files
Run the update script to change all localhost references to production:
```bash
cd "/Users/user/Documents/TRESR Shopify/tresr-shopify-app-clean"
chmod +x update-theme-backend-url.sh
./update-theme-backend-url.sh
```

### 2. Deploy to Railway
1. Push code to GitHub
2. Railway will auto-deploy from the repository
3. Update environment variables in Railway dashboard:
   - Set `APP_URL=https://vibes.tresr.com`

### 3. Update Dynamic.xyz Configuration
In the Dynamic.xyz dashboard:
1. Add `https://vibes.tresr.com` as an allowed origin
2. Set OAuth callback URL to: `https://vibes.tresr.com/apps/tresr/auth/callback`
3. Validate the domain if required

### 4. Test the Setup
```bash
# Test health endpoint
curl https://vibes.tresr.com/health

# Test from auth subdomain (same backend)
curl https://auth.tresr.com/health
```

## 📝 Domain Usage

- **vibes.tresr.com**: Primary backend URL for all API calls
- **auth.tresr.com**: Can be used for Dynamic.xyz authentication flows if needed
- Both domains point to the same Railway deployment

## 🔒 Security Notes

- CORS is configured to accept requests from both domains
- SSL/TLS is automatically handled by Railway
- Both domains use HTTPS by default

## 💡 Why Two Domains?

Having both `vibes.tresr.com` and `auth.tresr.com` pointing to the same backend provides flexibility:
- Use `vibes.tresr.com` as the main API endpoint
- Use `auth.tresr.com` specifically for authentication flows if Dynamic.xyz requires a separate domain
- Both work identically since they point to the same Railway app