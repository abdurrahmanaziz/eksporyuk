#!/usr/bin/env node
const crypto = require('crypto');

// Simulate webhook dari Xendit untuk transaction SUCCESS
const transactionData = {
  id: 'txn_1768036141053_lk8d7r75lh',
  userId: 'cae2eab3-e653-40e9-893d-2e98994ba004',
  type: 'MEMBERSHIP',
  status: 'SUCCESS',
  amount: 15980,
  customerName: 'Rich Affiliate App',
  customerEmail: 'richaffiliateapp@gmail.com',
  customerPhone: '0812345678',
  customerWhatsapp: '0812345678',
  productId: null,
  courseId: null,
  eventId: null,
  membershipId: null,
  description: 'Membership: Paket 6 Bulan - Paket 6 Bulan',
  reference: '6962172dc3c8fc68421253d4',
  originalAmount: 1598000,
  notes: null,
  paymentMethod: 'INVOICE',
  paymentProvider: 'XENDIT',
  externalId: 'TXN-1768036141053-cae2eab3',
  paymentUrl: 'https://checkout.xendit.co/web/6962172dc3c8fc68421253d4',
  paymentProofUrl: null,
  paymentProofSubmittedAt: null,
  founderShare: null,
  coFounderShare: null,
  affiliateShare: null,
  mentorShare: null,
  companyFee: null,
  couponId: null,
  discountAmount: 0,
  affiliateId: null,
  metadata: {
    affiliateId: null,
    expiryHours: 72,
    membershipId: 'mem_6bulan_ekspor',
    xenditExpiry: '2026-01-13T09:09:01.129Z',
    affiliateCode: null,
    affiliateName: null,
    discountAmount: 0,
    membershipSlug: 'paket-6-bulan',
    membershipType: 'Paket 6 Bulan',
    originalAmount: 1598000,
    paymentChannel: 'QRIS',
    xenditInvoiceId: '6962172dc3c8fc68421253d4',
    xenditExternalId: 'TXN-1768036141053-cae2eab3',
    xenditInvoiceUrl: 'https://checkout.xendit.co/web/6962172dc3c8fc68421253d4',
    paymentMethodType: 'qris',
    discountPercentage: 0,
    membershipDuration: 'SIX_MONTHS',
    paymentChannelName: 'QRIS',
    affiliateCommission: 0,
    preferredPaymentMethod: 'qris',
    affiliateCommissionRate: 200000,
    preferredPaymentChannel: 'QRIS'
  },
  paidAt: '2026-01-10T09:10:40.448Z',
  expiredAt: '2026-01-13T09:09:01.129Z',
  createdAt: '2026-01-10T09:09:01.055Z',
  updatedAt: '2026-01-10T09:09:01.053Z',
  invoiceNumber: 'INV-1767079675835'
};

// Xendit webhook payload untuk invoice.paid
const webhookPayload = {
  id: '6962172dc3c8fc68421253d4',
  event: 'invoice.paid',
  external_id: 'TXN-1768036141053-cae2eab3',
  reference_id: '6962172dc3c8fc68421253d4',
  status: 'PAID',
  amount: 15980,
  payment_channel: 'QRIS',
  payment_destination: null,
  payer_email: 'richaffiliateapp@gmail.com',
  customer_name: 'Rich Affiliate App',
  paid_at: '2026-01-10T09:10:40.448Z',
  description: 'Membership: Paket 6 Bulan - Paket 6 Bulan',
  created: '2026-01-10T09:09:01Z',
  updated: '2026-01-10T09:10:40.448Z',
  currency: 'IDR'
};

// Get token from env
const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
if (!webhookToken) {
  console.error('❌ XENDIT_WEBHOOK_TOKEN not set');
  process.exit(1);
}

const payload = JSON.stringify(webhookPayload);

// Sign using SHA256
const signature = crypto
  .createHmac('sha256', webhookToken)
  .update(payload)
  .digest('base64');

console.log('\n=== MANUAL WEBHOOK TRIGGER ===\n');
console.log('Event:', webhookPayload.event);
console.log('External ID:', webhookPayload.external_id);
console.log('Amount:', webhookPayload.amount);
console.log('Status:', webhookPayload.status);
console.log('\nSignature:', signature);
console.log('\nPayload:');
console.log(JSON.stringify(webhookPayload, null, 2));

// Make request to webhook
const fetch = require('node-fetch');

async function triggerWebhook() {
  try {
    const response = await fetch('https://eksporyuk.com/api/webhooks/xendit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-token': signature
      },
      body: payload
    });

    console.log('\n=== WEBHOOK RESPONSE ===');
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

    if (response.status === 200) {
      console.log('\n✅ Webhook triggered successfully');
      
      // Wait 2 seconds then check if membership was created
      setTimeout(async () => {
        console.log('\nChecking if membership was created...');
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const um = await prisma.userMembership.findMany({
          where: { userId: 'cae2eab3-e653-40e9-893d-2e98994ba004' }
        });
        
        console.log(`Memberships count: ${um.length}`);
        if (um.length > 0) {
          console.log('✅ Membership created!');
          console.log(um[0]);
        } else {
          console.log('❌ Still no membership');
        }
        
        await prisma.$disconnect();
      }, 2000);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

triggerWebhook();
