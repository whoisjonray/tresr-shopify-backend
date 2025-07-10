// Minimal development server for testing without all dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    mode: 'development',
    timestamp: new Date().toISOString()
  });
});

// Mock wallet auth endpoint
app.post('/apps/tresr/wallet-auth', (req, res) => {
  console.log('Wallet auth request:', req.body);
  
  res.json({
    success: true,
    customerId: 'mock_' + Date.now(),
    isNewCreator: true,
    message: 'Mock authentication successful (dev mode)'
  });
});

// Mock NFKEY discount endpoint
app.post('/apps/tresr/nfkey-discount', (req, res) => {
  console.log('NFKEY discount request:', req.body);
  
  res.json({
    success: true,
    hasNFKEY: true,
    level: 50,
    discountPercentage: 12.5,
    discountCode: 'NFKEY-DEV-50',
    message: 'Mock discount applied (dev mode)'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TRESR Dev Server running on port ${PORT}`);
  console.log(`Mode: Development (Mock responses enabled)`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});