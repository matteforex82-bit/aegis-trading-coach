//+------------------------------------------------------------------+
//|                                                 PropControlEA.mq5 |
//|                              Copyright 2025, PROP CONTROL Team   |
//|                                      https://prop-control.com     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, PROP CONTROL Team"
#property link      "https://prop-control.com"
#property version   "1.00"
#property description "Expert Advisor completo per PROP CONTROL Dashboard"
#property description "Sincronizza dati MT5 con dashboard prop firm"

//+------------------------------------------------------------------+
//| Input Parameters                                                 |
//+------------------------------------------------------------------+
// API Configuration
input group "=== API CONFIGURATION ==="
input string   API_URL = "https://new2dash.vercel.app/api/ingest/mt5";  // URL API Dashboard
input string   API_KEY = "";                                                // API Key (opzionale)
input int      TIMEOUT_MS = 10000;                                         // Timeout richieste (ms)
input bool     ENABLE_SSL = true;                                          // Abilita HTTPS/SSL

// Sync Configuration  
input group "=== SYNC CONFIGURATION ==="
input bool     SYNC_HISTORICAL = true;                                     // Sincronizza storico al primo avvio
input int      SYNC_INTERVAL = 30;                                         // Intervallo sync live (secondi)
input int      MAX_TRADES_PER_REQUEST = 100;                               // Max trades per richiesta
input bool     SYNC_ON_TRADE_CLOSE = true;                                 // Sync immediato alla chiusura trade

// Prop Firm Rules
input group "=== PROP FIRM RULES ==="
input string   PROP_FIRM_NAME = "FTMO";                                    // Nome prop firm
input string   ACCOUNT_PHASE = "PHASE_1";                                  // Fase account (DEMO/PHASE_1/PHASE_2/FUNDED)
input double   START_BALANCE = 100000.0;                                   // Balance iniziale
input double   PROFIT_TARGET = 8000.0;                                     // Target profitto ($)
input double   MAX_DAILY_LOSS = 5000.0;                                    // Max perdita giornaliera ($)
input double   MAX_TOTAL_LOSS = 10000.0;                                   // Max perdita totale ($)
input double   MAX_DRAWDOWN_PERCENT = 10.0;                                // Max drawdown (%)
input int      MIN_TRADING_DAYS = 5;                                       // Min giorni di trading

// Monitoring Configuration
input group "=== MONITORING ==="
input bool     ENABLE_RULE_ALERTS = true;                                  // Abilita alert violazioni
input bool     ENABLE_EQUITY_MONITORING = true;                            // Monitor equity ogni tick
input bool     ENABLE_DETAILED_LOGGING = true;                             // Log dettagliati
input bool     SHOW_DASHBOARD_INFO = true;                                 // Mostra info su grafico

//+------------------------------------------------------------------+
//| Global Variables                                                 |
//+------------------------------------------------------------------+
bool g_FirstRun = true;
datetime g_LastSyncTime = 0;
datetime g_LastTradeCheck = 0;
double g_StartingBalance = 0;
double g_PeakBalance = 0;
double g_DailyStartBalance = 0;
datetime g_LastDayCheck = 0;
string g_LastTradeHash = "";
int g_TradingDays = 0;

// Performance tracking
double g_CurrentEquity = 0;
double g_CurrentDrawdown = 0;
double g_CurrentDailyPnL = 0;
double g_MaxDrawdown = 0;
double g_TotalPnL = 0;

// Rule violations
bool g_DailyLossViolated = false;
bool g_MaxLossViolated = false;
bool g_MaxDrawdownViolated = false;
bool g_ProfitTargetReached = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("🚀 PROP CONTROL EA inizializzato");
    Print("📡 API URL: ", API_URL);
    Print("🏢 Prop Firm: ", PROP_FIRM_NAME, " | Fase: ", ACCOUNT_PHASE);
    Print("💰 Balance: $", DoubleToString(START_BALANCE, 2), 
          " | Target: $", DoubleToString(PROFIT_TARGET, 2));
    
    // Inizializza variabili
    InitializeVariables();
    
    // Verifica connessione API
    if(!TestAPIConnection())
    {
        Print("❌ ERRORE: Impossibile connettersi all'API");
        return INIT_FAILED;
    }
    
    // Sincronizzazione storico al primo avvio
    if(SYNC_HISTORICAL && g_FirstRun)
    {
        Print("📊 Avvio sincronizzazione storico...");
        SyncHistoricalData();
    }
    
    // Imposta timer per sync periodico
    EventSetTimer(SYNC_INTERVAL);
    
    Print("✅ PROP CONTROL EA pronto!");
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    EventKillTimer();
    Print("🛑 PROP CONTROL EA terminato - Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                            |
//+------------------------------------------------------------------+
void OnTick()
{
    // Aggiorna metriche correnti
    UpdateCurrentMetrics();
    
    // Monitor equity se abilitato
    if(ENABLE_EQUITY_MONITORING)
    {
        MonitorEquityAndRules();
    }
    
    // Controlla nuovi trade
    CheckForNewTrades();
    
    // Aggiorna dashboard info se abilitato
    if(SHOW_DASHBOARD_INFO)
    {
        UpdateDashboardInfo();
    }
}

//+------------------------------------------------------------------+
//| Timer function                                                  |
//+------------------------------------------------------------------+
void OnTimer()
{
    Print("⏰ Timer sync - Invio metriche live...");
    SendLiveMetrics();
}

//+------------------------------------------------------------------+
//| Initialize Variables                                            |
//+------------------------------------------------------------------+
void InitializeVariables()
{
    g_StartingBalance = (START_BALANCE > 0) ? START_BALANCE : AccountInfoDouble(ACCOUNT_BALANCE);
    g_PeakBalance = g_StartingBalance;
    g_DailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    g_LastDayCheck = TimeCurrent();
    g_CurrentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
    
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("🔧 Variabili inizializzate:");
        Print("   Starting Balance: $", DoubleToString(g_StartingBalance, 2));
        Print("   Current Equity: $", DoubleToString(g_CurrentEquity, 2));
    }
}

//+------------------------------------------------------------------+
//| Test API Connection                                             |
//+------------------------------------------------------------------+
bool TestAPIConnection()
{
    // Test con endpoint principale invece di /health che potrebbe non esistere
    string headers = "Content-Type: application/json\r\n";
    if(API_KEY != "") headers += "X-API-Key: " + API_KEY + "\r\n";
    
    char data[];
    char result[];
    string resultString;
    
    // Test con payload minimo per verificare connessione
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
        Print("   URL: ", API_URL);
        Print("   Response: ", resultString);
        
        // Suggerimenti per errori comuni
        if(res == 0)
            Print("   💡 Verifica connessione internet e URL");
        else if(res == 401)
            Print("   💡 Verifica API_KEY");
        else if(res == 404)
            Print("   💡 Verifica URL endpoint API");
        
        return false;
    }
}

//+------------------------------------------------------------------+
//| Sync Historical Data                                           |
//+------------------------------------------------------------------+
void SyncHistoricalData()
{
    Print("📈 Sincronizzazione storico trades iniziata...");
    
    // Seleziona storico completo
    if(!HistorySelect(0, TimeCurrent()))
    {
        Print("❌ Impossibile selezionare storico");
        return;
    }
    
    int totalDeals = HistoryDealsTotal();
    Print("📊 Trovati ", totalDeals, " deals nello storico");
    
    string tradesJson = "";
    int processedTrades = 0;
    
    for(int i = 0; i < totalDeals; i++)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket <= 0) continue;
        
        // Solo deals di trading (non depositi/prelievi)
        if(HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY || 
           HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_SELL)
        {
            string tradeData = BuildTradeJSON(ticket, true);
            if(tradeData != "")
            {
                if(tradesJson != "") tradesJson += ",";
                tradesJson += tradeData;
                processedTrades++;
            }
        }
        
        // Invia a blocchi per evitare timeout
        if(processedTrades >= MAX_TRADES_PER_REQUEST)
        {
            SendTradesBatch(tradesJson);
            tradesJson = "";
            processedTrades = 0;
            Sleep(1000); // Pausa tra batch
        }
    }
    
    // Invia ultimo batch
    if(tradesJson != "")
    {
        SendTradesBatch(tradesJson);
    }
    
    g_FirstRun = false;
    Print("✅ Sincronizzazione storico completata");
}

//+------------------------------------------------------------------+
//| Send Trades Batch                                              |
//+------------------------------------------------------------------+
void SendTradesBatch(string tradesJson)
{
    string accountData = BuildAccountJSON();
    string payload = "{\"account\":" + accountData + ",\"trades\":[" + tradesJson + "]}";
    
    if(ENABLE_DETAILED_LOGGING)
    {
        Print("📤 Invio batch trades...");
    }
    
    SendHTTPRequest(payload);
}

//+------------------------------------------------------------------+
//| Build Account JSON                                             |
//+------------------------------------------------------------------+
string BuildAccountJSON()
{
    long login = AccountInfoInteger(ACCOUNT_LOGIN);
    string name = CleanJsonString(AccountInfoString(ACCOUNT_NAME));
    string server = CleanJsonString(AccountInfoString(ACCOUNT_SERVER));
    string broker = CleanJsonString(AccountInfoString(ACCOUNT_COMPANY));
    string currency = CleanJsonString(AccountInfoString(ACCOUNT_CURRENCY));
    
    string json = "{";
    json += "\"login\":\"" + IntegerToString(login) + "\",";
    json += "\"name\":\"" + name + "\",";
    json += "\"broker\":\"" + broker + "\",";
    json += "\"server\":\"" + server + "\",";
    json += "\"currency\":\"" + currency + "\",";
    json += "\"timezone\":\"Europe/Rome\",";
    json += "\"propFirm\":\"" + CleanJsonString(PROP_FIRM_NAME) + "\",";
    json += "\"phase\":\"" + CleanJsonString(ACCOUNT_PHASE) + "\",";
    json += "\"startBalance\":" + DoubleToString(g_StartingBalance, 2) + ",";
    json += "\"profitTarget\":" + DoubleToString(PROFIT_TARGET, 2) + ",";
    json += "\"maxDailyLoss\":" + DoubleToString(MAX_DAILY_LOSS, 2) + ",";
    json += "\"maxTotalLoss\":" + DoubleToString(MAX_TOTAL_LOSS, 2) + ",";
    json += "\"maxDrawdown\":" + DoubleToString(MAX_DRAWDOWN_PERCENT, 2);
    json += "}";
    
    return json;
}

//+------------------------------------------------------------------+
//| Build Trade JSON                                               |
//+------------------------------------------------------------------+
string BuildTradeJSON(ulong ticket, bool isHistorical = false)
{
    if(!HistoryDealSelect(ticket) && !isHistorical) return "";
    
    string symbol = CleanJsonString(HistoryDealGetString(ticket, DEAL_SYMBOL));
    double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
    double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
    double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
    double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
    double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
    datetime time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
    long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
    string comment = CleanJsonString(HistoryDealGetString(ticket, DEAL_COMMENT));
    long magic = HistoryDealGetInteger(ticket, DEAL_MAGIC);
    
    string side = (type == DEAL_TYPE_BUY) ? "buy" : "sell";
    
    // Calcola metriche aggiuntive
    double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
    double currentDrawdown = CalculateCurrentDrawdown();
    double dailyPnL = CalculateDailyPnL();
    
    string json = "{";
    json += "\"ticket_id\":\"" + IntegerToString(ticket) + "\",";
    json += "\"symbol\":\"" + symbol + "\",";
    json += "\"side\":\"" + side + "\",";
    json += "\"volume\":" + DoubleToString(volume, 2) + ",";
    json += "\"price\":" + DoubleToString(price, 5) + ",";
    json += "\"open_time\":\"" + TimeToString(time, TIME_DATE|TIME_SECONDS) + "\",";
    json += "\"pnl\":" + DoubleToString(profit, 2) + ",";
    json += "\"commission\":" + DoubleToString(commission, 2) + ",";
    json += "\"swap\":" + DoubleToString(swap, 2) + ",";
    json += "\"comment\":\"" + comment + "\",";
    json += "\"magic\":" + IntegerToString(magic) + ",";
    
    // Dati prop firm specifici
    json += "\"phase\":\"" + CleanJsonString(ACCOUNT_PHASE) + "\",";
    json += "\"equityAtClose\":" + DoubleToString(currentEquity, 2) + ",";
    json += "\"drawdownAtClose\":" + DoubleToString(currentDrawdown, 2) + ",";
    json += "\"dailyPnLAtClose\":" + DoubleToString(dailyPnL, 2) + ",";
    json += "\"violatesRules\":" + (CheckRuleViolations() ? "true" : "false") + ",";
    json += "\"isWeekendTrade\":" + (IsWeekendTime(time) ? "true" : "false");
    json += "}";
    
    return json;
}

//+------------------------------------------------------------------+
//| Update Current Metrics                                         |
//+------------------------------------------------------------------+
void UpdateCurrentMetrics()
{
    g_CurrentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
    g_CurrentDrawdown = CalculateCurrentDrawdown();
    g_CurrentDailyPnL = CalculateDailyPnL();
    g_TotalPnL = g_CurrentEquity - g_StartingBalance;
    
    // Aggiorna peak balance
    if(g_CurrentEquity > g_PeakBalance)
    {
        g_PeakBalance = g_CurrentEquity;
    }
    
    // Aggiorna max drawdown
    double currentDD = (g_PeakBalance - g_CurrentEquity) / g_StartingBalance * 100;
    if(currentDD > g_MaxDrawdown)
    {
        g_MaxDrawdown = currentDD;
    }
    
    // Reset daily se nuovo giorno
    datetime currentTime = TimeCurrent();
    MqlDateTime currentMqlTime, lastMqlTime;
    TimeToStruct(currentTime, currentMqlTime);
    TimeToStruct(g_LastDayCheck, lastMqlTime);
    
    if(currentMqlTime.day != lastMqlTime.day)
    {
        g_DailyStartBalance = g_CurrentEquity;
        g_LastDayCheck = currentTime;
        g_TradingDays++;
        
        // Reset flag violazioni giornaliere
        g_DailyLossViolated = false;
    }
}

//+------------------------------------------------------------------+
//| Calculate Current Drawdown                                     |
//+------------------------------------------------------------------+
double CalculateCurrentDrawdown()
{
    if(g_PeakBalance <= 0) return 0;
    return (g_PeakBalance - g_CurrentEquity) / g_StartingBalance * 100;
}

//+------------------------------------------------------------------+
//| Calculate Daily PnL                                           |
//+------------------------------------------------------------------+
double CalculateDailyPnL()
{
    return g_CurrentEquity - g_DailyStartBalance;
}

//+------------------------------------------------------------------+
//| Monitor Equity And Rules                                      |
//+------------------------------------------------------------------+
void MonitorEquityAndRules()
{
    // Controlla violazioni regole
    bool ruleViolated = CheckRuleViolations();
    
    if(ruleViolated && ENABLE_RULE_ALERTS)
    {
        ShowRuleViolationAlert();
    }
}

//+------------------------------------------------------------------+
//| Check Rule Violations                                          |
//+------------------------------------------------------------------+
bool CheckRuleViolations()
{
    bool violated = false;
    
    // Controllo perdita giornaliera
    if(g_CurrentDailyPnL < -MAX_DAILY_LOSS)
    {
        if(!g_DailyLossViolated)
        {
            Print("🚨 VIOLAZIONE: Perdita giornaliera massima superata!");
            Print("   Perdita: $", DoubleToString(-g_CurrentDailyPnL, 2), 
                  " | Limite: $", DoubleToString(MAX_DAILY_LOSS, 2));
            g_DailyLossViolated = true;
        }
        violated = true;
    }
    
    // Controllo perdita totale
    if(g_TotalPnL < -MAX_TOTAL_LOSS)
    {
        if(!g_MaxLossViolated)
        {
            Print("🚨 VIOLAZIONE: Perdita totale massima superata!");
            Print("   Perdita: $", DoubleToString(-g_TotalPnL, 2), 
                  " | Limite: $", DoubleToString(MAX_TOTAL_LOSS, 2));
            g_MaxLossViolated = true;
        }
        violated = true;
    }
    
    // Controllo drawdown massimo
    if(g_CurrentDrawdown > MAX_DRAWDOWN_PERCENT)
    {
        if(!g_MaxDrawdownViolated)
        {
            Print("🚨 VIOLAZIONE: Drawdown massimo superato!");
            Print("   Drawdown: ", DoubleToString(g_CurrentDrawdown, 2), "% | Limite: ", 
                  DoubleToString(MAX_DRAWDOWN_PERCENT, 2), "%");
            g_MaxDrawdownViolated = true;
        }
        violated = true;
    }
    
    // Controllo target profitto raggiunto
    if(g_TotalPnL >= PROFIT_TARGET)
    {
        if(!g_ProfitTargetReached)
        {
            Print("🎉 TARGET RAGGIUNTO: Profit target completato!");
            Print("   Profitto: $", DoubleToString(g_TotalPnL, 2), 
                  " | Target: $", DoubleToString(PROFIT_TARGET, 2));
            g_ProfitTargetReached = true;
        }
    }
    
    return violated;
}

//+------------------------------------------------------------------+
//| Show Rule Violation Alert                                      |
//+------------------------------------------------------------------+
void ShowRuleViolationAlert()
{
    string alertMsg = "PROP CONTROL: Violazione regole rilevata!";
    
    if(g_DailyLossViolated)
        alertMsg += "\n• Perdita giornaliera: $" + DoubleToString(-g_CurrentDailyPnL, 2);
    if(g_MaxLossViolated)
        alertMsg += "\n• Perdita totale: $" + DoubleToString(-g_TotalPnL, 2);
    if(g_MaxDrawdownViolated)
        alertMsg += "\n• Drawdown: " + DoubleToString(g_CurrentDrawdown, 2) + "%";
    
    Alert(alertMsg);
}

//+------------------------------------------------------------------+
//| Check For New Trades                                           |
//+------------------------------------------------------------------+
void CheckForNewTrades()
{
    if(!HistorySelect(g_LastTradeCheck, TimeCurrent())) return;
    
    int totalDeals = HistoryDealsTotal();
    bool newTrades = false;
    
    for(int i = totalDeals - 1; i >= 0; i--)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket <= 0) continue;
        
        datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
        if(dealTime <= g_LastTradeCheck) break;
        
        // Solo trades (non depositi/prelievi)
        long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
        if(dealType == DEAL_TYPE_BUY || dealType == DEAL_TYPE_SELL)
        {
            if(ENABLE_DETAILED_LOGGING)
            {
                Print("🔄 Nuovo trade rilevato: ", ticket);
            }
            
            // Invia nuovo trade se sync abilitato
            if(SYNC_ON_TRADE_CLOSE)
            {
                string tradeData = BuildTradeJSON(ticket);
                if(tradeData != "")
                {
                    SendTradesBatch(tradeData);
                }
            }
            
            newTrades = true;
        }
    }
    
    if(newTrades)
    {
        g_LastTradeCheck = TimeCurrent();
    }
}

//+------------------------------------------------------------------+
//| Send Live Metrics                                             |
//+------------------------------------------------------------------+
void SendLiveMetrics()
{
    string accountData = BuildAccountJSON();
    
    string metricsJson = "{";
    metricsJson += "\"equity\":" + DoubleToString(g_CurrentEquity, 2) + ",";
    metricsJson += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    metricsJson += "\"drawdown\":" + DoubleToString(g_CurrentDrawdown, 2) + ",";
    metricsJson += "\"dailyPnL\":" + DoubleToString(g_CurrentDailyPnL, 2) + ",";
    metricsJson += "\"totalPnL\":" + DoubleToString(g_TotalPnL, 2) + ",";
    metricsJson += "\"maxDrawdown\":" + DoubleToString(g_MaxDrawdown, 2) + ",";
    metricsJson += "\"tradingDays\":" + IntegerToString(g_TradingDays) + ",";
    metricsJson += "\"phase\":\"" + ACCOUNT_PHASE + "\",";
    metricsJson += "\"ruleViolations\":{";
    metricsJson += "\"dailyLoss\":" + (g_DailyLossViolated ? "true" : "false") + ",";
    metricsJson += "\"maxLoss\":" + (g_MaxLossViolated ? "true" : "false") + ",";
    metricsJson += "\"maxDrawdown\":" + (g_MaxDrawdownViolated ? "true" : "false");
    metricsJson += "},";
    metricsJson += "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
    metricsJson += "}";
    
    string payload = "{\"account\":" + accountData + ",\"metrics\":" + metricsJson + "}";
    
    SendHTTPRequest(payload);
    g_LastSyncTime = TimeCurrent();
}

//+------------------------------------------------------------------+
//| Send HTTP Request                                              |
//+------------------------------------------------------------------+
bool SendHTTPRequest(string payload)
{
    string headers = "Content-Type: application/json\r\n";
    if(API_KEY != "") headers += "X-API-Key: " + API_KEY + "\r\n";
    
    char data[];
    char result[];
    string resultString;
    
    // Converti payload in array di char
    int dataLength = StringToCharArray(payload, data, 0, -1, CP_UTF8) - 1;
    if(dataLength < 0) 
    {
        Print("❌ Errore conversione payload");
        return false;
    }
    
    // Ridimensiona array
    ArrayResize(data, dataLength);
    
    int res = WebRequest("POST", API_URL, headers, TIMEOUT_MS, data, result, resultString);
    
    if(res == 200 || res == 201)
    {
        if(ENABLE_DETAILED_LOGGING)
        {
            Print("✅ Dati inviati con successo - Codice: ", res);
        }
        return true;
    }
    else
    {
        Print("❌ Errore invio dati - Codice: ", res);
        Print("   Payload size: ", dataLength, " bytes");
        Print("   Response: ", resultString);
        if(ENABLE_DETAILED_LOGGING && StringLen(payload) < 500)
        {
            Print("   Payload: ", payload);
        }
        return false;
    }
}

//+------------------------------------------------------------------+
//| Update Dashboard Info                                          |
//+------------------------------------------------------------------+
void UpdateDashboardInfo()
{
    string info = "PROP CONTROL - " + PROP_FIRM_NAME + " [" + ACCOUNT_PHASE + "]";
    info += "\nEquity: $" + DoubleToString(g_CurrentEquity, 2);
    info += " | P&L: $" + DoubleToString(g_TotalPnL, 2);
    info += "\nDrawdown: " + DoubleToString(g_CurrentDrawdown, 2) + "%";
    info += " | Daily: $" + DoubleToString(g_CurrentDailyPnL, 2);
    
    if(g_ProfitTargetReached) info += "\n🎉 TARGET RAGGIUNTO!";
    if(CheckRuleViolations()) info += "\n🚨 VIOLAZIONI ATTIVE";
    
    Comment(info);
}

//+------------------------------------------------------------------+
//| Utility Functions                                             |
//+------------------------------------------------------------------+

// Semplifica stringa per JSON - rimuove caratteri problematici
string CleanJsonString(string inputStr)
{
    string output = inputStr;
    
    // Sostituisce caratteri problematici con spazi o li rimuove
    for(int i = 0; i < StringLen(output); i++)
    {
        ushort ch = StringGetCharacter(output, i);
        if(ch == '"' || ch == '\\' || ch == '\n' || ch == '\r' || ch == '\t')
        {
            StringSetCharacter(output, i, ' '); // Sostituisce con spazio
        }
    }
    
    return output;
}

bool IsWeekendTime(datetime time)
{
    MqlDateTime timeStruct;
    TimeToStruct(time, timeStruct);
    int dayOfWeek = timeStruct.day_of_week;
    return (dayOfWeek == 0 || dayOfWeek == 6); // Domenica o Sabato
}

//+------------------------------------------------------------------+