require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

// Import routes - wrap in try/catch for missing dependencies
let authRoutes, discountRoutes, webhookRoutes;

try {
  authRoutes = require('./routes/auth');
  discountRoutes = require('./routes/discounts');
  webhookRoutes = require('./routes/webhooks');
} catch (error) {
  console.error('Failed to load routes - missing dependencies?', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from Shopify domains and localhost
    const allowedOrigins = [
      `https://${process.env.SHOPIFY_STORE_DOMAIN}`,
      'https://auth.0xtresr.com',
      'https://0xtresr.com',
      'http://localhost:9292', // Shopify theme dev
      'http://localhost:3000',
      'http://127.0.0.1:9292',
      /\.myshopify\.com$/,
      /\.shopifypreview\.com$/
    ];
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // For development, allow all origins
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/apps/tresr/', limiter);

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Mount routes
app.use('/apps/tresr', authRoutes);
app.use('/apps/tresr/auth', require('./routes/auth-callback'));
app.use('/apps/tresr/auth', require('./routes/dynamic-verify'));
app.use('/apps/tresr', discountRoutes);
app.use('/webhooks', webhookRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    requestId: req.id
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TRESR Shopify App running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Store: ${process.env.SHOPIFY_STORE_DOMAIN}`);
});