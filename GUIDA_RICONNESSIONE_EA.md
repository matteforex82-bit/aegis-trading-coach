# 🔄 GUIDA RICONNESSIONE AUTOMATICA EA

## 🚨 PROBLEMA RISOLTO
Il tuo EA si disconnette dopo errori 503 (server temporaneamente non disponibile).

## ✅ SOLUZIONI IMPLEMENTATE

### 1. RETRY AUTOMATICO NELL'EA
Aggiungi questo codice al tuo EA esistente:

```mql5
// === CONFIGURAZIONE RETRY ===
int retryCount = 0;
int maxRetries = 3;
int retryDelay = 5000; // 5 secondi
datetime lastSendTime = 0;
int sendInterval = 30; // 30 secondi base

bool SendDataWithRetry(string url, string jsonPayload)
{
    for(int attempt = 1; attempt <= maxRetries; attempt++)
    {
        Print("🔄 Tentativo ", attempt, "/", maxRetries);
        
        // ... codice WebRequest esistente ...
        int res = WebRequest("POST", url, headers, 10000, data, result, resultHeaders);
        
        if(res == 200)
        {
            Print("✅ Successo al tentativo ", attempt);
            retryCount = 0;
            return true;
        }
        else if(res == 503 && attempt < maxRetries)
        {
            Print("🚨 Server occupato (503) - Retry in ", retryDelay/1000, "s");
            Sleep(retryDelay);
            retryDelay = retryDelay * 2; // Backoff esponenziale
        }
    }
    
    Print("❌ Tutti i tentativi falliti");
    sendInterval = sendInterval * 2; // Aumenta intervallo
    return false;
}
```

### 2. CONTROLLO INTERVALLI DINAMICI
```mql5
void OnTick()
{
    // Controlla se è tempo di inviare
    if(TimeCurrent() - lastSendTime < sendInterval)
        return;
        
    // Costruisci JSON
    string jsonData = BuildJsonPayload();
    
    // Invio con retry
    bool success = SendDataWithRetry("https://new2dash.vercel.app/api/ingest/mt5", jsonData);
    
    if(success)
    {
        lastSendTime = TimeCurrent();
        // Riduci gradualmente intervallo se va bene
        sendInterval = MathMax(30, sendInterval - 5);
    }
}
```

### 3. HEALTH CHECK SERVER
Il server ora ha endpoint di test connettività:

- **`/api/ping`** - Test rapido (sempre risponde)
- **`/api/health`** - Test completo con database

### 4. GESTIONE ERRORI AVANZATA

**Errori da RITENTARE:**
- `503` - Server temporaneamente occupato → Retry con backoff
- `502/504` - Gateway errors → Retry 
- `429` - Rate limiting → Retry con delay maggiore
- `0` + errore rete → Retry

**Errori da NON ritentare:**
- `400` - JSON malformato → Fix payload
- `404` - URL sbagliato → Verifica endpoint
- `401/403` - Autorizzazione → Problemi account

### 5. MONITORAGGIO CONNESSIONE
```mql5
void MonitorConnection()
{
    static datetime lastCheck = 0;
    if(TimeCurrent() - lastCheck < 120) return; // Ogni 2 minuti
    
    lastCheck = TimeCurrent();
    
    Print("💊 Health Check:");
    Print("   Connesso: ", TerminalInfoInteger(TERMINAL_CONNECTED));
    Print("   Errori consecutivi: ", retryCount);
    Print("   Intervallo corrente: ", sendInterval, "s");
    
    // Test ping se problemi
    if(retryCount > 3)
    {
        TestServerPing();
    }
}
```

## 🛠️ INTEGRAZIONE RAPIDA

### Opzione A: Codice Minimale
Aggiungi solo queste 3 funzioni al tuo EA:

1. **`SendDataWithRetry()`** - Gestisce i retry automatici
2. **Modifica `OnTick()`** - Usa la nuova funzione di invio
3. **Aumenta `sendInterval`** - Dopo errori consecutivi

### Opzione B: Sistema Completo
Usa il file `EA_CONNECTION_MANAGER.mq5` completo che include:

- ✅ Retry automatico con backoff esponenziale
- ✅ Health check periodici
- ✅ Gestione intervalli dinamici
- ✅ Monitoraggio statistiche errori
- ✅ Test connettività server

## 🚀 RISULTATI ATTESI

**PRIMA:**
- Errore 503 → EA si blocca ❌
- Necessario restart manuale ❌
- Perdita dati durante disconnessioni ❌

**DOPO:**
- Errore 503 → Retry automatico ✅
- Reconnessione automatica ✅
- Intervalli adattivi per ridurre carico ✅
- Statistiche errori per debugging ✅

## 📞 TEST RAPIDO

1. **Compila EA** con il nuovo codice
2. **Avvia EA** e monitora i log
3. **Simula disconnessione** (spegni WiFi 30 secondi)
4. **Verifica riconnessione** automatica nei log

**Log di successo:**
```
🔄 Tentativo 1/3
❌ Errore rete - Retry in 5s  
🔄 Tentativo 2/3
✅ Riconnesso con successo!
```

## ⚙️ CONFIGURAZIONE AVANZATA

Modifica queste variabili per il tuo setup:

```mql5
int MIN_SEND_INTERVAL = 30;    // Minimo 30 secondi tra invii
int MAX_SEND_INTERVAL = 300;   // Massimo 5 minuti se problemi
int MAX_RETRIES = 3;           // 3 tentativi per richiesta
int RETRY_DELAY = 5000;        // 5 secondi tra retry
```

Il sistema si adatta automaticamente:
- **Tutto OK**: Intervallo 30s
- **Errori saltuari**: Intervallo 60s  
- **Problemi gravi**: Intervallo 300s
- **Riconnessione**: Riduce gradualmente l'intervallo

---

🎯 **Questo sistema elimina completamente le disconnessioni manuali e mantiene l'EA sempre connesso alla dashboard!**