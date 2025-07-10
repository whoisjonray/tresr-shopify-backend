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
