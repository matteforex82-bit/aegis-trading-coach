// Test TRUE Safe Capacity - SCENARIO CRITICO
const testTrueSafeCapacity = async () => {
  try {
    console.log('🚨 Testing TRUE SAFE CAPACITY - CRITICAL SCENARIO...')
    
    // Scenario PERICOLOSO: Trader con profit ma SL che violerebbero il daily limit
    const testPayload = {
      "account": {
        "login": "2958",
        "name": "matteo negrini", 
        "broker": "Blue Chip Broker (Pty) Ltd",
        "server": "BlueChip-Server",
        "currency": "USD",
        "balance": 50000.00,
        "equity": 51500.00, // +$1500 floating profit
        "propFirm": "FTMO",
        "phase": "PHASE_1",
        "startBalance": 50000.00
      },
      "metrics": {
        "equity": 51500.00,
        "balance": 50000.00,
        "margin": 2000.00,
        "phase": "PHASE_1",
        "timestamp": new Date().toISOString()
      },
      "openPositions": [
        {
          "symbol": "EURUSD.p",
          "ticket": "400001",
          "time": "2025.08.21 14:00:00",
          "type": "buy",
          "volume": 2.0, // LOTTO GROSSO!
          "price_open": 1.08000,
          "stop_loss": 1.06500, // 150 pips SL = $3000 loss potential!
          "take_profit": 1.09000,
          "price_current": 1.08500, // +$1000 profit
          "value": 217000.0,
          "swap": 0.00,
          "profit": 1000.00, // In profit ma SL pericoloso
          "change_percent": 0.46,
          "magic": 0,
          "comment": "DANGEROUS: Large position with big SL",
          "phase": "PHASE_1"
        },
        {
          "symbol": "GBPUSD.p",
          "ticket": "400002",
          "time": "2025.08.21 14:15:00",
          "type": "sell", 
          "volume": 1.5,
          "price_open": 1.26500,
          "stop_loss": 1.27500, // 100 pips SL = $1500 loss potential
          "take_profit": 1.25500,
          "price_current": 1.26200, // +$450 profit
          "value": 189300.0,
          "swap": -2.00,
          "profit": 450.00,
          "change_percent": 0.24,
          "magic": 0,
          "comment": "RISKY: Another big SL",
          "phase": "PHASE_1"
        },
        {
          "symbol": "USDCAD.p",
          "ticket": "400003",
          "time": "2025.08.21 14:30:00",
          "type": "buy",
          "volume": 1.0,
          "price_open": 1.37000,
          "stop_loss": 1.36000, // 100 pips = ~$730 loss potential
          "take_profit": 1.38000,
          "price_current": 1.37050, // Small profit
          "value": 137050.0,
          "swap": 0.00,
          "profit": 50.00,
          "change_percent": 0.04,
          "magic": 0,
          "comment": "Final risky position",
          "phase": "PHASE_1"
        }
      ]
    }
    
    console.log('📤 Sending DANGEROUS SCENARIO to test TRUE Safe Capacity...')
    const response = await fetch('http://localhost:3018/api/ingest/mt5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })
    
    if (response.ok) {
      console.log('✅ Dangerous scenario data synced!')
      
      // Test TRUE Safe Capacity analysis
      setTimeout(async () => {
        console.log('\n🚨 Testing TRUE SAFE CAPACITY with dangerous scenario...')
        
        const accountId = 'cmej2fx5s0001wf3gkmbktejc'
        const riskResponse = await fetch(`http://localhost:3018/api/accounts/${accountId}/risk-analysis`)
        
        if (riskResponse.ok) {
          const riskResult = await riskResponse.json()
          const { riskMetrics } = riskResult
          
          console.log('\n🚨 TRUE SAFE CAPACITY TEST RESULTS:')
          console.log('=' .repeat(70))
          console.log(`💰 Starting Balance: $50,000`)
          console.log(`💹 Current Equity: $${riskMetrics.trueSafeCapacity.currentEquity.toFixed(2)}`)
          console.log(`📈 Floating P&L: +$${riskMetrics.trueSafeCapacity.floatingPL.toFixed(2)}`)
          console.log(`🚫 Daily Limit: $${riskMetrics.trueSafeCapacity.dailyLimitUSD} (5%)`)
          console.log('')
          
          console.log('⚖️ CAPACITY COMPARISON:')
          console.log(`   📊 Theoretical Capacity: $${riskMetrics.trueSafeCapacity.theoreticalCapacity.toFixed(2)} (MISLEADING!)`)
          console.log(`   🚨 TRUE Safe Capacity: $${riskMetrics.trueSafeCapacity.trueSafeCapacity.toFixed(2)} (REAL!)`)
          console.log(`   🎯 Risk Level: ${riskMetrics.trueSafeCapacity.riskLevel}`)
          console.log('')
          
          console.log('💥 SEQUENTIAL SL SIMULATION:')
          console.log(`   Min Equity if all SL hit: $${riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.minEquityTouched.toFixed(2)}`)
          console.log(`   Would violate daily limit: ${riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate ? '🚨 YES!' : '✅ NO'}`)
          console.log(`   Margin to violation: $${riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.marginToViolation.toFixed(2)}`)
          console.log('')
          
          if (riskMetrics.trueSafeCapacity.warning) {
            console.log(`⚠️ WARNING: ${riskMetrics.trueSafeCapacity.warning}`)
            console.log('')
          }
          
          console.log('🔄 SL HIT SEQUENCE:')
          riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.sequence.forEach((step, i) => {
            console.log(`   ${i + 1}. ${step.trade}: ${step.slLoss.toFixed(2)} → $${step.runningEquity.toFixed(2)} ${step.violatesHere ? '🚨 VIOLATION!' : ''}`)
          })
          console.log('')
          
          console.log('🧪 EXPECTED BEHAVIOR:')
          console.log(`   - Theoretical should show high capacity (WRONG!)`)
          console.log(`   - TRUE capacity should show DANGER/CRITICAL`)
          console.log(`   - Should detect sequential violation risk`)
          console.log(`   - Should warn about misleading profit`)
          console.log('')
          
          // Validate the fix works
          const isFixed = riskMetrics.trueSafeCapacity.trueSafeCapacity < riskMetrics.trueSafeCapacity.theoreticalCapacity
          console.log(`✅ FIX VALIDATION: ${isFixed ? 'TRUE capacity < Theoretical ✅' : 'Still using theoretical ❌'}`)
          
          if (riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate) {
            console.log('🚨 CRITICAL: This scenario WOULD violate daily limit - TRUE capacity working!')
          } else {
            console.log('✅ SAFE: Sequential SL hits would not violate - safe to continue')
          }
          
        } else {
          console.log('❌ Risk analysis failed:', riskResponse.status)
        }
      }, 2000)
      
    } else {
      console.log('❌ Data sync failed')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testTrueSafeCapacity()