// Debug script to test /api/accounts endpoint
async function debugApiAccounts() {
  try {
    console.log('🔍 Testing /api/accounts endpoint...')
    
    const response = await fetch('http://localhost:3000/api/accounts')
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('Response data type:', typeof data)
    console.log('Response data:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Error testing API:', error)
  }
}

debugApiAccounts()