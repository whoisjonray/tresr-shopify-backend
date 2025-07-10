const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopify');
const db = require('../models/customer');

// Middleware to verify webhook
const verifyWebhook = (req, res, next) => {
  const signature = req.get('X-Shopify-Hmac-Sha256');
  
  if (!signature || !shopifyService.constructor.verifyWebhook(req.rawBody, signature)) {
    return res.status(401).send('Unauthorized');
  }
  
  next();
};

/**
 * POST /webhooks/customers/create
 * Handle new customer creation
 */
router.post('/customers/create', verifyWebhook, async (req, res) => {
  try {
    const customer = req.body;
    console.log('New customer created:', customer.id);
    
    // Check if customer has wallet in note or tags
    if (customer.note && customer.note.includes('Wallet:')) {
      const walletMatch = customer.note.match(/Wallet:\s*(0x[a-fA-F0-9]{40})/);
      if (walletMatch) {
        const walletAddress = walletMatch[1];
        await db.upsertWalletCustomer({
          wallet_address: walletAddress,
          shopify_customer_id: customer.id,
          email: customer.email
        });
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * POST /webhooks/customers/update
 * Handle customer updates
 */
router.post('/customers/update', verifyWebhook, async (req, res) => {
  try {
    const customer = req.body;
    console.log('Customer updated:', customer.id);
    
    // Update local database if needed
    const walletCustomer = await db.getByShopifyId(customer.id);
    if (walletCustomer && customer.email !== walletCustomer.email) {
      await db.upsertWalletCustomer({
        wallet_address: walletCustomer.wallet_address,
        shopify_customer_id: customer.id,
        email: customer.email
      });
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * POST /webhooks/orders/create
 * Handle new orders for commission tracking
 */
router.post('/orders/create', verifyWebhook, async (req, res) => {
  try {
    const order = req.body;
    console.log('New order created:', order.id);
    
    // Check if order has NFKEY discount
    const nfkeyDiscount = order.discount_codes?.find(dc => 
      dc.code.startsWith('NFKEY-')
    );
    
    if (nfkeyDiscount) {
      // Track commission for creators
      console.log('NFKEY discount used:', nfkeyDiscount.code);
      
      // Get customer's commission rate
      const walletCustomer = await db.getByShopifyId(order.customer.id);
      if (walletCustomer && walletCustomer.commission_rate > 0) {
        // Calculate creator commissions
        const totalCommission = order.line_items.reduce((sum, item) => {
          // Get vendor from product
          const vendorCommission = (item.price * item.quantity) * (walletCustomer.commission_rate / 100);
          return sum + vendorCommission;
        }, 0);
        
        console.log(`Commission for order ${order.id}: $${totalCommission.toFixed(2)}`);
        // TODO: Store commission data for payout
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * POST /webhooks/app/uninstalled
 * Handle app uninstall
 */
router.post('/app/uninstalled', verifyWebhook, async (req, res) => {
  console.log('App uninstalled');
  // Clean up any app data if needed
  res.status(200).send('OK');
});

module.exports = router;