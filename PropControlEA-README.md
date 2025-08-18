# 🚀 PROP CONTROL EXPERT ADVISOR

**Expert Advisor completo per MetaTrader 5 che sincronizza automaticamente i dati del tuo account prop firm con la dashboard PROP CONTROL.**

---

## 📋 CARATTERISTICHE PRINCIPALI

### 🔄 **SINCRONIZZAZIONE COMPLETA**
- **Storico Completo**: Al primo avvio, invia tutte le operazioni chiuse dell'account
- **Monitoraggio Live**: Traccia equity, drawdown e P&L in tempo reale
- **Sync Automatico**: Invio dati ogni 30 secondi (configurabile)
- **Sync su Trade**: Invio immediato alla chiusura di ogni operazione

### 📊 **RULE MONITORING**
- **Violazioni Real-time**: Calcolo automatico violazioni regole prop firm
- **Alert Sistema**: Notifiche immediate su violazioni regole
- **Multiple Rules**: Daily loss, max drawdown, profit target, total loss
- **Phase Tracking**: Tracciamento fase challenge (DEMO/PHASE_1/PHASE_2/FUNDED)

### 🎯 **PROP FIRM SUPPORT**
- **FTMO, MyForexFunds, TFT**: Supporto per le principali prop firm
- **Regole Configurabili**: Tutti i limiti personalizzabili
- **Target Tracking**: Monitoraggio automatico profit target
- **Drawdown Monitoring**: Calcolo drawdown in tempo reale

---

## ⚙️ INSTALLAZIONE

### 1. **DOWNLOAD EA**
1. Scarica il file `PropControlEA.mq5`
2. Copia nella cartella: `MQL5/Experts/` del tuo MetaTrader 5

### 2. **COMPILAZIONE**
1. Apri MetaEditor (F4 in MT5)
2. Apri il file `PropControlEA.mq5`
3. Clicca **Compile** (F7)
4. Verifica che non ci siano errori

### 3. **CONFIGURAZIONE**
1. Trascina l'EA sul grafico
2. Configura i parametri (vedi sezione sotto)
3. Abilita **Allow WebRequest** nelle impostazioni MT5

---

## 🔧 CONFIGURAZIONE PARAMETRI

### **📡 API CONFIGURATION**
```mq5
API_URL = "https://tuo-domain.vercel.app/api/ingest/mt5"  // URL della tua dashboard
API_KEY = ""                                             // API Key (opzionale)
TIMEOUT_MS = 10000                                       // Timeout richieste
ENABLE_SSL = true                                        // Abilita HTTPS
```

### **🔄 SYNC CONFIGURATION**
```mq5
SYNC_HISTORICAL = true                                   // Sync storico al primo avvio
SYNC_INTERVAL = 30                                       // Intervallo sync (secondi)
MAX_TRADES_PER_REQUEST = 100                             // Max trades per richiesta
SYNC_ON_TRADE_CLOSE = true                               // Sync immediato su chiusura
```

### **🏢 PROP FIRM RULES**
```mq5
PROP_FIRM_NAME = "FTMO"                                  // Nome prop firm
ACCOUNT_PHASE = "PHASE_1"                                // Fase challenge
START_BALANCE = 100000.0                                 // Balance iniziale ($)
PROFIT_TARGET = 8000.0                                   // Target profitto ($)
MAX_DAILY_LOSS = 5000.0                                  // Max perdita giornaliera ($)
MAX_TOTAL_LOSS = 10000.0                                 // Max perdita totale ($)
MAX_DRAWDOWN_PERCENT = 10.0                              // Max drawdown (%)
MIN_TRADING_DAYS = 5                                     // Min giorni trading
```

### **📊 MONITORING**
```mq5
ENABLE_RULE_ALERTS = true                                // Alert violazioni
ENABLE_EQUITY_MONITORING = true                          // Monitor equity
ENABLE_DETAILED_LOGGING = true                           // Log dettagliati
SHOW_DASHBOARD_INFO = true                               // Info su grafico
```

---

## 🎯 CONFIGURAZIONI PER PROP FIRM

### **FTMO**
```mq5
PROP_FIRM_NAME = "FTMO"
ACCOUNT_PHASE = "PHASE_1"           // o "PHASE_2" o "FUNDED"
START_BALANCE = 100000.0            // $100k, $200k, etc.
PROFIT_TARGET = 8000.0              // 8% per Phase 1
MAX_DAILY_LOSS = 5000.0             // 5% daily loss
MAX_TOTAL_LOSS = 10000.0            // 10% max loss
MAX_DRAWDOWN_PERCENT = 10.0         // 10% max drawdown
MIN_TRADING_DAYS = 4                // 4 giorni minimi
```

### **MyForexFunds (MFF)**
```mq5
PROP_FIRM_NAME = "MyForexFunds"
ACCOUNT_PHASE = "PHASE_1"
START_BALANCE = 100000.0
PROFIT_TARGET = 8000.0              // 8% target
MAX_DAILY_LOSS = 5000.0             // 5% daily
MAX_TOTAL_LOSS = 12000.0            // 12% max loss
MAX_DRAWDOWN_PERCENT = 12.0         // 12% drawdown
MIN_TRADING_DAYS = 5
```

### **The Funded Trader (TFT)**
```mq5
PROP_FIRM_NAME = "The Funded Trader"
ACCOUNT_PHASE = "PHASE_1"
START_BALANCE = 100000.0
PROFIT_TARGET = 8000.0              // 8% target
MAX_DAILY_LOSS = 4000.0             // 4% daily loss
MAX_TOTAL_LOSS = 8000.0             // 8% max loss
MAX_DRAWDOWN_PERCENT = 8.0          // 8% drawdown
MIN_TRADING_DAYS = 5
```

---

## 📊 DATI INVIATI ALLA DASHBOARD

### **ACCOUNT INFO**
- Login, Nome, Broker, Server
- Prop Firm, Fase Challenge
- Balance iniziale e corrente
- Regole e limiti configurati

### **TRADE DATA**
- Ticket, Symbol, Side, Volume
- Prezzi apertura/chiusura
- P&L, Commission, Swap
- **Equity al momento del trade**
- **Drawdown al momento del trade**
- **P&L giornaliero al momento**
- **Fase challenge durante trade**
- **Violazioni regole**

### **LIVE METRICS**
- Equity corrente
- Drawdown real-time
- P&L giornaliero
- P&L totale
- Giorni di trading
- Violazioni attive

---

## 🚨 SISTEMA ALERT

### **VIOLAZIONI TRACCIATE**
- **Daily Loss**: Perdita giornaliera > limite
- **Max Loss**: Perdita totale > limite
- **Max Drawdown**: Drawdown > percentuale limite
- **Profit Target**: Target raggiunto

### **TIPI DI ALERT**
- **Console Log**: Tutti gli eventi loggati
- **MT5 Alert**: Popup alert su violazioni
- **Dashboard**: Notifiche real-time nella dashboard
- **Grafico**: Info display sul grafico

---

## 🔧 TROUBLESHOOTING

### **❌ "Impossibile connettersi all'API"**
1. Verifica URL API corretto
2. Controlla connessione internet
3. Abilita WebRequest in MT5: Strumenti → Opzioni → Expert Advisors → Allow WebRequest per il tuo URL

### **❌ "Errore invio dati - Codice: 400"**
1. Verifica formato dati JSON
2. Controlla parametri configurazione
3. Verifica che il database sia online

### **❌ "Nessun dato storico sincronizzato"**
1. Controlla che `SYNC_HISTORICAL = true`
2. Verifica che ci siano trades nello storico
3. Controlla log per errori specifici

### **⚠️ Performance Issues**
1. Aumenta `SYNC_INTERVAL` se troppo frequente
2. Riduci `MAX_TRADES_PER_REQUEST` per batch più piccoli
3. Disabilita `ENABLE_DETAILED_LOGGING` in produzione

---

## 📈 MONITORAGGIO PERFORMANCE

### **LOG MESSAGGI**
```
🚀 PROP CONTROL EA inizializzato
📊 Trovati 150 deals nello storico
✅ Sincronizzazione storico completata
🔄 Nuovo trade rilevato: 123456
🚨 VIOLAZIONE: Perdita giornaliera massima superata!
🎉 TARGET RAGGIUNTO: Profit target completato!
```

### **DASHBOARD INFO**
Sul grafico appare:
```
PROP CONTROL - FTMO [PHASE_1]
Equity: $98,500.00 | P&L: $-1,500.00
Drawdown: 1.50% | Daily: $-500.00
🚨 VIOLAZIONI ATTIVE
```

---

## 🔐 SICUREZZA

### **BEST PRACTICES**
1. **API Key**: Usa sempre API key per autenticazione
2. **HTTPS**: Mantieni `ENABLE_SSL = true`
3. **Timeout**: Non impostare timeout troppo alti
4. **Rate Limiting**: Rispetta i limiti di richieste API

### **DATI SENSIBILI**
- L'EA **NON** invia password o dati sensibili
- Solo dati di trading e metriche pubbliche
- Comunicazione crittografata via HTTPS

---

## 📞 SUPPORTO

### **LOG ANALYSIS**
Per supporto, fornisci sempre:
1. Log completo dell'EA dalla tab Experts
2. Configurazione parametri utilizzata
3. Versione MT5 e build
4. Tipo di account (demo/live)

### **AGGIORNAMENTI**
Scarica sempre l'ultima versione da:
- Dashboard PROP CONTROL
- Repository GitHub ufficiale

---

**🎯 Buon Trading con PROP CONTROL!**