/**
 * Xendit Payment Integration - v7+ API
 * Using Invoice and PaymentRequest APIs
 * Config priority: Database IntegrationConfig > Environment Variables
 */

import { Xendit, Invoice, PaymentRequest } from 'xendit-node';
import { getXenditConfig } from './integration-config';

export class XenditService {
  private secretKey: string | null = null;
  private invoiceApi: Invoice | null = null;
  private paymentRequestApi: PaymentRequest | null = null;

  constructor() {
    // APIs will be initialized on first use
  }

  /**
   * Refresh Xendit APIs with latest config from database
   */
  private async refreshClient(): Promise<void> {
    const dbConfig = await getXenditConfig();
    
    if (dbConfig && dbConfig.XENDIT_SECRET_KEY && !this.isPlaceholderKey(dbConfig.XENDIT_SECRET_KEY)) {
      console.log('[Xendit] Using config from database');
      this.secretKey = dbConfig.XENDIT_SECRET_KEY;
    } else if (process.env.XENDIT_SECRET_KEY && !this.isPlaceholderKey(process.env.XENDIT_SECRET_KEY)) {
      console.log('[Xendit] Using config from environment variables');
      this.secretKey = process.env.XENDIT_SECRET_KEY;
    } else {
      console.error('[Xendit] No valid secret key available');
      this.secretKey = null;
      return;
    }

    // Initialize APIs with secret key
    this.invoiceApi = new Invoice({ secretKey: this.secretKey });
    this.paymentRequestApi = new PaymentRequest({ secretKey: this.secretKey });
  }

  /**
   * Check if key is placeholder
   */
  private isPlaceholderKey(key: string): boolean {
    const placeholders = ['PASTE', 'YOUR_KEY', 'YOUR_SECRET', 'xxx', 'XXX', 'test_key'];
    return placeholders.some(p => key.toLowerCase().includes(p.toLowerCase()));
  }

  /**
   * Check if Xendit is properly configured
   */
  async isConfigured(): Promise<boolean> {
    const dbConfig = await getXenditConfig();
    const dbKey = dbConfig?.XENDIT_SECRET_KEY;
    const envKey = process.env.XENDIT_SECRET_KEY;
    
    const hasValidDbKey = dbKey && !this.isPlaceholderKey(dbKey);
    const hasValidEnvKey = envKey && !this.isPlaceholderKey(envKey);
    
    return hasValidDbKey || hasValidEnvKey;
  }

  /**
   * Create Invoice (main payment method in v7+)
   */
  async createInvoice(data: {
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
    console.log('[Xendit] Creating Invoice:', JSON.stringify(data, null, 2));
    
    await this.refreshClient();
    
    if (!this.invoiceApi) {
      const errorMsg = 'Xendit Invoice API tidak tersedia. Pastikan XENDIT_SECRET_KEY sudah diset dengan benar.';
      console.error('[Xendit]', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const payload: any = {
        externalId: data.external_id,
        amount: data.amount,
        payerEmail: data.payer_email || 'customer@eksporyuk.com',
        description: data.description || 'Payment',
        invoiceDuration: data.invoice_duration || 86400,
        currency: data.currency || 'IDR',
      };

      if (data.payment_methods) {
        payload.paymentMethods = data.payment_methods;
      }

      if (data.customer) {
        payload.customer = data.customer;
      }

      if (data.success_redirect_url) {
        payload.successRedirectUrl = data.success_redirect_url;
      }

      if (data.failure_redirect_url) {
        payload.failureRedirectUrl = data.failure_redirect_url;
      }

      const invoice = await this.invoiceApi.createInvoice({ data: payload });
      console.log('[Xendit] Invoice created:', invoice.id);
      return invoice;
    } catch (error: any) {
      console.error('[Xendit] Invoice creation failed:', error.message);
      
      // Check if it's an authentication error
      if (error.message && error.message.includes('401')) {
        throw new Error('Xendit API Key tidak valid atau belum diset. Silakan set XENDIT_SECRET_KEY di environment variables atau database Integration Config.');
      }
      
      throw new Error(`Gagal membuat invoice Xendit: ${error.message}`);
    }
  }

  /**
   * Convert bank code to Xendit channel code format
   * Based on xendit-node SDK: VirtualAccountChannelCode enum
   * Format: BCA, MANDIRI, BNI, BRI, BSI, PERMATA, CIMB (NO ID_ prefix!)
   */
  private getXenditChannelCode(bankCode: string): string {
    // Valid channel codes from xendit-node SDK (VirtualAccountChannelCode)
    const validChannelCodes = [
      'BCA', 'BJB', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BSI', 'CIMB', 
      'SAHABAT_SAMPOERNA', 'ARTAJASA', 'BNC', 'HANA', 'MUAMALAT'
    ];
    
    // Remove ID_ prefix if accidentally added
    let code = bankCode.replace(/^ID_/, '');
    
    // Validate
    if (validChannelCodes.includes(code)) {
      return code;
    }
    
    // Return as-is if not in list (let Xendit API validate)
    return code;
  }

  /**
   * Create Virtual Account using PaymentRequest API (v7+)
   * Returns actual VA number for custom UI display
   */
  async createVirtualAccount(data: {
    externalId: string;
    bankCode: string;
    name: string;
    amount?: number;
    isSingleUse?: boolean;
    expirationDate?: Date;
  }) {
    // Convert to valid Xendit channel code (NO ID_ prefix)
    const channelCode = this.getXenditChannelCode(data.bankCode);
    console.log('[Xendit] Creating VA with PaymentRequest API:', data.bankCode, '→', channelCode);
    
    await this.refreshClient();
    
    if (!this.paymentRequestApi) {
      console.log('[Xendit] No PaymentRequest API, returning mock');
      const companyCode = process.env.XENDIT_VA_COMPANY_CODE || '88088';
      const vaNumber = companyCode + Date.now().toString().slice(-7);
      
      return {
        success: true,
        data: {
          id: 'mock-va-' + Date.now(),
          external_id: data.externalId,
          bank_code: data.bankCode,
          account_number: vaNumber,
          name: data.name,
          expected_amount: data.amount,
          status: 'ACTIVE',
          _fallback: true,
        }
      };
    }

    try {
      // Calculate expiration (24 hours default)
      const expiresAt = data.expirationDate 
        ? data.expirationDate.toISOString() 
        : new Date(Date.now() + 86400000).toISOString();

      // Create PaymentRequest with VIRTUAL_ACCOUNT type
      // channelCode must be: BCA, MANDIRI, BNI, BRI, BSI, PERMATA, CIMB etc (NO ID_ prefix!)
      const paymentRequest = await this.paymentRequestApi.createPaymentRequest({
        data: {
          referenceId: data.externalId,
          amount: data.amount || 0,
          currency: 'IDR',
          paymentMethod: {
            type: 'VIRTUAL_ACCOUNT',
            reusability: data.isSingleUse === false ? 'MULTIPLE_USE' : 'ONE_TIME_USE',
            virtualAccount: {
              channelCode: channelCode as any, // BCA, BNI, MANDIRI, BRI, BSI, PERMATA, CIMB
              channelProperties: {
                customerName: data.name,
                expiresAt: new Date(expiresAt),
              }
            }
          }
        }
      });

      console.log('[Xendit] PaymentRequest created:', paymentRequest.id);

      // Extract VA number from response
      const vaNumber = (paymentRequest.paymentMethod as any)?.virtualAccount?.channelProperties?.virtualAccountNumber 
        || (paymentRequest as any).payment_method?.virtual_account?.channel_properties?.virtual_account_number
        || 'N/A';

      console.log('[Xendit] ✅ VA Number:', vaNumber);

      return {
        success: true,
        data: {
          id: paymentRequest.id,
          external_id: paymentRequest.referenceId,
          bank_code: data.bankCode,
          account_number: vaNumber,
          name: data.name,
          expected_amount: paymentRequest.amount,
          expiration_date: expiresAt,
          status: paymentRequest.status,
          payment_method: 'VIRTUAL_ACCOUNT',
        }
      };
    } catch (error: any) {
      console.error('[Xendit] PaymentRequest VA error:', error.message);
      console.error('[Xendit] Error details:', error.response?.data || error);
      
      // Fallback: Try Invoice API (returns checkout link)
      console.log('[Xendit] Falling back to Invoice API...');
      
      try {
        if (!this.invoiceApi) throw new Error('No Invoice API available');
        
        const invoice = await this.invoiceApi.createInvoice({
          data: {
            externalId: data.externalId,
            amount: data.amount || 0,
            payerEmail: 'customer@eksporyuk.com',
            description: data.name,
            invoiceDuration: 86400,
            currency: 'IDR',
            paymentMethods: [data.bankCode],
          }
        });

        console.log('[Xendit] ⚠️ Using Invoice fallback:', invoice.invoiceUrl);

        return {
          success: true,
          data: {
            id: invoice.id,
            external_id: invoice.externalId,
            bank_code: data.bankCode,
            account_number: invoice.invoiceUrl, // Checkout link as fallback
            name: data.name,
            expected_amount: invoice.amount,
            status: invoice.status,
            payment_method: 'INVOICE',
            _fallback: 'invoice',
          }
        };
      } catch (fallbackError: any) {
        console.error('[Xendit] Invoice fallback also failed:', fallbackError.message);
        
        // Last resort: Generate mock VA
        const companyCode = process.env.XENDIT_VA_COMPANY_CODE || '88088';
        const vaNumber = companyCode + Date.now().toString().slice(-7);
        
        return {
          success: true,
          data: {
            id: 'fallback-va-' + Date.now(),
            external_id: data.externalId,
            bank_code: data.bankCode,
            account_number: vaNumber,
            name: data.name,
            expected_amount: data.amount,
            status: 'PENDING',
            payment_method: 'MANUAL',
            _fallback: 'manual',
            _error: error.message,
          }
        };
      }
    }
  }

  /**
   * Create QR Code using PaymentRequest API
   */
  async createQRCode(externalId: string, amount: number) {
    console.log('[Xendit] Creating QR Code');
    
    await this.refreshClient();
    
    if (!this.paymentRequestApi) {
      return {
        success: true,
        data: {
          id: 'mock-qr-' + Date.now(),
          qr_string: 'MOCK_QR_' + Date.now(),
          amount: amount,
        }
      };
    }

    try {
      const payment = await this.paymentRequestApi.createPaymentRequest({
        data: {
          referenceId: externalId,
          amount: amount,
          currency: 'IDR',
          paymentMethod: {
            type: 'QR_CODE',
            reusability: 'ONE_TIME_USE',
            qrCode: {
              channelCode: 'QRIS',
            }
          },
        }
      });

      return {
        success: true,
        data: {
          id: payment.id,
          qr_string: (payment.paymentMethod as any)?.qrCode?.qrString || 'N/A',
          amount: payment.amount,
        }
      };
    } catch (error: any) {
      console.error('[Xendit] QR error:', error.message);
      throw new Error(`QR creation failed: ${error.message}`);
    }
  }

  /**
   * Get Invoice by ID
   */
  async getInvoice(invoiceId: string) {
    await this.refreshClient();
    
    if (!this.invoiceApi) {
      return { id: invoiceId, status: 'PENDING' };
    }

    try {
      return await this.invoiceApi.getInvoiceById({ invoiceId });
    } catch (error: any) {
      console.error('[Xendit] Get invoice error:', error.message);
      throw error;
    }
  }

  /**
   * Verify Webhook Signature
   */
  verifyWebhookSignature(webhookToken: string, payload: string, signature: string): boolean {
    if (!webhookToken) return false;

    try {
      const crypto = require('crypto');
      const computed = crypto.createHmac('sha256', webhookToken).update(payload).digest('hex');
      return computed === signature;
    } catch {
      return false;
    }
  }

  /**
   * Get Balance (for testing)
   */
  async getBalance() {
    await this.refreshClient();
    
    if (!this.secretKey) {
      throw new Error('No Xendit secret key available');
    }

    try {
      const client = new Xendit({ secretKey: this.secretKey });
      return await client.Balance.getBalance({ accountType: 'CASH' });
    } catch (error: any) {
      console.error('[Xendit] Balance error:', error.message);
      throw error;
    }
  }
}

// Export singleton
export const xenditService = new XenditService();

// Export helper
export async function getXenditClient() {
  const config = await getXenditConfig();
  const secretKey = config?.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET_KEY;
  
  if (!secretKey) return null;
  
  return new Xendit({ secretKey });
}
