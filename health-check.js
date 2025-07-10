// Simple health check endpoint
const http = require('http');

const checkHealth = () => {
  http.get('http://localhost:3001/health', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed');
      process.exit(0);
    } else {
      console.error('❌ Health check failed');
      process.exit(1);
    }
  }).on('error', (err) => {
    console.error('❌ Health check error:', err.message);
    process.exit(1);
  });
};

// Wait for server to start
setTimeout(checkHealth, 5000);
