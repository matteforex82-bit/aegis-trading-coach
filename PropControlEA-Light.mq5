//+------------------------------------------------------------------+
//|                                          PropControlEA-Light.mq5 |
//|                              Copyright 2025, PROP CONTROL Team   |
//|                                      https://prop-control.com     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, PROP CONTROL Team"
#property link      "https://prop-control.com"
#property version   "3.00"
#property description "Expert Advisor LIGHT per PROP CONTROL Dashboard"
#property description "SOLO: Live monitoring + Instant trade sync"

//+------------------------------------------------------------------+
//| Input Parameters                                                 |
//+------------------------------------------------------------------+
// API Configuration
input group "=== API CONFIGURATION ==="
input string   API_URL = "https://aegis-trading-coach.vercel.app/api/ingest/mt5";  // URL API Dashboard
input int      TIMEOUT_MS = 10000;                                         // Timeout richieste (ms)

// Sync Configuration  
input group "=== SYNC CONFIGURATION ==="
input int      SYNC_INTERVAL = 30;                                         // Intervallo sync live (secondi)
input bool     ENABLE_DETAILED_LOGGING = true;                             // Log dettagliati

//+------------------------------------------------------------------+
//| Global Variables                                                 |
//+------------------------------------------------------------------+
datetime g_LastSyncTime = 0;
int g_LastKnownDealsCount = 0;

// === SISTEMA RICONNESSIONE AUTOMATICA ===
int g_RetryCount = 0;
int g_MaxRetries = 3;
int g_RetryDelay = 5000; // 5 secondi
datetime g_LastSendTime = 0;
int g_SendInterval = 30; // 30 secondi base
int g_MinSendInterval = 30;
int g_MaxSendInterval = 300;
datetime g_LastHealthCheck = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("PROP CONTROL EA LIGHT v3.0 - Inizializzazione...");
    Print("API URL: ", API_URL);
    Print("Sync interval: ", SYNC_INTERVAL, " secondi");
    Print("MODALITA: Solo nuove operazioni chiuse + Live sync ogni ", SYNC_INTERVAL, "s");
    
    // Test connessione API
    if(!TestAPIConnection())
    {
        Print("ERRORE: Impossibile connettersi all'API");
        return INIT_FAILED;
    }
    
    // Inizializza conteggio deals per rilevare SOLO nuove chiusure da questo momento
    if(!HistorySelect(0, TimeCurrent()))
    {
        Print("ERRORE: Impossibile selezionare lo storico");
        return INIT_FAILED;
    }
    
    g_LastKnownDealsCount = HistoryDealsTotal();
    Print("Punto di partenza: ", g_LastKnownDealsCount, " deals nello storico (ignorati)");
    
    // Avvia timer per sync live
    EventSetTimer(SYNC_INTERVAL);
    
    Print("PROP CONTROL EA LIGHT pronto!");
    Print("STORICO: Ignorato - Solo nuove operazioni da adesso");
    Print("LIVE SYNC: Ogni ", SYNC_INTERVAL, " secondi");
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    EventKillTimer();
    Print("PROP CONTROL EA LIGHT terminato - Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                            |
//+------------------------------------------------------------------+
void OnTick()
{
    // Controlla se ci sono nuove operazioni chiuse
    CheckForNewClosedTrades();
}

//+------------------------------------------------------------------+
//| Timer function - Live Sync                                     |
//+------------------------------------------------------------------+
void OnTimer()
{
    // Controllo intervalli dinamici per evitare spam al server
    if(TimeCurrent() - g_LastSendTime < g_SendInterval)
    {
        if(ENABLE_DETAILED_LOGGING)
            Print("SKIP SYNC: Aspetto ", g_SendInterval, "s tra invii (ultimo: ", (TimeCurrent() - g_LastSendTime), "s fa)");
        return;
    }
    
    if(ENABLE_DETAILED_LOGGING)
        Print("LIVE SYNC: Invio posizioni aperte ogni ", g_SendInterval, "s");
    
    SendLivePositions();
    
    // Health check periodico
    MonitorConnection();
}

//+------------------------------------------------------------------+
//| Test API Connection                                             |
//+------------------------------------------------------------------+
bool TestAPIConnection()
{
    string headers = "Content-Type: application/json\r\n";
    char data[];
    char result[];
    string resultString;
    
    string testPayload = "{\"test\":true}";
    int dataLength = StringToCharArray(testPayload, data, 0, -1, CP_UTF8) - 1;
    if(dataLength < 0) dataLength = 0;
    ArrayResize(data, dataLength);
    
    int res = WebRequest("POST", API_URL, headers, TIMEOUT_MS, data, result, resultString);
    
    if(res == 200 || res == 201 || res == 400) // 400 può essere OK se endpoint esiste
    {
        Print("API connessione OK - Codice: ", res);
        return true;
    }
    else
    {
        Print("API connessione fallita - Codice: ", res);
        return false;
    }
}

//+------------------------------------------------------------------+
//| Check For New Closed Trades                                    |
//+------------------------------------------------------------------+
void CheckForNewClosedTrades()
{
    // Aggiorna lo storico per essere sicuri di avere tutti i deals
    if(!HistorySelect(0, TimeCurrent()))
    {
        Print("Errore nel selezionare lo storico");
        return;
    }
    
    int currentDealsCount = HistoryDealsTotal();
    
    // Se ci sono nuovi deals, controlla se sono chiusure di posizioni
    if(currentDealsCount > g_LastKnownDealsCount)
    {
        if(ENABLE_DETAILED_LOGGING)
        {
            Print("NUOVI DEALS: ", (currentDealsCount - g_LastKnownDealsCount), " rilevati da ultimo check");
        }
        
        // Esamina SOLO i deals più recenti (dal punto di avvio EA)
        for(int i = g_LastKnownDealsCount; i < currentDealsCount; i++)
        {
            ulong dealTicket = HistoryDealGetTicket(i);
            if(dealTicket <= 0) continue;
            
            // Controlla se è una chiusura (DEAL_TYPE_SELL per long, DEAL_TYPE_BUY per short)
            long dealType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
            long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
            ulong positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
            
            if(dealEntry == DEAL_ENTRY_OUT) // È una chiusura
            {
                if(ENABLE_DETAILED_LOGGING)
                {
                    string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
                    ulong positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
                    Print("NUOVA CHIUSURA: ", symbol, " #", positionId, " (dal momento avvio EA)");
                }
                SendClosedTrade(dealTicket);
            }
        }
        
        g_LastKnownDealsCount = currentDealsCount;
    }
}

//+------------------------------------------------------------------+
//| Send Closed Trade to API                                       |
//+------------------------------------------------------------------+
void SendClosedTrade(ulong dealTicket)
{
    string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
    double volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
    double price = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
    datetime time = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
    double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
    double swap = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
    double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
    string comment = HistoryDealGetString(dealTicket, DEAL_COMMENT);
    ulong positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
    
    // Trova il deal di apertura corrispondente per avere tutti i dati
    if(!HistorySelectByPosition(positionId))
    {
        Print("Non riesco a trovare lo storico per posizione: ", positionId);
        return;
    }
    
    // Trova deal di apertura
    datetime openTime = 0;
    double openPrice = 0;
    string side = "";
    
    int positionDeals = HistoryDealsTotal();
    for(int i = 0; i < positionDeals; i++)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(HistoryDealGetInteger(ticket, DEAL_POSITION_ID) == positionId)
        {
            long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
            if(entry == DEAL_ENTRY_IN) // Deal di apertura
            {
                openTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
                openPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
                long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
                side = (dealType == DEAL_TYPE_BUY) ? "BUY" : "SELL";
                break;
            }
        }
    }
    
    if(openTime == 0)
    {
        Print("Non riesco a trovare il deal di apertura per posizione: ", positionId);
        return;
    }
    
    Print("INVIO CHIUSURA: ", symbol, " #", positionId, " P&L: ", profit);
    
    // Costruisci payload per singola operazione chiusa
    string accountData = BuildAccountJSON();
    string tradeJson = BuildClosedTradeJSON(positionId, symbol, side, volume, openPrice, price, openTime, time, profit, commission, swap, comment);
    
    string payload = "{\"account\":" + accountData + ",\"trades\":[" + tradeJson + "]}";
    
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("Payload operazione chiusa: ", payload);
    }
    
    SendHTTPRequest(payload);
    g_LastSendTime = TimeCurrent();
    g_LastSendTime = TimeCurrent();
}

//+------------------------------------------------------------------+
//| Build Account JSON                                             |
//+------------------------------------------------------------------+
string BuildAccountJSON()
{
    string accountJson = "{";
    accountJson += "\"login\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    accountJson += "\"name\":\"" + CleanJsonString(AccountInfoString(ACCOUNT_NAME)) + "\",";
    accountJson += "\"broker\":\"" + CleanJsonString(AccountInfoString(ACCOUNT_COMPANY)) + "\",";
    accountJson += "\"server\":\"" + CleanJsonString(AccountInfoString(ACCOUNT_SERVER)) + "\",";
    accountJson += "\"currency\":\"" + AccountInfoString(ACCOUNT_CURRENCY) + "\",";
    accountJson += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    accountJson += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2);
    accountJson += "}";
    
    return accountJson;
}

//+------------------------------------------------------------------+
//| Build Closed Trade JSON                                        |
//+------------------------------------------------------------------+
string BuildClosedTradeJSON(ulong positionId, string symbol, string side, double volume, double openPrice, double closePrice, datetime openTime, datetime closeTime, double profit, double commission, double swap, string comment)
{
    string tradeJson = "{";
    tradeJson += "\"ticket_id\":\"" + IntegerToString(positionId) + "\",";
    tradeJson += "\"position_id\":\"" + IntegerToString(positionId) + "\",";
    tradeJson += "\"symbol\":\"" + CleanJsonString(symbol) + "\",";
    tradeJson += "\"side\":\"" + side + "\",";
    tradeJson += "\"volume\":" + DoubleToString(volume, 2) + ",";
    tradeJson += "\"open_price\":" + DoubleToString(openPrice, 5) + ",";
    tradeJson += "\"close_price\":" + DoubleToString(closePrice, 5) + ",";
    tradeJson += "\"open_time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\",";
    tradeJson += "\"close_time\":\"" + TimeToString(closeTime, TIME_DATE|TIME_SECONDS) + "\",";
    tradeJson += "\"pnl\":" + DoubleToString(profit, 2) + ",";
    tradeJson += "\"commission\":" + DoubleToString(commission, 2) + ",";
    tradeJson += "\"swap\":" + DoubleToString(swap, 2) + ",";
    tradeJson += "\"comment\":\"" + CleanJsonString(comment) + "\"";
    tradeJson += "}";
    
    return tradeJson;
}

//+------------------------------------------------------------------+
//| Send Live Positions                                            |
//+------------------------------------------------------------------+
void SendLivePositions()
{
    string accountData = BuildAccountJSON();
    string openPositionsJson = BuildCurrentOpenPositionsJSON();
    
    // Costruisci metriche live semplici
    string metricsJson = "{";
    metricsJson += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
    metricsJson += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    metricsJson += "\"margin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ",";
    metricsJson += "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
    metricsJson += "}";
    
    string payload = "{\"account\":" + accountData + ",\"metrics\":" + metricsJson + ",\"openPositions\":[" + openPositionsJson + "]}";
    
    SendHTTPRequest(payload);
    g_LastSyncTime = TimeCurrent();
}

//+------------------------------------------------------------------+
//| Build Current Open Positions JSON                             |
//+------------------------------------------------------------------+
string BuildCurrentOpenPositionsJSON()
{
    string positionsJson = "";
    int totalPositions = PositionsTotal();
    
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("Trovate ", totalPositions, " posizioni aperte correnti");
    }
    
    for(int i = 0; i < totalPositions; i++)
    {
        ulong positionTicket = PositionGetTicket(i);
        if(positionTicket <= 0) 
        {
            Print("Posizione ", i, " - PositionGetTicket fallito");
            continue;
        }
        
        if(ENABLE_DETAILED_LOGGING)
        {
            Print("Processo posizione ", i, " - Ticket: ", positionTicket);
        }
        
        if(!PositionSelectByTicket(positionTicket)) 
        {
            Print("Posizione ", positionTicket, " - PositionSelectByTicket fallito!");
            continue;
        }
        
        // Recupera TUTTE le informazioni della posizione
        string symbol = PositionGetString(POSITION_SYMBOL);
        long positionType = PositionGetInteger(POSITION_TYPE);
        double volume = PositionGetDouble(POSITION_VOLUME);
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
        double currentProfit = PositionGetDouble(POSITION_PROFIT);
        double swap = PositionGetDouble(POSITION_SWAP);
        string comment = PositionGetString(POSITION_COMMENT);
        long magic = PositionGetInteger(POSITION_MAGIC);
        
        // Nuove informazioni complete
        double stopLoss = PositionGetDouble(POSITION_SL);
        double takeProfit = PositionGetDouble(POSITION_TP);
        double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
        
        // Calcola il valore della posizione (volume * contract size * current price)
        double contractSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
        double positionValue = volume * contractSize * currentPrice;
        
        // Calcola la percentuale di cambio
        double changePercent = 0.0;
        if(openPrice != 0)
        {
            if(positionType == POSITION_TYPE_BUY)
                changePercent = ((currentPrice - openPrice) / openPrice) * 100;
            else
                changePercent = ((openPrice - currentPrice) / openPrice) * 100;
        }
        
        string side = (positionType == POSITION_TYPE_BUY) ? "buy" : "sell";
        string type = (positionType == POSITION_TYPE_BUY) ? "buy" : "sell";
        
        if(ENABLE_DETAILED_LOGGING)
        {
            Print("Posizione COMPLETA: ", positionTicket, " ", symbol, " ", side, " ", volume, " lots");
            Print("  Open: ", openPrice, " Current: ", currentPrice, " SL: ", stopLoss, " TP: ", takeProfit);
            Print("  P&L: ", currentProfit, " Swap: ", swap, " Value: ", positionValue, " Change%: ", NormalizeDouble(changePercent, 2));
        }
        
        if(positionsJson != "") positionsJson += ",";
        
        positionsJson += "{";
        positionsJson += "\"symbol\":\"" + CleanJsonString(symbol) + "\",";
        positionsJson += "\"ticket\":\"" + IntegerToString(positionTicket) + "\",";
        positionsJson += "\"time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\",";
        positionsJson += "\"type\":\"" + type + "\",";
        positionsJson += "\"volume\":" + DoubleToString(volume, 2) + ",";
        positionsJson += "\"price_open\":" + DoubleToString(openPrice, 5) + ",";
        positionsJson += "\"stop_loss\":" + DoubleToString(stopLoss, 5) + ",";
        positionsJson += "\"take_profit\":" + DoubleToString(takeProfit, 5) + ",";
        positionsJson += "\"price_current\":" + DoubleToString(currentPrice, 5) + ",";
        positionsJson += "\"value\":" + DoubleToString(positionValue, 2) + ",";
        positionsJson += "\"swap\":" + DoubleToString(swap, 2) + ",";
        positionsJson += "\"profit\":" + DoubleToString(currentProfit, 2) + ",";
        positionsJson += "\"change_percent\":" + DoubleToString(changePercent, 2) + ",";
        positionsJson += "\"magic\":" + IntegerToString(magic) + ",";
        positionsJson += "\"comment\":\"" + CleanJsonString(comment) + "\"";
        positionsJson += "}";
    }
    
    // Debug finale
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("JSON COMPLETO costruito per ", totalPositions, " posizioni aperte");
    }
    
    return positionsJson;
}

//+------------------------------------------------------------------+
//| Send HTTP Request with Automatic Retry                        |
//+------------------------------------------------------------------+
bool SendHTTPRequest(string payload)
{
    string headers = "Content-Type: application/json\r\n";
    
    for(int attempt = 1; attempt <= g_MaxRetries; attempt++)
    {
        if(ENABLE_DETAILED_LOGGING && attempt > 1)
            Print("RETRY ", attempt, "/", g_MaxRetries, " - Tentativo riconnessione...");
        
        char data[];
        char result[];
        string resultString;
        
        int dataLength = StringToCharArray(payload, data, 0, -1, CP_UTF8) - 1;
        if(dataLength < 0) dataLength = 0;
        ArrayResize(data, dataLength);
        
        int res = WebRequest("POST", API_URL, headers, TIMEOUT_MS, data, result, resultString);
        
        if(res == 200 || res == 201)
        {
            if(ENABLE_DETAILED_LOGGING)
            {
                if(attempt > 1)
                    Print("RICONNESSO! Successo al tentativo ", attempt);
                else
                    Print("Dati inviati con successo - Codice: ", res);
            }
            
            // Reset parametri dopo successo
            g_RetryCount = 0;
            g_RetryDelay = 5000;
            g_LastSendTime = TimeCurrent();
            
            // Riduci gradualmente intervallo se tutto va bene
            if(g_SendInterval > g_MinSendInterval)
            {
                g_SendInterval = MathMax(g_MinSendInterval, g_SendInterval - 5);
                if(ENABLE_DETAILED_LOGGING)
                    Print("OTTIMIZZAZIONE: Intervallo ridotto a ", g_SendInterval, "s");
            }
            
            return true;
        }
        else if(ShouldRetry(res) && attempt < g_MaxRetries)
        {
            g_RetryCount++;
            Print("ERRORE ", res, " - Server temporaneamente non disponibile");
            Print("RETRY automatico in ", g_RetryDelay/1000, " secondi...");
            
            Sleep(g_RetryDelay);
            g_RetryDelay = g_RetryDelay * 2; // Backoff esponenziale
        }
        else
        {
            // Errore non recuperabile o tentativi esauriti
            Print("ERRORE DEFINITIVO ", res, " - Impossibile connettersi");
            break;
        }
    }
    
    // Tutti i tentativi falliti - aumenta intervallo
    Print("DISCONNESSIONE: Tutti i ", g_MaxRetries, " tentativi falliti");
    g_SendInterval = MathMin(g_MaxSendInterval, g_SendInterval * 2);
    Print("PROTEZIONE: Intervallo aumentato a ", g_SendInterval, "s per ridurre carico server");
    
    return false;
}

//+------------------------------------------------------------------+
//| Check if error should be retried                               |
//+------------------------------------------------------------------+
bool ShouldRetry(int errorCode)
{
    // Errori che giustificano un retry automatico
    if(errorCode == 503) return true; // Server temporaneamente non disponibile
    if(errorCode == 502) return true; // Bad Gateway
    if(errorCode == 504) return true; // Gateway Timeout
    if(errorCode == 429) return true; // Too Many Requests
    if(errorCode == 0)   return true; // Errore di rete
    
    // Errori che NON devono essere ritentati
    if(errorCode == 400) return false; // Bad Request (JSON malformato)
    if(errorCode == 401) return false; // Unauthorized
    if(errorCode == 403) return false; // Forbidden
    if(errorCode == 404) return false; // Not Found
    
    return false; // Default: non ritentare
}

//+------------------------------------------------------------------+
//| Monitor Connection Health                                       |
//+------------------------------------------------------------------+
void MonitorConnection()
{
    // Health check ogni 2 minuti
    if(TimeCurrent() - g_LastHealthCheck < 120) return;
    
    g_LastHealthCheck = TimeCurrent();
    
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("HEALTH CHECK:");
        Print("  Terminal connesso: ", (TerminalInfoInteger(TERMINAL_CONNECTED) ? "SI" : "NO"));
        Print("  Errori consecutivi: ", g_RetryCount);
        Print("  Intervallo corrente: ", g_SendInterval, "s");
        Print("  Ultimo invio: ", (TimeCurrent() - g_LastSendTime), "s fa");
    }
    
    // Se troppi errori, testa la connessione base
    if(g_RetryCount > 3)
    {
        Print("TROPPI ERRORI: Test connessione base...");
        TestServerPing();
    }
}

//+------------------------------------------------------------------+
//| Test Server Ping                                              |
//+------------------------------------------------------------------+
void TestServerPing()
{
    string headers = "Content-Type: application/json\r\n";
    char data[];
    char result[];
    string resultString;
    
    string pingPayload = "{\"ping\":true}";
    int dataLength = StringToCharArray(pingPayload, data, 0, -1, CP_UTF8) - 1;
    if(dataLength < 0) dataLength = 0;
    ArrayResize(data, dataLength);
    
    int res = WebRequest("POST", API_URL, headers, 5000, data, result, resultString);
    
    if(res == 200 || res == 201 || res == 400)
    {
        Print("PING OK: Server raggiungibile (", res, ")");
        g_RetryCount = 0; // Reset conteggio errori
    }
    else
    {
        Print("PING FAIL: Server non raggiungibile (", res, ")");
    }
}

//+------------------------------------------------------------------+
//| Clean JSON String                                              |
//+------------------------------------------------------------------+
string CleanJsonString(string inputString)
{
    string cleanString = inputString;
    
    // Rimuovi caratteri problematici per JSON
    for(int i = 0; i < StringLen(cleanString); i++)
    {
        ushort ch = StringGetCharacter(cleanString, i);
        
        // Sostituisci virgolette doppie con underscore
        if(ch == 34)  // "
        {
            StringSetCharacter(cleanString, i, 95); // _
        }
        // Sostituisci caratteri di controllo con spazi
        else if(ch < 32)
        {
            StringSetCharacter(cleanString, i, 32); // spazio
        }
    }
    
    return cleanString;
}