const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function fixFuturaFunding() {
  try {
    console.log('🔧 Fixing FUTURA FUNDING template rules...')
    
    // Find FUTURA FUNDING PropFirm
    const futuraFunding = await db.propFirm.findFirst({
      where: { name: 'FUTURA FUNDING' },
      include: { templates: true }
    })
    
    if (!futuraFunding) {
      console.log('❌ FUTURA FUNDING not found!')
      return
    }
    
    console.log(`✅ Found FUTURA FUNDING (${futuraFunding.templates.length} templates)`)
    
    // Update each template with correct rules
    for (const template of futuraFunding.templates) {
      const size = template.accountSize
      
      const correctedRules = {
        profitTargets: {
          PHASE_1: {
            percentage: 8,
            amount: size * 0.08,
            description: "8% profit target to advance to Phase 2"
          },
          PHASE_2: {
            percentage: 6, // FIXED: Was 5%, now 6%
            amount: size * 0.06,
            description: "6% profit target to become funded - REDUCED from Phase 1"
          },
          FUNDED: {
            percentage: null,
            amount: null,
            description: "No profit targets - unlimited earning potential"
          }
        },
        
        dailyLossLimits: {
          PHASE_1: {
            percentage: 5,
            amount: size * 0.05,
            description: "5% daily loss limit from starting balance"
          },
          PHASE_2: {
            percentage: 5,
            amount: size * 0.05,
            description: "5% daily loss limit maintained"
          },
          FUNDED: {
            percentage: 5,
            amount: size * 0.05,
            description: "5% daily loss limit maintained"
          }
        },
        
        overallLossLimits: {
          PHASE_1: {
            percentage: 10,
            amount: size * 0.10,
            description: "10% overall loss limit from initial balance"
          },
          PHASE_2: {
            percentage: 10,
            amount: size * 0.10,
            description: "10% overall loss limit maintained"
          },
          FUNDED: {
            percentage: 10,
            amount: size * 0.10,
            description: "10% overall loss limit maintained"
          }
        },
        
        minimumTradingDays: {
          PHASE_1: {
            days: 1,
            description: "Minimum 1 trading day required"
          },
          PHASE_2: {
            days: 1,
            description: "Minimum 1 trading day maintained"
          },
          FUNDED: {
            days: 14, // ADDED: 14 days for first payout
            description: "14 days from first trade for initial payout eligibility"
          }
        },
        
        consistencyRules: {
          PHASE_1: {
            enabled: false,
            description: "No consistency rules"
          },
          PHASE_2: {
            enabled: false,
            description: "No consistency rules"
          },
          FUNDED: {
            enabled: false,
            description: "No consistency rules"
          }
        },
        
        timeLimit: {
          PHASE_1: "Unlimited",
          PHASE_2: "Unlimited",
          FUNDED: "20 days inactivity limit" // ADDED
        },
        
        payoutInfo: {
          profitSplit: {
            trader: 90, // FIXED: Added profit split
            propFirm: 10,
            description: "90% profit goes to trader, 10% to PropFirm"
          },
          schedule: {
            firstPayout: "14 days from first trade",
            subsequent: "Every 14 days",
            description: "Bi-weekly payout schedule"
          },
          minimumAmount: 50, // ADDED: 50€ minimum
          currency: "EUR",
          processingTime: "1 hour working time",
          methods: ["Bank Transfer", "Bitcoin", "Ethereum"], // ADDED
          fees: "No fees from FUTURA FUNDING"
        },
        
        tradingRestrictions: {
          newsTrading: true,
          expertAdvisors: true,
          copyTrading: true,
          weekendTrading: true,
          inactivityLimit: 20, // ADDED: 20 days
          prohibitedPractices: [
            "High-Frequency Trading (HFT)",
            "Hedging between different accounts",
            "Group trading"
          ]
        },
        
        specialFeatures: [
          "No consistency rules",
          "Reduced Phase 2 profit target (6% vs 8%)",
          "Same loss limits across all phases",
          "Multiple payout methods including crypto",
          "Fast 1-hour processing time",
          "No payout fees",
          "Bi-weekly payout schedule"
        ]
      }
      
      await db.propFirmTemplate.update({
        where: { id: template.id },
        data: { rulesJson: correctedRules }
      })
      
      console.log(`✅ Fixed template: ${template.name}`)
    }
    
    console.log('\n🎉 FUTURA FUNDING fixes completed successfully!')
    console.log('\n🔧 Key fixes applied:')
    console.log('- Phase 2 profit target: 5% → 6%')
    console.log('- Added complete payout information')
    console.log('- Added inactivity limits and trading restrictions')
    console.log('- Added 90/10 profit split')
    console.log('- Added bi-weekly payout schedule')
    
  } catch (error) {
    console.error('❌ Error fixing FUTURA FUNDING:', error)
  } finally {
    await db.$disconnect()
  }
}

fixFuturaFunding()