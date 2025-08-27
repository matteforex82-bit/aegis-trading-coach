# 🚀 Vercel Deployment Guide

## Configurazione Variabili d'Ambiente

Per risolvere l'errore di build `Invalid value undefined for datasource "db"`, devi configurare le seguenti variabili d'ambiente nel dashboard di Vercel:

### 1. Accedi al Dashboard Vercel
- Vai su [vercel.com](https://vercel.com)
- Seleziona il tuo progetto `aegis-trading-coach`
- Vai su **Settings** → **Environment Variables**

### 2. Aggiungi le Variabili Richieste

#### DATABASE_URL (OBBLIGATORIO)
```
Nome: DATABASE_URL
Valore: postgres://17b3f8bfadad63ae0819c2fc9faf3c0eb5cf2ba715a33f6543642f96d7050a32:sk_sDZsNRCzd3ODUzJwC9CD6@db.prisma.io:5432/postgres?sslmode=require
Environment: Production, Preview, Development
```

#### NEXTAUTH_SECRET (OBBLIGATORIO)
```
Nome: NEXTAUTH_SECRET
Valore: your-nextauth-secret-key-here
Environment: Production, Preview, Development
```

#### NEXTAUTH_URL (OBBLIGATORIO)
```
Nome: NEXTAUTH_URL
Valore: https://your-vercel-app-url.vercel.app
Environment: Production, Preview
```

#### NODE_ENV (AUTOMATICO)
```
Nome: NODE_ENV
Valore: production
Environment: Production
```

### 3. Redeploy
Dopo aver aggiunto le variabili:
1. Vai su **Deployments**
2. Clicca sui tre puntini dell'ultimo deployment
3. Seleziona **Redeploy**

## 🔧 Risoluzione Problemi

### Errore: "Invalid value undefined for datasource db"
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