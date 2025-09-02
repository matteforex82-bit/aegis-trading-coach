# Configurazione Webhook Finnhub

Questa guida spiega come configurare e utilizzare il webhook Finnhub per ricevere notifiche in tempo reale nel dashboard.

## 🔧 Configurazione

### 1. Endpoint Webhook

**URL del Webhook:** `https://your-domain.com/api/finnhub-webhook`

- **Metodo:** POST
- **Autenticazione:** Header `X-Finnhub-Secret`
- **Secret:** `d2r7o31r01qlk22s2hcg`

### 2. Configurazione su Finnhub

1. Accedi al tuo account Finnhub
2. Vai nella sezione "Webhooks" del dashboard
3. Crea un nuovo webhook con:
   - **URL:** `https://your-domain.com/api/finnhub-webhook`
   - **Secret:** `d2r7o31r01qlk22s2hcg`
   - **Eventi:** Seleziona gli eventi che vuoi ricevere

### 3. Variabili d'Ambiente

Assicurati che nel file `.env` sia configurato:

```env
FINNHUB_WEBHOOK_SECRET="d2r7o31r01qlk22s2hcg"
FINNHUB_API_KEY="your-api-key-here"
```

## 📡 Funzionalità

### Endpoint API

- **POST `/api/finnhub-webhook`** - Riceve notifiche da Finnhub
- **GET `/api/finnhub-webhook`** - Verifica lo stato del webhook

### Autenticazione

Tutte le richieste da Finnhub includono l'header:
```
X-Finnhub-Secret: d2r7o31r01qlk22s2hcg
```

### Gestione Errori

- Il webhook restituisce sempre status 200 per evitare disabilitazione
- Gli errori vengono loggati ma non bloccano l'acknowledgment
- Timeout automatico per prevenire disabilitazione del webhook

## 🎯 Tipi di Eventi Supportati

### 1. Aggiornamenti Prezzi
```json
{
  "symbol": "AAPL",
  "price": 150.25,
  "timestamp": 1640995200,
  "volume": 1000
}
```

### 2. Eventi Economici
```json
{
  "event": "Non-Farm Payrolls",
  "country": "US",
  "impact": "high",
  "timestamp": 1640995200
}
```

### 3. Notizie di Mercato
```json
{
  "event": "news",
  "headline": "Market Update",
  "summary": "...",
  "timestamp": 1640995200
}
```

## 🔍 Monitoraggio

### Dashboard Webhook Status

Il componente `WebhookStatus` nel tab "NEWS & MACRO" mostra:

- ✅ **Stato connessione** - Attivo/Disconnesso
- 📡 **Ultimo evento ricevuto** - Timestamp e dettagli
- 📋 **Eventi recenti** - Lista degli ultimi 10 eventi
- 🧪 **Test simulazione** - Pulsante per testare l'interfaccia

### Logs

I webhook vengono loggati nella console con:

```
📡 Finnhub Webhook ricevuto: { timestamp, data }
🔄 Processing webhook event: { event details }
📈 Price update for AAPL: $150.25
📰 Economic event: Non-Farm Payrolls
```

## 🚀 Deployment

### Vercel

1. Il webhook è automaticamente disponibile dopo il deploy
2. URL: `https://your-app.vercel.app/api/finnhub-webhook`
3. Configura l'URL su Finnhub dopo il deploy

### Locale (Sviluppo)

1. Usa ngrok per esporre il webhook localmente:
   ```bash
   ngrok http 3000
   ```

2. URL temporaneo: `https://abc123.ngrok.io/api/finnhub-webhook`

## 🔧 Troubleshooting

### Webhook Non Funziona

1. **Verifica URL:** Assicurati che l'URL sia corretto e accessibile
2. **Controlla Secret:** Verifica che il secret sia configurato correttamente
3. **Logs:** Controlla i logs del server per errori
4. **Status Code:** Il webhook deve restituire 2xx per essere considerato attivo

### Errori Comuni

- **401 Unauthorized:** Secret non corretto
- **404 Not Found:** URL webhook non valido
- **500 Internal Error:** Errore nel processamento (ma webhook rimane attivo)

### Test del Webhook

```bash
# Test manuale con curl
curl -X POST https://your-domain.com/api/finnhub-webhook \
  -H "Content-Type: application/json" \
  -H "X-Finnhub-Secret: d2r7o31r01qlk22s2hcg" \
  -d '{"symbol":"AAPL","price":150.25,"timestamp":1640995200}'
```

### Verifica Status

```bash
# Verifica stato webhook
curl https://your-domain.com/api/finnhub-webhook
```

## 📚 Risorse

- [Documentazione Finnhub Webhooks](https://finnhub.io/docs/api/webhook)
- [API Reference](https://finnhub.io/docs/api)
- [Dashboard Finnhub](https://finnhub.io/dashboard)

## 🔄 Prossimi Sviluppi

- [ ] WebSocket per notifiche real-time ai client
- [ ] Persistenza eventi nel database
- [ ] Filtri avanzati per tipi di eventi
- [ ] Notifiche push browser
- [ ] Dashboard analytics eventi webhook