const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function addPropNumberOne() {
  try {
    console.log('🏢 Creating PROP NUMBER ONE PropFirm...')
    
    // Create PropFirm
    const propFirm = await db.propFirm.create({
      data: {
        name: 'PROP NUMBER ONE',
        description: 'Professional prop trading firm with 50% consistency protection rules',
        website: 'https://propnumberone.com',
        isActive: true
      }
    })
    
    console.log(`✅ PropFirm created: ${propFirm.name} (ID: ${propFirm.id})`)
    
    // Account sizes to create
    const accountSizes = [
      { size: 10000, fee: 580 },
      { size: 25000, fee: 580 },
      { size: 50000, fee: 580 },
      { size: 100000, fee: 580 },
      { size: 200000, fee: 580 },
      { size: 300000, fee: 580 }
    ]
    
    console.log('💰 Creating templates for all account sizes...')
    
    for (const { size, fee } of accountSizes) {
      const rules = {
        profitTargets: {
          PHASE_1: {
            percentage: 5,
            amount: size * 0.05,
            description: "5% profit target to advance to Phase 2"
          },
          PHASE_2: {
            percentage: 8,
            amount: size * 0.08,
            description: "8% profit target to become funded"
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
            percentage: 4,
            amount: size * 0.04,
            description: "4% daily loss limit - REDUCED from Phase 1"
          },
          FUNDED: {
            percentage: 4,
            amount: size * 0.04,
            description: "4% daily loss limit maintained"
          }
        },
        
        overallLossLimits: {
          PHASE_1: {
            percentage: 10,
            amount: size * 0.10,
            description: "10% overall loss limit from initial balance"
          },
          PHASE_2: {
            percentage: 8,
            amount: size * 0.08,
            description: "8% overall loss limit - REDUCED from Phase 1"
          },
          FUNDED: {
            percentage: 8,
            amount: size * 0.08,
            description: "8% overall loss limit maintained"
          }
        },
        
        minimumTradingDays: {
          PHASE_1: {
            days: 1,
            description: "Minimum 1 trading day required"
          },
          PHASE_2: {
            days: 5,
            description: "Minimum 5 trading days - INCREASED from Phase 1"
          },
          FUNDED: {
            days: 5,
            description: "Minimum 5 trading days for payout eligibility"
          }
        },
        
        consistencyRules: {
          PHASE_1: {
            enabled: false,
            description: "No consistency rules in Phase 1"
          },
          PHASE_2: {
            enabled: true,
            description: "50% Protection: Total profit ≥ 2x best day AND ≥ 2x best single trade",
            rules: [
              "Total profit must be at least twice the most profitable day",
              "Total profit must be at least twice the most profitable single trade"
            ]
          },
          FUNDED: {
            enabled: true,
            description: "50% Protection maintained for payout requests",
            rules: [
              "Total profit must be at least twice the most profitable day",
              "Total profit must be at least twice the most profitable single trade"
            ]
          }
        },
        
        timeLimit: {
          PHASE_1: "Unlimited",
          PHASE_2: "Unlimited", 
          FUNDED: "Unlimited"
        },
        
        payoutInfo: {
          profitSplit: {
            trader: 100,
            propFirm: 0,
            description: "100% profit goes to trader"
          },
          feeRefund: {
            phase1ToPhase2: fee,
            phase2ToFunded: Math.round(fee * 0.91), // $527 for $580 fee
            description: "Fee refunded upon successful phase completion"
          },
          minimumAmount: null,
          frequency: "On demand",
          processingTime: "Standard processing"
        },
        
        tradingRestrictions: {
          newsTrading: true,
          expertAdvisors: true,
          copyTrading: true,
          weekendTrading: true,
          prohibitedPractices: [
            "Risky behavior discouraged by consistency rules",
            "All-in single trade strategies not recommended"
          ]
        },
        
        specialFeatures: [
          "50% Protection consistency rules in Phase 2 and Funded",
          "Reduced daily and overall loss limits in Phase 2",
          "100% profit split for trader",
          "Fee refund system",
          "Unlimited time limits",
          "Professional risk management approach"
        ]
      }
      
      await db.propFirmTemplate.create({
        data: {
          propFirmId: propFirm.id,
          name: `PROP NUMBER ONE ${size / 1000}K`,
          accountSize: size,
          rulesJson: rules,
          isActive: true
        }
      })
      
      console.log(`✅ Created template: ${size / 1000}K`)
    }
    
    console.log('\n🎉 PROP NUMBER ONE setup completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- PropFirm: ${propFirm.name}`)
    console.log(`- Templates: ${accountSizes.length} account sizes`)
    console.log('- Special Features: 50% Protection, 100% profit split')
    console.log('- Phase 2 Restrictions: Reduced loss limits, increased min days')
    
  } catch (error) {
    console.error('❌ Error creating PROP NUMBER ONE:', error)
  } finally {
    await db.$disconnect()
  }
}

addPropNumberOne()