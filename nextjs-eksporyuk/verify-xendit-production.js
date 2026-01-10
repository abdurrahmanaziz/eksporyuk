/**
 * Verify Xendit Integration in Production
 * Tests that Xendit API returns camelCase properties correctly
 */

import { Xendit } from 'xendit-node';
import dotenv from 'dotenv';
dotenv.config({ path: './nextjs-eksporyuk/.env.local' });

async function verifyXenditProduction() {
  console.log('🔍 Verifying Xendit Integration in Production...\n');

  // Use production keys
  const xenditClient = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY,
  });

  try {
    console.log('📡 Creating test invoice with production Xendit API...');
    
    const invoice = await xenditClient.Invoice.createInvoice({
      data: {
        externalId: `verify-prod-${Date.now()}`,
        amount: 350000,
        description: 'Test Invoice - Verify CamelCase Properties',
        invoiceDuration: 172800, // 48 hours
        currency: 'IDR',
        reminderTime: 1,
        customer: {
          givenNames: 'Test User',
          email: 'test@eksporyuk.com',
          mobileNumber: '+6281234567890'
        },
        customerNotificationPreference: {
          invoiceCreated: ['email'],
          invoiceReminder: ['email'],
          invoicePaid: ['email']
        },
        successRedirectUrl: 'https://eksporyuk.com/checkout/success',
        failureRedirectUrl: 'https://eksporyuk.com/checkout/failed'
      }
    });

    console.log('\n✅ Invoice Created Successfully!\n');
    
    // Check property names
    console.log('🔑 Checking property names...');
    console.log('Has invoiceUrl (camelCase):', !!invoice.invoiceUrl);
    console.log('Has invoice_url (snake_case):', !!invoice.invoice_url);
    console.log('Has expiryDate (camelCase):', !!invoice.expiryDate);
    console.log('Has expiry_date (snake_case):', !!invoice.expiry_date);
    console.log('Has externalId (camelCase):', !!invoice.externalId);
    console.log('Has external_id (snake_case):', !!invoice.external_id);
    
    console.log('\n📋 Invoice Details:');
    console.log('ID:', invoice.id);
    console.log('Status:', invoice.status);
    console.log('Amount:', invoice.amount);
    
    if (invoice.invoiceUrl) {
      console.log('\n✅ CORRECT: Using camelCase property (invoiceUrl)');
      console.log('Payment URL:', invoice.invoiceUrl);
      
      if (invoice.invoiceUrl.includes('checkout.xendit.co')) {
        console.log('✅ URL format is correct - points to Xendit checkout page');
      }
    } else if (invoice.invoice_url) {
      console.log('\n⚠️  WARNING: API returns snake_case (invoice_url) - need to update code');
      console.log('Payment URL:', invoice.invoice_url);
    } else {
      console.log('\n❌ ERROR: No invoice URL found in response!');
    }

    console.log('\n📄 Full Response Structure:');
    console.log(JSON.stringify(invoice, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

verifyXenditProduction();
