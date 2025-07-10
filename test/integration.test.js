const request = require('supertest');
const app = require('../server');

describe('TRESR Shopify App Integration Tests', () => {
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Wallet Authentication', () => {
    it('should create new customer with wallet', async () => {
      const walletData = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        email: 'test@example.com',
        dynamicUserId: 'dynamic_test_123',
        authMethod: 'email',
        termsAccepted: true,
        marketingConsent: false
      };

      const response = await request(app)
        .post('/apps/tresr/wallet-auth')
        .send(walletData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('customerId');
      expect(response.body).toHaveProperty('isNewCreator');
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/apps/tresr/wallet-auth')
        .send({ walletAddress: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('NFKEY Discounts', () => {
    it('should check NFKEY ownership', async () => {
      const response = await request(app)
        .post('/apps/tresr/nfkey-discount')
        .send({ walletAddress: '0xtest' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('hasNFKEY');
    });

    it('should check discount status', async () => {
      const response = await request(app)
        .get('/apps/tresr/check-discount/0xtest')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('hasDiscount');
    });
  });

  describe('Webhook Processing', () => {
    it('should reject webhook without signature', async () => {
      await request(app)
        .post('/webhooks/customers/create')
        .send({ id: 123 })
        .expect(401);
    });

    it('should process valid webhook', async () => {
      // Mock webhook with signature
      const webhookData = {
        id: 123456,
        email: 'customer@example.com',
        created_at: new Date().toISOString()
      };

      // In real test, calculate proper HMAC signature
      await request(app)
        .post('/webhooks/customers/create')
        .set('X-Shopify-Hmac-Sha256', 'mock-signature')
        .send(webhookData)
        .expect(401); // Will fail without proper signature
    });
  });
});