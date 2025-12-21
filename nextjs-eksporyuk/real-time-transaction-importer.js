#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// 🔄 REAL-TIME SEJOLI TRANSACTION IMPORTER
class RealTimeSejoliImporter {
  constructor() {
    this.baseURL = "https://member.eksporyuk.com/wp-json/sejoli-api/v1";
    this.auth = {
      username: process.env.SEJOLI_API_USERNAME || "admin_ekspor",
      password: process.env.SEJOLI_API_PASSWORD || "Eksporyuk2024#"
    };
    this.stats = {
      processed: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  // 📥 IMPORT TRANSAKSI BARU
  async importNewTransactions(limit = 100) {
    console.log(`🔄 Starting import of ${limit} latest transactions...`);
    
    try {
      // Fetch latest transactions from Sejoli
      const response = await axios.get(`${this.baseURL}/sales`, {
        auth: this.auth,
        params: {
          limit,
          orderby: 'ID',
          order: 'DESC' // Latest first
        },
        timeout: 60000,
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      const transactions = response.data.orders || [];
      console.log(`📊 Fetched ${transactions.length} transactions from Sejoli API`);
      console.log(`📊 Total available: ${response.data.recordsTotal || 'unknown'}`)
      
      // Process each transaction
      for (const sejoliTx of transactions) {
        await this.processTransaction(sejoliTx);
      }
      
      console.log(`✅ Import completed!`);
      this.printStats();
      
      return this.stats;
      
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
  }

  // 🔧 PROCESS SINGLE TRANSACTION
  async processTransaction(sejoliTx) {
    this.stats.processed++;
    
    try {
      console.log(`Processing transaction ${sejoliTx.ID}...`);
      
      // Check if transaction already exists
      const existingTx = await prisma.transaction.findFirst({
        where: {
          OR: [
            { externalId: sejoliTx.ID.toString() },
            { 
              AND: [
                { userId: sejoliTx.user_id.toString() },
                { amount: parseFloat(sejoliTx.grand_total) },
                { createdAt: new Date(sejoliTx.created_at) }
              ]
            }
          ]
        }
      });
      
      if (existingTx) {
        console.log(`   ⏭️  Transaction ${sejoliTx.ID} already exists, checking for updates...`);
        await this.updateTransactionIfNeeded(existingTx, sejoliTx);
        return;
      }
      
      // Create new transaction
      await this.createNewTransaction(sejoliTx);
      
    } catch (error) {
      console.error(`❌ Error processing transaction ${sejoliTx.ID}:`, error.message);
      this.stats.errors++;
    }
  }

  // ➕ CREATE NEW TRANSACTION
  async createNewTransaction(sejoliTx) {
    try {
      // Get or create user
      const user = await this.getOrCreateUser(sejoliTx);
      
      // Map Sejoli status to our status
      const status = this.mapTransactionStatus(sejoliTx.status);
      
      // Get commission amount dari mapping yang sudah ada
      const commissionAmount = await this.getCommissionAmount(sejoliTx);
      
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          id: `sejoliimport_${sejoliTx.ID}`,
          externalId: sejoliTx.ID.toString(),
          userId: user.id,
          amount: parseFloat(sejoliTx.grand_total),
          status: status,
          type: 'MEMBERSHIP', // Default, akan diupdate based on product mapping
          paymentMethod: sejoliTx.payment_gateway || 'unknown',
          metadata: {
            sejoli: {
              product_id: sejoliTx.product_id,
              product_name: sejoliTx.product_name,
              affiliate_id: sejoliTx.affiliate_id,
              affiliate_name: sejoliTx.affiliate_name,
              coupon_code: sejoliTx.coupon_code,
              payment_gateway: sejoliTx.payment_gateway,
              order_type: sejoliTx.type,
              quantity: sejoliTx.quantity
            }
          },
          createdAt: new Date(sejoliTx.created_at),
          updatedAt: new Date(sejoliTx.updated_at || sejoliTx.created_at)
        }
      });
      
      console.log(`   ✅ Created transaction: ${transaction.id} - Rp ${transaction.amount.toLocaleString()}`);
      
      // Handle affiliate commission if applicable
      if (sejoliTx.affiliate_id && sejoliTx.affiliate_id > 0 && status === 'SUCCESS') {
        await this.handleAffiliateCommission(transaction, sejoliTx, commissionAmount);
      }
      
      // Handle membership creation if applicable
      if (status === 'SUCCESS') {
        await this.handleMembershipCreation(transaction, sejoliTx, user);
      }
      
      this.stats.imported++;
      
    } catch (error) {
      console.error(`❌ Failed to create transaction:`, error.message);
      this.stats.errors++;
      throw error;
    }
  }

  // 🔄 UPDATE TRANSACTION IF NEEDED
  async updateTransactionIfNeeded(existingTx, sejoliTx) {
    const newStatus = this.mapTransactionStatus(sejoliTx.status);
    const newUpdatedAt = new Date(sejoliTx.updated_at || sejoliTx.created_at);
    
    // Check if status or timestamp changed
    if (existingTx.status !== newStatus || 
        existingTx.updatedAt.getTime() !== newUpdatedAt.getTime()) {
      
      await prisma.transaction.update({
        where: { id: existingTx.id },
        data: {
          status: newStatus,
          updatedAt: newUpdatedAt,
          metadata: {
            ...existingTx.metadata,
            lastSyncAt: new Date(),
            sejoliStatus: sejoliTx.status
          }
        }
      });
      
      console.log(`   🔄 Updated transaction ${existingTx.id}: ${existingTx.status} → ${newStatus}`);
      
      // Handle new success transactions (commission & membership)
      if (newStatus === 'SUCCESS' && existingTx.status !== 'SUCCESS') {
        const user = await prisma.user.findUnique({ where: { id: existingTx.userId } });
        
        if (sejoliTx.affiliate_id && sejoliTx.affiliate_id > 0) {
          const commissionAmount = await this.getCommissionAmount(sejoliTx);
          await this.handleAffiliateCommission(existingTx, sejoliTx, commissionAmount);
        }
        
        await this.handleMembershipCreation(existingTx, sejoliTx, user);
      }
      
      this.stats.updated++;
    } else {
      console.log(`   ⏭️  No changes needed for transaction ${existingTx.id}`);
      this.stats.skipped++;
    }
  }

  // 👤 GET OR CREATE USER
  async getOrCreateUser(sejoliTx) {
    // Try to find existing user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sejoliTx.user_email },
          { id: sejoliTx.user_id.toString() }
        ]
      }
    });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: sejoliTx.user_id.toString(),
          email: sejoliTx.user_email,
          name: sejoliTx.user_name,
          role: 'USER_FREE',
          isActive: true,
          createdAt: new Date(sejoliTx.created_at)
        }
      });
      console.log(`   👤 Created user: ${user.name} (${user.email})`);
    }
    
    return user;
  }

  // 💰 GET COMMISSION AMOUNT
  async getCommissionAmount(sejoliTx) {
    // Load commission mapping
    try {
      const { getCommissionBySejolProductId } = require('../src/lib/sejoli-commission');
      return getCommissionBySejolProductId(sejoliTx.product_id) || 0;
    } catch (error) {
      // Fallback: use existing mapping logic
      const productCommissionMap = {
        179: 250000,    // Lifetime basic
        13401: 325000,  // Lifetime premium 
        3840: 300000,   // Lifetime advanced
        8683: 300000,   // 12 bulan
        8684: 250000,   // 6 bulan
        // Add more as needed
      };
      
      return productCommissionMap[sejoliTx.product_id] || 0;
    }
  }

  // 🎯 HANDLE AFFILIATE COMMISSION
  async handleAffiliateCommission(transaction, sejoliTx, commissionAmount) {
    if (commissionAmount <= 0) {
      console.log(`   ⏭️  No commission for product ${sejoliTx.product_id}`);
      return;
    }
    
    try {
      // Get or create affiliate profile
      const affiliate = await this.getOrCreateAffiliate(sejoliTx);
      
      // Create affiliate conversion
      const conversion = await prisma.affiliateConversion.create({
        data: {
          id: `conversion_sejoli_${sejoliTx.ID}`,
          affiliateId: affiliate.id,
          transactionId: transaction.id,
          commissionAmount: commissionAmount,
          status: 'COMPLETED',
          createdAt: new Date(sejoliTx.created_at)
        }
      });
      
      // Update affiliate wallet
      await prisma.wallet.upsert({
        where: { userId: affiliate.userId },
        create: {
          userId: affiliate.userId,
          balance: commissionAmount,
          balancePending: 0
        },
        update: {
          balance: {
            increment: commissionAmount
          }
        }
      });
      
      console.log(`   💰 Commission processed: ${affiliate.username} gets Rp ${commissionAmount.toLocaleString()}`);
      
    } catch (error) {
      console.error(`   ❌ Commission processing failed:`, error.message);
    }
  }

  // 🏷️ GET OR CREATE AFFILIATE
  async getOrCreateAffiliate(sejoliTx) {
    let affiliate = await prisma.affiliateProfile.findFirst({
      where: {
        OR: [
          { username: sejoliTx.affiliate_name },
          { userId: sejoliTx.affiliate_id?.toString() }
        ]
      }
    });
    
    if (!affiliate) {
      // Create affiliate profile
      affiliate = await prisma.affiliateProfile.create({
        data: {
          id: `affiliate_sejoli_${sejoliTx.affiliate_id}`,
          userId: sejoliTx.affiliate_id.toString(),
          username: sejoliTx.affiliate_name || `affiliate_${sejoliTx.affiliate_id}`,
          isActive: true,
          joinedAt: new Date(sejoliTx.created_at)
        }
      });
      console.log(`   🏷️  Created affiliate: ${affiliate.username}`);
    }
    
    return affiliate;
  }

  // 🎫 HANDLE MEMBERSHIP CREATION
  async handleMembershipCreation(transaction, sejoliTx, user) {
    // Product mapping ke membership duration
    const membershipMapping = {
      // Lifetime products
      179: 'LIFETIME', 13401: 'LIFETIME', 3840: 'LIFETIME', 
      28: 'LIFETIME', 93: 'LIFETIME', 1529: 'LIFETIME',
      
      // 12 bulan
      8683: '12_MONTHS', 13399: '12_MONTHS',
      
      // 6 bulan  
      8684: '6_MONTHS', 13400: '6_MONTHS'
    };
    
    const membershipDuration = membershipMapping[sejoliTx.product_id];
    
    if (!membershipDuration) {
      console.log(`   ⏭️  Product ${sejoliTx.product_id} is not a membership product`);
      return;
    }
    
    try {
      // Calculate expiry date
      let expiresAt = null;
      if (membershipDuration === '12_MONTHS') {
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (membershipDuration === '6_MONTHS') {
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6);
      }
      // LIFETIME = null (never expires)
      
      // Create membership
      const membership = await prisma.membership.create({
        data: {
          id: `membership_sejoli_${sejoliTx.ID}`,
          userId: user.id,
          type: membershipDuration === 'LIFETIME' ? 'LIFETIME' : 'PREMIUM',
          status: 'ACTIVE',
          startDate: new Date(sejoliTx.created_at),
          expiresAt: expiresAt,
          transactionId: transaction.id
        }
      });
      
      // Update user role
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          role: membershipDuration === 'LIFETIME' ? 'MEMBER_LIFETIME' : 'MEMBER_PREMIUM'
        }
      });
      
      console.log(`   🎫 Membership created: ${membershipDuration} for ${user.name}`);
      
    } catch (error) {
      console.error(`   ❌ Membership creation failed:`, error.message);
    }
  }

  // 🗺️ MAP TRANSACTION STATUS
  mapTransactionStatus(sejoliStatus) {
    const statusMap = {
      'completed': 'SUCCESS',
      'on-hold': 'PENDING', 
      'cancelled': 'FAILED',
      'refunded': 'FAILED',
      'payment-confirm': 'PENDING'
    };
    
    return statusMap[sejoliStatus] || 'PENDING';
  }

  // 📊 PRINT STATS
  printStats() {
    console.log('\n📊 IMPORT STATISTICS:');
    console.log(`   Processed: ${this.stats.processed}`);
    console.log(`   Imported (new): ${this.stats.imported}`);
    console.log(`   Updated: ${this.stats.updated}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Success Rate: ${((this.stats.processed - this.stats.errors) / this.stats.processed * 100).toFixed(1)}%`);
  }
}

// 🚀 STANDALONE USAGE
if (require.main === module) {
  const importer = new RealTimeSejoliImporter();
  
  // Get limit from command line args
  const limit = parseInt(process.argv[2]) || 50;
  
  console.log('🔥 REAL-TIME SEJOLI TRANSACTION IMPORTER');
  console.log(`📥 Importing latest ${limit} transactions...\n`);
  
  importer.importNewTransactions(limit)
    .then(stats => {
      console.log('\n✅ Import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Import failed:', error.message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { RealTimeSejoliImporter };