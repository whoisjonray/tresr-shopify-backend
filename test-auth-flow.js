#!/usr/bin/env node

/**
 * Test script for TRESR Shopify App Authentication Flow
 * Tests the complete auth flow from Dynamic.xyz to Shopify customer creation
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;
const TEST_DATA = {
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  email: 'test.creator@tresr.com',
  dynamicUserId: 'dynamic_test_' + Date.now(),
  authMethod: 'email',
  socialAccounts: {
    google: {
      name: 'Test Creator'
    }
  },
  isEmailVerified: true,
  termsAccepted: true,
  marketingConsent: false
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testWalletAuth() {
  log('\n=== Testing Wallet Authentication ===', 'cyan');
  log(`Endpoint: POST ${API_BASE_URL}/apps/tresr/wallet-auth`, 'blue');
  log('Test Data:', 'yellow');
  console.log(JSON.stringify(TEST_DATA, null, 2));

  try {
    const response = await axios.post(
      `${API_BASE_URL}/apps/tresr/wallet-auth`,
      TEST_DATA,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      log('\n✅ Authentication successful!', 'green');
      log(`Customer ID: ${response.data.customerId}`, 'green');
      log(`Is New Creator: ${response.data.isNewCreator}`, 'green');
      log(`Message: ${response.data.message}`, 'green');
      
      return response.data.customerId;
    } else {
      log('\n❌ Authentication failed', 'red');
      console.log(response.data);
      return null;
    }
  } catch (error) {
    log('\n❌ Request failed', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`Error: ${error.message}`, 'red');
    }
    return null;
  }
}

async function testNFKEYDiscount(walletAddress) {
  log('\n=== Testing NFKEY Discount Check ===', 'cyan');
  log(`Endpoint: POST ${API_BASE_URL}/apps/tresr/nfkey-discount`, 'blue');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/apps/tresr/nfkey-discount`,
      { walletAddress },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      if (response.data.hasNFKEY) {
        log('\n✅ NFKEY found!', 'green');
        log(`Level: ${response.data.level}`, 'green');
        log(`Discount: ${response.data.discountPercentage}%`, 'green');
        log(`Discount Code: ${response.data.discountCode}`, 'green');
      } else {
        log('\n⚠️ No NFKEY found for this wallet', 'yellow');
      }
    } else {
      log('\n❌ Discount check failed', 'red');
      console.log(response.data);
    }
  } catch (error) {
    log('\n❌ Request failed', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`Error: ${error.message}`, 'red');
    }
  }
}

async function testGetCustomer(walletAddress) {
  log('\n=== Testing Get Customer by Wallet ===', 'cyan');
  log(`Endpoint: GET ${API_BASE_URL}/apps/tresr/customer/${walletAddress}`, 'blue');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/apps/tresr/customer/${walletAddress}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      log('\n✅ Customer retrieved successfully!', 'green');
      const customer = response.data.customer;
      log(`ID: ${customer.id}`, 'green');
      log(`Email: ${customer.email}`, 'green');
      log(`Name: ${customer.first_name} ${customer.last_name}`, 'green');
      log(`Tags: ${customer.tags}`, 'green');
      
      if (customer.metafields && customer.metafields.length > 0) {
        log('\nMetafields:', 'cyan');
        customer.metafields.forEach(mf => {
          log(`  ${mf.namespace}.${mf.key}: ${mf.value}`, 'blue');
        });
      }
    } else {
      log('\n❌ Customer retrieval failed', 'red');
      console.log(response.data);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log('\n⚠️ Customer not found', 'yellow');
    } else {
      log('\n❌ Request failed', 'red');
      if (error.response) {
        log(`Status: ${error.response.status}`, 'red');
        log(`Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      } else {
        log(`Error: ${error.message}`, 'red');
      }
    }
  }
}

async function runTests() {
  log('\n🚀 Starting TRESR Shopify App Authentication Tests', 'cyan');
  log('=' .repeat(50), 'cyan');

  // Check environment
  log('\n📋 Environment Check:', 'yellow');
  log(`API URL: ${API_BASE_URL}`, 'blue');
  log(`Shopify Store: ${process.env.SHOPIFY_STORE_DOMAIN || 'Not configured'}`, 'blue');
  log(`Shopify Access Token: ${process.env.SHOPIFY_ACCESS_TOKEN ? '✓ Configured' : '✗ Missing'}`, 
      process.env.SHOPIFY_ACCESS_TOKEN ? 'green' : 'red');

  // Test 1: Wallet Authentication
  const customerId = await testWalletAuth();
  
  if (!customerId) {
    log('\n⚠️ Skipping remaining tests due to auth failure', 'yellow');
    return;
  }

  // Wait a moment for data to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: NFKEY Discount
  await testNFKEYDiscount(TEST_DATA.walletAddress);

  // Test 3: Get Customer
  await testGetCustomer(TEST_DATA.walletAddress);

  log('\n' + '=' .repeat(50), 'cyan');
  log('✅ All tests completed!', 'green');
  log('\nNext steps:', 'yellow');
  log('1. Check Shopify admin for the created customer', 'blue');
  log('2. Verify metafields are properly set', 'blue');
  log('3. Test with a real NFKEY wallet address', 'blue');
  log('4. Test webhook processing', 'blue');
}

// Run tests
runTests().catch(error => {
  log('\n❌ Test suite failed:', 'red');
  console.error(error);
  process.exit(1);
});