const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopify');
const avalancheService = require('../services/avalanche');
const db = require('../models/customer');

/**
 * POST /apps/tresr/nfkey-discount
 * Check NFKEY ownership and create discount
 */
router.post('/nfkey-discount', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    // Get customer from database
    const walletCustomer = await db.getByWalletAddress(walletAddress);
    if (!walletCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found. Please authenticate first.'
      });
    }

    // Check NFKEY ownership
    const nfkeyData = await avalancheService.checkNFKEYOwnership(walletAddress);
    
    if (!nfkeyData.hasNFKEY) {
      return res.json({
        success: true,
        hasNFKEY: false,
        message: 'No NFKEY found for this wallet'
      });
    }

    // Get discount tier
    const discountTier = avalancheService.getDiscountForLevel(nfkeyData.level);
    
    // Create discount in Shopify
    const discount = await shopifyService.createNFKEYDiscount(
      nfkeyData.level,
      discountTier.discount,
      walletCustomer.shopify_customer_id
    );

    // Update customer metafields
    await shopifyService.updateCustomerMetafields(walletCustomer.shopify_customer_id, {
      nfkey_level: nfkeyData.level,
      nfkey_discount: discountTier.discount,
      commission_rate: discountTier.commission,
      nfkey_token_id: nfkeyData.tokenId
    });

    // Update local database
    await db.updateNFKEYStatus(walletAddress, {
      nfkey_level: nfkeyData.level,
      discount_percentage: discountTier.discount,
      commission_rate: discountTier.commission
    });

    res.json({
      success: true,
      hasNFKEY: true,
      level: nfkeyData.level,
      discountPercentage: discountTier.discount,
      discountCode: discount.discountCode,
      message: `${discountTier.discount}% discount applied!`
    });

  } catch (error) {
    console.error('NFKEY discount error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process NFKEY discount'
    });
  }
});

/**
 * POST /apps/tresr/update-nfkey-status
 * Update customer's NFKEY status
 */
router.post('/update-nfkey-status', async (req, res) => {
  try {
    const { walletAddress, hasNFKEY, level, tokenId } = req.body;

    const walletCustomer = await db.getByWalletAddress(walletAddress);
    if (!walletCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Update metafields
    const metafields = {
      nfkey_level: level || 0,
      nfkey_token_id: tokenId || ''
    };

    if (hasNFKEY && level) {
      const discountTier = avalancheService.getDiscountForLevel(level);
      metafields.nfkey_discount = discountTier.discount;
      metafields.commission_rate = discountTier.commission;
    }

    await shopifyService.updateCustomerMetafields(walletCustomer.shopify_customer_id, metafields);

    res.json({
      success: true,
      message: 'NFKEY status updated'
    });

  } catch (error) {
    console.error('Update NFKEY status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update NFKEY status'
    });
  }
});

/**
 * GET /apps/tresr/check-discount/:walletAddress
 * Check if wallet has active discount
 */
router.get('/check-discount/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Check cache first
    const nfkeyData = await avalancheService.checkNFKEYOwnership(walletAddress);
    
    if (!nfkeyData.hasNFKEY) {
      return res.json({
        success: true,
        hasDiscount: false
      });
    }

    const discountTier = avalancheService.getDiscountForLevel(nfkeyData.level);
    
    res.json({
      success: true,
      hasDiscount: true,
      level: nfkeyData.level,
      percentage: discountTier.discount,
      commission: discountTier.commission
    });

  } catch (error) {
    console.error('Check discount error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check discount'
    });
  }
});

/**
 * POST /apps/tresr/scan-linked-wallets
 * Scan all linked wallets for best NFKEY
 */
router.post('/scan-linked-wallets', async (req, res) => {
  try {
    const { customerId } = req.body;

    // Get customer with metafields
    const customer = await shopifyService.client.get({
      path: `customers/${customerId}`,
      query: { fields: 'id,metafields' }
    });

    const linkedWallets = JSON.parse(
      customer.body.customer.metafields?.find(m => m.key === 'linked_wallets')?.value || '[]'
    );

    if (linkedWallets.length === 0) {
      return res.json({
        success: true,
        hasNFKEY: false,
        message: 'No linked wallets found'
      });
    }

    // Batch check all wallets
    const bestNFKEY = await avalancheService.batchCheckNFKEY(linkedWallets);
    
    if (!bestNFKEY.hasNFKEY) {
      return res.json({
        success: true,
        hasNFKEY: false,
        message: 'No NFKEY found in any linked wallet'
      });
    }

    // Apply the best discount found
    const discountTier = avalancheService.getDiscountForLevel(bestNFKEY.level);
    const discount = await shopifyService.createNFKEYDiscount(
      bestNFKEY.level,
      discountTier.discount,
      customerId
    );

    res.json({
      success: true,
      hasNFKEY: true,
      level: bestNFKEY.level,
      discountPercentage: discountTier.discount,
      discountCode: discount.discountCode,
      walletsScanned: linkedWallets.length
    });

  } catch (error) {
    console.error('Scan linked wallets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan linked wallets'
    });
  }
});

module.exports = router;