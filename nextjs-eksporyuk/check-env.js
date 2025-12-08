#!/usr/bin/env node

/**
 * 🔍 ENVIRONMENT VARIABLES CHECKER
 * 
 * Script untuk validasi environment variables sebelum deployment
 * Run: node check-env.js
 */

const requiredEnvVars = {
  // Database (CRITICAL)
  DATABASE_URL: {
    required: true,
    description: 'Database connection string',
    example: 'postgresql://user:pass@host:5432/db',
    validate: (value) => {
      if (!value.startsWith('postgresql://') && !value.startsWith('mysql://')) {
        return 'Must start with postgresql:// or mysql://';
      }
      if (!value.includes('@')) {
        return 'Must include username and host (@)';
      }
      return null;
    }
  },

  // NextAuth (CRITICAL)
  NEXTAUTH_URL: {
    required: true,
    description: 'Production URL',
    example: 'https://eksporyuk.com',
    validate: (value) => {
      if (value.includes('localhost')) {
        return 'Cannot use localhost in production!';
      }
      if (!value.startsWith('https://')) {
        return 'Must use HTTPS in production';
      }
      return null;
    }
  },

  NEXTAUTH_SECRET: {
    required: true,
    description: 'NextAuth JWT secret',
    example: 'Generate with: openssl rand -base64 32',
    validate: (value) => {
      if (value.length < 32) {
        return 'Must be at least 32 characters';
      }
      if (value === 'your-secret-key-here-change-in-production') {
        return 'Cannot use default secret! Generate a new one.';
      }
      return null;
    }
  },

  // Xendit Payment (CRITICAL)
  XENDIT_API_KEY: {
    required: true,
    description: 'Xendit API Key (LIVE mode)',
    example: 'xnd_production_xxx',
    validate: (value) => {
      if (value.includes('test') || value.includes('development')) {
        return '⚠️  WARNING: Looks like TEST key! Use LIVE key for production.';
      }
      return null;
    }
  },

  XENDIT_SECRET_KEY: {
    required: true,
    description: 'Xendit Secret Key',
    example: 'xnd_secret_xxx'
  },

  XENDIT_WEBHOOK_TOKEN: {
    required: true,
    description: 'Xendit Webhook Verification Token',
    example: 'webhook_token_xxx'
  },

  // App Settings (CRITICAL)
  APP_URL: {
    required: true,
    description: 'Application URL',
    example: 'https://eksporyuk.com',
    validate: (value) => {
      if (value.includes('localhost')) {
        return 'Cannot use localhost in production!';
      }
      if (!value.startsWith('https://')) {
        return 'Must use HTTPS in production';
      }
      return null;
    }
  },

  CRON_SECRET: {
    required: true,
    description: 'Cron job authentication secret',
    example: 'Generate with: openssl rand -base64 32',
    validate: (value) => {
      if (value.length < 20) {
        return 'Must be at least 20 characters';
      }
      if (value === 'your-secure-cron-secret-key-change-in-production') {
        return 'Cannot use default secret! Generate a new one.';
      }
      return null;
    }
  },

  // Optional but recommended
  MAILKETING_API_KEY: {
    required: false,
    description: 'Email marketing API key (optional Phase 1)'
  },

  STARSENDER_API_KEY: {
    required: false,
    description: 'WhatsApp API key (optional Phase 1)'
  },

  PUSHER_APP_ID: {
    required: false,
    description: 'Real-time features (optional)'
  }
};

function checkEnvironment() {
  console.log('\n🔍 CHECKING ENVIRONMENT VARIABLES...\n');

  const errors = [];
  const warnings = [];
  const missing = [];
  const success = [];

  // Load environment variables
  require('dotenv').config({ path: '.env.production' });

  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key];

    if (!value) {
      if (config.required) {
        missing.push({
          key,
          description: config.description,
          example: config.example
        });
      } else {
        warnings.push(`⚪ ${key}: Optional (not set)`);
      }
      return;
    }

    // Validate if validator exists
    if (config.validate) {
      const error = config.validate(value);
      if (error) {
        if (error.includes('WARNING')) {
          warnings.push(`⚠️  ${key}: ${error}`);
        } else {
          errors.push(`❌ ${key}: ${error}`);
        }
        return;
      }
    }

    success.push(`✅ ${key}: OK`);
  });

  // Print results
  if (success.length > 0) {
    console.log('✅ VALID VARIABLES:\n');
    success.forEach(msg => console.log(msg));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach(msg => console.log(msg));
    console.log('');
  }

  if (missing.length > 0) {
    console.log('❌ MISSING REQUIRED VARIABLES:\n');
    missing.forEach(({ key, description, example }) => {
      console.log(`❌ ${key}`);
      console.log(`   Description: ${description}`);
      if (example) {
        console.log(`   Example: ${example}`);
      }
      console.log('');
    });
  }

  if (errors.length > 0) {
    console.log('❌ VALIDATION ERRORS:\n');
    errors.forEach(msg => console.log(msg));
    console.log('');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY:');
  console.log(`   ✅ Valid: ${success.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  console.log(`   ❌ Errors: ${errors.length + missing.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (missing.length > 0 || errors.length > 0) {
    console.log('❌ ENVIRONMENT CHECK FAILED!\n');
    console.log('Please fix the errors above before deploying.\n');
    console.log('📖 See: PRODUCTION_ENV_SETUP_GUIDE.md\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('⚠️  ENVIRONMENT CHECK PASSED WITH WARNINGS\n');
    console.log('Review warnings above. Optional features may not work.\n');
  } else {
    console.log('✅ ENVIRONMENT CHECK PASSED!\n');
    console.log('All required variables are set correctly.\n');
    console.log('Ready to deploy! 🚀\n');
  }

  process.exit(0);
}

// Run check
try {
  checkEnvironment();
} catch (error) {
  console.error('\n❌ Error checking environment:');
  console.error(error.message);
  console.error('\nMake sure .env.production file exists.\n');
  process.exit(1);
}
