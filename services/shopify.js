const { shopifyApi, ApiVersion, Session } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: [
    'read_customers',
    'write_customers', 
    'read_discounts',
    'write_discounts',
    'read_price_rules',
    'write_price_rules',
    'read_products'
  ],
  hostName: process.env.APP_URL || 'http://localhost:3000',
  apiVersion: '2023-10', // Use string instead of enum
});

// Create session for API calls
const session = new Session({
  id: process.env.SHOPIFY_STORE_DOMAIN,
  shop: process.env.SHOPIFY_STORE_DOMAIN,
  state: 'active',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

class ShopifyService {
  constructor() {
    this.client = new shopify.clients.Rest({ session });
    this.graphqlClient = new shopify.clients.Graphql({ session });
  }

  /**
   * Find or create customer by email
   */
  async findOrCreateCustomer(email, data = {}) {
    try {
      // First, try to find existing customer by email using GraphQL
      console.log(`Searching for customer with email: ${email}`);
      
      const searchQuery = `
        query findCustomerByEmail($query: String!) {
          customers(first: 1, query: $query) {
            edges {
              node {
                id
                email
                firstName
                lastName
                tags
                verifiedEmail
                acceptsMarketing
                metafields(first: 10) {
                  edges {
                    node {
                      namespace
                      key
                      value
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      try {
        const searchResponse = await this.graphqlClient.query({
          data: { 
            query: searchQuery,
            variables: { query: `email:${email}` }
          }
        });
        
        if (searchResponse.body.data.customers.edges.length > 0) {
          const customer = searchResponse.body.data.customers.edges[0].node;
          // Convert GraphQL ID to REST ID
          const customerId = customer.id.split('/').pop();
          
          console.log('Found existing customer:', email);
          
          return { 
            id: customerId,
            email: customer.email,
            first_name: customer.firstName,
            last_name: customer.lastName,
            tags: customer.tags.join(','),
            verified_email: customer.verifiedEmail,
            accepts_marketing: customer.acceptsMarketing
          };
        }
      } catch (searchError) {
        console.log('Customer search returned no results, will create new customer');
      }
      
      // Customer doesn't exist, create new one
      console.log('Creating new customer:', email);
      
      const createResponse = await this.client.post({
        path: 'customers',
        data: {
          customer: {
            email,
            verified_email: true,
            accepts_marketing: data.marketingConsent || false,
            tags: 'wallet-connected,dynamic-xyz',
            note: `Dynamic.xyz user - Wallet: ${data.walletAddress}`,
            first_name: data.first_name,
            last_name: data.last_name
          }
        },
        extraHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Customer created successfully:', createResponse.body.customer.email);
      return createResponse.body.customer;
      
    } catch (error) {
      // Handle specific error cases
      if (error.response?.body?.errors?.email?.[0]?.includes('taken')) {
        // Race condition - customer was created between search and create
        console.log('Customer was created by another process, fetching...');
        
        // Retry the search
        const retryQuery = `
          query findCustomer($query: String!) {
            customers(first: 1, query: $query) {
              edges {
                node {
                  id
                  email
                  firstName
                  lastName
                  tags
                }
              }
            }
          }
        `;
        
        try {
          const response = await this.graphqlClient.query({
            data: { 
              query: retryQuery,
              variables: { query: `email:${email}` }
            }
          });
          
          if (response.body.data.customers.edges.length > 0) {
            const customer = response.body.data.customers.edges[0].node;
            const customerId = customer.id.split('/').pop();
            return { 
              id: customerId,
              email: customer.email,
              first_name: customer.firstName,
              last_name: customer.lastName,
              tags: customer.tags.join(',')
            };
          }
        } catch (retryError) {
          console.error('Retry search failed:', retryError);
        }
      }
      
      console.error('Error in findOrCreateCustomer:', error);
      throw error;
    }
  }

  /**
   * Update customer metafields
   */
  async updateCustomerMetafields(customerId, metafields) {
    const mutation = `
      mutation updateCustomerMetafields($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            metafields(first: 10) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const metafieldInputs = Object.entries(metafields).map(([key, value]) => ({
      namespace: 'tresr',
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      type: typeof value === 'number' ? 'number_integer' : 'single_line_text_field'
    }));

    const variables = {
      input: {
        id: `gid://shopify/Customer/${customerId}`,
        metafields: metafieldInputs
      }
    };

    try {
      const response = await this.graphqlClient.query({
        data: { query: mutation, variables }
      });

      if (response.body.data.customerUpdate.userErrors.length > 0) {
        throw new Error(response.body.data.customerUpdate.userErrors[0].message);
      }

      return response.body.data.customerUpdate.customer;
    } catch (error) {
      console.error('Error updating customer metafields:', error);
      throw error;
    }
  }

  /**
   * Create discount for NFKEY holders using REST API
   * Creates both a price rule and discount code
   */
  async createNFKEYDiscount(level, percentage, customerId) {
    const code = `NFKEY-${level}-${customerId}`;
    
    try {
      // First check if a discount already exists for this customer
      console.log(`Creating NFKEY discount: Level ${level}, ${percentage}% for customer ${customerId}`);
      
      // Create price rule
      const priceRule = await this.client.post({
        path: 'price_rules',
        data: {
          price_rule: {
            title: `NFKEY Level ${level} - ${percentage}% off`,
            target_type: 'line_item',
            target_selection: 'all',
            allocation_method: 'across',
            value_type: 'percentage',
            value: `-${percentage}`,
            customer_selection: 'prerequisite',
            prerequisite_customer_ids: [customerId],
            starts_at: new Date().toISOString(),
            usage_limit: null,
            ends_at: null,
            once_per_customer: false
          }
        }
      });

      console.log('Price rule created:', priceRule.body.price_rule.id);

      // Create discount code
      const discountCode = await this.client.post({
        path: `price_rules/${priceRule.body.price_rule.id}/discount_codes`,
        data: {
          discount_code: {
            code: code
          }
        }
      });

      console.log('Discount code created:', code);

      return {
        priceRuleId: priceRule.body.price_rule.id,
        discountCode: code,
        percentage: percentage
      };
    } catch (error) {
      // Check if discount already exists
      if (error.response?.body?.errors?.base?.[0]?.includes('already been taken')) {
        console.log('Discount code already exists for this customer');
        return {
          priceRuleId: null,
          discountCode: code,
          percentage: percentage,
          existing: true
        };
      }
      
      console.error('Error creating NFKEY discount:', error.response?.body || error);
      throw error;
    }
  }

  /**
   * Delete existing discount for a customer
   * Used when NFKEY level changes
   */
  async deleteCustomerDiscounts(customerId) {
    try {
      // Get all price rules
      const priceRules = await this.client.get({
        path: 'price_rules',
        query: {
          limit: 250,
          customer_selection: 'prerequisite'
        }
      });

      // Find and delete price rules for this customer
      for (const rule of priceRules.body.price_rules) {
        if (rule.prerequisite_customer_ids?.includes(customerId)) {
          console.log(`Deleting price rule ${rule.id} for customer ${customerId}`);
          await this.client.delete({
            path: `price_rules/${rule.id}`
          });
        }
      }
    } catch (error) {
      console.error('Error deleting customer discounts:', error);
      // Non-critical error, continue
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhook(rawBody, signature) {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(rawBody, 'utf8')
      .digest('base64');
    
    return hash === signature;
  }
}

module.exports = new ShopifyService();