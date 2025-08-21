// Test nuovo formato EA
const testNewEAFormat = async () => {
  try {
    console.log('🧪 Testing NEW EA Format with Risk Analysis...')
    
    // Simula il payload del nuovo EA con formato completo
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
          "symbol": "AUDUSD.p",
          "ticket": "193548",
          "time": "2025.08.07 08:14:01",
          "type": "sell",
          "volume": 0.80,
          "price_open": 0.65187,
          "stop_loss": 0.65500, // ✅ HAS Stop Loss
          "take_profit": 0.64800,
          "price_current": 0.65010,
          "value": 52008.0,
          "swap": -2.50,
          "profit": 561.20,
          "change_percent": 0.27,
          "magic": 0,
          "comment": "",
          "phase": "PHASE_1"
        },
        {
          "symbol": "NZDUSD.p", 
          "ticket": "193550",
          "time": "2025.08.07 08:14:14",
          "type": "sell", 
          "volume": 0.80,
          "price_open": 0.59518,
          "stop_loss": 0.0, // ❌ NO Stop Loss
          "take_profit": 0.58900,
          "price_current": 0.59285,
          "value": 47428.0,
          "swap": 0.00,
          "profit": 988.80,
          "change_percent": 0.39,
          "magic": 0,
          "comment": "",
          "phase": "PHASE_1"
        },
        {
          "symbol": "USDCAD.p",
          "ticket": "193586",
          "time": "2025.08.07 08:19:59", 
          "type": "buy",
          "volume": 0.80,
          "price_open": 1.37297,
          "stop_loss": 0.0, // ❌ NO Stop Loss
          "take_profit": 1.38000,
          "price_current": 1.37398,
          "value": 109918.4,
          "swap": 0.00,
          "profit": 813.80,
          "change_percent": 0.07,
          "magic": 0,
          "comment": "",
          "phase": "PHASE_1"
        },
        {
          "symbol": "XAGUSD.p",
          "ticket": "162527", 
          "time": "2025.08.01 10:30:00",
          "type": "buy",
          "volume": 0.50,
          "price_open": 28.85,
          "stop_loss": 28.50, // ✅ HAS Stop Loss
          "take_profit": 29.50,
          "price_current": 30.89,
          "value": 15445.0,
          "swap": -25.00,
          "profit": 1020.00,
          "change_percent": 7.07,
          "magic": 0,
          "comment": "Test position",
          "phase": "PHASE_1"
        }
      ]
    }
    
    console.log('📤 Sending NEW format to API...')
    const response = await fetch('http://localhost:3013/api/ingest/mt5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })
    
    const result = await response.json()
    
    console.log('📊 Sync Response Status:', response.status)
    console.log('📋 Sync Response Body:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('✅ NEW EA Format sync successful!')
      
      // Wait a moment then test risk analysis
      setTimeout(async () => {
        console.log('\n🔍 Testing Risk Analysis after sync...')
        
        const accountId = 'cmej2fx5s0001wf3gkmbktejc'
        const riskResponse = await fetch(`http://localhost:3013/api/accounts/${accountId}/risk-analysis`)
        
        if (riskResponse.ok) {
          const riskResult = await riskResponse.json()
          const { riskMetrics } = riskResult
          
          console.log('\n🎯 NEW FORMAT Risk Analysis:')
          console.log(`   Risk Level: ${riskMetrics.riskLevel}`)
          console.log(`   Exposure: ${riskMetrics.totalExposurePercent.toFixed(2)}%`)
          console.log(`   Trades without SL: ${riskMetrics.tradesWithoutSL.length}`)
          
          if (riskMetrics.tradesWithoutSL.length > 0) {
            console.log('\n❌ Positions without Stop Loss:')
            riskMetrics.tradesWithoutSL.forEach((trade, i) => {
              console.log(`   ${i + 1}. ${trade.symbol} #${trade.ticketId} (SL: ${trade.sl || 'NONE'})`)
            })
          }
          
          if (riskMetrics.alerts.length > 0) {
            console.log('\n🚨 Risk Alerts:')
            riskMetrics.alerts.forEach((alert, i) => {
              console.log(`   ${i + 1}. [${alert.severity}] ${alert.message}`)
            })
          }
        } else {
          console.log('❌ Risk analysis failed')
        }
      }, 2000)
      
    } else {
      console.log('❌ NEW EA Format sync failed:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testNewEAFormat()