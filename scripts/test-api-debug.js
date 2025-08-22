// Test /api/debug-accounts endpoint
async function testDebugApi() {
  try {
    console.log('🔍 Testing /api/debug-accounts endpoint...')
    
    const response = await fetch('http://localhost:3000/api/debug-accounts')
    console.log('Response status:', response.status)
    
    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Error testing debug API:', error)
  }
}

testDebugApi()