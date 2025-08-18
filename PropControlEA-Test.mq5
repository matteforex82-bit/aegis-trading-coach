//+------------------------------------------------------------------+
//|                                            PropControlEA-Test.mq5 |
//|                              Test version to debug payload       |
//+------------------------------------------------------------------+
#property version   "1.00"
#property description "Test EA for payload analysis"

// API Configuration
input string   API_URL = "https://new2dash.vercel.app/api/ingest/test";
input int      TIMEOUT_MS = 10000;

// Test parameters
input string   PROP_FIRM_NAME = "FTMO";
input string   ACCOUNT_PHASE = "PHASE_1";
input double   START_BALANCE = 50000.0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("🧪 PROP CONTROL TEST EA inizializzato");
    Print("📡 API URL: ", API_URL);
    
    // Test con payload reale
    TestRealPayload();
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Test Real Payload                                             |
//+------------------------------------------------------------------+
void TestRealPayload()
{
    Print("🚀 Creando payload reale per test...");
    
    // Simula il payload che normalmente invia l'EA
    string accountData = BuildAccountJSON();
    string tradeData = BuildSampleTradeJSON();
    string payload = "{\"account\":" + accountData + ",\"trades\":[" + tradeData + "]}";
    
    Print("📤 Payload size:", StringLen(payload), " characters");
    Print("📄 Payload:", payload);
    
    // Invia richiesta
    string headers = "Content-Type: application/json\r\n";
    char data[];
    char result[];
    string resultString;
    
    int dataLength = StringToCharArray(payload, data, 0, -1, CP_UTF8) - 1;
    if(dataLength < 0) dataLength = 0;
    ArrayResize(data, dataLength);
    
    int res = WebRequest("POST", API_URL, headers, TIMEOUT_MS, data, result, resultString);
    
    Print("📊 Codice risposta:", res);
    Print("📄 Risposta:", resultString);
    
    if(res == 200)
    {
        Print("✅ Test payload SUCCESS!");
    }
    else
    {
        Print("❌ Test payload FAILED!");
    }
}

//+------------------------------------------------------------------+
//| Build Account JSON                                             |
//+------------------------------------------------------------------+
string BuildAccountJSON()
{
    long login = AccountInfoInteger(ACCOUNT_LOGIN);
    string name = AccountInfoString(ACCOUNT_NAME);
    string server = AccountInfoString(ACCOUNT_SERVER);
    string broker = AccountInfoString(ACCOUNT_COMPANY);
    string currency = AccountInfoString(ACCOUNT_CURRENCY);
    
    string json = "{";
    json += "\"login\":\"" + IntegerToString(login) + "\",";
    json += "\"name\":\"" + name + "\",";
    json += "\"broker\":\"" + broker + "\",";
    json += "\"server\":\"" + server + "\",";
    json += "\"currency\":\"" + currency + "\",";
    json += "\"timezone\":\"Europe/Rome\",";
    json += "\"propFirm\":\"" + PROP_FIRM_NAME + "\",";
    json += "\"phase\":\"" + ACCOUNT_PHASE + "\",";
    json += "\"startBalance\":" + DoubleToString(START_BALANCE, 2) + ",";
    json += "\"currentBalance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2);
    json += "}";
    
    return json;
}

//+------------------------------------------------------------------+
//| Build Sample Trade JSON                                       |
//+------------------------------------------------------------------+
string BuildSampleTradeJSON()
{
    string json = "{";
    json += "\"ticket_id\":\"12345678\",";
    json += "\"symbol\":\"BTCUSD\",";
    json += "\"side\":\"buy\",";
    json += "\"volume\":0.1,";
    json += "\"price\":60000.0,";
    json += "\"open_time\":\"2025.08.19 01:00:00\",";
    json += "\"pnl\":-833.91,";
    json += "\"commission\":0.0,";
    json += "\"swap\":0.0,";
    json += "\"comment\":\"test trade\",";
    json += "\"magic\":0,";
    json += "\"phase\":\"" + ACCOUNT_PHASE + "\",";
    json += "\"equityAtClose\":49167.09,";
    json += "\"drawdownAtClose\":1.67,";
    json += "\"dailyPnLAtClose\":-833.91,";
    json += "\"violatesRules\":false,";
    json += "\"isWeekendTrade\":false";
    json += "}";
    
    return json;
}