/**
 * Xendit API via Cloudflare Worker Proxy
 * Bypasses IP whitelist issues with Vercel dynamic IPs
 * 
 * Proxy URL: https://xendit-proxy.uts-eksporyuk.workers.dev
 */

import { getXenditConfig } from './integration-config';

const XENDIT_PROXY_URL = 'https://xendit-proxy.uts-eksporyuk.workers.dev';

export class XenditProxyService {
  private secretKey: string | null = null;

  /**
   * Refresh secret key from database config
   */
  private async refreshConfig(): Promise<void> {
    const dbConfig = await getXenditConfig();
    
    if (dbConfig?.XENDIT_SECRET_KEY && !this.isPlaceholderKey(dbConfig.XENDIT_SECRET_KEY)) {
      this.secretKey = dbConfig.XENDIT_SECRET_KEY;
    } else if (process.env.XENDIT_SECRET_KEY && !this.isPlaceholderKey(process.env.XENDIT_SECRET_KEY)) {
      this.secretKey = process.env.XENDIT_SECRET_KEY;
    } else {
      this.secretKey = null;
    }
  }

  private isPlaceholderKey(key: string): boolean {
    const placeholders = ['PASTE', 'YOUR_KEY', 'YOUR_SECRET', 'xxx', 'XXX', 'test_key'];
    return placeholders.some(p => key.toLowerCase().includes(p.toLowerCase()));
  }

  /**
   * Get Authorization header (Basic auth with secret key)
   */
  private getAuthHeader(): string {
    if (!this.secretKey) {
      throw new Error('Xendit secret key not configured');
    }
    return 'Basic ' + Buffer.from(this.secretKey + ':').toString('base64');
  }

  /**
   * Make request to Xendit via Cloudflare proxy
   */
  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    await this.refreshConfig();

    const url = `${XENDIT_PROXY_URL}${endpoint}`;
    
    console.log(`[XenditProxy] ${method} ${endpoint}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[XenditProxy] Error:', data);
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  /**
   * Check if Xendit is configured
   */
  async isConfigured(): Promise<boolean> {
    await this.refreshConfig();
    return this.secretKey !== null;
  }

  /**
   * Test connection to Xendit
   */
  async testConnection(): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      const data = await this.request('/balance');
      return { success: true, balance: data.balance };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Invoice
   */
  async createInvoice(params: {
    external_id: string;
    amount: number;
    payer_email?: string;
    description?: string;
    invoice_duration?: number;
    currency?: string;
    payment_methods?: string[];
    customer?: {
      given_names?: string;
      email?: string;
      mobile_number?: string;
    };
    success_redirect_url?: string;
    failure_redirect_url?: string;
  }) {
    console.log('[XenditProxy] Creating Invoice:', params.external_id);

    const payload: any = {
      external_id: params.external_id,
      amount: params.amount,
      payer_email: params.payer_email || 'customer@eksporyuk.com',
      description: params.description || 'Payment',
      invoice_duration: params.invoice_duration || 86400,
      currency: params.currency || 'IDR',
    };

    if (params.payment_methods) {
      payload.payment_methods = params.payment_methods;
    }

    if (params.customer) {
      payload.customer = params.customer;
    }

    if (params.success_redirect_url) {
      payload.success_redirect_url = params.success_redirect_url;
    }

    if (params.failure_redirect_url) {
      payload.failure_redirect_url = params.failure_redirect_url;
    }

    const invoice = await this.request('/v2/invoices', 'POST', payload);
    
    console.log('[XenditProxy] Invoice created:', invoice.id);
    
    return invoice;
  }

  /**
   * Get Invoice by ID
   */
  async getInvoice(invoiceId: string) {
    return this.request(`/v2/invoices/${invoiceId}`);
  }

  /**
   * Create Virtual Account via Payment Request API
   */
  async createVirtualAccount(params: {
    external_id: string;
    bank_code: string;
    name: string;
    amount?: number;
    is_single_use?: boolean;
    expiration_date?: string;
  }) {
    console.log('[XenditProxy] Creating VA:', params.bank_code, params.external_id);

    // Use PaymentRequest API for VA
    const expiresAt = params.expiration_date || new Date(Date.now() + 86400000).toISOString();

    const payload = {
      reference_id: params.external_id,
      amount: params.amount || 0,
      currency: 'IDR',
      payment_method: {
        type: 'VIRTUAL_ACCOUNT',
        reusability: params.is_single_use === false ? 'MULTIPLE_USE' : 'ONE_TIME_USE',
        virtual_account: {
          channel_code: params.bank_code, // BCA, MANDIRI, BNI, BRI, BSI, PERMATA, CIMB
          channel_properties: {
            customer_name: params.name,
            expires_at: expiresAt,
          }
        }
      }
    };

    try {
      const paymentRequest = await this.request('/payment_requests', 'POST', payload);
      
      // Extract VA number
      const vaNumber = paymentRequest.payment_method?.virtual_account?.channel_properties?.virtual_account_number
        || 'N/A';

      console.log('[XenditProxy] VA created:', vaNumber);

      return {
        success: true,
        data: {
          id: paymentRequest.id,
          external_id: paymentRequest.reference_id,
          bank_code: params.bank_code,
          account_number: vaNumber,
          name: params.name,
          expected_amount: paymentRequest.amount,
          expiration_date: expiresAt,
          status: paymentRequest.status,
          payment_method: 'VIRTUAL_ACCOUNT',
        }
      };
    } catch (error: any) {
      console.error('[XenditProxy] VA creation failed:', error.message);
      
      // Fallback to Invoice API
      console.log('[XenditProxy] Trying Invoice fallback...');
      
      try {
        const invoice = await this.createInvoice({
          external_id: params.external_id,
          amount: params.amount || 0,
          description: `Payment - ${params.name}`,
          payment_methods: [params.bank_code],
        });

        return {
          success: true,
          data: {
            id: invoice.id,
            external_id: invoice.external_id,
            bank_code: params.bank_code,
            account_number: invoice.invoice_url, // Checkout link
            name: params.name,
            expected_amount: invoice.amount,
            status: invoice.status,
            payment_method: 'INVOICE',
            invoice_url: invoice.invoice_url,
            _fallback: 'invoice',
          }
        };
      } catch (invoiceError: any) {
        console.error('[XenditProxy] Invoice fallback failed:', invoiceError.message);
        throw new Error(`Failed to create payment: ${error.message}`);
      }
    }
  }

  /**
   * Get Payment Request by ID
   */
  async getPaymentRequest(paymentRequestId: string) {
    return this.request(`/payment_requests/${paymentRequestId}`);
  }

  /**
   * Get Balance
   */
  async getBalance() {
    return this.request('/balance');
  }

  /**
   * Create Disbursement (Payout)
   */
  async createDisbursement(params: {
    external_id: string;
    amount: number;
    bank_code: string;
    account_holder_name: string;
    account_number: string;
    description?: string;
  }) {
    console.log('[XenditProxy] Creating Disbursement:', params.external_id);

    const payload = {
      external_id: params.external_id,
      amount: params.amount,
      bank_code: params.bank_code,
      account_holder_name: params.account_holder_name,
      account_number: params.account_number,
      description: params.description || 'Disbursement',
    };

    return this.request('/disbursements', 'POST', payload);
  }
}

// Export singleton instance
export const xenditProxy = new XenditProxyService();
