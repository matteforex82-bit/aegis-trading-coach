//+------------------------------------------------------------------+
//|                                            PropControlEA-Simple.mq5 |
//|                              Simple test version for debugging     |
//+------------------------------------------------------------------+
#property version   "1.00"
#property description "Simple test EA for PROP CONTROL debugging"

// API Configuration
input string   API_URL = "https://new2dash-arujtlgab-matteo-negrinis-projects.vercel.app/api/ingest/simple";
input int      TIMEOUT_MS = 10000;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("🧪 PROP CONTROL SIMPLE TEST EA inizializzato");
    Print("📡 API URL: ", API_URL);
    
    // Test immediato al caricamento
    TestSimpleEndpoint();
    
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Test Simple Endpoint                                           |
//+------------------------------------------------------------------+
void TestSimpleEndpoint()
{
    Print("🚀 Testando endpoint simple...");
    
    // Crea payload di test semplice
    string testPayload = "{";
    testPayload += "\"test\": true,";
    testPayload += "\"timestamp\": \"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\",";
    testPayload += "\"account\": {";
    testPayload += "\"login\": \"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    testPayload += "\"broker\": \"" + AccountInfoString(ACCOUNT_COMPANY) + "\"";
    testPayload += "},";
    testPayload += "\"message\": \"Simple test from EA\"";
    testPayload += "}";
    
    Print("📤 Payload:", testPayload);
    
    // Invia richiesta
    string headers = "Content-Type: application/json\r\n";
    char data[];
    char result[];
    string resultString;
    
    int dataLength = StringToCharArray(testPayload, data, 0, -1, CP_UTF8) - 1;
    if(dataLength < 0) dataLength = 0;
    ArrayResize(data, dataLength);
    
    int res = WebRequest("POST", API_URL, headers, TIMEOUT_MS, data, result, resultString);
    
    Print("📊 Codice risposta: ", res);
    Print("📄 Risposta: ", resultString);
    
    if(res == 200)
    {
        Print("✅ Test SIMPLE endpoint SUCCESS!");
    }
    else
    {
        Print("❌ Test SIMPLE endpoint FAILED!");
        
        // Suggerimenti debug
        if(res == 0)
            Print("   💡 Verifica connessione internet");
        else if(res == 404)
            Print("   💡 Endpoint non trovato - verifica URL");
        else if(res == 500)
            Print("   💡 Errore server interno - verifica logs");
    }
}

//+------------------------------------------------------------------+
//| Timer per test ripetuti                                        |
//+------------------------------------------------------------------+
void OnTimer()
{
    TestSimpleEndpoint();
}

//+------------------------------------------------------------------+
//| Test button per test manuale                                   |
//+------------------------------------------------------------------+
void OnTick()
{
    // Test ogni 60 secondi  
    static datetime lastTest = 0;
    if(TimeCurrent() - lastTest > 60)
    {
        TestSimpleEndpoint();
        lastTest = TimeCurrent();
    }
}