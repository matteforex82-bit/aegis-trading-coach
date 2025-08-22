// Debug script to test /api/accounts endpoint
async function debugApiAccounts() {
  try {
    console.log('🔍 Testing /api/accounts endpoint...')
    
    const response = await fetch('http://localhost:3000/api/accounts')
    const accounts = await response.json()
    
    console.log(`✅ Found ${accounts.length} accounts`)
    
    // Find account 31284471
    const targetAccount = accounts.find(acc => acc.login === '31284471')
    
    if (targetAccount) {
      console.log('\n📊 Account 31284471 from API:')
      console.log(`- ID: ${targetAccount.id}`)
      console.log(`- Login: ${targetAccount.login}`)
      console.log(`- Name: ${targetAccount.name}`)
      console.log(`- Phase: ${targetAccount.currentPhase}`)
      console.log(`- Initial Balance: ${targetAccount.initialBalance}`)
      console.log(`- Template Present: ${targetAccount.propFirmTemplate ? 'YES' : 'NO'}`)
      
      if (targetAccount.propFirmTemplate) {
        console.log('\n🏢 Template from API:')
        console.log(`- Template Name: ${targetAccount.propFirmTemplate.name}`)
        console.log(`- Account Size: ${targetAccount.propFirmTemplate.accountSize}`)
        console.log(`- Has Rules JSON: ${targetAccount.propFirmTemplate.rulesJson ? 'YES' : 'NO'}`)
        console.log(`- Has PropFirm: ${targetAccount.propFirmTemplate.propFirm ? 'YES' : 'NO'}`)
        
        if (targetAccount.propFirmTemplate.propFirm) {
          console.log(`- PropFirm Name: ${targetAccount.propFirmTemplate.propFirm.name}`)
        }
        
        if (targetAccount.propFirmTemplate.rulesJson) {
          console.log('\n🎯 Profit Targets from API:')
          const rules = targetAccount.propFirmTemplate.rulesJson
          if (rules.profitTargets) {
            console.log(`- PHASE_1: ${rules.profitTargets.PHASE_1?.percentage}% = $${rules.profitTargets.PHASE_1?.amount}`)
            console.log(`- PHASE_2: ${rules.profitTargets.PHASE_2?.percentage}% = $${rules.profitTargets.PHASE_2?.amount}`)
            
            console.log(`\n✅ For current phase (${targetAccount.currentPhase}):`)
            const currentPhaseTarget = rules.profitTargets[targetAccount.currentPhase]
            if (currentPhaseTarget) {
              console.log(`   Should show: ${currentPhaseTarget.percentage}% del conto`)
              console.log(`   Target amount: $${currentPhaseTarget.amount}`)
            } else {
              console.log('   ❌ No target found for current phase!')
            }
          }
        }
      } else {
        console.log('\n❌ No propFirmTemplate in API response!')
      }
      
      console.log('\n📋 Raw Account Object Keys:')
      console.log(Object.keys(targetAccount))
      
    } else {
      console.log('\n❌ Account 31284471 not found in API response!')
      console.log('\n📋 Available accounts:')
      accounts.forEach(acc => {
        console.log(`- ${acc.login} (${acc.name})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error)
  }
}

debugApiAccounts()