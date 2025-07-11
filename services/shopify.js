const { initializeShopify } = require('./shopify-init');

class ShopifyService {
  constructor() {
    // Lazy initialization
    this._shopify = null;
    this._session = null;
    this._client = null;
    this._graphqlClient = null;
  }

  // Initialize on first use
  _ensureInitialized() {
    if (!this._shopify) {
      const { shopify, session } = initializeShopify();
      this._shopify = shopify;
      this._session = session;
      this._client = new shopify.clients.Rest({ session });
      this._graphqlClient = new shopify.clients.Graphql({ session });
    }
  }

  get client() {
    this._ensureInitialized();
    return this._client;
  }

  get graphqlClient() {
    this._ensureInitialized();
    return this._graphqlClient;
  }

  /**
   * Find or create customer by email
   */
  async findOrCreateCustomer(email, data = {}) {
    try {
      // Skip search for now - just create
      // TODO: Implement proper customer search with GraphQL
      
      // Create new customer
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

      console.log('Customer created:', createResponse.body.customer.email);
      return createResponse.body.customer;
    } catch (error) {
      // If customer already exists, try to get them by email
      if (error.response?.body?.errors?.email?.[0]?.includes('taken')) {
        console.log('Customer already exists, fetching...');
        
        // Use GraphQL to find customer
        const query = `
          query findCustomer($email: String!) {
            customers(first: 1, query: $email) {
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
              query,
              variables: { email }
            }
          });
          
          if (response.body.data.customers.edges.length > 0) {
            const customer = response.body.data.customers.edges[0].node;
            // Convert GraphQL ID to REST ID
            const customerId = customer.id.split('/').pop();
            return { 
              id: customerId,
              email: customer.email,
              first_name: customer.firstName,
              last_name: customer.lastName,
              tags: customer.tags
            };
          }
        } catch (graphError) {
          console.error('GraphQL search failed:', graphError);
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
   * Create automatic discount for NFKEY holders
   */
  async createNFKEYDiscount(level, percentage, customerId) {
    const code = `NFKEY-${level}-${customerId}`;
    
    try {
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
            ends_at: null
          }
        }
      });

      // Create discount code
      const discountCode = await this.client.post({
        path: `price_rules/${priceRule.body.price_rule.id}/discount_codes`,
        data: {
          discount_code: {
            code: code
          }
        }
      });

      return {
        priceRuleId: priceRule.body.price_rule.id,
        discountCode: code,
        percentage: percentage
      };
    } catch (error) {
      console.error('Error creating NFKEY discount:', error);
      throw error;
    }
  }

  /**
   * Create automatic discount using GraphQL (preferred method)
   */
  async createAutomaticNFKEYDiscount(level, percentage, customerSegmentId) {
    const mutation = `
      mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
          automaticDiscountNode {
            id
            automaticDiscount {
              ... on DiscountAutomaticBasic {
                title
                status
                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                  }
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

    const variables = {
      automaticBasicDiscount: {
        title: `NFKEY Level ${level} - ${percentage}% off`,
        customerGets: {
          value: {
            percentage: percentage / 100
          },
          items: {
            all: true
          }
        },
        customerSelection: {
          customerSegmentIds: [customerSegmentId]
        },
        startsAt: new Date().toISOString()
      }
    };

    try {
      const response = await this.graphqlClient.query({
        data: { query: mutation, variables }
      });

      if (response.body.data.discountAutomaticBasicCreate.userErrors.length > 0) {
        throw new Error(response.body.data.discountAutomaticBasicCreate.userErrors[0].message);
      }

      return response.body.data.discountAutomaticBasicCreate.automaticDiscountNode;
    } catch (error) {
      console.error('Error creating automatic discount:', error);
      throw error;
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