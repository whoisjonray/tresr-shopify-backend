require('dotenv').config();
const { shopifyApi, ApiVersion } = require('@shopify/shopify-api');

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  hostName: process.env.APP_URL,
  apiVersion: ApiVersion.October23,
});

const session = {
  shop: process.env.SHOPIFY_STORE_DOMAIN,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
};

const client = new shopify.clients.Rest({ session });

async function registerWebhooks() {
  const webhooks = [
    {
      topic: 'customers/create',
      address: `${process.env.APP_URL}/webhooks/customers/create`,
      format: 'json'
    },
    {
      topic: 'customers/update',
      address: `${process.env.APP_URL}/webhooks/customers/update`,
      format: 'json'
    },
    {
      topic: 'orders/create',
      address: `${process.env.APP_URL}/webhooks/orders/create`,
      format: 'json'
    },
    {
      topic: 'app/uninstalled',
      address: `${process.env.APP_URL}/webhooks/app/uninstalled`,
      format: 'json'
    }
  ];

  console.log('Registering webhooks...\n');

  for (const webhook of webhooks) {
    try {
      const response = await client.post({
        path: 'webhooks',
        data: { webhook }
      });
      
      console.log(`✅ Registered: ${webhook.topic}`);
      console.log(`   ID: ${response.body.webhook.id}`);
      console.log(`   Address: ${webhook.address}\n`);
    } catch (error) {
      if (error.response?.body?.errors?.address?.[0]?.includes('already exists')) {
        console.log(`⚠️  ${webhook.topic} already registered\n`);
      } else {
        console.error(`❌ Failed to register ${webhook.topic}:`, error.response?.body || error);
      }
    }
  }

  // List all registered webhooks
  console.log('\n📋 All registered webhooks:');
  try {
    const list = await client.get({ path: 'webhooks' });
    list.body.webhooks.forEach(wh => {
      console.log(`   - ${wh.topic}: ${wh.address}`);
    });
  } catch (error) {
    console.error('Failed to list webhooks:', error);
  }
}

// Run the script
registerWebhooks().catch(console.error);