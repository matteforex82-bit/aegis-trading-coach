# PROP CONTROL - Piano Multi-Account

## 🎯 OBIETTIVO
Permettere a un utente di gestire facilmente multiple accounts MT5 con:
- Aggiunta/rimozione account agevole
- Dashboard centralizzata multi-account  
- Expert Advisor configurabile per ogni account
- Scalabilità illimitata

## 📋 FASE 1: User Authentication & Management

### Backend Changes Needed:
1. **User Authentication System**
   ```typescript
   // src/app/api/auth/[...nextauth]/route.ts
   - Implementare NextAuth.js
   - Google/Email login
   - JWT tokens
   ```

2. **User Dashboard API**  
   ```typescript
   // src/app/api/users/[userId]/accounts/route.ts
   GET  → Lista tutti gli account dell'utente
   POST → Aggiungi nuovo account
   ```

3. **Account Management API**
   ```typescript  
   // src/app/api/accounts/[accountId]/route.ts
   PUT    → Aggiorna config account
   DELETE → Rimuovi account
   ```

### Frontend Changes:
1. **Login Page** (`/login`)
2. **Account Selector** (sidebar migliorata)
3. **Account Settings** (`/accounts/manage`)

## 📋 FASE 2: Multi-Account Dashboard

### Features:
- **Account Overview**: Cards con summary di ogni account
- **Unified View**: P&L aggregato di tutti gli account  
- **Account Switching**: Click per cambiare focus
- **Bulk Operations**: Confronta performance tra accounts

### Database Schema Addition:
```sql
-- User API Keys per autenticazione EA
CREATE TABLE user_api_keys (
  id        STRING PRIMARY KEY,
  user_id   STRING NOT NULL,
  api_key   STRING UNIQUE NOT NULL,
  name      STRING,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 📋 FASE 3: Expert Advisor Multi-Account

### Opzione A: UN EA PER ACCOUNT (Raccomandato)
**Vantaggi:**
- ✅ Isolamento completo tra account
- ✅ Configurazione indipendente
- ✅ Failure isolation (se uno fallisce, altri continuano)
- ✅ Performance ottimale

**Setup Process:**
1. User genera API Key nella dashboard
2. User scarica EA configurato con API Key  
3. User allega EA su ogni account MT5 desiderato
4. EA auto-rileva login e inizia sync

### Opzione B: UN EA MULTI-ACCOUNT
**Vantaggi:**  
- ✅ Un solo EA da gestire
- ✅ Gestione centralizzata

**Svantaggi:**
- ❌ Complessità maggiore
- ❌ Single point of failure
- ❌ Performance impact

## 📋 FASE 4: Advanced Features

### Account Management:
- **Auto-Detection**: EA rileva automaticamente login account
- **Bulk Import**: Importa storico di tutti gli account
- **Account Grouping**: Raggruppa per Prop Firm
- **Custom Names**: Rinomina account per facilità

### Monitoring:
- **Connection Status**: Stato connessione EA per ogni account
- **Sync Health**: Ultimo sync, errori, performance
- **Alerts**: Notifiche per disconnessioni o violazioni regole

## 🔧 IMPLEMENTAZIONE TECNICA

### 1. User API Keys System:
```typescript
// Genera API key unica per utente
const apiKey = `pk_${userId}_${randomString(32)}`;

// EA configuration auto-generated
const eaConfig = `
input string API_KEY = "${apiKey}";
input string USER_ID = "${userId}";
input bool AUTO_DETECT_ACCOUNT = true;
`;
```

### 2. Multi-Account EA Logic:
```mql5
// In OnInit()
if(AUTO_DETECT_ACCOUNT) {
    string currentLogin = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
    // Auto-register questo account per l'utente
    RegisterAccountWithAPI(currentLogin, API_KEY);
}
```

### 3. Dashboard Account Switcher:
```typescript
// Sidebar con tutti gli account dell'utente
const accounts = await fetch(`/api/users/${userId}/accounts`);

// Click per cambiare account attivo
const switchAccount = (accountId: string) => {
    setSelectedAccount(accountId);
    // Refresh metrics and trades
};
```

## 🎚️ LIMITI E CONSIDERAZIONI

### Limiti Tecnici:
- **MT5 Connections**: Nessun limite client-side
- **Database**: PostgreSQL scala facilmente a milioni di records  
- **API Rate Limits**: Implementare throttling per protezione
- **Vercel**: Funzioni serverless scale automaticamente

### Limiti Pratici:
- **EA per Account**: 1 EA per account MT5 (raccomandato)
- **Accounts per User**: Nessun limite hard, ma UI optimized per ~10-20
- **Concurrent Sync**: Database handles concurrent writes

### Performance Optimization:
- **Database Indexing**: Index su accountId, userId, timestamps
- **API Caching**: Cache metrics per 30 secondi  
- **Background Jobs**: Batch processing per heavy operations

## 📊 STIMA SVILUPPO

### Tempi Sviluppo:
- **Fase 1** (User Auth): 2-3 ore
- **Fase 2** (Multi Dashboard): 3-4 ore  
- **Fase 3** (EA Multi-Account): 2-3 ore
- **Fase 4** (Advanced Features): 4-6 ore

**TOTALE: ~12-16 ore** per sistema completo multi-account

### Priorità:
1. 🔥 **HIGH**: User authentication + API keys
2. 🔥 **HIGH**: Multi-account dashboard  
3. 🔶 **MEDIUM**: EA auto-configuration
4. 🔷 **LOW**: Advanced monitoring features

## 🚀 QUICK START (Minimal Viable)

Per implementazione rapida (2-3 ore):
1. Aggiungi login semplice (email/password)
2. API key generation per utente
3. EA configuration con API key
4. Dashboard account selector migliorato

Questo da subito supporto multi-account manuale senza grandi cambiamenti architetturali.