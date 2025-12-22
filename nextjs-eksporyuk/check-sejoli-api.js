const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Load environment variables
require('dotenv').config();

async function checkSejoliAPI() {
  try {
    console.log('=== CHECKING SEJOLI API DATA ===\n');

    // Get API credentials from environment or settings
    const sejoliApiUrl = process.env.SEJOLI_API_URL || 'https://app.eksporyuk.com/wp-json/sejoli-api/v1';
    const sejoliApiKey = process.env.SEJOLI_API_KEY;
    const sejoliApiSecret = process.env.SEJOLI_API_SECRET;

    if (!sejoliApiKey || !sejoliApiSecret) {
      console.log('❌ Sejoli API credentials not found in environment');
      console.log('Looking for credentials in settings...\n');
      
      // Check settings table for API credentials
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: ['sejoli_api_url', 'sejoli_api_key', 'sejoli_api_secret']
          }
        }
      });

      console.log('Settings found:');
      settings.forEach(setting => {
        console.log(`- ${setting.key}: ${setting.value ? '✓ Set' : '❌ Empty'}`);
      });
      console.log();
    } else {
      console.log('✅ Sejoli API credentials found in environment');
      console.log(`API URL: ${sejoliApiUrl}`);
      console.log(`API Key: ${sejoliApiKey ? '✓ Set' : '❌ Missing'}`);
      console.log(`API Secret: ${sejoliApiSecret ? '✓ Set' : '❌ Missing'}`);
      console.log();
    }

    // Check affiliate data in our database
    console.log('=== CHECKING DATABASE AFFILIATE DATA ===\n');
    
    // Get Sutisna's data
    const sutisna = await prisma.affiliateProfile.findFirst({
      where: {
        email: 'azzka42@gmail.com'
      }
    });

    if (sutisna) {
      console.log('📊 Sutisna AffiliateProfile Data:');
      console.log(`- ID: ${sutisna.id}`);
      console.log(`- Email: ${sutisna.email}`);
      console.log(`- Name: ${sutisna.firstName} ${sutisna.lastName}`);
      console.log(`- Code: ${sutisna.code}`);
      console.log(`- Total Earnings: Rp ${sutisna.totalEarnings.toLocaleString('id-ID')}`);
      console.log(`- Total Clicks: ${sutisna.totalClicks}`);
      console.log(`- Total Conversions: ${sutisna.totalConversions}`);
      console.log(`- Status: ${sutisna.isActive ? 'Active' : 'Inactive'}`);
      console.log(`- Created: ${sutisna.createdAt}`);
      console.log(`- Updated: ${sutisna.updatedAt}`);
      console.log();
    } else {
      console.log('❌ Sutisna not found in AffiliateProfile table\n');
    }

    // Get all affiliate profiles stats
    const totalAffiliates = await prisma.affiliateProfile.count();
    const activeAffiliates = await prisma.affiliateProfile.count({
      where: { isActive: true }
    });
    
    const totalEarningsSum = await prisma.affiliateProfile.aggregate({
      _sum: {
        totalEarnings: true
      }
    });

    const totalConversionsSum = await prisma.affiliateProfile.aggregate({
      _sum: {
        totalConversions: true
      }
    });

    console.log('📈 Database Summary:');
    console.log(`- Total Affiliates: ${totalAffiliates}`);
    console.log(`- Active Affiliates: ${activeAffiliates}`);
    console.log(`- Total Earnings: Rp ${totalEarningsSum._sum.totalEarnings?.toLocaleString('id-ID') || 0}`);
    console.log(`- Total Conversions: ${totalConversionsSum._sum.totalConversions || 0}`);
    console.log();

    // Check AffiliateConversion data
    console.log('=== CHECKING AFFILIATE CONVERSION DATA ===\n');
    
    const sutisnaConversions = await prisma.affiliateConversion.count({
      where: {
        affiliate: {
          email: 'azzka42@gmail.com'
        }
      }
    });

    const sutisnaConversionSum = await prisma.affiliateConversion.aggregate({
      where: {
        affiliate: {
          email: 'azzka42@gmail.com'
        }
      },
      _sum: {
        commissionAmount: true
      }
    });

    console.log('📊 Sutisna AffiliateConversion Data:');
    console.log(`- Total Conversions: ${sutisnaConversions}`);
    console.log(`- Total Commission: Rp ${sutisnaConversionSum._sum.commissionAmount?.toLocaleString('id-ID') || 0}`);
    console.log();

    // Get recent conversions for analysis
    const recentConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliate: {
          email: 'azzka42@gmail.com'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        affiliate: true,
        transaction: true
      }
    });

    console.log('📊 Recent Conversions (Last 5):');
    recentConversions.forEach((conv, index) => {
      console.log(`${index + 1}. ${conv.createdAt.toDateString()} - Rp ${conv.commissionAmount.toLocaleString('id-ID')} (Transaction: ${conv.transactionId || 'N/A'})`);
    });
    console.log();

    // Data comparison analysis
    console.log('=== DATA ANALYSIS ===\n');
    
    if (sutisna && sutisnaConversionSum._sum.commissionAmount) {
      const profileTotal = sutisna.totalEarnings;
      const conversionTotal = sutisnaConversionSum._sum.commissionAmount;
      const difference = profileTotal.minus(conversionTotal);
      const percentMigrated = conversionTotal.div(profileTotal).mul(100);

      console.log('💡 Commission Analysis:');
      console.log(`- AffiliateProfile Total: Rp ${profileTotal.toLocaleString('id-ID')}`);
      console.log(`- AffiliateConversion Total: Rp ${conversionTotal.toLocaleString('id-ID')}`);
      console.log(`- Difference: Rp ${difference.toLocaleString('id-ID')}`);
      console.log(`- Data Migrated: ${percentMigrated.toFixed(1)}%`);
      console.log();

      if (difference.gt(0)) {
        console.log('🔍 Analysis:');
        console.log('- AffiliateProfile contains historical WordPress/Sejoli data');
        console.log('- AffiliateConversion contains new Next.js system data');
        console.log('- The difference represents unmigrated historical transactions');
        console.log('- This is normal for a migrated system');
      }
    }

  } catch (error) {
    console.error('❌ Error checking Sejoli API:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkSejoliAPI();
}

module.exports = { checkSejoliAPI };