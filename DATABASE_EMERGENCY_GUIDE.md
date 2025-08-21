# 🚨 DATABASE EMERGENCY GUIDE

## ❌ PROBLEMA CRITICO IDENTIFICATO

**Errore**: Prisma Database Plan Limit Reached
**Codice**: P6003 - planLimitReached
**Impatto**: EA disconnesso, dashboard non funzionante

```
Error [PrismaClientKnownRequestError]: Invalid `prisma.account.findMany()` invocation: 
{"type":"UnknownJsonError","body":{"code":"P6003","message":"There is a hold on your account. Reason: planLimitReached. Please contact Prisma support if you think this is an error."}}
```

## 🔥 AZIONI IMMEDIATE RICHIESTE

### 1. VERIFICA STATO ACCOUNT PRISMA

1. **Vai su [Prisma Cloud Console](https://cloud.prisma.io/)**
2. **Login con il tuo account**
3. **Controlla Dashboard > Usage & Billing**
4. **Verifica**:
   - Piano attuale (Free/Hobby/Pro)
   - Queries utilizzate questo mese
   - Data di reset del limite
   - Eventuali notifiche di billing

### 2. SOLUZIONI DISPONIBILI

#### Opzione A: Upgrade Piano Prisma ⭐ CONSIGLIATO
- **Hobby Plan**: $5/mese - 100K query requests/mese
- **Pro Plan**: $25/mese - 10M query requests/mese  
- **Upgrade immediato** → Risolve il problema in 5-10 minuti

#### Opzione B: Attesa Reset Mensile
- Il limite si resetta **il primo del mese**
- **SCONSIGLIATO**: EA rimarrà disconnesso fino ad allora

#### Opzione C: Migrazione Database (Avanzata)
- Migrazione a **PostgreSQL self-hosted**
- Richiede configurazione tecnica
- **Solo se necessario**

### 3. MONITORAGGIO SISTEMA

Abbiamo implementato una **pagina di status** per monitorare la salute:

🔗 **URL**: `https://new2dash.vercel.app/status`

**Features**:
- ✅ Stato database in tempo reale
- ✅ Controllo endpoint API
- ✅ Tempi di risposta
- ✅ Alerts automatici per plan limit
- ✅ Auto-refresh ogni 30 secondi

## 🛠️ COSA ABBIAMO GIÀ IMPLEMENTATO

### ✅ Gestione Errori Migliorata

**Endpoint protetti**:
- `/api/accounts` → Gestione graceful P6003
- `/api/ingest/mt5` → Retry automatico EA
- `/api/health` → Status check completo
- `/api/ping` → Test connettività rapido

**EA Retry Sistema**:
- ✅ Rileva errore 503 dal plan limit
- ✅ Retry automatico ogni 30 minuti
- ✅ Backoff esponenziale
- ✅ Log dettagliati per debug

### ✅ Nuovi Endpoint di Monitoring

```bash
# Test rapido server
GET /api/ping
→ {"status": "ok", "timestamp": "..."}

# Check completo salute sistema  
GET /api/health
→ {"status": "healthy|unhealthy", "database": "connected|disconnected"}

# Test EA connectivity
POST /api/ingest/mt5
Headers: X-Health-Check: true
→ {"status": "ready", "message": "Ready for MT5 data"}
```

## 📊 DASHBOARD MONITORAGGIO

### Status Page Features

**Sistema Generale**:
- 🟢 **Healthy**: Tutto funzionante
- 🟡 **Limited**: Plan limit raggiunto
- 🔴 **Down**: Database offline

**Endpoint Monitoring**:
- Response time per ogni API
- Status code tracking  
- Error details per debugging
- Auto-refresh real-time

**Alerts**:
- ⚠️ Plan limit warnings
- 🚨 Database connection errors
- 📈 Performance degradation

## 🔧 LOG DEBUGGING

### EA Logs da Cercare

**Successo**:
```
✅ Dati inviati con successo al tentativo 1
📝 Risposta: {"success":true,"message":"Trades processed successfully"}
```

**Plan Limit Error**:
```
❌ Tentativo 1 fallito - Codice HTTP: 503
🚨 Server temporaneamente non disponibile (503) - Retry in 30m
🔄 PRISMA PLAN LIMIT REACHED - EA will retry automatically!
```

**Retry Automatico**:
```
🔄 Tentativo 2/3
⏳ Aspetto 1800 secondi prima del prossimo tentativo...
```

### Server Logs da Cercare

```bash
# Errore plan limit identificato
🚨 PRISMA PLAN LIMIT REACHED - Database account suspended!

# Risposta appropriata inviata all'EA
Status: 503 Service Unavailable
Headers: Retry-After: 1800
Body: {"code": "PRISMA_PLAN_LIMIT", "ea_action": "RETRY_LATER"}
```

## ⚡ TESTING DEL FIX

### 1. Test Status Page
```bash
# Vai a https://new2dash.vercel.app/status
# Verifica che mostri "DATABASE: LIMITED" 
# Controlla che gli endpoint rispondano correttamente
```

### 2. Test EA Response
```bash
# Nel tuo EA, cerca questi log:
# - "Server temporaneamente non disponibile (503)"
# - "EA will retry automatically"  
# - Retry intervals aumentati (30m, 60m, ecc.)
```

### 3. Test API Endpoints
```bash
# Test diretto degli endpoint
curl https://new2dash.vercel.app/api/ping
curl https://new2dash.vercel.app/api/health  

# Dovrebbero rispondere anche durante plan limit
```

## 📈 PREVENZIONE FUTURA

### 1. Monitoring Continuo
- ✅ Status page implementata
- ✅ Alerts automatici implementati
- ✅ Usage tracking ready

### 2. EA Resilience  
- ✅ Retry automatico implementato
- ✅ Gestione errori graceful
- ✅ Intervalli adattivi

### 3. Piano di Contingenza
- ✅ Fallback endpoints ready
- ✅ Error handling robusto
- ✅ Status monitoring completo

## 🆘 CONTATTI EMERGENZA

**Prisma Support**: [https://www.prisma.io/support](https://www.prisma.io/support)
**Documentazione**: [https://www.prisma.io/docs](https://www.prisma.io/docs)
**Status Page**: [https://status.prisma.io/](https://status.prisma.io/)

---

## ✅ CHECKLIST RISOLUZIONE

- [ ] Verificato account Prisma Cloud
- [ ] Controllato usage e billing  
- [ ] Aggiornato piano se necessario
- [ ] Testato status page
- [ ] Verificato retry EA nei log
- [ ] Confermato riconnessione automatica

**Tempo stimato risoluzione**: 5-15 minuti con upgrade piano

🎯 **L'EA si riconnetterà automaticamente una volta risolto il problema del database!**