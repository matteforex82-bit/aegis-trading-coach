# 🔐 GUIDA CONFIGURAZIONE ADMIN - AEGIS TRADING COACH

## 🚀 PUSH GITHUB COMPLETATO ✅

Le modifiche sono state caricate su GitHub con successo! 
Repository aggiornato con tutte le configurazioni di produzione.

---

## 👨‍💼 CONFIGURAZIONE ACCESSO AMMINISTRATORE

### 📋 Metodo 1: Creazione Admin Automatica (RACCOMANDATO)

#### 1️⃣ Esegui lo Script di Creazione Admin
```bash
# Nel terminale del progetto
npx tsx scripts/create-admin.ts
```

#### 2️⃣ Credenziali Default Generate
Lo script creerà automaticamente un admin con:
- **📧 Email**: `admin@dashboard.com`
- **🔑 Password**: `Admin123!`
- **👤 Nome**: `Administrator`
- **🛡️ Ruolo**: `ADMIN` (accesso completo)

#### 3️⃣ Login nell'Applicazione
1. Vai su http://localhost:3000/auth/signin
2. Usa le credenziali generate
3. **IMPORTANTE**: Cambia la password dopo il primo accesso!

---

### 📋 Metodo 2: Creazione Admin Personalizzata

#### 1️⃣ Con Variabili d'Ambiente Personalizzate
```bash
# Imposta le tue credenziali
$env:ADMIN_EMAIL="tuaemail@example.com"
$env:ADMIN_PASSWORD="TuaPasswordSicura123!"
$env:ADMIN_NAME="Il Tuo Nome"

# Esegui lo script
npx tsx scripts/create-admin.ts
```

#### 2️⃣ Modifica Diretta dello Script
Puoi modificare direttamente il file `scripts/create-admin.ts`:
```typescript
// Linee 8-10
const adminEmail = 'tuaemail@example.com'
const adminPassword = 'TuaPasswordSicura123!'
const adminName = 'Il Tuo Nome'
```

---

### 📋 Metodo 3: Promozione Utente Esistente

Se hai già un account utente normale:

#### 1️⃣ Modifica Database Direttamente
```bash
# Apri Prisma Studio
npx prisma studio
```

#### 2️⃣ Trova il Tuo Utente
- Vai su http://localhost:5555
- Apri la tabella `User`
- Trova il tuo account

#### 3️⃣ Cambia il Ruolo
- Modifica il campo `role` da `USER` a `ADMIN`
- Salva le modifiche

---

## 🛡️ PRIVILEGI AMMINISTRATORE

### ✅ Accesso Completo A:
- **👥 Gestione Utenti**: Visualizza, modifica, elimina tutti gli utenti
- **💳 Gestione Abbonamenti**: Controllo completo su tutti i piani
- **📊 Analytics Avanzate**: Statistiche complete della piattaforma
- **⚙️ Configurazioni Sistema**: Accesso a tutte le impostazioni
- **🔧 API Admin**: Endpoint `/api/admin/*` sbloccati
- **📈 Metriche Dettagliate**: Performance e utilizzo sistema

### 🚫 Limitazioni Rimosse:
- **Nessun limite** su account trading
- **Nessun limite** su import Excel
- **Nessun limite** su calcoli PropFirm
- **Accesso completo** a tutte le funzionalità premium

---

## 🔍 VERIFICA ACCESSO ADMIN

### 1️⃣ Test Login
```bash
# Assicurati che il server sia attivo
npm run dev
```

### 2️⃣ Controlla Ruolo
Dopo il login, verifica che nell'interfaccia appaia:
- Menu "Admin" nella navigazione
- Badge "Administrator" nel profilo
- Accesso alle sezioni admin

### 3️⃣ Test API Admin
```bash
# Test endpoint admin (sostituisci con il tuo token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/stats
```

---

## 🚨 SICUREZZA IMPORTANTE

### ⚠️ DOPO IL PRIMO ACCESSO:
1. **Cambia immediatamente la password**
2. **Abilita 2FA se disponibile**
3. **Non condividere le credenziali admin**
4. **Usa email sicura per l'admin**

### 🔐 Password Sicura:
- Minimo 12 caratteri
- Maiuscole, minuscole, numeri, simboli
- Non usare informazioni personali
- Cambiala regolarmente

---

## 🛠️ TROUBLESHOOTING

### ❌ Errore "User already exists"
```bash
# L'utente esiste già, prova a promuoverlo
npx prisma studio
# Cambia manualmente il ruolo a ADMIN
```

### ❌ Errore Database Connection
```bash
# Verifica che il database sia attivo
npx prisma db push
```

### ❌ Script Non Funziona
```bash
# Installa le dipendenze mancanti
npm install tsx bcryptjs @types/bcryptjs
```

### ❌ Non Vedo Menu Admin
- Fai logout e login di nuovo
- Controlla che il ruolo sia effettivamente `ADMIN`
- Verifica in Prisma Studio

---

## 🎯 PROSSIMI PASSI DOPO SETUP ADMIN

### 1️⃣ Configurazione Iniziale
- [ ] Login come admin
- [ ] Cambia password
- [ ] Configura impostazioni sistema
- [ ] Verifica connessioni API

### 2️⃣ Test Funzionalità
- [ ] Test import Excel
- [ ] Test calcoli PropFirm
- [ ] Test gestione utenti
- [ ] Test Stripe integration

### 3️⃣ Deploy Produzione
- [ ] Deploy su Vercel
- [ ] Configura environment variables
- [ ] Test in produzione
- [ ] Crea admin in produzione

---

## 📞 SUPPORTO

Se hai problemi con la configurazione admin:
1. Controlla i log del server (`npm run dev`)
2. Verifica Prisma Studio (http://localhost:5555)
3. Controlla il database con `npx prisma db push`

**Il tuo progetto è pronto per il lancio! 🚀**

---
*Guida generata automaticamente - Aegis Trading Coach Admin Setup*