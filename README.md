# PROP CONTROL - Dashboard per Prop Firm

Una moderna web application per il monitoraggio e l'analisi delle performance di trading account prop firm, con integrazione diretta con MetaTrader 5.

## 🚀 Caratteristiche

- **Dashboard Moderna**: Interfaccia intuitiva con metriche chiave in tempo reale
- **Integrazione MT5**: EA per MetaTrader 5 che esporta automaticamente i dati
- **Metriche Prop Firm**: Calcolo automatico di drawdown, win rate, perdite giornaliere
- **Multi-Account**: Supporto per più account prop firm
- **Reattivo**: Design ottimizzato per desktop e mobile
- **Deploy Semplice**: Frontend e backend su Vercel

## 🛠 Stack Tecnologico

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Prisma + SQLite
- **Database**: SQLite (perfetto per MVP, facile da deployare)
- **Deploy**: Vercel

## 📊 Metriche Calcolate

### Metriche Principali
- **P&L Totale**: Profitti e perdite complessivi
- **Win Rate**: Percentuale di operazioni vincenti
- **Drawdown Corrente**: Drawdown attuale del conto
- **Volume Totale**: Volume totale scambiato

### Analisi Dettagliata
- **Analisi Drawdown**: Monitoraggio del rischio e drawdown massimo
- **Analisi Perdite**: Massime perdite giornaliere e cumulative
- **Analisi Volume**: Statistiche sul volume e costi di transazione

## 🏗️ Struttura Database

```
Users (Utenti)
├── Accounts (Account Prop Firm)
    ├── Trades (Operazioni di Trading)
    └── Metrics (Metriche Calcolate)
```

## ⚙️ Setup

### 1. Configurazione Backend

```bash
# Installa dipendenze
npm install

# Configura database
npm run db:push

# Avvia sviluppo
npm run dev
```

### 2. Configurazione MT5 EA

Copia l'EA `PropControlExporter.mq5` nella cartella `MQL5/Experts` del tuo MetaTrader 5.

**Parametri configurabili:**
```mq5
input string API_URL = "https://tuo-domain.vercel.app/api/ingest/mt5";  // La tua URL Vercel
input string API_KEY = "tuo-api-key";                                  // Chiave API (opzionale)
input int    SYNC_INTERVAL = 30;                                       // Intervallo di sync in secondi
input bool   ENABLE_LOGGING = true;                                    // Abilita logging
```

### 3. Deploy su Vercel

1. Push del codice su GitHub
2. Connetti repository a Vercel
3. Aggiungi variabili d'ambiente:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
4. Deploy automatico

## 🔌 API Endpoints

### Ingestione MT5
- `POST /api/ingest/mt5` - Riceve dati da MT5 EA

### Account
- `GET /api/accounts` - Lista account
- `GET /api/accounts/[id]/metrics` - Metriche account
- `GET /api/accounts/[id]/trades` - Operazioni account

## 📱 Utilizzo

### Dashboard Principale
1. Seleziona un account dalla sidebar
2. Visualizza metriche chiave in tempo reale
3. Naviga tra le diverse sezioni di analisi

### Vista Operazioni
1. Accedi alla pagina "Operazioni"
2. Filtra per symbol o tipo di operazione
3. Naviga tra le operazioni con paginazione

## 🔧 Personalizzazione

### Aggiungere nuove metriche
1. Aggiungi campi al modello Prisma
2. Aggiorna la logica di calcolo nell'API
3. Aggiorna i componenti frontend

### Modificare lo styling
- Usa Tailwind CSS classes
- Personalizza i componenti shadcn/ui
- Modifica i colori nel tema globale

## 🚀 Deployment

### Vercel (Consigliato)
1. Push su GitHub
2. Connetti a Vercel
3. Configura variabili d'ambiente
4. Deploy automatico su ogni push

### Altre piattaforme
- **Netlify**: Supporta Next.js con build personalizzati
- **Railway**: Deploy semplice con database SQLite
- **DigitalOcean**: App Platform con deploy automatico

## 📈 Performance

- **Database**: SQLite ottimizzato per lettura/scrittura
- **API**: Next.js API Routes con caching intelligente
- **Frontend**: Componenti ottimizzati con React.memo
- **CDN**: Vercel Edge Network per velocità globale

## 🔒 Sicurezza

- API endpoint protetti
- Validazione input dati
- SQL injection prevention con Prisma
- CORS configurato

## 🤝 Contributi

1. Fork del progetto
2. Crea una feature branch
3. Fai commit delle modifiche
4. Push e crea pull request

## 📄 License

MIT License - vedi LICENSE file

## 🆘 Supporto

Per assistenza:
1. Controlla la documentazione
2. Apri un issue su GitHub
3. Verifica i log di MT5 EA

---

**Made with ❤️ by Prop Control Team**