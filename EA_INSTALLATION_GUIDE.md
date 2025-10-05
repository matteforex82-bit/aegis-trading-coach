# 📘 AEGIS Trading Coach - Expert Advisor Installation Guide

## 🎯 Overview

This guide will help you install and configure the AEGIS Trading Coach Expert Advisor (EA) for **MT4** and **MT5** to automatically sync your trading data to the web dashboard.

---

## 📋 What You'll Need

- MetaTrader 4 or MetaTrader 5 installed
- AEGIS Trading Coach dashboard URL: `https://aegis-trading-coach.vercel.app`
- The EA files:
  - `PropControlExporter.mq5` (for MT5)
  - `PropControlExporter.mq4` (for MT4)

---

## 🔧 Installation Steps

### For MetaTrader 5 (MT5)

#### 1️⃣ Copy the EA file

1. Open MetaTrader 5
2. Click **File** → **Open Data Folder**
3. Navigate to: `MQL5/Experts/`
4. Copy `PropControlExporter.mq5` into this folder

#### 2️⃣ Compile the EA (optional but recommended)

1. In MT5, press **F4** or click **Tools** → **MetaQuotes Language Editor**
2. In the Navigator, expand **Experts**
3. Find and double-click `PropControlExporter.mq5`
4. Click **Compile** button (or press F7)
5. Check for "0 errors, 0 warnings" in the output

#### 3️⃣ Configure WebRequest permissions

**IMPORTANT:** MT5 blocks web requests by default for security.

1. In MT5, click **Tools** → **Options**
2. Go to **Expert Advisors** tab
3. Check ✅ **Allow WebRequest for listed URL:**
4. Add the following URL:
   ```
   https://aegis-trading-coach.vercel.app
   ```
5. Click **OK**

#### 4️⃣ Attach EA to chart

1. In the **Navigator** window (Ctrl+N), expand **Expert Advisors**
2. Find **PropControlExporter**
3. Drag and drop it onto any chart (the symbol doesn't matter)
4. A settings window will appear - **see Configuration section below**
5. Click **OK**

---

### For MetaTrader 4 (MT4)

#### 1️⃣ Copy the EA file

1. Open MetaTrader 4
2. Click **File** → **Open Data Folder**
3. Navigate to: `MQL4/Experts/`
4. Copy `PropControlExporter.mq4` into this folder

#### 2️⃣ Compile the EA (optional but recommended)

1. In MT4, press **F4** or click **Tools** → **MetaEditor**
2. In the Navigator, expand **Experts**
3. Find and double-click `PropControlExporter.mq4`
4. Click **Compile** button (or press F7)
5. Check for "0 errors, 0 warnings" in the output

#### 3️⃣ Configure WebRequest permissions

**IMPORTANT:** MT4 blocks web requests by default for security.

1. In MT4, click **Tools** → **Options**
2. Go to **Expert Advisors** tab
3. Check ✅ **Allow WebRequest for listed URL:**
4. Add the following URL:
   ```
   https://aegis-trading-coach.vercel.app
   ```
5. Click **OK**

#### 4️⃣ Attach EA to chart

1. In the **Navigator** window (Ctrl+N), expand **Expert Advisors**
2. Find **PropControlExporter**
3. Drag and drop it onto any chart
4. A settings window will appear - **see Configuration section below**
5. Click **OK**

---

## ⚙️ EA Configuration Settings

When you attach the EA, you'll see these parameters:

### Basic Settings

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| **API_URL** | `https://aegis-trading-coach.vercel.app/api/ingest/mt5` | Dashboard API endpoint (don't change unless using custom domain) |
| **SYNC_INTERVAL_SECONDS** | `60` | How often to sync data (in seconds). Recommended: 60-300 |
| **ENABLE_LOGGING** | `true` | Show detailed logs in Expert tab (helpful for debugging) |
| **SYNC_OPEN_POSITIONS** | `true` | Sync live open positions in real-time |
| **SYNC_CLOSED_TRADES** | `true` | Sync historical closed trades |
| **SYNC_METRICS** | `true` | Sync account metrics (balance, equity, drawdown) |

### PropFirm Settings (Optional)

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| **PROP_FIRM_NAME** | `""` (empty) | Your prop firm name (e.g., "FTMO", "The5ers", "MyForexFunds") |
| **ACCOUNT_PHASE** | `"DEMO"` | Current challenge phase: `DEMO`, `PHASE_1`, `PHASE_2`, `FUNDED`, `VERIFICATION` |
| **ACCOUNT_START_BALANCE** | `0` | Starting balance for drawdown calculation (0 = auto-detect) |

### Recommended Settings

**For Live Accounts:**
- SYNC_INTERVAL_SECONDS: `120` (2 minutes)
- SYNC_OPEN_POSITIONS: `true`
- SYNC_CLOSED_TRADES: `true`
- ENABLE_LOGGING: `false` (to reduce log clutter)

**For Prop Firm Challenges:**
- SYNC_INTERVAL_SECONDS: `60` (1 minute - for real-time monitoring)
- SYNC_OPEN_POSITIONS: `true`
- SYNC_METRICS: `true`
- PROP_FIRM_NAME: Set to your firm (e.g., "FTMO")
- ACCOUNT_PHASE: Set to current phase (e.g., "PHASE_1")
- ACCOUNT_START_BALANCE: Set to challenge starting balance (e.g., 100000)

**For Demo/Testing:**
- SYNC_INTERVAL_SECONDS: `60`
- ENABLE_LOGGING: `true`
- All sync options: `true`

---

## ✅ Verification

After attaching the EA, check the **Expert** tab (Terminal window → Expert tab):

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║          AEGIS TRADING COACH - MT5 EXPORTER v3.0            ║
╚═══════════════════════════════════════════════════════════════╝
🔗 Dashboard URL: https://aegis-trading-coach.vercel.app/api/ingest/mt5
⏱️  Sync Interval: 60 seconds
📊 Account: 12345678 (YourBroker-Server)
🔍 Performing health check...
✅ Health check passed: {"status":"healthy",...}
✅ EA initialized successfully - monitoring started
```

After the first sync interval (default 60 seconds):
```
⏰ Sync interval reached - starting sync #1
📊 Syncing live metrics...
🔴 Found 2 open positions
✅ METRICS sync successful
📥 Response: {"success":true,"message":"Metrics processed successfully"}
```

---

## 🔍 Troubleshooting

### ❌ "WebRequest error" message

**Problem:** EA can't connect to dashboard

**Solution:**
1. Go to **Tools** → **Options** → **Expert Advisors**
2. Make sure the URL is added to allowed list:
   ```
   https://aegis-trading-coach.vercel.app
   ```
3. Restart MT4/MT5
4. Re-attach the EA

### ❌ "Health check failed"

**Problem:** Dashboard API is unreachable

**Solutions:**
- Check your internet connection
- Verify the API_URL is correct
- Try accessing the dashboard in your browser: https://aegis-trading-coach.vercel.app
- The EA will continue working and retry automatically

### ❌ "Service temporarily unavailable (503)"

**Problem:** Database plan limit reached or temporary outage

**Solution:**
- This is normal if using free database tier
- EA will automatically retry
- Data will sync once service is available

### ❌ No data appearing in dashboard

**Checklist:**
1. ✅ EA is attached to chart (smiley face icon in top-right corner)
2. ✅ "Expert Advisors" button is enabled in MT4/MT5 toolbar
3. ✅ WebRequest URL is whitelisted
4. ✅ Check Expert tab for error messages
5. ✅ Wait at least 1 sync interval (60 seconds by default)
6. ✅ Login to dashboard with same account number shown in MT4/MT5

### ⚠️ EA stopped working after restarting MT4/MT5

**Solution:**
- EA must be re-attached to chart after MT4/MT5 restart
- To auto-start: Save a template or chart profile with EA attached

---

## 📊 What Data Gets Synced?

### Live Metrics (every SYNC_INTERVAL_SECONDS)
- Account balance
- Account equity
- Current drawdown %
- Daily P&L
- Open positions (symbol, volume, P&L, SL/TP)

### Closed Trades (every 5 minutes)
- Trade history (last 30 days for MT5, last 100 trades for MT4)
- Entry/exit prices
- Profit/loss
- Commission and swap
- Trade duration

### Account Info
- Login number
- Broker name
- Server name
- Currency
- PropFirm info (if configured)

---

## 🔒 Privacy & Security

- **Data Transfer:** All data is sent via HTTPS (encrypted)
- **API Endpoint:** Only sends to your configured dashboard URL
- **No Third Parties:** Data goes directly to your AEGIS dashboard
- **Source Code:** EA source code is included - you can review it anytime

---

## 🎯 Next Steps

1. ✅ Install and configure EA (you're here!)
2. 🌐 Open dashboard: https://aegis-trading-coach.vercel.app
3. 🔐 Login with admin credentials
4. 📊 View your trading data in real-time
5. 📈 Monitor your challenge progress (if using PropFirm features)

---

## 💡 Tips

- **Multiple Accounts:** You can run the EA on multiple MT4/MT5 instances - each account will appear separately in the dashboard
- **VPS Usage:** If using a VPS, install the EA there for 24/7 syncing
- **Backup:** Keep a copy of your EA files in a safe location
- **Updates:** Check for EA updates periodically for new features

---

## 🆘 Support

If you encounter issues:

1. Check the **Expert** tab for error messages
2. Enable `ENABLE_LOGGING = true` for detailed logs
3. Verify WebRequest URL is whitelisted
4. Check your internet connection
5. Try restarting MT4/MT5

---

**Made with ❤️ by AEGIS Trading Coach Team**
