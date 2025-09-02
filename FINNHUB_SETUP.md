# 🔑 Configurazione Finnhub API per NEWS & MACRO

Per utilizzare il tab **NEWS & MACRO** è necessario configurare una chiave API gratuita di Finnhub.

## 📋 Passaggi per la configurazione

### 1. Registrazione su Finnhub
1. Vai su [https://finnhub.io/register](https://finnhub.io/register)
2. Registrati gratuitamente con la tua email
3. Conferma l'account tramite email
4. Accedi al tuo dashboard Finnhub

### 2. Ottenere la chiave API
1. Nel dashboard di Finnhub, vai alla sezione **API Keys**
2. Copia la tua **API Key** (dovrebbe iniziare con lettere e numeri)
3. La chiave gratuita permette fino a 60 chiamate al minuto

### 3. Configurare la chiave nel progetto
1. Apri il file `.env` nella root del progetto
2. Trova la sezione con `FINNHUB_API_KEY`
3. Sostituisci `la-tua-chiave-api-qui` con la tua chiave API
4. Rimuovi il `#` all'inizio della riga per attivare la configurazione

**Esempio:**
```env
# Prima (disattivato)
# FINNHUB_API_KEY="la-tua-chiave-api-qui"

# Dopo (attivato con la tua chiave)
FINNHUB_API_KEY="abc123def456ghi789"
```

### 4. Riavviare il server
1. Ferma il server di sviluppo (Ctrl+C nel terminale)
2. Riavvia con `npm run dev`
3. Il tab NEWS & MACRO ora dovrebbe funzionare correttamente

## 🔍 Verifica della configurazione

- Se la chiave è configurata correttamente, vedrai gli eventi economici nel tab NEWS & MACRO
- Se vedi l'errore "Chiave API Finnhub non configurata", controlla i passaggi sopra
- Se vedi errore 401, la chiave potrebbe essere scaduta o non valida

## 📊 Limiti del piano gratuito

- **60 chiamate al minuto**
- **Calendario economico completo**
- **Dati in tempo reale**
- **Nessun costo**

Per utilizzi più intensivi, Finnhub offre piani a pagamento con limiti più alti.

## 🔒 Sicurezza

⚠️ **IMPORTANTE**: Non condividere mai la tua chiave API pubblicamente o commitarla su repository pubblici. Il file `.env` è già incluso nel `.gitignore` per proteggere le tue credenziali.