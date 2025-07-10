const Web3 = require('web3');
const redis = require('redis');

// Initialize Redis client for caching
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect();

class AvalancheService {
  constructor() {
    this.web3 = new Web3(process.env.AVALANCHE_RPC_URL);
    this.nfkeyContract = new this.web3.eth.Contract(
      this.getNFKEYABI(),
      process.env.NFKEY_CONTRACT_ADDRESS
    );
    this.cacheExpiry = 3600; // 1 hour cache
  }

  getNFKEYABI() {
    return [
      {
        "inputs": [{"name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
        "constant": true
      },
      {
        "inputs": [{"name": "tokenId", "type": "uint256"}],
        "name": "getLevel",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
        "constant": true
      },
      {
        "inputs": [{"name": "owner", "type": "address"}, {"name": "index", "type": "uint256"}],
        "name": "tokenOfOwnerByIndex",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
        "constant": true
      }
    ];
  }

  /**
   * Check if wallet owns NFKEY and get level
   */
  async checkNFKEYOwnership(walletAddress) {
    try {
      // Check cache first
      const cacheKey = `nfkey:${walletAddress}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        console.log(`Cache hit for wallet ${walletAddress}`);
        return JSON.parse(cached);
      }

      // Check on-chain
      const balance = await this.nfkeyContract.methods.balanceOf(walletAddress).call();
      
      if (balance === '0') {
        const result = { hasNFKEY: false };
        await redisClient.setEx(cacheKey, this.cacheExpiry, JSON.stringify(result));
        return result;
      }

      // Get the first NFKEY token
      const tokenId = await this.nfkeyContract.methods.tokenOfOwnerByIndex(walletAddress, 0).call();
      const level = await this.nfkeyContract.methods.getLevel(tokenId).call();

      const result = {
        hasNFKEY: true,
        tokenId: tokenId.toString(),
        level: parseInt(level),
        balance: parseInt(balance)
      };

      // Cache the result
      await redisClient.setEx(cacheKey, this.cacheExpiry, JSON.stringify(result));
      
      return result;

    } catch (error) {
      console.error('Error checking NFKEY ownership:', error);
      throw error;
    }
  }

  /**
   * Get discount percentage based on NFKEY level
   */
  getDiscountForLevel(level) {
    const discountTiers = [
      { min: 1, max: 10, discount: 2.5, commission: 10.0 },
      { min: 11, max: 20, discount: 5.0, commission: 10.0 },
      { min: 21, max: 30, discount: 7.5, commission: 10.0 },
      { min: 31, max: 40, discount: 10.0, commission: 10.0 },
      { min: 41, max: 50, discount: 12.5, commission: 10.0 },
      { min: 51, max: 60, discount: 15.0, commission: 20.0 },
      { min: 61, max: 70, discount: 17.5, commission: 20.0 },
      { min: 71, max: 80, discount: 20.0, commission: 20.0 },
      { min: 81, max: 90, discount: 22.5, commission: 20.0 },
      { min: 91, max: 100, discount: 25.0, commission: 20.0 },
      { min: 101, max: 110, discount: 27.5, commission: 30.0 },
      { min: 111, max: 120, discount: 30.0, commission: 30.0 },
      { min: 121, max: 130, discount: 32.5, commission: 30.0 },
      { min: 131, max: 140, discount: 35.0, commission: 30.0 },
      { min: 141, max: 150, discount: 40.0, commission: 40.0 }
    ];

    const tier = discountTiers.find(t => level >= t.min && level <= t.max);
    return tier || { discount: 0, commission: 0 };
  }

  /**
   * Clear cache for a wallet (useful after NFT transfers)
   */
  async clearCache(walletAddress) {
    await redisClient.del(`nfkey:${walletAddress}`);
  }

  /**
   * Batch check multiple wallets (efficient for linked wallets)
   */
  async batchCheckNFKEY(walletAddresses) {
    const results = await Promise.all(
      walletAddresses.map(wallet => this.checkNFKEYOwnership(wallet))
    );

    // Return the highest level found
    const nfkeyHolders = results.filter(r => r.hasNFKEY);
    if (nfkeyHolders.length === 0) {
      return { hasNFKEY: false };
    }

    return nfkeyHolders.reduce((highest, current) => 
      current.level > highest.level ? current : highest
    );
  }
}

module.exports = new AvalancheService();