// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://becc05-b4.myshopify.com',
      'https://tresr.com',
      'https://www.tresr.com',
      'https://0xtresr.com',
      'https://www.0xtresr.com',
      'https://shopify-api.tresr.com', // Your custom domain
      'https://shopify.0xtresr.com'    // Alternative custom domain
    ];
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = corsOptions;
