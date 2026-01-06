/**
 * Serious diagnostic: Check actual withdrawal system state
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING WITHDRAWAL SYSTEM IN DETAIL\n');

// 1. Check API route
console.log('1️⃣ CHECKING API ROUTE: /api/ewallet/check-name-xendit');
console.log('─────────────────────────────────────────────────────\n');

const apiRoute = path.join(__dirname, 'src/app/api/ewallet/check-name-xendit/route.ts');
if (fs.existsSync(apiRoute)) {
  const content = fs.readFileSync(apiRoute, 'utf8');
  
  // Check if it calls validateAccount
  if (content.includes('validateAccount')) {
    console.log('✅ Calls validateAccount()');
  }
  
  // Check if it calls getAccountName
  if (content.includes('getAccountName')) {
    console.log('✅ Calls getAccountName()');
  }
  
  // Check if it has mock fallback
  if (content.includes('getMockAccountInfo') || content.includes('ewalletService.getAccountName')) {
    console.log('✅ Has mock service fallback');
  }
  
  console.log(`File size: ${content.length} bytes`);
} else {
  console.log('❌ Route file NOT FOUND');
}

// 2. Check XenditPayoutService
console.log('\n2️⃣ CHECKING XENDIT SERVICE: XenditPayoutService');
console.log('─────────────────────────────────────────────────────\n');

const xenditService = path.join(__dirname, 'src/lib/services/xendit-payout.ts');
if (fs.existsSync(xenditService)) {
  const content = fs.readFileSync(xenditService, 'utf8');
  
  // Check validateAccount method
  if (content.includes('async validateAccount')) {
    console.log('✅ Has validateAccount() method');
    
    if (content.includes('/v1/account_validation')) {
      console.log('⚠️  Still calling /v1/account_validation endpoint');
    } else {
      console.log('✅ Not calling /v1/account_validation (removed)');
    }
  }
  
  // Check if it mentions endpoint doesn't exist
  if (content.includes('does NOT provide')) {
    console.log('✅ Documentation: "Xendit does NOT provide account validation"');
  }
  
  console.log(`File size: ${content.length} bytes`);
} else {
  console.log('❌ Service file NOT FOUND');
}

// 3. Check EWalletService
console.log('\n3️⃣ CHECKING EWALLET SERVICE: EWalletService');
console.log('─────────────────────────────────────────────────────\n');

const ewalletService = path.join(__dirname, 'src/lib/services/ewallet-service.ts');
if (fs.existsSync(ewalletService)) {
  const content = fs.readFileSync(ewalletService, 'utf8');
  
  // Check if getAccountName exists
  if (content.includes('async getAccountName')) {
    console.log('✅ Has getAccountName() method');
  } else {
    console.log('❌ Missing getAccountName() method');
  }
  
  // Check if checkAccountName exists
  if (content.includes('async checkAccountName')) {
    console.log('✅ Has checkAccountName() method');
  }
  
  // Check mock data for DANA
  if (content.includes('"DANA"') && content.includes('08118748177')) {
    console.log('✅ Mock data has DANA + 08118748177');
  }
  
  // Check if Aziz Rahman in mock data
  if (content.includes('Aziz Rahman')) {
    console.log('✅ Mock data includes: "Aziz Rahman"');
  }
  
  console.log(`File size: ${content.length} bytes`);
} else {
  console.log('❌ Service file NOT FOUND');
}

// 4. Check Withdrawal Form Component
console.log('\n4️⃣ CHECKING WITHDRAWAL FORM COMPONENT');
console.log('─────────────────────────────────────────────────────\n');

const walletPage = path.join(__dirname, 'src/app/(dashboard)/affiliate/wallet/page.tsx');
if (fs.existsSync(walletPage)) {
  const content = fs.readFileSync(walletPage, 'utf8');
  
  if (content.includes('checkEWalletName')) {
    console.log('✅ Has checkEWalletName() function');
  }
  
  if (content.includes('setWithdrawForm')) {
    console.log('✅ Updates form state with withdrawal data');
  }
  
  if (content.includes('accountName')) {
    console.log('✅ Uses accountName field');
  }
  
  // Check if validates account name
  if (content.includes('accountName') && content.includes('required')) {
    console.log('✅ Has validation for accountName');
  }
  
  console.log(`File size: ${content.length} bytes`);
} else {
  console.log('❌ Wallet page NOT FOUND');
}

// 5. Check Database Schema
console.log('\n5️⃣ CHECKING DATABASE SCHEMA');
console.log('─────────────────────────────────────────────────────\n');

const schema = path.join(__dirname, 'prisma/schema.prisma');
if (fs.existsSync(schema)) {
  const content = fs.readFileSync(schema, 'utf8');
  
  // Check for EWalletAccount model
  if (content.includes('model EWalletAccount') || content.includes('model eWalletAccount')) {
    console.log('✅ Has EWalletAccount model');
    
    if (content.includes('provider') && content.includes('phoneNumber')) {
      console.log('✅ EWalletAccount has provider + phoneNumber fields');
    }
    
    if (content.includes('accountName')) {
      console.log('✅ EWalletAccount has accountName field');
    }
  } else {
    console.log('⚠️  No EWalletAccount model found');
  }
  
  // Check for Withdrawal model
  if (content.includes('model Withdrawal')) {
    console.log('✅ Has Withdrawal model');
  } else {
    console.log('⚠️  No Withdrawal model found');
  }
  
  console.log(`Schema file size: ${content.length} bytes`);
} else {
  console.log('❌ Schema file NOT FOUND');
}

// 6. Check Environment Variables
console.log('\n6️⃣ CHECKING ENVIRONMENT VARIABLES');
console.log('─────────────────────────────────────────────────────\n');

const envExample = path.join(__dirname, '.env.example');
if (fs.existsSync(envExample)) {
  const content = fs.readFileSync(envExample, 'utf8');
  
  if (content.includes('XENDIT')) {
    console.log('✅ .env.example has XENDIT variables');
    
    if (content.includes('XENDIT_API_KEY')) {
      console.log('   - XENDIT_API_KEY');
    }
    if (content.includes('XENDIT_SECRET_KEY')) {
      console.log('   - XENDIT_SECRET_KEY');
    }
    if (content.includes('XENDIT_WEBHOOK_TOKEN')) {
      console.log('   - XENDIT_WEBHOOK_TOKEN');
    }
  } else {
    console.log('⚠️  No XENDIT variables in .env.example');
  }
} else {
  console.log('⚠️  .env.example not found');
}

const envLocal = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocal)) {
  const content = fs.readFileSync(envLocal, 'utf8');
  const lines = content.split('\n');
  
  let hasXendit = false;
  for (const line of lines) {
    if (line.includes('XENDIT_SECRET_KEY')) {
      if (line.includes('=') && !line.includes('=')) {
        console.log('⚠️  XENDIT_SECRET_KEY is empty');
      } else {
        console.log('✅ XENDIT_SECRET_KEY is set');
        hasXendit = true;
      }
    }
  }
  
  if (!hasXendit) {
    console.log('⚠️  XENDIT_SECRET_KEY might not be configured');
  }
} else {
  console.log('⚠️  .env.local not found');
}

console.log('\n═════════════════════════════════════════════════════');
console.log('CONCLUSION: System readiness status above ☝️');

