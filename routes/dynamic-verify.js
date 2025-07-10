const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const shopifyService = require('../services/shopify');
const db = require('../models/customer');

// Cache for Dynamic.xyz JWKS
let jwksCache = null;
let jwksCacheTime = 0;
const JWKS_CACHE_DURATION = 3600000; // 1 hour

/**
 * Get Dynamic.xyz JWKS for JWT verification
 */
async function getDynamicJWKS() {
  const now = Date.now();
  
  // Return cached JWKS if still valid
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_DURATION) {
    return jwksCache;
  }
  
  try {
    // Fetch JWKS from Dynamic.xyz
    const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID || 'b17e8631-c1b7-45d5-95cf-151eb5246423';
    const response = await axios.get(
      `https://app.dynamic.xyz/api/v0/sdk/${environmentId}/.well-known/jwks`
    );
    
    jwksCache = response.data;
    jwksCacheTime = now;
    return jwksCache;
  } catch (error) {
    console.error('Failed to fetch Dynamic JWKS:', error);
    throw new Error('Failed to verify authentication');
  }
}

/**
 * Verify Dynamic.xyz JWT token
 */
async function verifyDynamicJWT(token) {
  try {
    // Decode token header to get kid
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token format');
    }
    
    // Get JWKS
    const jwks = await getDynamicJWKS();
    
    // Find the key matching the kid
    const key = jwks.keys.find(k => k.kid === decoded.header.kid);
    if (!key) {
      throw new Error('Token signing key not found');
    }
    
    // Convert JWK to PEM for verification
    const publicKey = jwkToPem(key);
    
    // Verify the token
    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://app.dynamic.xyz',
      audience: process.env.DYNAMIC_ENVIRONMENT_ID || 'b17e8631-c1b7-45d5-95cf-151eb5246423'
    });
    
    return verified;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw error;
  }
}

/**
 * Convert JWK to PEM format
 */
function jwkToPem(jwk) {
  // This is a simplified version - in production, use a library like 'jwk-to-pem'
  const jwkToPem = require('jwk-to-pem');
  return jwkToPem(jwk);
}

/**
 * POST /apps/tresr/auth/dynamic-verify
 * Verify Dynamic.xyz authentication and create/update Shopify customer
 */
router.post('/dynamic-verify', async (req, res) => {
  try {
    const { dynamicJwt, userId, email, walletAddress, walletProvider } = req.body;
    
    if (!dynamicJwt || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // In production, verify the JWT
    let verifiedUser;
    try {
      verifiedUser = await verifyDynamicJWT(dynamicJwt);
      console.log('Dynamic JWT verified:', verifiedUser.sub);
    } catch (verifyError) {
      console.error('JWT verification failed:', verifyError);
      // For development/testing, continue with provided data
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Skipping JWT verification');
        verifiedUser = { sub: userId };
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token'
        });
      }
    }
    
    // Create or update Shopify customer
    let customerId;
    try {
      // Check if customer exists
      const existingCustomer = await shopifyService.findCustomerByEmail(email || `${userId}@dynamic.tresr.com`);
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
        
        // Update customer metafields
        await shopifyService.updateCustomerMetafields(customerId, {
          dynamic_user_id: userId,
          wallet_address: walletAddress || '',
          wallet_provider: walletProvider || 'email',
          last_login: new Date().toISOString()
        });
      } else {
        // Create new customer
        const customer = await shopifyService.createCustomer({
          email: email || `${userId}@dynamic.tresr.com`,
          firstName: walletProvider === 'email' ? email?.split('@')[0] : 'Dynamic',
          lastName: 'User',
          acceptsMarketing: false,
          metafields: [
            {
              namespace: 'tresr',
              key: 'dynamic_user_id',
              value: userId,
              type: 'single_line_text_field'
            },
            {
              namespace: 'tresr',
              key: 'wallet_address',
              value: walletAddress || '',
              type: 'single_line_text_field'
            },
            {
              namespace: 'tresr',
              key: 'wallet_provider',
              value: walletProvider || 'email',
              type: 'single_line_text_field'
            }
          ]
        });
        
        customerId = customer.id;
      }
    } catch (shopifyError) {
      console.error('Shopify customer error:', shopifyError);
      // Use mock customer ID for development
      customerId = `dynamic_${Date.now()}`;
    }
    
    // Store in database
    try {
      await db.upsertWalletCustomer({
        wallet_address: walletAddress || userId,
        shopify_customer_id: customerId,
        dynamic_user_id: userId,
        email: email || `${userId}@dynamic.tresr.com`,
        wallet_provider: walletProvider
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue even if DB fails
    }
    
    // Create session token
    const sessionToken = jwt.sign(
      { 
        userId,
        customerId,
        email,
        walletAddress,
        provider: 'dynamic',
        timestamp: Date.now()
      },
      process.env.JWT_SECRET || 'tresr-shopify-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      sessionToken,
      customerId
    });
    
  } catch (error) {
    console.error('Dynamic verify error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication verification failed'
    });
  }
});

/**
 * GET /apps/tresr/auth/dynamic-user
 * Get Dynamic user info by ID
 */
router.get('/dynamic-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user from database
    const walletCustomer = await db.getByDynamicUserId(userId);
    
    if (!walletCustomer) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        userId: walletCustomer.dynamic_user_id,
        email: walletCustomer.email,
        walletAddress: walletCustomer.wallet_address,
        customerId: walletCustomer.shopify_customer_id,
        walletProvider: walletCustomer.wallet_provider
      }
    });
    
  } catch (error) {
    console.error('Get Dynamic user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

module.exports = router;