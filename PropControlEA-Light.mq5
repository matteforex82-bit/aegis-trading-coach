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
input string   API_URL = "https://new2dash.vercel.app/api/ingest/mt5";  // URL API Dashboard
input int      TIMEOUT_MS = 10000;                                         // Timeout richieste (ms)

// Sync Configuration  
input group "=== SYNC CONFIGURATION ==="
input int      SYNC_INTERVAL = 30;                                         // Intervallo sync live (secondi)
input bool     ENABLE_DETAILED_LOGGING = true;                             // Log dettagliati

// Account Info
input group "=== ACCOUNT INFO ==="
input string   PROP_FIRM_NAME = "FTMO";                                    // Nome prop firm
input string   ACCOUNT_PHASE = "PHASE_1";                                  // Fase account
input double   START_BALANCE = 50000.0;                                    // Balance iniziale

//+------------------------------------------------------------------+
//| Global Variables                                                 |
//+------------------------------------------------------------------+
datetime g_LastSyncTime = 0;
int g_LastKnownDealsCount = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("🚀 PROP CONTROL EA LIGHT v3.0 - Inizializzazione...");
    Print("📡 API URL: ", API_URL);
    Print("⏱️ Sync interval: ", SYNC_INTERVAL, " secondi");
    
    // Test connessione API
    if(!TestAPIConnection())
    {
        Print("❌ ERRORE: Impossibile connettersi all'API");
        return INIT_FAILED;
    }
    
    // Inizializza conteggio deals per rilevare nuove chiusure
    g_LastKnownDealsCount = HistoryDealsTotal();
    
    // Avvia timer per sync live
    EventSetTimer(SYNC_INTERVAL);
    
    Print("✅ PROP CONTROL EA LIGHT pronto!");
    Print("📋 Modalità: LIVE ONLY - Storico da Excel");
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    EventKillTimer();
    Print("🛑 PROP CONTROL EA LIGHT terminato - Motivo: ", reason);
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
    if(ENABLE_DETAILED_LOGGING)
        Print("⏰ Timer sync - Invio posizioni aperte...");
    
    SendLivePositions();
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
        Print("✅ API connessione OK - Codice: ", res);
        return true;
    }
    else
    {
        Print("❌ API connessione fallita - Codice: ", res);
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
        Print("⚠️ Errore nel selezionare lo storico");
        return;
    }
    
    int currentDealsCount = HistoryDealsTotal();
    
    // Se ci sono nuovi deals, controlla se sono chiusure di posizioni
    if(currentDealsCount > g_LastKnownDealsCount)
    {
        if(ENABLE_DETAILED_LOGGING)
        {
            Print("🔍 Rilevati ", (currentDealsCount - g_LastKnownDealsCount), " nuovi deals");
        }
        
        // Esamina i deals più recenti per trovare chiusure
        for(int i = g_LastKnownDealsCount; i < currentDealsCount; i++)
        {
            ulong dealTicket = HistoryDealGetTicket(i);
            if(dealTicket <= 0) continue;
            
            // Controlla se è una chiusura (DEAL_TYPE_SELL per long, DEAL_TYPE_BUY per short)
            long dealType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
            long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
            
            if(dealEntry == DEAL_ENTRY_OUT) // È una chiusura
            {
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
        Print("⚠️ Non riesco a trovare lo storico per posizione: ", positionId);
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
        Print("❌ Non riesco a trovare il deal di apertura per posizione: ", positionId);
        return;
    }
    
    Print("📤 Invio operazione chiusa: ", symbol, " #", positionId, " P&L: ", profit);
    
    // Costruisci payload per singola operazione chiusa
    string accountData = BuildAccountJSON();
    string tradeJson = BuildClosedTradeJSON(positionId, symbol, side, volume, openPrice, price, openTime, time, profit, commission, swap, comment);
    
    string payload = "{\"account\":" + accountData + ",\"trades\":[" + tradeJson + "]}";
    
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("🚀 Payload operazione chiusa: ", payload);
    }
    
    SendHTTPRequest(payload);
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
    accountJson += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
    accountJson += "\"propFirm\":\"" + CleanJsonString(PROP_FIRM_NAME) + "\",";
    accountJson += "\"phase\":\"" + CleanJsonString(ACCOUNT_PHASE) + "\",";
    accountJson += "\"startBalance\":" + DoubleToString(START_BALANCE, 2);
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
    tradeJson += "\"comment\":\"" + CleanJsonString(comment) + "\",";
    tradeJson += "\"phase\":\"" + CleanJsonString(ACCOUNT_PHASE) + "\"";
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
    metricsJson += "\"phase\":\"" + ACCOUNT_PHASE + "\",";
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
        Print("🔍 Trovate ", totalPositions, " posizioni aperte correnti");
    }
    
    for(int i = 0; i < totalPositions; i++)
    {
        ulong positionTicket = PositionGetTicket(i);
        if(positionTicket <= 0) 
        {
            Print("⚠️ Posizione ", i, " - PositionGetTicket fallito");
            continue;
        }
        
        if(ENABLE_DETAILED_LOGGING)
        {
            Print("🔍 Processo posizione ", i, " - Ticket: ", positionTicket);
        }
        
        if(!PositionSelectByTicket(positionTicket)) 
        {
            Print("❌ Posizione ", positionTicket, " - PositionSelectByTicket fallito!");
            continue;
        }
        
        string symbol = PositionGetString(POSITION_SYMBOL);
        long positionType = PositionGetInteger(POSITION_TYPE);
        double volume = PositionGetDouble(POSITION_VOLUME);
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
        double currentProfit = PositionGetDouble(POSITION_PROFIT);
        double swap = PositionGetDouble(POSITION_SWAP);
        string comment = PositionGetString(POSITION_COMMENT);
        long magic = PositionGetInteger(POSITION_MAGIC);
        
        string side = (positionType == POSITION_TYPE_BUY) ? "buy" : "sell";
        
        if(ENABLE_DETAILED_LOGGING)
        {
            Print("📊 Posizione: ", positionTicket, " ", symbol, " ", side, " ", volume, " lots, P&L: ", currentProfit);
        }
        
        if(positionsJson != "") positionsJson += ",";
        
        positionsJson += "{";
        positionsJson += "\"ticket_id\":\"" + IntegerToString(positionTicket) + "\",";
        positionsJson += "\"symbol\":\"" + CleanJsonString(symbol) + "\",";
        positionsJson += "\"side\":\"" + side + "\",";
        positionsJson += "\"volume\":" + DoubleToString(volume, 2) + ",";
        positionsJson += "\"open_price\":" + DoubleToString(openPrice, 5) + ",";
        positionsJson += "\"open_time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\",";
        positionsJson += "\"pnl\":" + DoubleToString(currentProfit, 2) + ",";
        positionsJson += "\"swap\":" + DoubleToString(swap, 2) + ",";
        positionsJson += "\"commission\":0.0,";
        positionsJson += "\"comment\":\"" + CleanJsonString(comment) + "\",";
        positionsJson += "\"magic\":" + IntegerToString(magic) + ",";
        positionsJson += "\"phase\":\"" + CleanJsonString(ACCOUNT_PHASE) + "\"";
        positionsJson += "}";
    }
    
    // Debug finale
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("✅ JSON costruito per ", totalPositions, " posizioni aperte");
        
        // Verifica specifica per XAGUSD #162527
        if(StringFind(positionsJson, "162527") >= 0)
        {
            Print("✅ XAGUSD #162527 INCLUSA nel payload");
        }
        else 
        {
            Print("⚠️ XAGUSD #162527 non trovata nel payload corrente");
        }
    }
    
    return positionsJson;
}

//+------------------------------------------------------------------+
//| Send HTTP Request                                              |
//+------------------------------------------------------------------+
bool SendHTTPRequest(string payload)
{
    string headers = "Content-Type: application/json\r\n";
    
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
            Print("✅ Dati inviati con successo - Codice: ", res);
        return true;
    }
    else
    {
        Print("❌ Errore invio dati - Codice: ", res);
        Print("📤 Payload che ha fallito: ", payload);
        return false;
    }
}

//+------------------------------------------------------------------+
//| Clean JSON String                                              |
//+------------------------------------------------------------------+
string CleanJsonString(string input)
{
    // Semplice pulizia per JSON - rimuove caratteri problematici
    string output = input;
    
    // Sostituisci caratteri di escape manualmente
    for(int i = 0; i < StringLen(output); i++)
    {
        ushort ch = StringGetCharacter(output, i);
        if(ch == '"' || ch == '\r' || ch == '\n' || ch == '\t')
        {
            StringSetCharacter(output, i, ' '); // Sostituisci con spazio
        }
    }
    
    return output;
}