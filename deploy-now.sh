#!/bin/bash

echo "🚀 Railway Deployment Instructions"
echo "=================================="
echo ""
echo "Since the Railway token is expired, please follow these steps:"
echo ""
echo "1. Open your browser and go to: https://railway.app/new"
echo ""
echo "2. Click 'Deploy from GitHub repo'"
echo ""
echo "3. Select repository: whoisjonray/tresr-shopify-backend"
echo ""
echo "4. Railway will automatically detect the project and start deployment"
echo ""
echo "5. Once deployed, add these environment variables in Railway dashboard:"
echo ""
echo "   Settings → Variables → Raw Editor"
echo ""
cat << 'EOF'
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
DYNAMIC_API_KEY=your_dynamic_api_key
PORT=3001
NODE_ENV=production
JWT_SECRET=3dda204c3a439dbd47161d4120fcd45a0a802fe0c93f797a316a6af0edacb2cc
ENCRYPTION_KEY=084a6a06ffa90f9272d20840f0b480c225813895d7c96e0b481d4b9916b251ba
EOF

echo ""
echo "6. Click 'Deploy' to redeploy with environment variables"
echo ""
echo "Your app will be available at: https://[project-name].up.railway.app"
echo ""
echo "Alternative: Use Railway CLI"
echo "============================"
echo "1. railway login (opens browser)"
echo "2. railway init"
echo "3. railway up"
echo ""
echo "Opening Railway in browser..."
open "https://railway.app/new"