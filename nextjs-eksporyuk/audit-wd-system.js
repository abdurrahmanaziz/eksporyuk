/**
 * Audit: Complete Withdrawal System Analysis
 * Check what's actually in the codebase vs what's needed
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           WITHDRAWAL SYSTEM - COMPLETE AUDIT                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// 1. Check database schema for withdrawal models
console.log('1️⃣ DATABASE SCHEMA CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Check for withdrawal-related models
  const hasWithdrawal = schema.includes('model Withdrawal');
  const hasWithdrawalRequest = schema.includes('model WithdrawalRequest');
  const hasWallet = schema.includes('model Wallet');
  const hasTransaction = schema.includes('model Transaction');
  const hasPayout = schema.includes('model Payout');
  const hasEWalletAccount = schema.includes('model EWalletAccount');
  
  console.log('Found Models:');
  console.log(`  ✓ Wallet: ${hasWallet ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ Transaction: ${hasTransaction ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ Withdrawal: ${hasWithdrawal ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ WithdrawalRequest: ${hasWithdrawalRequest ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ Payout: ${hasPayout ? '✅ YES' : '❌ NO'}`);
  console.log(`  ✓ EWalletAccount: ${hasEWalletAccount ? '✅ YES' : '❌ NO'}`);
  
  if (hasWithdrawal) {
    const withdrawalMatch = schema.match(/model Withdrawal\s*\{[\s\S]*?\n\}/);
    if (withdrawalMatch) {
      console.log('\n  Model Withdrawal definition:');
      console.log('  ' + withdrawalMatch[0].split('\n').slice(0, 10).join('\n  '));
    }
  }
} catch (e) {
  console.error('❌ Error reading schema:', e.message);
}

// 2. Check API routes for withdrawal endpoints
console.log('\n\n2️⃣ API ROUTES CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const apiDir = path.join(__dirname, 'src/app/api');
  
  // Find withdrawal-related routes
  const findRoutes = (dir, prefix = '') => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    const routes = [];
    
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      const routePath = prefix + '/' + item.name;
      
      if (item.isDirectory()) {
        routes.push(...findRoutes(fullPath, routePath));
      } else if (item.name === 'route.ts' || item.name === 'route.js') {
        routes.push(routePath.replace('/route.ts', '').replace('/route.js', ''));
      }
    });
    
    return routes;
  };
  
  const allRoutes = findRoutes(apiDir);
  const withdrawalRoutes = allRoutes.filter(r => r.toLowerCase().includes('withdraw'));
  
  console.log('Withdrawal-related API routes:');
  if (withdrawalRoutes.length === 0) {
    console.log('  ❌ NO withdrawal routes found!');
  } else {
    withdrawalRoutes.forEach(r => console.log(`  ✅ ${r}`));
  }
  
  console.log('\nAll API routes with "wallet", "payment", "transaction":');
  const relevantRoutes = allRoutes.filter(r => 
    r.toLowerCase().includes('wallet') || 
    r.toLowerCase().includes('payment') || 
    r.toLowerCase().includes('transaction') ||
    r.toLowerCase().includes('xendit') ||
    r.toLowerCase().includes('payout')
  );
  
  if (relevantRoutes.length === 0) {
    console.log('  ❌ NO relevant routes found!');
  } else {
    relevantRoutes.forEach(r => console.log(`  ✅ ${r}`));
  }
  
} catch (e) {
  console.error('❌ Error reading API routes:', e.message);
}

// 3. Check XenditPayoutService implementation
console.log('\n\n3️⃣ XENDIT PAYOUT SERVICE CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const xenditPath = path.join(__dirname, 'src/lib/services/xendit-payout.ts');
  const xenditCode = fs.readFileSync(xenditPath, 'utf-8');
  
  // Check what methods exist
  const methods = xenditCode.match(/async \w+\([^)]*\)/g) || [];
  
  console.log('XenditPayoutService methods:');
  methods.forEach(m => console.log(`  ✓ ${m}`));
  
  // Check for critical methods
  const hasValidateAccount = xenditCode.includes('async validateAccount');
  const hasCreatePayout = xenditCode.includes('async createPayout');
  const hasGetPayoutStatus = xenditCode.includes('async getPayoutStatus');
  
  console.log('\nCritical methods:');
  console.log(`  validateAccount: ${hasValidateAccount ? '✅ YES' : '❌ NO'}`);
  console.log(`  createPayout: ${hasCreatePayout ? '✅ YES' : '❌ NO'}`);
  console.log(`  getPayoutStatus: ${hasGetPayoutStatus ? '✅ YES' : '❌ NO'}`);
  
  // Check for /v1/account_validation endpoint call
  const hasAccountValidationEndpoint = xenditCode.includes('/v1/account_validation');
  console.log(`\n⚠️  Still calling /v1/account_validation: ${hasAccountValidationEndpoint ? '❌ YES (SHOULD BE REMOVED!)' : '✅ NO'}`);
  
} catch (e) {
  console.error('❌ Error reading xendit service:', e.message);
}

// 4. Check withdrawal form component
console.log('\n\n4️⃣ WITHDRAWAL FORM COMPONENT CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  // Find wallet/withdrawal pages
  const findFiles = (dir, pattern) => {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results.push(...findFiles(fullPath, pattern));
      } else if (item.name.match(pattern)) {
        results.push(fullPath);
      }
    });
    
    return results;
  };
  
  const pageDir = path.join(__dirname, 'src/app');
  const walletFiles = findFiles(pageDir, /wallet|withdrawal/i);
  
  console.log('Withdrawal/Wallet related files:');
  if (walletFiles.length === 0) {
    console.log('  ❌ NO withdrawal/wallet pages found!');
  } else {
    walletFiles.slice(0, 10).forEach(f => {
      const relative = f.replace(__dirname, '');
      console.log(`  ✅ ${relative}`);
    });
    if (walletFiles.length > 10) {
      console.log(`  ... and ${walletFiles.length - 10} more`);
    }
  }
  
} catch (e) {
  console.error('❌ Error finding wallet files:', e.message);
}

// 5. Check withdrawal business logic
console.log('\n\n5️⃣ WITHDRAWAL BUSINESS LOGIC CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  const libDir = path.join(__dirname, 'src/lib');
  const findFiles = (dir, pattern) => {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results.push(...findFiles(fullPath, pattern));
      } else if (item.name.match(pattern)) {
        results.push(fullPath);
      }
    });
    
    return results;
  };
  
  const libFiles = findFiles(libDir, /withdrawal|payout/i);
  
  console.log('Withdrawal/Payout business logic files:');
  if (libFiles.length === 0) {
    console.log('  ❌ NO withdrawal business logic found!');
  } else {
    libFiles.forEach(f => {
      const relative = f.replace(__dirname, '');
      console.log(`  ✅ ${relative}`);
    });
  }
  
} catch (e) {
  console.error('❌ Error finding business logic:', e.message);
}

// 6. Summary
console.log('\n\n📊 SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  ISSUES FOUND:');
console.log('  1. Need to verify Withdrawal model exists in database');
console.log('  2. Need to check if /v1/account_validation call is still there');
console.log('  3. Need to verify API endpoints for withdrawal process');
console.log('  4. Need to check form implementation');
console.log('  5. Need to verify Xendit integration is complete');

console.log('\n📝 NEXT STEPS:');
console.log('  1. Read Xendit documentation for correct integration');
console.log('  2. Verify database schema has Withdrawal/WithdrawalRequest model');
console.log('  3. Implement withdrawal API endpoint with Xendit integration');
console.log('  4. Connect form to backend');
console.log('  5. Test entire flow');

