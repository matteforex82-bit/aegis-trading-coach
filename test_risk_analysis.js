// Test Risk Analysis API
const testRiskAnalysis = async () => {
  try {
    console.log('🔍 Testing Risk Analysis API...')
    
    // Use the existing account ID
    const accountId = 'cmej2fx5s0001wf3gkmbktejc'
    const response = await fetch(`http://localhost:3012/api/accounts/${accountId}/risk-analysis`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Risk Analysis Success!')
      console.log('📊 Response:', JSON.stringify(result, null, 2))
      
      const { riskMetrics } = result
      console.log('\n🎯 Key Metrics:')
      console.log(`   Risk Level: ${riskMetrics.riskLevel}`)
      console.log(`   Exposure: ${riskMetrics.totalExposurePercent.toFixed(2)}%`)
      console.log(`   Exposure USD: $${riskMetrics.totalExposureUSD.toFixed(2)}`)
      console.log(`   Max Additional Risk: $${riskMetrics.maxAdditionalRisk.toFixed(2)}`)
      console.log(`   Trades without SL: ${riskMetrics.tradesWithoutSL.length}`)
      console.log(`   Alerts: ${riskMetrics.alerts.length}`)
      
      if (riskMetrics.alerts.length > 0) {
        console.log('\n🚨 Active Alerts:')
        riskMetrics.alerts.forEach((alert, i) => {
          console.log(`   ${i + 1}. [${alert.severity}] ${alert.message}`)
        })
      }
      
    } else {
      console.log('❌ Risk Analysis Failed:', response.status, response.statusText)
      const error = await response.text()
      console.log('Error details:', error)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testRiskAnalysis()