// Test EA sync after cleanup
const testPayload = {
  "account": {
    "login": "2958",
    "name": "matteo negrini",
    "broker": "Blue Chip Broker (Pty) Ltd",
    "server": "BlueChip-Server",
    "currency": "USD",
    "balance": 50000.00,
    "equity": 52383.80,
    "propFirm": "FTMO",
    "phase": "PHASE_1",
    "startBalance": 50000.00
  },
  "metrics": {
    "equity": 52383.80,
    "balance": 50000.00,
    "margin": 1500.00,
    "phase": "PHASE_1",
    "timestamp": new Date().toISOString()
  },
  "openPositions": [
    {
      "ticket_id": "193548",
      "symbol": "AUDUSD.p",
      "side": "sell",
      "volume": 0.80,
      "open_price": 0.65187,
      "open_time": "2025-08-07 08:14:01",
      "pnl": 561.20,
      "swap": 0.00,
      "commission": 0.00,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    },
    {
      "ticket_id": "193550", 
      "symbol": "NZDUSD.p",
      "side": "sell",
      "volume": 0.80,
      "open_price": 0.59518,
      "open_time": "2025-08-07 08:14:14",
      "pnl": 988.80,
      "swap": 0.00,
      "commission": 0.00,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    },
    {
      "ticket_id": "193586",
      "symbol": "USDCAD.p", 
      "side": "buy",
      "volume": 0.80,
      "open_price": 1.37297,
      "open_time": "2025-08-07 08:19:59",
      "pnl": 813.80,
      "swap": 0.00,
      "commission": 0.00,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    },
    {
      "ticket_id": "162527",
      "symbol": "XAGUSD.p",
      "side": "buy",
      "volume": 0.50,
      "open_price": 28.85,
      "open_time": "2025-08-06 10:30:00",
      "pnl": 1020.00,
      "swap": 0.00,
      "commission": 0.00,
      "comment": "Test position",
      "magic": 0,
      "phase": "PHASE_1"
    }
  ]
}

async function testSync() {
  try {
    console.log('🧪 Testing EA sync with 4 positions (including XAGUSD #162527)...')
    
    const response = await fetch('http://localhost:3008/api/ingest/mt5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })
    
    const result = await response.json()
    
    console.log('📊 Response Status:', response.status)
    console.log('📋 Response Body:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('✅ Sync test completed successfully!')
    } else {
      console.log('❌ Sync test failed:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

if (require.main === module) {
  testSync()
}

module.exports = { testSync, testPayload }