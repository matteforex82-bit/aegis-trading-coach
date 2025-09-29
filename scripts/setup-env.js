#!/usr/bin/env node

/**
 * AEGIS TRADING COACH - Environment Setup Script
 * 
 * This script helps you generate secure environment variables
 * and creates a .env.local file from .env.example
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateRandomString(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

async function setupEnvironment() {
  log('\n🚀 AEGIS TRADING COACH - Environment Setup', 'bright');
  log('=' .repeat(50), 'cyan');

  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    log('❌ .env.example file not found!', 'red');
    process.exit(1);
  }

  // Read .env.example
  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  log('\n🔐 Generating secure keys...', 'yellow');

  // Generate secure values
  const secureValues = {
    'your-nextauth-secret-here': generateSecureKey(32),
    'your-google-client-id': `google_client_${generateRandomString(16)}`,
    'your-google-client-secret': generateSecureKey(24),
    'your-github-client-id': `github_client_${generateRandomString(16)}`,
    'your-github-client-secret': generateSecureKey(24),
    'whsec_your_webhook_secret_here': `whsec_${generateSecureKey(24)}`,
    'your-finnhub-api-key': generateRandomString(32)
  };

  // Replace placeholder values with generated ones
  Object.entries(secureValues).forEach(([placeholder, value]) => {
    envContent = envContent.replace(new RegExp(placeholder, 'g'), value);
  });

  // Update URLs for development
  envContent = envContent.replace(
    'NEXTAUTH_URL="http://localhost:3000"',
    'NEXTAUTH_URL="http://localhost:3000"'
  );
  
  envContent = envContent.replace(
    'NEXT_PUBLIC_APP_URL="http://localhost:3000"',
    'NEXT_PUBLIC_APP_URL="http://localhost:3000"'
  );

  // Write .env.local
  fs.writeFileSync(envLocalPath, envContent);

  log('✅ Generated secure keys:', 'green');
  log(`   • NEXTAUTH_SECRET: ${secureValues['your-nextauth-secret-here'].substring(0, 20)}...`, 'cyan');
  log(`   • STRIPE_WEBHOOK_SECRET: ${secureValues['whsec_your_webhook_secret_here'].substring(0, 20)}...`, 'cyan');
  log(`   • FINNHUB_API_KEY: ${secureValues['your-finnhub-api-key'].substring(0, 20)}...`, 'cyan');

  log('\n📝 .env.local file created successfully!', 'green');
  
  log('\n⚠️  IMPORTANT NEXT STEPS:', 'yellow');
  log('1. 🗄️  Set up your PostgreSQL database:', 'bright');
  log('   • Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres', 'cyan');
  log('   • Railway: https://railway.app/', 'cyan');
  log('   • Supabase: https://supabase.com/', 'cyan');
  
  log('\n2. 💳 Configure Stripe (for billing):', 'bright');
  log('   • Get keys from: https://dashboard.stripe.com/apikeys', 'cyan');
  log('   • Create products/prices in Stripe Dashboard', 'cyan');
  log('   • Update STRIPE_* variables in .env.local', 'cyan');
  
  log('\n3. 🔐 Set up OAuth providers (optional):', 'bright');
  log('   • Google: https://console.cloud.google.com/', 'cyan');
  log('   • GitHub: https://github.com/settings/developers', 'cyan');
  
  log('\n4. 🚀 Deploy to Vercel:', 'bright');
  log('   • Run: npx vercel', 'cyan');
  log('   • Add environment variables in Vercel dashboard', 'cyan');
  
  log('\n🎉 Setup complete! Run "npm run dev" to start development.', 'green');
  log('=' .repeat(50), 'cyan');
}

// Run setup
setupEnvironment().catch(error => {
  log(`❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});