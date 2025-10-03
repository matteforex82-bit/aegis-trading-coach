# 🚀 GUIDA RAPIDA - Setup AEGIS Trading Coach

> Guida per chi sta creando la **prima app**. Tutto quello che devi fare, passo-passo!

---

## ✅ STEP 1: Configurare .env.local (OBBLIGATORIO)

Il file `.env.local` contiene le configurazioni della tua app. Devi sostituire i placeholder con valori reali.

### 🔐 Secret Già Generati

Ho generato automaticamente i secret. **Apri il file `.env.local`** e sostituisci:

```env
# Sostituisci questa riga:
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Con:
NEXTAUTH_SECRET="QYvDZbsTUt/KjXzGZXQ0MMHB0RbMC6AA32c7FufsmQ0="

# E questa:
FINNHUB_WEBHOOK_SECRET="your-generated-webhook-secret"

# Con:
FINNHUB_WEBHOOK_SECRET="43b4757add76377b8ebe90edc725cc213be64798f0f50748"
```

### 🗄️ DATABASE_URL (OBBLIGATORIO)

**Devi avere un database PostgreSQL.** Scegli una di queste opzioni:

#### Opzione A: Vercel Postgres (Gratuito, Consigliato)

1. Vai su https://vercel.com e crea account (gratis)
2. Crea nuovo progetto: "Add New" → "Project"
3. Vai su "Storage" → "Create Database" → "Postgres"
4. Copia la "POSTGRES_URL" che ti danno
5. Incollala nel `.env.local`:
   ```env
   DATABASE_URL="postgresql://default:abc123@ep-cool-name.us-east-1.postgres.vercel-storage.com:5432/verceldb"
   ```

#### Opzione B: Supabase (Gratuito, Facile)

1. Vai su https://supabase.com e crea account
2. "New Project" → Scegli nome e password
3. Vai in "Settings" → "Database" → "Connection String"
4. Copia la "URI" e sostituisci `[YOUR-PASSWORD]` con la tua password
5. Incollala nel `.env.local`

#### Opzione C: Database Locale (Solo Test)

```bash
# 1. Installa PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Durante installazione, ricorda la password che scegli!

# 2. Dopo installazione, usa:
DATABASE_URL="postgresql://postgres:TUA_PASSWORD@localhost:5432/aegis_trading"
```

---

## 🎯 STEP 2: Inizializzare il Database

Una volta configurato `DATABASE_URL`, esegui:

```bash
cd "c:\Users\matte\Downloads\NEW AEGIS CALUDE CODE\aegis-trading-coach"

# Crea le tabelle nel database
npx prisma db push

# (Opzionale) Inserisci dati demo
npx prisma db seed
```

Se vedi "✅ Database created successfully", sei pronto!

---

## 🏃 STEP 3: Avviare l'App in Locale

```bash
npm run dev
```

Dovresti vedere:
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

Apri il browser su **http://localhost:3000** 🎉

---

## 🔑 STEP 4: Creare il Primo Account

1. Vai su http://localhost:3000/auth/signup
2. Registrati con email e password
3. Login su http://localhost:3000/auth/signin
4. Accedi al dashboard!

---

## 💳 STEP 5 (OPZIONALE): Configurare Stripe

Se vuoi testare i pagamenti:

1. Crea account su https://stripe.com
2. Vai in "Developers" → "API Keys"
3. Copia "Secret key" e "Publishable key" (usa le chiavi TEST)
4. Aggiungi a `.env.local`:
   ```env
   STRIPE_SECRET_KEY="sk_test_51..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51..."
   ```

5. Crea prodotti subscription in Stripe Dashboard
6. Copia i "Price ID" nel `.env.local`

**Non obbligatorio per testare l'app!**

---

## 🚀 STEP 6: Deploy su Vercel (Quando sei pronto)

```bash
# Installa Vercel CLI (se non l'hai)
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Vercel ti chiederà di collegare il database e configurare le variabili d'ambiente.

---

## 🆘 TROUBLESHOOTING

### Errore "DATABASE_URL is not set"
→ Hai dimenticato di configurare DATABASE_URL in `.env.local`

### Errore "Port 3000 already in use"
→ Chiudi altre app sulla porta 3000, o usa: `PORT=3001 npm run dev`

### Build fallisce
→ Assicurati di aver eseguito `npm install` prima

### Database connection error
→ Verifica che il DATABASE_URL sia corretto e il database sia raggiungibile

---

## 📚 File Importanti

| File | Cosa fa |
|------|---------|
| `.env.local` | Configurazioni segrete (NON committare su GitHub!) |
| `package.json` | Dipendenze del progetto |
| `prisma/schema.prisma` | Schema del database |
| `src/app/` | Pagine e API routes |
| `next.config.ts` | Configurazione Next.js |

---

## 🎓 Prossimi Passi

Una volta che l'app funziona:

1. ✅ Esplora il dashboard
2. ✅ Crea un account trading di test
3. ✅ Importa dati da MT5 (se hai un account MetaTrader)
4. ✅ Testa le funzionalità PropFirm rules
5. ✅ Configura Stripe per subscription (opzionale)

---

## 💬 Hai Bisogno di Aiuto?

Se qualcosa non funziona, dimmi:
- Quale step stai facendo
- Che errore vedi (copia l'errore completo)
- Sistema operativo (Windows/Mac/Linux)

Sono qui per aiutarti! 🚀
