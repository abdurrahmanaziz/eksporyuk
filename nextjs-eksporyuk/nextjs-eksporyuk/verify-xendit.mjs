/**
 * Verify Xendit Production Response Structure
 */

import { Xendit } from 'xendit-node';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

async function verify() {
  console.log('🔍 Testing Xendit Production API...\n');

  try {
    const invoice = await xenditClient.Invoice.createInvoice({
      data: {
        externalId: `verify-${Date.now()}`,
        amount: 350000,
        description: 'Verification Test',
        invoiceDuration: 86400,
        currency: 'IDR',
        customer: {
          givenNames: 'Test User',
          email: 'test@eksporyuk.com',
          mobileNumber: '+6281234567890'
        },
        successRedirectUrl: 'https://eksporyuk.com/checkout/success',
        failureRedirectUrl: 'https://eksporyuk.com/checkout/failed'
      }
    });

    console.log('✅ Invoice Created!\n');
    console.log('Property Name Check:');
    console.log('  invoice.invoiceUrl:', !!invoice.invoiceUrl ? '✅ EXISTS' : '❌ NOT FOUND');
    console.log('  invoice.invoice_url:', !!invoice.invoice_url ? '✅ EXISTS' : '❌ NOT FOUND');
    console.log('  invoice.expiryDate:', !!invoice.expiryDate ? '✅ EXISTS' : '❌ NOT FOUND');
    console.log('  invoice.expiry_date:', !!invoice.expiry_date ? '✅ EXISTS' : '❌ NOT FOUND');
    
    console.log('\nInvoice Details:');
    console.log('  ID:', invoice.id);
    console.log('  URL:', invoice.invoiceUrl || invoice.invoice_url || 'NOT FOUND');
    console.log('  Status:', invoice.status);
    
    console.log('\n✅ Fix is correct if invoice.invoiceUrl EXISTS');
    console.log('❌ Need to revert if invoice.invoice_url EXISTS instead');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verify();
