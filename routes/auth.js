const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopify');
const dynamicService = require('../services/dynamic');
const db = require('../models/customer');

/**
 * POST /apps/tresr/wallet-auth
 * Authenticate user via Dynamic.xyz and create/update Shopify customer
 */
router.post('/wallet-auth', async (req, res) => {
  try {
    const {
      walletAddress,
      email,
      dynamicUserId,
      authMethod,
      socialAccounts,
      isEmailVerified,
      termsAccepted,
      marketingConsent
    } = req.body;

    // Validate required fields
    if (!walletAddress || !dynamicUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress and dynamicUserId'
      });
    }

    // For demo/testing - skip Shopify API calls
    const customerEmail = email || `${walletAddress.toLowerCase()}@wallet.tresr.com`;
    const mockCustomerId = 'demo_' + Date.now();
    
    console.log('Demo mode: Would create customer:', {
      email: customerEmail,
      wallet: walletAddress,
      dynamicUserId
    });

    // Store in local database for quick lookup
    try {
      await db.upsertWalletCustomer({
        wallet_address: walletAddress,
        shopify_customer_id: mockCustomerId,
        dynamic_user_id: dynamicUserId,
        email: customerEmail
      });
    } catch (dbError) {
      console.log('Database not available in demo mode');
    }

    // Check if this is a new creator (always true in demo)
    const isNewCreator = true;

    res.json({
      success: true,
      customerId: mockCustomerId,
      isNewCreator,
      message: 'Customer authenticated successfully (demo mode)'
    });

  } catch (error) {
    console.error('Wallet auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate wallet'
    });
  }
});

/**
 * POST /apps/tresr/link-wallet
 * Link additional wallet to existing customer
 */
router.post('/link-wallet', async (req, res) => {
  try {
    const { customerId, walletAddress, signature } = req.body;

    // TODO: Verify wallet signature to prove ownership

    // Get current linked wallets
    const customer = await shopifyService.client.get({
      path: `customers/${customerId}`,
      query: { fields: 'id,metafields' }
    });

    const currentWallets = JSON.parse(
      customer.body.customer.metafields?.find(m => m.key === 'linked_wallets')?.value || '[]'
    );

    // Add new wallet if not already linked
    if (!currentWallets.includes(walletAddress)) {
      currentWallets.push(walletAddress);
      
      await shopifyService.updateCustomerMetafields(customerId, {
        linked_wallets: JSON.stringify(currentWallets)
      });
    }

    res.json({
      success: true,
      linkedWallets: currentWallets
    });

  } catch (error) {
    console.error('Link wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link wallet'
    });
  }
});

/**
 * GET /apps/tresr/customer/:walletAddress
 * Get customer data by wallet address
 */
router.get('/customer/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Look up in database
    const walletCustomer = await db.getByWalletAddress(walletAddress);
    
    if (!walletCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Get full customer data from Shopify
    const customer = await shopifyService.client.get({
      path: `customers/${walletCustomer.shopify_customer_id}`,
      query: { fields: 'id,email,first_name,last_name,tags,metafields' }
    });

    res.json({
      success: true,
      customer: customer.body.customer
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer'
    });
  }
});

module.exports = router;