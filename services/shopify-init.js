const { shopifyApi, ApiVersion, Session } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

// Lazy initialization to ensure env vars are loaded
let shopify = null;
let session = null;

function initializeShopify() {
  if (shopify) return { shopify, session };
  
  console.log('Initializing Shopify API with:', {
    apiKey: process.env.SHOPIFY_API_KEY ? 'Set' : 'Missing',
    apiSecret: process.env.SHOPIFY_API_SECRET ? 'Set' : 'Missing',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN ? 'Set' : 'Missing',
    store: process.env.SHOPIFY_STORE_DOMAIN
  });

  shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: [
      'read_customers',
      'write_customers', 
      'read_discounts',
      'write_discounts',
      'read_price_rules',
      'write_price_rules',
      'read_products'
    ],
    hostName: process.env.APP_URL || 'http://localhost:3000',
    apiVersion: '2023-10',
  });

  session = new Session({
    id: process.env.SHOPIFY_STORE_DOMAIN,
    shop: process.env.SHOPIFY_STORE_DOMAIN,
    state: 'active',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN,
  });

  return { shopify, session };
}

module.exports = { initializeShopify };