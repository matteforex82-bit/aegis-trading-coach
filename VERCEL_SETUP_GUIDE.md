# 🚀 Guida Completa Deploy Vercel - Aegis Trading Coach

## 📋 Prerequisiti

- Account Vercel (gratuito)
- Account GitHub con repository del progetto
- Account Stripe per i pagamenti
- Database PostgreSQL (Vercel Postgres consigliato)

---

## 🔧 STEP 1: Preparazione Locale

### 1.1 Genera Variabili d'Ambiente
```bash
# Esegui lo script di setup automatico
node scripts/setup-env.js
```

Questo script:
- ✅ Genera chiavi sicure automaticamente
- ✅ Crea il file `.env.local` 
- ✅ Configura tutti i placeholder necessari

### 1.2 Verifica Configurazione
```bash
# Testa l'app localmente
npm run dev
```

---

## 🗄️ STEP 2: Setup Database PostgreSQL

### Opzione A: Vercel Postgres (Consigliato)
```bash
# Installa Vercel CLI
npm i -g vercel

# Login a Vercel
vercel login

# Crea database Postgres
vercel postgres create aegis-trading-db
```

### Opzione B: Railway
1. Vai su [railway.app](https://railway.app)
2. Crea nuovo progetto PostgreSQL
3. Copia la connection string

### Opzione C: Supabase
1. Vai su [supabase.com](https://supabase.com)
2. Crea nuovo progetto
3. Vai in Settings > Database
4. Copia la connection string

---

## 🚀 STEP 3: Deploy su Vercel

### 3.1 Deploy Iniziale
```bash
# Deploy del progetto
vercel

# Segui le istruzioni:
# - Link to existing project? No
# - Project name: aegis-trading-coach
# - Directory: ./
# - Override settings? No
```

### 3.2 Configura Variabili d'Ambiente

Vai nel **Vercel Dashboard** > **Project Settings** > **Environment Variables**

Aggiungi TUTTE queste variabili:

#### 🔐 Database & Auth
```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

#### 💳 Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_your_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_starter_id
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_pro_id
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_id
```

#### 🔑 OAuth (Opzionale)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### 🌐 App Settings
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT_SUPPORT=true
```

---

## 🗃️ STEP 4: Setup Database Schema

### 4.1 Esegui Migrazioni
```bash
# Genera e applica schema Prisma
npx prisma db push

# Popola dati iniziali (PropFirm templates)
npx prisma db seed
```

### 4.2 Verifica Database
```bash
# Apri Prisma Studio per verificare
npx prisma studio
```

---

## 💳 STEP 5: Configurazione Stripe

### 5.1 Crea Prodotti e Prezzi
Nel **Stripe Dashboard**:

1. **Products** > **Add Product**
   - **Starter Plan**: €29/mese
   - **Professional Plan**: €79/mese  
   - **Enterprise Plan**: €199/mese

2. Copia i **Price IDs** e aggiungili alle env vars Vercel

### 5.2 Setup Webhooks
1. **Developers** > **Webhooks** > **Add endpoint**
2. **URL**: `https://your-app.vercel.app/api/webhooks/stripe`
3. **Events**: 
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. Copia il **Webhook Secret** nelle env vars

---

## 🔐 STEP 6: OAuth Setup (Opzionale)

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** > **Credentials**
3. **Create OAuth 2.0 Client ID**
4. **Authorized redirect URIs**: 
   - `https://your-app.vercel.app/api/auth/callback/google`

### GitHub OAuth
1. [GitHub Developer Settings](https://github.com/settings/developers)
2. **New OAuth App**
3. **Authorization callback URL**: 
   - `https://your-app.vercel.app/api/auth/callback/github`

---

## 🎯 STEP 7: Deploy Finale e Test

### 7.1 Redeploy con Tutte le Configurazioni
```bash
# Redeploy per applicare tutte le env vars
vercel --prod
```

### 7.2 Test Completo
Testa queste funzionalità:

- ✅ **Registrazione/Login** utenti
- ✅ **Dashboard** caricamento dati
- ✅ **Stripe Billing** subscription flow
- ✅ **Database** connessione e queries
- ✅ **API Endpoints** funzionamento
- ✅ **Import Excel** upload file
- ✅ **Real-time Updates** WebSocket

---

## 🔧 STEP 8: Configurazioni Avanzate

### 8.1 Custom Domain (Opzionale)
1. **Vercel Dashboard** > **Domains**
2. Aggiungi il tuo dominio
3. Configura DNS records
4. Aggiorna `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL`

### 8.2 Analytics e Monitoring
```bash
# Abilita Vercel Analytics
npm i @vercel/analytics

# Abilita Vercel Speed Insights  
npm i @vercel/speed-insights
```

### 8.3 Cron Jobs per Cleanup
Il file `vercel.json` include già:
- **Cleanup giornaliero** alle 2:00 AM
- **Timeout ottimizzati** per API pesanti

---

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test connessione database
npx prisma db pull
```

### Stripe Webhook Issues
- Verifica URL webhook in Stripe Dashboard
- Controlla logs in Vercel Functions tab
- Testa webhook con Stripe CLI

### Environment Variables
- Assicurati che TUTTE le env vars siano settate
- Redeploy dopo ogni modifica env vars
- Usa `vercel env ls` per verificare

### Build Errors
```bash
# Pulisci cache e rebuilda
rm -rf .next node_modules
npm install
npm run build
```

---

## 📊 Monitoring Post-Deploy

### Vercel Dashboard
- **Functions**: Monitor API performance
- **Analytics**: Track user behavior  
- **Speed Insights**: Monitor Core Web Vitals
- **Logs**: Debug issues in real-time

### Database Monitoring
- **Prisma Pulse**: Real-time database events
- **Connection pooling**: Monitor active connections
- **Query performance**: Optimize slow queries

---

## 🎉 Deploy Completato!

Il tuo **Aegis Trading Coach** è ora live su Vercel con:

- ✅ **Database PostgreSQL** configurato
- ✅ **Autenticazione** funzionante
- ✅ **Stripe Billing** attivo
- ✅ **API** ottimizzate
- ✅ **Real-time Updates** abilitati
- ✅ **Mobile Responsive** design
- ✅ **SEO Optimized** con metadata

**URL Produzione**: `https://your-app.vercel.app`

---

## 📞 Supporto

Per problemi di deploy:
1. Controlla **Vercel Logs** nel dashboard
2. Verifica **Environment Variables**
3. Testa **Database Connection**
4. Controlla **Stripe Configuration**

**Happy Trading! 📈**