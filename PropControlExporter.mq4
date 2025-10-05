//+------------------------------------------------------------------+
//|                                          PropControlExporter.mq4 |
//|                                    AEGIS Trading Coach MT4 EA    |
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
   Print("║          AEGIS TRADING COACH - MT4 EXPORTER v3.0            ║");
   Print("╚═══════════════════════════════════════════════════════════════╝");
   Print("🔗 Dashboard URL: ", API_URL);
   Print("⏱️  Sync Interval: ", SYNC_INTERVAL_SECONDS, " seconds");
   Print("📊 Account: ", AccountNumber(), " (", AccountServer(), ")");

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
   int res = WebRequest("GET", healthUrl, NULL, NULL, timeout, data, 0, result, headers);

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
   int totalOrders = OrdersHistoryTotal();
   if (totalOrders == 0) {
      if (ENABLE_LOGGING) Print("ℹ️ No closed trades found");
      return;
   }

   if (ENABLE_LOGGING) Print("📋 Found ", totalOrders, " orders in history");

   // Build trades array (last 100 trades max)
   string tradesJson = "[";
   int tradesAdded = 0;
   int maxTrades = 100;

   for (int i = totalOrders - 1; i >= 0 && tradesAdded < maxTrades; i--)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;

      // Only process closed market orders
      if (OrderType() != OP_BUY && OrderType() != OP_SELL) continue;
      if (OrderCloseTime() == 0) continue;

      if (tradesAdded > 0) tradesJson += ",";
      tradesJson += GetOrderJson();
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
   json += "\"login\":\"" + IntegerToString(AccountNumber()) + "\",";
   json += "\"name\":\"" + AccountName() + "\",";
   json += "\"broker\":\"" + AccountCompany() + "\",";
   json += "\"server\":\"" + AccountServer() + "\",";
   json += "\"currency\":\"" + AccountCurrency() + "\",";

   // PropFirm fields
   if (StringLen(PROP_FIRM_NAME) > 0) {
      json += "\"propFirm\":\"" + PROP_FIRM_NAME + "\",";
   }
   if (StringLen(ACCOUNT_PHASE) > 0) {
      json += "\"phase\":\"" + ACCOUNT_PHASE + "\",";
   }
   if (ACCOUNT_START_BALANCE > 0) {
      json += "\"startBalance\":" + DoubleToStr(ACCOUNT_START_BALANCE, 2) + ",";
   }

   json += "\"currentBalance\":" + DoubleToStr(AccountBalance(), 2);
   json += "}";

   return json;
}

//+------------------------------------------------------------------+
//| Get account metrics as JSON                                      |
//+------------------------------------------------------------------+
string GetMetricsJson()
{
   double balance = AccountBalance();
   double equity = AccountEquity();
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
   json += "\"balance\":" + DoubleToStr(balance, 2) + ",";
   json += "\"equity\":" + DoubleToStr(equity, 2) + ",";
   json += "\"drawdown\":" + DoubleToStr(drawdown, 2) + ",";
   json += "\"dailyPnL\":" + DoubleToStr(dailyPnL, 2) + ",";
   json += "\"totalPnL\":" + DoubleToStr(totalPnL, 2) + ",";
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

   for (int i = 0; i < OrdersTotal(); i++)
   {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;

      // Only open market orders
      if (OrderType() != OP_BUY && OrderType() != OP_SELL) continue;

      if (positionsAdded > 0) json += ",";

      int ticket = OrderTicket();
      string symbol = OrderSymbol();
      int type = OrderType();
      double volume = OrderLots();
      double openPrice = OrderOpenPrice();
      double currentPrice = (type == OP_BUY) ? MarketInfo(symbol, MODE_BID) : MarketInfo(symbol, MODE_ASK);
      double sl = OrderStopLoss();
      double tp = OrderTakeProfit();
      double profit = OrderProfit();
      double swap = OrderSwap();
      double commission = OrderCommission();
      datetime openTime = OrderOpenTime();
      int magic = OrderMagicNumber();
      string comment = OrderComment();

      json += "{";
      json += "\"ticket_id\":\"" + IntegerToString(ticket) + "\",";
      json += "\"symbol\":\"" + symbol + "\",";
      json += "\"side\":\"" + ((type == OP_BUY) ? "buy" : "sell") + "\",";
      json += "\"volume\":" + DoubleToStr(volume, 2) + ",";
      json += "\"open_price\":" + DoubleToStr(openPrice, 5) + ",";
      json += "\"price_open\":" + DoubleToStr(openPrice, 5) + ",";
      json += "\"stop_loss\":" + DoubleToStr(sl, 5) + ",";
      json += "\"take_profit\":" + DoubleToStr(tp, 5) + ",";
      json += "\"pnl\":" + DoubleToStr(profit, 2) + ",";
      json += "\"profit\":" + DoubleToStr(profit, 2) + ",";
      json += "\"swap\":" + DoubleToStr(swap, 2) + ",";
      json += "\"commission\":" + DoubleToStr(commission, 2) + ",";
      json += "\"open_time\":\"" + TimeToStr(openTime, TIME_DATE|TIME_SECONDS) + "\",";
      json += "\"time\":\"" + TimeToStr(openTime, TIME_DATE|TIME_SECONDS) + "\",";
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
//| Get order info as JSON                                           |
//+------------------------------------------------------------------+
string GetOrderJson()
{
   int ticket = OrderTicket();
   string symbol = OrderSymbol();
   int type = OrderType();
   double volume = OrderLots();
   double openPrice = OrderOpenPrice();
   double closePrice = OrderClosePrice();
   double sl = OrderStopLoss();
   double tp = OrderTakeProfit();
   double commission = OrderCommission();
   double swap = OrderSwap();
   double profit = OrderProfit();
   datetime openTime = OrderOpenTime();
   datetime closeTime = OrderCloseTime();
   int magic = OrderMagicNumber();
   string comment = OrderComment();

   string json = "{";
   json += "\"ticket_id\":\"" + IntegerToString(ticket) + "\",";
   json += "\"position_id\":\"" + IntegerToString(ticket) + "\",";
   json += "\"order_id\":\"" + IntegerToString(ticket) + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"side\":\"" + ((type == OP_BUY) ? "buy" : "sell") + "\",";
   json += "\"volume\":" + DoubleToStr(volume, 2) + ",";
   json += "\"open_time\":\"" + TimeToStr(openTime, TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"open_price\":" + DoubleToStr(openPrice, 5) + ",";
   json += "\"close_time\":\"" + TimeToStr(closeTime, TIME_DATE|TIME_SECONDS) + "\",";
   json += "\"close_price\":" + DoubleToStr(closePrice, 5) + ",";
   json += "\"sl\":" + DoubleToStr(sl, 5) + ",";
   json += "\"tp\":" + DoubleToStr(tp, 5) + ",";
   json += "\"commission\":" + DoubleToStr(commission, 2) + ",";
   json += "\"swap\":" + DoubleToStr(swap, 2) + ",";
   json += "\"pnl_gross\":" + DoubleToStr(profit, 2) + ",";
   json += "\"pnl\":" + DoubleToStr(profit, 2) + ",";
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
   ArrayResize(data, StringLen(payload));

   string headers = "Content-Type: application/json\r\n";

   int timeout = 10000; // 10 seconds
   int res = WebRequest("POST", API_URL, NULL, NULL, timeout, data, ArraySize(data), result, headers);

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
