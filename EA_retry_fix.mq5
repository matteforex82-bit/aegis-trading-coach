//+------------------------------------------------------------------+
//| Expert Advisor - Retry Connection Fix per PropControl Dashboard |
//| Aggiungere questo codice al tuo EA esistente                    |
//+------------------------------------------------------------------+

// Variabili globali per retry system
int retryCount = 0;
int maxRetries = 3;
int retryDelay = 5000; // 5 secondi tra i retry
datetime lastSendTime = 0;
int sendInterval = 30; // secondi tra invii normali

//+------------------------------------------------------------------+
//| Funzione di invio HTTP con retry automatico                     |
//+------------------------------------------------------------------+
bool SendDataWithRetry(string url, string jsonPayload)
{
   for(int attempt = 1; attempt <= maxRetries; attempt++)
   {
      Print("🔄 Tentativo ", attempt, "/", maxRetries, " di invio dati...");
      
      // Reset delle variabili HTTP
      ResetLastError();
      
      // Preparazione headers HTTP
      string headers = "Content-Type: application/json\r\n";
      
      // Buffer per risposta
      char data[];
      char result[];
      string resultHeaders;
      
      // Conversione stringa in bytes
      StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));
      
      // Invio richiesta HTTP
      int timeout = 10000; // 10 secondi timeout
      int res = WebRequest(
         "POST",           // metodo
         url,              // URL
         headers,          // headers
         timeout,          // timeout
         data,             // dati da inviare
         result,           // buffer risposta
         resultHeaders     // headers risposta
      );
      
      // Controllo risultato
      if(res == 200)
      {
         Print("✅ Dati inviati con successo al tentativo ", attempt);
         string response = CharArrayToString(result);
         Print("📝 Risposta server: ", StringSubstr(response, 0, 200));
         retryCount = 0; // Reset counter successo
         return true;
      }
      else
      {
         int error = GetLastError();
         Print("❌ Tentativo ", attempt, " fallito - Codice HTTP: ", res, " Error: ", error);
         
         if(res == 503)
         {
            Print("🚨 Server temporaneamente non disponibile (503) - Retry in ", retryDelay/1000, " secondi");
         }
         else if(res == 429)
         {
            Print("⚠️ Troppe richieste (429) - Aumentando delay per prossimo invio");
            retryDelay = retryDelay * 2; // Backoff esponenziale
         }
         else if(res == 0)
         {
            Print("🌐 Problema di connessione di rete - Verificare internet");
         }
         
         // Se non è l'ultimo tentativo, aspetta prima di ritentare
         if(attempt < maxRetries)
         {
            Print("⏳ Aspetto ", retryDelay/1000, " secondi prima del prossimo tentativo...");
            Sleep(retryDelay);
         }
      }
   }
   
   // Tutti i tentativi falliti
   Print("🚫 ERRORE: Impossibile inviare dati dopo ", maxRetries, " tentativi");
   Print("📊 Aumentando intervallo di invio per ridurre carico server");
   
   retryCount++;
   
   // Se fallisce spesso, aumenta l'intervallo tra invii
   if(retryCount >= 3)
   {
      sendInterval = sendInterval * 2; // Raddoppia intervallo
      Print("🔧 Intervallo invio aumentato a ", sendInterval, " secondi");
      retryCount = 0;
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Funzione principale di invio con controllo timing               |
//+------------------------------------------------------------------+
void SendMetricsWithRetry()
{
   // Controllo se è tempo di inviare
   if(TimeCurrent() - lastSendTime < sendInterval)
   {
      return; // Non è ancora tempo
   }
   
   // Costruisci il JSON come già fai nel tuo EA
   string jsonPayload = BuildJsonPayload(); // La tua funzione esistente
   
   // URL del tuo server (sostituisci con quello corretto)
   string serverUrl = "https://aegis-trading-coach.vercel.app/api/ingest/mt5";
   
   // In caso di sviluppo locale, usa questo:
   // string serverUrl = "http://localhost:3000/api/ingest/mt5";
   
   Print("📤 Iniziando invio dati al server...");
   Print("🌐 URL: ", serverUrl);
   Print("📊 Dimensione payload: ", StringLen(jsonPayload), " caratteri");
   
   // Invio con retry
   bool success = SendDataWithRetry(serverUrl, jsonPayload);
   
   if(success)
   {
      lastSendTime = TimeCurrent();
      Print("✅ Ciclo invio completato con successo");
      
      // Se andato a buon fine, riduci gradualmente l'intervallo
      if(sendInterval > 30)
      {
         sendInterval = MathMax(30, sendInterval - 5);
         Print("🔧 Intervallo ridotto a ", sendInterval, " secondi");
      }
   }
   else
   {
      Print("❌ Ciclo invio fallito - Prossimo tentativo tra ", sendInterval, " secondi");
   }
}

//+------------------------------------------------------------------+
//| Funzione da chiamare in OnTick() del tuo EA                     |
//+------------------------------------------------------------------+
void OnTick()
{
   // Il tuo codice esistente...
   
   // Aggiungi questa chiamata per invio automatico con retry
   SendMetricsWithRetry();
   
   // Resto del tuo codice...
}

//+------------------------------------------------------------------+
//| Funzione di recupero connessione in caso di disconnessione      |
//+------------------------------------------------------------------+
void CheckAndReconnect()
{
   // Controlla se il terminale è connesso
   if(!TerminalInfoInteger(TERMINAL_CONNECTED))
   {
      Print("🚨 TERMINALE DISCONNESSO - Tentando riconnessione...");
      
      // Aspetta un po' per riconnessione automatica
      Sleep(5000);
      
      if(TerminalInfoInteger(TERMINAL_CONNECTED))
      {
         Print("✅ Riconnesso con successo!");
      }
      else
      {
         Print("❌ Riconnessione fallita - Verificare connessione internet");
      }
   }
}

//+------------------------------------------------------------------+
//| Funzione per monitoraggio salute connessione                    |
//+------------------------------------------------------------------+
void MonitorConnectionHealth()
{
   static datetime lastHealthCheck = 0;
   
   // Controllo ogni 2 minuti
   if(TimeCurrent() - lastHealthCheck < 120)
      return;
   
   lastHealthCheck = TimeCurrent();
   
   // Controlli di salute
   bool connected = TerminalInfoInteger(TERMINAL_CONNECTED);
   bool tradeAllowed = TerminalInfoInteger(TERMINAL_TRADE_ALLOWED);
   
   Print("💊 Health Check:");
   Print("   📶 Connesso: ", connected ? "✅" : "❌");
   Print("   📈 Trading: ", tradeAllowed ? "✅" : "❌");
   Print("   🕐 Server Time: ", TimeToString(TimeCurrent()));
   Print("   📡 Ultimo invio: ", lastSendTime > 0 ? TimeToString(lastSendTime) : "Mai");
   
   if(!connected)
   {
      CheckAndReconnect();
   }
}

//+------------------------------------------------------------------+
//| Esempio di integrazione nel tuo EA esistente                    |
//+------------------------------------------------------------------+

/*
// Nel tuo EA esistente, modifica così:

void OnTick()
{
   // Monitoraggio connessione
   MonitorConnectionHealth();
   
   // Il tuo codice di trading esistente...
   
   // Invio dati con retry automatico (sostituisce il vecchio invio)
   SendMetricsWithRetry();
}

void OnInit()
{
   // Il tuo codice di inizializzazione...
   
   // Inizializza variabili retry
   retryCount = 0;
   lastSendTime = 0;
   sendInterval = 30; // Parti con 30 secondi
   
   Print("🚀 PropControl EA avviato con sistema retry automatico");
}
*/