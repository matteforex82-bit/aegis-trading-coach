const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function debugAccountData() {
  try {
    console.log('🔍 Debugging account 31284471...')

    // Get the account with all relations
    const account = await db.account.findUnique({
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
      console.log('❌ Account not found!')
      return
    }

    console.log('\n📊 Account Details:')
    console.log(`- Login: ${account.login}`)
    console.log(`- Name: ${account.name}`)
    console.log(`- Current Phase: ${account.currentPhase}`)
    console.log(`- Initial Balance: $${account.initialBalance?.toLocaleString() || 'N/A'}`)
    console.log(`- Current Balance: $${account.currentBalance?.toLocaleString() || 'N/A'}`)
    console.log(`- PropFirm ID: ${account.propFirmId}`)
    console.log(`- Template ID: ${account.propFirmTemplateId}`)

    console.log('\n🏢 PropFirm Template:')
    if (account.propFirmTemplate) {
      console.log(`- Template Name: ${account.propFirmTemplate.name}`)
      console.log(`- Account Size: $${account.propFirmTemplate.accountSize?.toLocaleString()}`)
      console.log(`- Currency: ${account.propFirmTemplate.currency}`)
      console.log(`- Active: ${account.propFirmTemplate.isActive}`)
      
      if (account.propFirmTemplate.propFirm) {
        console.log(`- PropFirm: ${account.propFirmTemplate.propFirm.name}`)
      }

      console.log('\n📋 Template Rules JSON:')
      const rules = account.propFirmTemplate.rulesJson
      console.log(JSON.stringify(rules, null, 2))

      console.log('\n🎯 Profit Targets:')
      if (rules.profitTargets) {
        console.log(`- PHASE_1: ${rules.profitTargets.PHASE_1?.percentage}% = $${rules.profitTargets.PHASE_1?.amount?.toLocaleString()}`)
        console.log(`- PHASE_2: ${rules.profitTargets.PHASE_2?.percentage}% = $${rules.profitTargets.PHASE_2?.amount?.toLocaleString()}`)
        console.log(`- FUNDED: ${rules.profitTargets.FUNDED?.description}`)
      }

      console.log('\n🚫 Risk Limits:')
      if (rules.maxDailyLoss) {
        console.log(`- Max Daily Loss: ${rules.maxDailyLoss.percentage}% = $${rules.maxDailyLoss.amount?.toLocaleString()}`)
      }
      if (rules.maxTotalLoss) {
        console.log(`- Max Total Loss: ${rules.maxTotalLoss.percentage}% = $${rules.maxTotalLoss.amount?.toLocaleString()}`)
      }

      console.log('\n⚖️ Special Rules:')
      if (rules.specialFeatures) {
        console.log(`- Consistency Rule: ${rules.specialFeatures.consistencyRule?.exists ? 'YES' : 'NO'}`)
        console.log(`- Unlimited Time: ${rules.specialFeatures.unlimitedTime?.available ? 'YES' : 'NO'}`)
      }

      console.log('\n📝 Expected Values for PHASE_2:')
      const currentPhase = account.currentPhase
      console.log(`- Current Phase: ${currentPhase}`)
      
      if (rules.profitTargets && rules.profitTargets[currentPhase]) {
        const phaseTarget = rules.profitTargets[currentPhase]
        console.log(`- Should show: ${phaseTarget.percentage}% del conto`)
        console.log(`- Target amount: $${phaseTarget.amount?.toLocaleString()}`)
        console.log(`- Target balance: $${(account.initialBalance + phaseTarget.amount).toLocaleString()}`)
      } else {
        console.log('❌ No profit target found for current phase!')
      }

    } else {
      console.log('❌ No PropFirm template attached!')
    }

  } catch (error) {
    console.error('❌ Error debugging account:', error)
  } finally {
    await db.$disconnect()
  }
}

debugAccountData()