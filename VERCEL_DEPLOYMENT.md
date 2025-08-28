# 🚀 Vercel Deployment Guide

## ⚠️ IMPORTANTE: Errore Environment Variables

Se vedi l'errore: **"Environment Variable 'DATABASE_URL' references Secret 'database-url', which does not exist"**

Questo significa che le variabili d'ambiente devono essere configurate SOLO nel dashboard di Vercel, non nel file `vercel.json`.

## Environment Variables Configuration

⚠️ **CRITICAL**: Environment variables must be configured ONLY in the Vercel dashboard, NOT in vercel.json!

🚨 **COMMON ERROR**: If you see `Invalid value undefined for datasource "db"`, it means DATABASE_URL is not configured in Vercel.

Configure the following environment variables in your Vercel dashboard:

### 1. Access Vercel Dashboard
- Go to [vercel.com](https://vercel.com)
- Select your project `aegis-trading-coach`
- Go to **Settings** → **Environment Variables**

### 2. Add Required Variables

#### DATABASE_URL (REQUIRED)
```
Name: DATABASE_URL
Value: postgresql://17b3f8bfadad63ae0819c2fc9faf3c0eb5cf2ba715a33f6543642f96d7050a32:sk_sDZsNRCzd3ODUzJwC9CD6@db.prisma.io:5432/postgres?sslmode=require
Environment: Production, Preview, Development
```

⚠️ **CRITICAL**: Must use `postgresql://` prefix, NOT `postgres://`!

#### NEXTAUTH_SECRET (REQUIRED)
```
Name: NEXTAUTH_SECRET
Value: your-nextauth-secret-key-here (32+ characters)
Environment: Production, Preview, Development
```

#### NEXTAUTH_URL (REQUIRED)
```
Name: NEXTAUTH_URL
Value: https://your-vercel-app-url.vercel.app
Environment: Production, Preview
```

#### NODE_ENV (AUTOMATIC)
```
Name: NODE_ENV
Value: production
Environment: Production
```

### 3. Redeploy
Dopo aver aggiunto le variabili:
1. Vai su **Deployments**
2. Clicca sui tre puntini dell'ultimo deployment
3. Seleziona **Redeploy**

## 🔧 Risoluzione Problemi

### Errore: "Invalid value undefined for datasource db"

**Causa**: La variabile `DATABASE_URL` non è configurata o non è accessibile durante il build.

**Soluzione**:
1. Vai su [vercel.com](https://vercel.com) → Il tuo progetto → **Settings** → **Environment Variables**
2. Verifica che `DATABASE_URL` sia presente e configurata per tutti gli ambienti (Production, Preview, Development)
3. Il valore deve iniziare con `postgresql://` (non `postgres://`)
4. Dopo aver aggiunto/modificato le variabili, vai su **Deployments** e fai **Redeploy**

### Come Verificare le Variabili d'Ambiente su Vercel

1. **Accedi al Dashboard Vercel**: [vercel.com](https://vercel.com)
2. **Seleziona il progetto**: `aegis-trading-coach`
3. **Vai su Settings**: Settings → Environment Variables
4. **Verifica che siano presenti**:
   - `DATABASE_URL` (con valore che inizia con `postgresql://`)
   - `NEXTAUTH_SECRET` (una stringa casuale lunga)
   - `NEXTAUTH_URL` (l'URL della tua app Vercel)

### Errore: "Invalid value undefined for datasource db" (Continuazione)
- ✅ Verifica che `DATABASE_URL` sia configurata
- ✅ Controlla che sia applicata a tutti gli environment
- ✅ Redeploy dopo aver aggiunto le variabili

### Errore: "PrismaClientConstructorValidationError"
- ✅ Assicurati che il formato della `DATABASE_URL` sia corretto
- ✅ Verifica che non ci siano spazi extra nelle variabili

### Build Timeout
- ✅ Le funzioni API hanno un timeout di 30 secondi (configurato in vercel.json)
- ✅ Il database Prisma ha timeout configurati per Vercel

## 📋 Checklist Pre-Deploy

- [ ] `DATABASE_URL` configurata su Vercel
- [ ] `NEXTAUTH_SECRET` configurata su Vercel  
- [ ] `NEXTAUTH_URL` configurata su Vercel
- [ ] File `vercel.json` presente nel repository
- [ ] Prisma schema aggiornato
- [ ] Build locale funzionante (`npm run build`)

## 🆘 Supporto

Se il problema persiste:
1. Controlla i logs di build su Vercel
2. Verifica che tutte le variabili siano visibili in **Settings** → **Environment Variables**
3. Prova un redeploy completo

---

**Nota**: Le variabili d'ambiente devono essere configurate nel dashboard di Vercel, non tramite file `.env` per i deployment di produzione.