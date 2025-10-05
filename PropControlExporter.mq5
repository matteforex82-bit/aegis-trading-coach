//+------------------------------------------------------------------+
//|                                          PropControlExporter.mq5 |
//|                                    AEGIS Trading Coach MT5 EA    |
//|                     Exports trading data to AEGIS web dashboard  |
//+------------------------------------------------------------------+
#property copyright "AEGIS Trading Coach"
#property link      "https://aegis-trading-coach.vercel.app"
#property version   "3.0"
#property strict

//--- Input parameters
input string API_URL = "https://aegis-trading-coach.vercel.app/api/ingest/mt5";  // Dashboard URL
input int    SYNC_INTERVAL_SECONDS = 60;        // Sync interval (seconds) - recommended: 60-300
input bool   ENABLE_LOGGING = true;             // Enable detailed logging
input bool   SYNC_OPEN_POSITIONS = true;        // Sync live open positions
input bool   SYNC_CLOSED_TRADES = true;         // Sync historical closed trades
input bool   SYNC_METRICS = true;               // Sync account metrics (balance, equity, drawdown)

// PropFirm Configuration (optional)
input string PROP_FIRM_NAME = "";                // Prop firm name (e.g., "FTMO", "The5ers")
input string ACCOUNT_PHASE = "DEMO";             // Current phase: DEMO, PHASE_1, PHASE_2, FUNDED
input double ACCOUNT_START_BALANCE = 0;          // Starting balance (0 = auto-detect)

//--- Global variables
datetime lastSyncTime = 0;
datetime lastTradesSyncTime = 0;
int syncCounter = 0;
bool healthCheckDone = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("╔═══════════════════════════════════════════════════════════════╗");
   Print("║          AEGIS TRADING COACH - MT5 EXPORTER v3.0            ║");
   Print("╚═══════════════════════════════════════════════════════════════╝");
   Print("🔗 Dashboard URL: ", API_URL);
   Print("⏱️  Sync Interval: ", SYNC_INTERVAL_SECONDS, " seconds");
   Print("📊 Account: ", AccountInfoInteger(ACCOUNT_LOGIN), " (", AccountInfoString(ACCOUNT_SERVER), ")");

   // Initial health check
   if (!PerformHealthCheck()) {
      Print("⚠️ WARNING: Health check failed. Check your API_URL!");
      Print("💡 EA will continue and retry. Verify URL is correct.");
   }

   Print("✅ EA initialized successfully - monitoring started");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("🛑 AEGIS Exporter stopped. Total syncs: ", syncCounter);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check if it's time to sync
   datetime currentTime = TimeCurrent();

   if (currentTime - lastSyncTime >= SYNC_INTERVAL_SECONDS)
   {
      if (ENABLE_LOGGING) Print("⏰ Sync interval reached - starting sync #", syncCounter + 1);

      // Sync live metrics with open positions
      if (SYNC_METRICS) {
         SyncLiveMetrics();
      }

      lastSyncTime = currentTime;
      syncCounter++;
   }

   // Sync closed trades less frequently (every 5 minutes or when new trades detected)
   if (SYNC_CLOSED_TRADES && (currentTime - lastTradesSyncTime >= 300 || lastTradesSyncTime == 0))
   {
      if (ENABLE_LOGGING) Print("📋 Syncing closed trades...");
      SyncClosedTrades();
      lastTradesSyncTime = currentTime;
   }
}

//+------------------------------------------------------------------+
//| Perform health check on API endpoint                             |
//+------------------------------------------------------------------+
bool PerformHealthCheck()
{
   if (ENABLE_LOGGING) Print("🔍 Performing health check...");

   // Replace /api/ingest/mt5 with /api/ea-health
   string healthUrl = API_URL;
   StringReplace(healthUrl, "/api/ingest/mt5", "/api/ea-health");

   char data[];
   char result[];
   string headers = "Content-Type: application/json\r\n";

   int timeout = 5000; // 5 seconds
   int res = WebRequest("GET", healthUrl, headers, timeout, data, result, headers);

   if (res == 200) {
      string response = CharArrayToString(result);
      if (ENABLE_LOGGING) Print("✅ Health check passed: ", response);
      healthCheckDone = true;
      return true;
   } else {
      Print("❌ Health check failed with code: ", res);
      if (res == -1) {
         Print("⚠️ WebRequest error. Make sure URL is in Tools → Options → Expert Advisors → Allow WebRequest for: ", healthUrl);
      }
      return false;
   }
}

//+------------------------------------------------------------------+
//| Sync live account metrics with open positions                    |
//+------------------------------------------------------------------+
void SyncLiveMetrics()
{
   if (ENABLE_LOGGING) Print("📊 Syncing live metrics...");

   // Get account info
   string accountJson = GetAccountInfoJson();

   // Get metrics
   string metricsJson = GetMetricsJson();

   // Get open positions
   string openPositionsJson = "";
   if (SYNC_OPEN_POSITIONS) {
      openPositionsJson = GetOpenPositionsJson();
   }

   // Build complete JSON payload
   string payload = "{";
   payload += "\"account\":" + accountJson + ",";
   payload += "\"metrics\":" + metricsJson;

   if (SYNC_OPEN_POSITIONS && StringLen(openPositionsJson) > 2) {
      payload += ",\"openPositions\":" + openPositionsJson;
   }

   payload += "}";

   // Send to API
   SendToAPI(payload, "METRICS");
}

//+------------------------------------------------------------------+
//| Sync closed trades to API                                        |
//+------------------------------------------------------------------+
void SyncClosedTrades()
{
   // Select history for last 30 days
   datetime fromDate = TimeCurrent() - (30 * 24 * 3600);
   if (!HistorySelect(fromDate, TimeCurrent())) {
      if (ENABLE_LOGGING) Print("⚠️ Failed to select history");
      return;
   }

   int totalDeals = HistoryDealsTotal();
   if (totalDeals == 0) {
      if (ENABLE_LOGGING) Print("ℹ️ No closed trades found");
      return;
   }

   if (ENABLE_LOGGING) Print("📋 Found ", totalDeals, " deals in history");

   // Build trades array
   string tradesJson = "[";
   int tradesAdded = 0;

   for (int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if (ticket == 0) continue;

      // Only process IN/OUT deals (actual trades)
      ENUM_DEAL_ENTRY dealEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if (dealEntry != DEAL_ENTRY_IN && dealEntry != DEAL_ENTRY_OUT) continue;

      ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
      if (dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;

      if (tradesAdded > 0) tradesJson += ",";
      tradesJson += GetDealJson(ticket);
      tradesAdded++;
   }

   tradesJson += "]";

   if (tradesAdded == 0) {
      if (ENABLE_LOGGING) Print("ℹ️ No valid trades to sync");
      return;
   }

   // Build payload
   string accountJson = GetAccountInfoJson();
   string payload = "{\"account\":" + accountJson + ",\"trades\":" + tradesJson + "}";

   if (ENABLE_LOGGING) Print("📤 Sending ", tradesAdded, " trades to dashboard");
   SendToAPI(payload, "TRADES");
}

//+------------------------------------------------------------------+
//| Get account info as JSON                                         |
//+------------------------------------------------------------------+
string GetAccountInfoJson()
{
   string json = "{";
   json += "\"login\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   json += "\"name\":\"" + AccountInfoString(ACCOUNT_NAME) + "\",";
   json += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
   json += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
   json += "\"currency\":\"" + AccountInfoString(ACCOUNT_CURRENCY) + "\",";

   // PropFirm fields
   if (StringLen(PROP_FIRM_NAME) > 0) {
      json += "\"propFirm\":\"" + PROP_FIRM_NAME + "\",";
   }
   if (StringLen(ACCOUNT_PHASE) > 0) {
      json += "\"phase\":\"" + ACCOUNT_PHASE + "\",";
   }
   if (ACCOUNT_START_BALANCE > 0) {
      json += "\"startBalance\":" + DoubleToString(ACCOUNT_START_BALANCE, 2) + ",";
   }

   json += "\"currentBalance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2);
   json += "}";

   return json;
}

//+------------------------------------------------------------------+
//| Get account metrics as JSON                                      |
//+------------------------------------------------------------------+
string GetMetricsJson()
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double startBalance = (ACCOUNT_START_BALANCE > 0) ? ACCOUNT_START_BALANCE : balance;

   // Calculate drawdown
   double drawdown = 0;
   if (equity < startBalance) {
      drawdown = ((startBalance - equity) / startBalance) * 100;
   }

   // Calculate daily P&L (simplified - based on today's equity change)
   double dailyPnL = equity - balance;

   // Calculate total P&L
   double totalPnL = balance - startBalance;

   string json = "{";
   json += "\"balance\":" + DoubleToString(balance, 2) + ",";
   json += "\"equity\":" + DoubleToString(equity, 2) + ",";
   json += "\"drawdown\":" + DoubleToString(drawdown, 2) + ",";
   json += "\"dailyPnL\":" + DoubleToString(dailyPnL, 2) + ",";
   json += "\"totalPnL\":" + DoubleToString(totalPnL, 2) + ",";
   json += "\"phase\":\"" + ACCOUNT_PHASE + "\"";
   json += "}";

   return json;
}

//+------------------------------------------------------------------+
//| Get open positions as JSON array                                 |
//+------------------------------------------------------------------+
string GetOpenPositionsJson()
{
   string json = "[";
   int positionsAdded = 0;

   for (int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if (ticket == 0) continue;

      if (positionsAdded > 0) json += ",";

      string symbol = PositionGetString(POSITION_SYMBOL);
      long type = PositionGetInteger(POSITION_TYPE);
      double volume = PositionGetDouble(POSITION_VOLUME);
      double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      double profit = PositionGetDouble(POSITION_PROFIT);
      double swap = PositionGetDouble(POSITION_SWAP);
      datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
      long magic = PositionGetInteger(POSITION_MAGIC);
      string comment = PositionGetString(POSITION_COMMENT);

      json += "{";
      json += "\"ticket_id\":\"" + IntegerToString(ticket) + "\",";
      json += "\"symbol\":\"" + symbol + "\",";
      json += "\"side\":\"" + ((type == POSITION_TYPE_BUY) ? "buy" : "sell") + "\",";
      json += "\"volume\":" + DoubleToString(volume, 2) + ",";
      json += "\"open_price\":" + DoubleToString(openPrice, 5) + ",";
      json += "\"price_open\":" + DoubleToString(openPrice, 5) + ",";
      json += "\"stop_loss\":" + DoubleToString(sl, 5) + ",";
      json += "\"take_profit\":" + DoubleToString(tp, 5) + ",";
      json += "\"pnl\":" + DoubleToString(profit, 2) + ",";
      json += "\"profit\":" + DoubleToString(profit, 2) + ",";
      json += "\"swap\":" + DoubleToString(swap, 2) + ",";
      json += "\"open_time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\",";
      json += "\"time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\",";
      json += "\"magic\":" + IntegerToString(magic) + ",";
      json += "\"comment\":\"" + comment + "\",";
      json += "\"phase\":\"" + ACCOUNT_PHASE + "\"";
      json += "}";

      positionsAdded++;
   }

   json += "]";

   if (ENABLE_LOGGING && positionsAdded > 0) {
      Print("🔴 Found ", positionsAdded, " open positions");
   }

   return json;
}

//+------------------------------------------------------------------+
//| Get deal info as JSON                                            |
//+------------------------------------------------------------------+
string GetDealJson(ulong ticket)
{
   string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
   long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
   double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
   double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
   double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   datetime time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
   long magic = HistoryDealGetInteger(ticket, DEAL_MAGIC);
   long positionId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
   long orderId = HistoryDealGetInteger(ticket, DEAL_ORDER);
   string comment = HistoryDealGetString(ticket, DEAL_COMMENT);
   ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

   string json = "{";
   json += "\"ticket_id\":\"" + IntegerToString(ticket) + "\",";
   json += "\"position_id\":\"" + IntegerToString(positionId) + "\",";
   json += "\"order_id\":\"" + IntegerToString(orderId) + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"side\":\"" + ((type == DEAL_TYPE_BUY) ? "buy" : "sell") + "\",";
   json += "\"volume\":" + DoubleToString(volume, 2) + ",";

   // Determine if this is open or close
   if (entry == DEAL_ENTRY_IN) {
      json += "\"open_time\":\"" + TimeToString(time, TIME_DATE|TIME_SECONDS) + "\",";
      json += "\"open_price\":" + DoubleToString(price, 5) + ",";
      json += "\"close_time\":null,";
      json += "\"close_price\":null,";
   } else {
      json += "\"open_time\":\"" + TimeToString(time - 3600, TIME_DATE|TIME_SECONDS) + "\",";  // Approximate
      json += "\"open_price\":" + DoubleToString(price, 5) + ",";
      json += "\"close_time\":\"" + TimeToString(time, TIME_DATE|TIME_SECONDS) + "\",";
      json += "\"close_price\":" + DoubleToString(price, 5) + ",";
   }

   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   json += "\"swap\":" + DoubleToString(swap, 2) + ",";
   json += "\"pnl_gross\":" + DoubleToString(profit, 2) + ",";
   json += "\"pnl\":" + DoubleToString(profit, 2) + ",";
   json += "\"magic\":" + IntegerToString(magic) + ",";
   json += "\"comment\":\"" + comment + "\",";
   json += "\"phase\":\"" + ACCOUNT_PHASE + "\"";
   json += "}";

   return json;
}

//+------------------------------------------------------------------+
//| Send data to API endpoint                                        |
//+------------------------------------------------------------------+
void SendToAPI(string payload, string dataType)
{
   char data[];
   char result[];

   StringToCharArray(payload, data, 0, StringLen(payload));

   string headers = "Content-Type: application/json\r\n";

   int timeout = 10000; // 10 seconds
   int res = WebRequest("POST", API_URL, headers, timeout, data, result, headers);

   if (res == 200) {
      string response = CharArrayToString(result);
      if (ENABLE_LOGGING) {
         Print("✅ ", dataType, " sync successful");
         Print("📥 Response: ", response);
      }
   } else if (res == 503) {
      Print("⚠️ Service temporarily unavailable (503) - will retry next interval");
   } else {
      Print("❌ ", dataType, " sync failed with code: ", res);
      if (res == -1) {
         Print("⚠️ WebRequest error. Add this URL to allowed list:");
         Print("   Tools → Options → Expert Advisors → Allow WebRequest for: ", API_URL);
      } else {
         string response = CharArrayToString(result);
         Print("📥 Error response: ", response);
      }
   }
}
