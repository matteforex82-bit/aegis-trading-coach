#!/usr/bin/env node

// Script per generare i secret necessari per .env.local

const crypto = require('crypto');

console.log('🔐 GENERAZIONE SECRET PER AEGIS TRADING COACH\n');
console.log('='.repeat(60));
console.log('\nCopia questi valori nel tuo file .env.local:\n');

// 1. NextAuth Secret
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('# NextAuth Secret (per JWT encryption)');
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);
console.log();

// 2. Finnhub Webhook Secret
const finnhubSecret = crypto.randomBytes(24).toString('hex');
console.log('# Finnhub Webhook Secret');
console.log(`FINNHUB_WEBHOOK_SECRET="${finnhubSecret}"`);
console.log();

console.log('='.repeat(60));
console.log('\n✅ Secret generati con successo!\n');
console.log('📋 PROSSIMI PASSI:\n');
console.log('1. Copia i secret sopra nel file .env.local');
console.log('2. Configura DATABASE_URL con la tua connection string PostgreSQL');
console.log('3. (Opzionale) Aggiungi le chiavi Stripe per pagamenti');
console.log('4. Esegui: npm run dev per avviare il server\n');
