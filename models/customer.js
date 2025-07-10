const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

class CustomerModel {
  /**
   * Initialize database tables
   */
  async init() {
    const connection = await pool.getConnection();
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS wallet_customers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          wallet_address VARCHAR(42) UNIQUE NOT NULL,
          shopify_customer_id BIGINT NOT NULL,
          dynamic_user_id VARCHAR(255),
          email VARCHAR(255),
          wallet_provider VARCHAR(50) DEFAULT 'email',
          nfkey_level INT DEFAULT 0,
          discount_percentage DECIMAL(5,2) DEFAULT 0,
          commission_rate DECIMAL(5,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_wallet (wallet_address),
          INDEX idx_customer (shopify_customer_id),
          INDEX idx_dynamic (dynamic_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('Database tables initialized');
    } finally {
      connection.release();
    }
  }

  /**
   * Insert or update wallet-customer mapping
   */
  async upsertWalletCustomer(data) {
    const connection = await pool.getConnection();
    try {
      const { wallet_address, shopify_customer_id, dynamic_user_id, email, wallet_provider } = data;
      
      await connection.execute(`
        INSERT INTO wallet_customers (wallet_address, shopify_customer_id, dynamic_user_id, email, wallet_provider)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          shopify_customer_id = VALUES(shopify_customer_id),
          dynamic_user_id = VALUES(dynamic_user_id),
          email = VALUES(email),
          wallet_provider = VALUES(wallet_provider),
          updated_at = CURRENT_TIMESTAMP
      `, [wallet_address.toLowerCase(), shopify_customer_id, dynamic_user_id, email, wallet_provider || 'email']);

      const [rows] = await connection.execute(
        'SELECT * FROM wallet_customers WHERE wallet_address = ?',
        [wallet_address.toLowerCase()]
      );
      
      return rows[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Get customer by wallet address
   */
  async getByWalletAddress(walletAddress) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM wallet_customers WHERE wallet_address = ?',
        [walletAddress.toLowerCase()]
      );
      
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get customer by Shopify ID
   */
  async getByShopifyId(shopifyCustomerId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM wallet_customers WHERE shopify_customer_id = ?',
        [shopifyCustomerId]
      );
      
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Update NFKEY status
   */
  async updateNFKEYStatus(walletAddress, data) {
    const connection = await pool.getConnection();
    try {
      const { nfkey_level, discount_percentage, commission_rate } = data;
      
      await connection.execute(`
        UPDATE wallet_customers 
        SET nfkey_level = ?, discount_percentage = ?, commission_rate = ?
        WHERE wallet_address = ?
      `, [nfkey_level, discount_percentage, commission_rate, walletAddress.toLowerCase()]);
      
      return true;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all NFKEY holders
   */
  async getAllNFKEYHolders() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM wallet_customers WHERE nfkey_level > 0 ORDER BY nfkey_level DESC'
      );
      
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get customer by Dynamic user ID
   */
  async getByDynamicUserId(dynamicUserId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM wallet_customers WHERE dynamic_user_id = ?',
        [dynamicUserId]
      );
      
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get customer statistics
   */
  async getStats() {
    const connection = await pool.getConnection();
    try {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN nfkey_level > 0 THEN 1 END) as nfkey_holders,
          AVG(CASE WHEN nfkey_level > 0 THEN nfkey_level END) as avg_nfkey_level,
          MAX(nfkey_level) as max_nfkey_level
        FROM wallet_customers
      `);
      
      return stats[0];
    } finally {
      connection.release();
    }
  }
}

// Create singleton instance
const customerModel = new CustomerModel();

// Initialize tables on startup
customerModel.init().catch(console.error);

module.exports = customerModel;