const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function checkAccountAssignment() {
  try {
    console.log('🔍 Checking all account template assignments...')
    
    const accounts = await db.account.findMany({
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })
    
    console.log(`\n📋 Found ${accounts.length} accounts:`)
    
    accounts.forEach(account => {
      console.log(`\n🏦 Account: ${account.login} (${account.name})`)
      console.log(`   Current Phase: ${account.currentPhase}`)
      
      if (account.propFirmTemplate) {
        console.log(`   Template: ${account.propFirmTemplate.name}`)
        console.log(`   PropFirm: ${account.propFirmTemplate.propFirm?.name || 'Unknown'}`)
        console.log(`   Account Size: $${account.propFirmTemplate.accountSize}`)
        
        // Check Phase 2 target for this template
        const rules = account.propFirmTemplate.rulesJson
        if (rules?.profitTargets?.PHASE_2) {
          const phase2 = rules.profitTargets.PHASE_2
          console.log(`   Phase 2 Target: ${phase2.percentage}% = $${phase2.amount}`)
          
          // Identify the issue
          if (account.propFirmTemplate.propFirm?.name === 'PROP NUMBER ONE' && phase2.percentage !== 8) {
            console.log(`   ❌ BUG: PROP NUMBER ONE should be 8%, but shows ${phase2.percentage}%`)
          } else if (account.propFirmTemplate.propFirm?.name === 'FUTURA FUNDING' && phase2.percentage !== 6) {
            console.log(`   ❌ BUG: FUTURA FUNDING should be 6%, but shows ${phase2.percentage}%`)
          } else if (account.propFirmTemplate.propFirm?.name === 'PROP NUMBER ONE' && phase2.percentage === 8) {
            console.log(`   ✅ CORRECT: PROP NUMBER ONE shows 8%`)
          } else if (account.propFirmTemplate.propFirm?.name === 'FUTURA FUNDING' && phase2.percentage === 6) {
            console.log(`   ✅ CORRECT: FUTURA FUNDING shows 6%`)
          }
        } else {
          console.log('   ❌ No Phase 2 target found')
        }
      } else {
        console.log('   ❌ No template assigned')
      }
    })
    
    // Check if we need to assign PROP NUMBER ONE to any account
    console.log('\n💡 Suggestions:')
    console.log('To test PROP NUMBER ONE, you can:')
    console.log('1. Update an existing account to use PROP NUMBER ONE template')
    console.log('2. Create a new test account with PROP NUMBER ONE')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

checkAccountAssignment()