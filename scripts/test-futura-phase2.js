const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testFuturaPhase2() {
  try {
    console.log('🔍 Testing FUTURA FUNDING Phase 2 calculations...')
    
    // Get account 31284471 with template
    const account = await db.account.findFirst({
      where: { login: '31284471' },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })
    
    if (!account) {
      console.log('❌ Account 31284471 not found')
      return
    }
    
    console.log(`\n📊 Account Info:`)
    console.log(`- Login: ${account.login}`)
    console.log(`- Current Phase: ${account.currentPhase}`)
    console.log(`- Start Balance: $${account.startBalance}`)
    console.log(`- Template: ${account.propFirmTemplate?.name}`)
    console.log(`- PropFirm: ${account.propFirmTemplate?.propFirm?.name}`)
    
    if (account.propFirmTemplate?.rulesJson) {
      const rules = account.propFirmTemplate.rulesJson
      
      console.log(`\n🎯 Profit Targets from Template:`)
      
      if (rules.profitTargets) {
        const phase1Target = rules.profitTargets.PHASE_1
        const phase2Target = rules.profitTargets.PHASE_2
        
        console.log(`- PHASE_1: ${phase1Target?.percentage}% = $${phase1Target?.amount}`)
        console.log(`- PHASE_2: ${phase2Target?.percentage}% = $${phase2Target?.amount}`)
        
        console.log(`\n✅ Current Phase (${account.currentPhase}) Target:`)
        const currentTarget = rules.profitTargets[account.currentPhase]
        
        if (currentTarget) {
          console.log(`   Percentage: ${currentTarget.percentage}%`)
          console.log(`   Amount: $${currentTarget.amount}`)
          console.log(`   Description: ${currentTarget.description}`)
          
          // Calculate what dashboard should show
          const startBalance = account.startBalance || 50000
          const expectedTargetAmount = startBalance + currentTarget.amount
          const expectedPercentage = currentTarget.percentage
          
          console.log(`\n🎛️ Dashboard Should Show:`)
          console.log(`   Requirement: "${expectedPercentage}% del conto"`)
          console.log(`   Target Amount: $${expectedTargetAmount}`)
          console.log(`   For calculations: ${expectedPercentage}% of ${startBalance}`)
          
          // Verify the fix
          if (account.currentPhase === 'PHASE_2' && currentTarget.percentage === 6) {
            console.log(`\n🎉 ✅ SUCCESS! Phase 2 shows 6% (not 8%)`)
          } else if (account.currentPhase === 'PHASE_2' && currentTarget.percentage !== 6) {
            console.log(`\n⚠️ ❌ ISSUE! Phase 2 shows ${currentTarget.percentage}% instead of 6%`)
          }
          
        } else {
          console.log(`   ❌ No target found for ${account.currentPhase}`)
        }
      }
      
      // Show other rules
      console.log(`\n📋 Other Rules:`)
      if (rules.dailyLossLimits && rules.dailyLossLimits[account.currentPhase]) {
        const dailyLimit = rules.dailyLossLimits[account.currentPhase]
        console.log(`- Daily Loss Limit: ${dailyLimit.percentage}% = $${dailyLimit.amount}`)
      }
      
      if (rules.overallLossLimits && rules.overallLossLimits[account.currentPhase]) {
        const overallLimit = rules.overallLossLimits[account.currentPhase]
        console.log(`- Overall Loss Limit: ${overallLimit.percentage}% = $${overallLimit.amount}`)
      }
      
    } else {
      console.log('❌ No rules found in template')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

testFuturaPhase2()