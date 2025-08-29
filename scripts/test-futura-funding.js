const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testFuturaFunding() {
  try {
    console.log('🔍 Testing FUTURA FUNDING setup...')

    // Check PropFirm
    const propFirm = await db.propFirm.findFirst({
      where: { name: 'FUTURA FUNDING' }
    })

    if (!propFirm) {
      console.log('❌ FUTURA FUNDING PropFirm not found!')
      return
    }

    console.log('✅ PropFirm found:', propFirm.name, '-', propFirm.id)

    // Check Templates
    const templates = await db.propFirmTemplate.findMany({
      where: { propFirmId: propFirm.id },
      orderBy: { accountSize: 'asc' }
    })

    console.log(`✅ Found ${templates.length} templates:`)
    
    templates.forEach(template => {
      console.log(`   📋 ${template.name} - $${template.accountSize.toLocaleString()} - ${template.currency}`)
      
      // Show profit targets for this template
      const rules = template.rulesJson
      const phase1Target = rules.profitTargets?.PHASE_1?.amount || 0
      const phase2Target = rules.profitTargets?.PHASE_2?.amount || 0
      const maxDaily = rules.dailyLossLimits?.PHASE_1?.amount || 0
      const maxTotal = rules.overallLossLimits?.PHASE_1?.amount || 0
      
      console.log(`      🎯 Phase 1 Target: $${phase1Target.toLocaleString()}`)
      console.log(`      🎯 Phase 2 Target: $${phase2Target.toLocaleString()}`)
      console.log(`      🚫 Max Daily Loss: $${maxDaily.toLocaleString()}`)
      console.log(`      🚫 Max Total Loss: $${maxTotal.toLocaleString()}`)
      console.log(`      📅 Min Trading Days: ${rules.minimumTradingDays?.PHASE_1?.days || 0}`)
      console.log(`      ⏰ Time Limit: ${rules.maxDuration?.description || 'Nessun limite di tempo'}`)
      console.log(`      🤖 EA Allowed: ${rules.tradingRestrictions?.expertAdvisors ? 'Yes' : 'No'}`)
      console.log(`      📰 News Trading: ${rules.tradingRestrictions?.newsTrading ? 'Yes' : 'No'}`)
      console.log(`      🎪 Consistency Rule: ${rules.consistencyRules?.PHASE_1?.enabled ? 'Yes' : 'No (VANTAGGIO!)'}`)
      console.log(`      💰 Profit Split: ${rules.payoutInfo?.profitSplit?.trader || 0}% trader`)
      console.log(`      🔄 Payout Frequency: Every ${rules.payoutInfo?.payoutFrequencyDays || 0} days`)
      console.log('')
    })

    console.log('🎉 FUTURA FUNDING is ready to use!')
    console.log('\n📝 To use in EA, send propFirm: "FUTURA FUNDING" in the account data')

  } catch (error) {
    console.error('❌ Error testing FUTURA FUNDING:', error)
  } finally {
    await db.$disconnect()
  }
}

testFuturaFunding()