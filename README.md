# TRESR Shopify App Backend

Backend service for Dynamic.xyz wallet authentication and NFKEY discount management.

## Features

- **Dynamic.xyz Integration**: Email/social wallet authentication
- **NFKEY Discounts**: Automatic discounts based on NFT levels (1-150)
- **Customer Metafields**: Store wallet data in Shopify
- **Commission Tracking**: Track creator commissions based on NFKEY level
- **Redis Caching**: Fast NFKEY lookups with 1-hour cache
- **Webhook Processing**: Handle customer and order events

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Create Shopify App

```bash
# Install Shopify CLI if not already installed
npm install -g @shopify/cli @shopify/theme

# Create a new app
shopify app generate

# Choose "Node" and "Express"
```

### 4. Get Shopify Access Token

1. Go to: https://becc05-b4.myshopify.com/admin/settings/apps/development
2. Create app: "TRESR Backend"
3. Configure scopes:
   - read_customers, write_customers
   - read_discounts, write_discounts  
   - read_price_rules, write_price_rules
   - read_products
4. Install app and copy access token to .env

### 5. Start Services

```bash
# Start MySQL (using Docker)
docker-compose up -d mysql

# Start Redis
docker-compose up -d redis

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### 6. Setup Ngrok Tunnel

```bash
# In another terminal
npm run tunnel

# Copy the HTTPS URL to .env as APP_URL
```

### 7. Register Webhooks

```bash
# Run webhook registration script
node scripts/register-webhooks.js
```

## API Endpoints

### Authentication
- `POST /apps/tresr/wallet-auth` - Authenticate via Dynamic.xyz
- `POST /apps/tresr/link-wallet` - Link additional wallet
- `GET /apps/tresr/customer/:walletAddress` - Get customer by wallet

### Discounts
- `POST /apps/tresr/nfkey-discount` - Check NFKEY and create discount
- `POST /apps/tresr/update-nfkey-status` - Update NFKEY metafields
- `GET /apps/tresr/check-discount/:walletAddress` - Check active discount
- `POST /apps/tresr/scan-linked-wallets` - Scan all linked wallets

### Webhooks
- `POST /webhooks/customers/create` - New customer
- `POST /webhooks/customers/update` - Customer updated
- `POST /webhooks/orders/create` - New order (commission tracking)

## Testing

### Run Tests
```bash
npm test
```

### Test Endpoints
```bash
# Test wallet auth
curl -X POST http://localhost:3000/apps/tresr/wallet-auth \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xtest",
    "email": "test@example.com",
    "dynamicUserId": "test-123",
    "authMethod": "email"
  }'

# Test NFKEY discount
curl -X POST http://localhost:3000/apps/tresr/nfkey-discount \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0xtest"}'
```

## Production Deployment

### Option 1: Heroku
```bash
heroku create tresr-shopify-app
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
heroku config:set NODE_ENV=production
git push heroku main
```

### Option 2: Digital Ocean App Platform
1. Connect GitHub repo
2. Set environment variables
3. Add managed database
4. Deploy

### Option 3: AWS Lambda
Use Serverless Framework for deployment

## Monitoring

- Health check: `GET /health`
- Logs: Check console output or use logging service
- Errors: Integrate Sentry for error tracking

## Security

- All endpoints use HTTPS
- Webhook signature verification
- Rate limiting (100 requests/15min)
- Input validation on all endpoints
- Wallet signature verification for linking

## Cost Estimates

- Hosting: ~$25/month (Digital Ocean)
- Database: ~$15/month (managed)
- Redis: ~$15/month (managed)
- Total: ~$55/month

## Support

For issues or questions, create an issue in the GitHub repo.