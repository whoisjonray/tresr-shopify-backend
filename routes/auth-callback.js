const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const shopifyService = require('../services/shopify');
const db = require('../models/customer');

/**
 * POST /apps/tresr/auth/callback
 * Handle Dynamic.xyz OAuth callback
 */
router.post('/callback', async (req, res) => {
  try {
    const { authToken, userId, provider } = req.body;
    
    if (!authToken || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // TODO: Verify the auth token with Dynamic.xyz API
    // For now, we'll trust it in demo mode
    
    // Create a session token
    const sessionToken = jwt.sign(
      { 
        userId,
        provider,
        timestamp: Date.now()
      },
      process.env.JWT_SECRET || 'tresr-shopify-secret',
      { expiresIn: '7d' }
    );
    
    // Create or update Shopify customer
    const customerEmail = `dynamic_${userId}@tresr.com`;
    const mockCustomerId = 'dynamic_' + Date.now();
    
    // Store in database
    try {
      await db.upsertWalletCustomer({
        wallet_address: userId,
        shopify_customer_id: mockCustomerId,
        dynamic_user_id: userId,
        email: customerEmail
      });
    } catch (dbError) {
      console.log('Database storage failed:', dbError);
    }
    
    res.json({
      success: true,
      sessionToken,
      customerId: mockCustomerId
    });
    
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * GET /apps/tresr/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No auth token provided'
      });
    }
    
    const token = authHeader.slice(7);
    
    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tresr-shopify-secret'
    );
    
    // Get user data from database
    const walletCustomer = await db.getByWalletAddress(decoded.userId);
    
    res.json({
      userId: decoded.userId,
      email: walletCustomer?.email,
      walletAddress: walletCustomer?.wallet_address,
      customerId: walletCustomer?.shopify_customer_id,
      provider: decoded.provider
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
});

/**
 * POST /apps/tresr/auth/logout
 * Handle logout
 */
router.post('/logout', async (req, res) => {
  // In a real implementation, you might want to:
  // - Invalidate the JWT token
  // - Clear any server-side sessions
  // - Notify Dynamic.xyz of logout
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;