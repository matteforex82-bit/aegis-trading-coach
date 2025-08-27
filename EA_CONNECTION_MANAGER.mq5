//+------------------------------------------------------------------+
//| PROPCONTROL CONNECTION MANAGER                                  |
//| Sistema completo di retry e monitoraggio per Expert Advisor     |
//+------------------------------------------------------------------+

// Configurazione connessione
string SERVER_URL = "https://aegis-trading-coach.vercel.app";  // URL produzione
// string SERVER_URL = "http://localhost:3000";     // URL sviluppo locale

// Variabili globali per gestione retry
struct ConnectionState {
   int consecutiveErrors;    // Errori consecutivi
   int totalErrors;         // Errori totali
   datetime lastSuccessTime; // Ultimo invio riuscito
   datetime lastAttemptTime; // Ultimo tentativo
   int currentInterval;     // Intervallo corrente tra invii
   bool isHealthy;          // Stato salute connessione
} connState;

// Configurazione retry
const int MIN_SEND_INTERVAL = 30;      // 30 secondi minimo
const int MAX_SEND_INTERVAL = 300;     // 5 minuti massimo
const int MAX_RETRIES = 3;             // Tentativi per richiesta
const int RETRY_DELAY = 5000;          // 5 secondi tra retry
const int HEALTH_CHECK_INTERVAL = 120; // 2 minuti tra health check

//+------------------------------------------------------------------+
//| Inizializzazione EA                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("🚀 PropControl Connection Manager avviato");
   
   // Inizializza stato connessione
   connState.consecutiveErrors = 0;
   connState.totalErrors = 0;
   connState.lastSuccessTime = 0;
   connState.lastAttemptTime = 0;
   connState.currentInterval = MIN_SEND_INTERVAL;
   connState.isHealthy = true;
   
   // Test iniziale connettività
   TestServerConnectivity();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Test connettività server                                        |
//+------------------------------------------------------------------+
bool TestServerConnectivity()
{
   Print("🔍 Test connettività server...");
   
   string pingUrl = SERVER_URL + "/api/ping";
   
   // Invio richiesta ping
   char data[];
   char result[];
   string headers = "User-Agent: PropControl-EA-Ping\r\n";
   string resultHeaders;
   
   int res = WebRequest("GET", pingUrl, headers, 5000, data, result, resultHeaders);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      Print("✅ Server raggiungibile - Risposta: ", StringSubstr(response, 0, 100));
      connState.isHealthy = true;
      return true;
   }
   else
   {
      Print("❌ Server non raggiungibile - Codice: ", res);
      connState.isHealthy = false;
      return false;
   }
}

//+------------------------------------------------------------------+
//| Invio dati con retry avanzato                                  |
//+------------------------------------------------------------------+
bool SendDataWithAdvancedRetry(string jsonPayload)
{
   // Controlla se è troppo presto per inviare
   if(TimeCurrent() - connState.lastAttemptTime < connState.currentInterval)
   {
      return false; // Non è ancora il momento
   }
   
   connState.lastAttemptTime = TimeCurrent();
   
   Print("📤 Avvio invio dati (Intervallo: ", connState.currentInterval, "s, Errori consecutivi: ", connState.consecutiveErrors, ")");
   
   string dataUrl = SERVER_URL + "/api/ingest/mt5";
   bool success = false;
   
   // Ciclo di retry
   for(int attempt = 1; attempt <= MAX_RETRIES; attempt++)
   {
      Print("🔄 Tentativo ", attempt, "/", MAX_RETRIES);
      
      // Preparazione richiesta
      char data[];
      char result[];
      string headers = "Content-Type: application/json\r\n";
      headers += "User-Agent: PropControl-EA-v2.0\r\n";
      headers += "X-Request-ID: " + IntegerToString(GetTickCount()) + "\r\n";
      string resultHeaders;
      
      // Conversione payload
      StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));
      
      // Calcola timeout dinamico basato sui tentativi precedenti
      int timeout = 10000 + (attempt - 1) * 5000; // 10s, 15s, 20s
      
      // Invio richiesta
      ResetLastError();
      int res = WebRequest("POST", dataUrl, headers, timeout, data, result, resultHeaders);
      
      // Analizza risposta
      if(res == 200)
      {
         // SUCCESSO!
         string response = CharArrayToString(result);
         Print("✅ Dati inviati con successo al tentativo ", attempt);
         Print("📝 Risposta: ", StringSubstr(response, 0, 150), "...");
         
         // Aggiorna stato successo
         connState.consecutiveErrors = 0;
         connState.lastSuccessTime = TimeCurrent();
         connState.isHealthy = true;
         
         // Riduci gradualmente l'intervallo se tutto va bene
         if(connState.currentInterval > MIN_SEND_INTERVAL)
         {
            connState.currentInterval = MathMax(MIN_SEND_INTERVAL, connState.currentInterval - 10);
            Print("🔧 Intervallo ridotto a ", connState.currentInterval, " secondi");
         }
         
         success = true;
         break;
      }
      else
      {
         // ERRORE - analizza tipo
         int error = GetLastError();
         string errorMsg = GetErrorDescription(res, error);
         
         Print("❌ Tentativo ", attempt, " fallito:");
         Print("   📊 Codice HTTP: ", res);
         Print("   🔧 Errore MT5: ", error);
         Print("   💬 Descrizione: ", errorMsg);
         
         // Logica retry basata sul tipo di errore
         bool shouldRetry = ShouldRetryError(res, error, attempt);
         
         if(shouldRetry && attempt < MAX_RETRIES)
         {
            int delay = CalculateRetryDelay(attempt, res);
            Print("⏳ Aspetto ", delay/1000, " secondi prima del prossimo tentativo...");
            Sleep(delay);
         }
         else if(attempt == MAX_RETRIES)
         {
            Print("🚫 Tutti i tentativi falliti, aggiornando strategia...");
         }
      }
   }
   
   // Aggiorna statistiche errori
   if(!success)
   {
      connState.consecutiveErrors++;
      connState.totalErrors++;
      connState.isHealthy = false;
      
      // Aggiusta strategia basata sui fallimenti
      AdjustConnectionStrategy();
   }
   
   return success;
}

//+------------------------------------------------------------------+
//| Determina se ritentare in base al tipo di errore               |
//+------------------------------------------------------------------+
bool ShouldRetryError(int httpCode, int mt5Error, int attempt)
{
   // Errori che vale la pena ritentare
   if(httpCode == 503 || httpCode == 502 || httpCode == 504) return true;  // Server errors
   if(httpCode == 429) return true;                                        // Rate limiting  
   if(httpCode == 0 && mt5Error == 4014) return true;                     // Network error
   if(httpCode == 0 && mt5Error == 5203) return true;                     // HTTP error
   
   // Errori che NON vale la pena ritentare
   if(httpCode == 400 || httpCode == 401 || httpCode == 403) return false; // Client errors
   if(httpCode == 404) return false;                                       // Not found
   
   // Per altri errori, ritenta solo se non è l'ultimo tentativo
   return (attempt < MAX_RETRIES);
}

//+------------------------------------------------------------------+
//| Calcola delay per retry basato su tipo errore                  |
//+------------------------------------------------------------------+
int CalculateRetryDelay(int attempt, int httpCode)
{
   int baseDelay = RETRY_DELAY;
   
   // Backoff esponenziale per errori server
   if(httpCode == 503 || httpCode == 502 || httpCode == 504)
   {
      baseDelay = baseDelay * MathPow(2, attempt - 1); // 5s, 10s, 20s
   }
   // Delay più lungo per rate limiting
   else if(httpCode == 429)
   {
      baseDelay = RETRY_DELAY * 3 * attempt; // 15s, 30s, 45s
   }
   // Delay standard per errori di rete
   else
   {
      baseDelay = RETRY_DELAY + (attempt - 1) * 2000; // 5s, 7s, 9s
   }
   
   return MathMin(baseDelay, 30000); // Massimo 30 secondi
}

//+------------------------------------------------------------------+
//| Aggiusta strategia connessione basata sui fallimenti           |
//+------------------------------------------------------------------+
void AdjustConnectionStrategy()
{
   // Aumenta intervallo dopo errori consecutivi
   if(connState.consecutiveErrors >= 2)
   {
      int oldInterval = connState.currentInterval;
      connState.currentInterval = MathMin(MAX_SEND_INTERVAL, connState.currentInterval * 2);
      
      if(connState.currentInterval != oldInterval)
      {
         Print("🔧 Intervallo aumentato a ", connState.currentInterval, " secondi dopo ", connState.consecutiveErrors, " errori consecutivi");
      }
   }
   
   // Dopo molti errori, testa connettività
   if(connState.consecutiveErrors >= 5)
   {
      Print("🚨 Troppi errori consecutivi, test connettività...");
      TestServerConnectivity();
   }
   
   // Dopo troppi errori, pausa più lunga
   if(connState.consecutiveErrors >= 10)
   {
      Print("⚠️ Modalità emergenza attivata - pausa 5 minuti");
      connState.currentInterval = 300; // 5 minuti
   }
}

//+------------------------------------------------------------------+
//| Descrizione errore leggibile                                   |
//+------------------------------------------------------------------+
string GetErrorDescription(int httpCode, int mt5Error)
{
   string desc = "";
   
   // Codici HTTP comuni
   switch(httpCode)
   {
      case 0: desc = "Errore di rete o timeout"; break;
      case 400: desc = "Richiesta malformata"; break;
      case 401: desc = "Non autorizzato"; break;
      case 403: desc = "Accesso negato"; break;
      case 404: desc = "Endpoint non trovato"; break;
      case 429: desc = "Troppe richieste (rate limit)"; break;
      case 500: desc = "Errore server interno"; break;
      case 502: desc = "Bad Gateway"; break;
      case 503: desc = "Servizio non disponibile"; break;
      case 504: desc = "Gateway timeout"; break;
      default: desc = "Codice HTTP: " + IntegerToString(httpCode); break;
   }
   
   // Aggiungi errore MT5 se presente
   if(mt5Error != 0)
   {
      desc += " (MT5: " + IntegerToString(mt5Error) + ")";
   }
   
   return desc;
}

//+------------------------------------------------------------------+
//| Monitoraggio salute connessione                                |
//+------------------------------------------------------------------+
void MonitorConnectionHealth()
{
   static datetime lastHealthCheck = 0;
   
   if(TimeCurrent() - lastHealthCheck < HEALTH_CHECK_INTERVAL)
      return;
      
   lastHealthCheck = TimeCurrent();
   
   // Status report
   Print("💊 === HEALTH CHECK ===");
   Print("   🌐 Connessione: ", connState.isHealthy ? "Sana" : "Problemi");
   Print("   📊 Errori consecutivi: ", connState.consecutiveErrors);
   Print("   📈 Errori totali: ", connState.totalErrors);
   Print("   ⏰ Intervallo corrente: ", connState.currentInterval, "s");
   Print("   ✅ Ultimo successo: ", connState.lastSuccessTime > 0 ? TimeToString(connState.lastSuccessTime) : "Mai");
   Print("   🔌 Terminale connesso: ", TerminalInfoInteger(TERMINAL_CONNECTED) ? "Sì" : "No");
   Print("   📡 Trading abilitato: ", TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) ? "Sì" : "No");
   
   // Test periodico server
   if(!connState.isHealthy || connState.consecutiveErrors > 3)
   {
      TestServerConnectivity();
   }
}

//+------------------------------------------------------------------+
//| Funzione principale da chiamare in OnTick                      |
//+------------------------------------------------------------------+
void OnTick()
{
   // Monitoraggio salute
   MonitorConnectionHealth();
   
   // Il tuo codice di trading esistente qui...
   
   // Costruisci payload JSON (sostituisci con la tua funzione)
   string jsonData = BuildYourJsonPayload(); // <- LA TUA FUNZIONE
   
   // Invio con retry avanzato
   if(StringLen(jsonData) > 0)
   {
      SendDataWithAdvancedRetry(jsonData);
   }
}

//+------------------------------------------------------------------+
//| Funzione esempio per costruire JSON (da sostituire)            |
//+------------------------------------------------------------------+
string BuildYourJsonPayload()
{
   // SOSTITUISCI CON IL TUO CODICE ESISTENTE
   return "{}"; // Placeholder
}

//+------------------------------------------------------------------+
//| Report finale                                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("📊 === STATISTICHE FINALI CONNESSIONE ===");
   Print("   Errori totali: ", connState.totalErrors);
   Print("   Ultimo successo: ", connState.lastSuccessTime > 0 ? TimeToString(connState.lastSuccessTime) : "Mai");
   Print("   Stato finale: ", connState.isHealthy ? "Sano" : "Problemi");
   Print("🔚 PropControl Connection Manager terminato");
}