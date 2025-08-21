const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function addFuturaFunding() {
  try {
    console.log('🏢 Creating FUTURA FUNDING PropFirm...')

    // Create or find FUTURA FUNDING PropFirm
    const propFirm = await db.propFirm.upsert({
      where: { name: 'FUTURA FUNDING' },
      update: {
        description: 'FUTURA FUNDING - No consistency rule, unlimited time, profitable prop firm',
        website: 'https://futurafunding.com',
        defaultRules: {
          maxDailyLoss: 5,
          maxTotalLoss: 10,
          minTradingDays: 5,
          profitSplit: 80,
          newsTrading: true,
          eaAllowed: true,
          weekendHolding: true,
          consistencyRule: false,
          firstPayoutDays: 30,
          subsequentPayoutDays: 15
        }
      },
      create: {
        name: 'FUTURA FUNDING',
        description: 'FUTURA FUNDING - No consistency rule, unlimited time, profitable prop firm',
        website: 'https://futurafunding.com',
        defaultRules: {
          maxDailyLoss: 5,
          maxTotalLoss: 10,
          minTradingDays: 5,
          profitSplit: 80,
          newsTrading: true,
          eaAllowed: true,
          weekendHolding: true,
          consistencyRule: false,
          firstPayoutDays: 30,
          subsequentPayoutDays: 15
        }
      }
    })

    console.log('✅ PropFirm created:', propFirm.id)

    // Define all account sizes and their configurations
    const accountConfigs = [
      {
        name: 'Challenge 10K',
        accountSize: 10000,
        phase1ProfitTarget: 800,   // 8% of 10k
        phase2ProfitTarget: 500,   // 5% of 10k
        maxDailyLoss: 500,         // 5% of 10k
        maxTotalLoss: 1000         // 10% of 10k
      },
      {
        name: 'Challenge 25K',
        accountSize: 25000,
        phase1ProfitTarget: 2000,  // 8% of 25k
        phase2ProfitTarget: 1250,  // 5% of 25k
        maxDailyLoss: 1250,        // 5% of 25k
        maxTotalLoss: 2500         // 10% of 25k
      },
      {
        name: 'Challenge 50K',
        accountSize: 50000,
        phase1ProfitTarget: 4000,  // 8% of 50k
        phase2ProfitTarget: 2500,  // 5% of 50k
        maxDailyLoss: 2500,        // 5% of 50k
        maxTotalLoss: 5000         // 10% of 50k
      },
      {
        name: 'Challenge 100K',
        accountSize: 100000,
        phase1ProfitTarget: 8000,  // 8% of 100k
        phase2ProfitTarget: 5000,  // 5% of 100k
        maxDailyLoss: 5000,        // 5% of 100k
        maxTotalLoss: 10000        // 10% of 100k
      },
      {
        name: 'Challenge 200K',
        accountSize: 200000,
        phase1ProfitTarget: 16000, // 8% of 200k
        phase2ProfitTarget: 10000, // 5% of 200k
        maxDailyLoss: 10000,       // 5% of 200k
        maxTotalLoss: 20000        // 10% of 200k
      },
      {
        name: 'Challenge 300K',
        accountSize: 300000,
        phase1ProfitTarget: 24000, // 8% of 300k
        phase2ProfitTarget: 15000, // 5% of 300k
        maxDailyLoss: 15000,       // 5% of 300k
        maxTotalLoss: 30000        // 10% of 300k
      }
    ]

    console.log('📋 Creating templates for all account sizes...')

    for (const config of accountConfigs) {
      console.log(`🎯 Creating template: ${config.name} ($${config.accountSize.toLocaleString()})`)

      const template = await db.propFirmTemplate.upsert({
        where: {
          propFirmId_name: {
            propFirmId: propFirm.id,
            name: config.name
          }
        },
        update: {
          accountSize: config.accountSize,
          currency: 'USD',
          rulesJson: {
            // Core Rules (Same for all phases)
            maxDailyLoss: {
              type: 'HARD_RULE',
              percentage: 5,
              amount: config.maxDailyLoss,
              description: '5% del saldo iniziale del conto (Violazione = Fallimento)',
              baseAmount: config.accountSize
            },
            maxTotalLoss: {
              type: 'HARD_RULE', 
              percentage: 10,
              amount: config.maxTotalLoss,
              description: '10% del saldo iniziale del conto (Violazione = Fallimento)',
              baseAmount: config.accountSize
            },
            minTradingDays: {
              type: 'PASSING_REQUIREMENT',
              days: 5,
              description: '5 giorni di trading distinti'
            },
            
            // Phase-specific Profit Targets
            profitTargets: {
              PHASE_1: {
                type: 'PASSING_REQUIREMENT',
                percentage: 8,
                amount: config.phase1ProfitTarget,
                description: 'Challenge: 8% del saldo iniziale'
              },
              PHASE_2: {
                type: 'PASSING_REQUIREMENT',
                percentage: 5,
                amount: config.phase2ProfitTarget,
                description: 'Verification: 5% del saldo iniziale'
              },
              FUNDED: {
                type: 'NO_TARGET',
                description: 'Nessun target di profitto richiesto'
              }
            },

            // Time Constraints
            timeConstraints: {
              PHASE_1: {
                maxDuration: null,
                description: 'Nessun limite di tempo'
              },
              PHASE_2: {
                maxDuration: null,
                description: 'Nessun limite di tempo'
              }
            },

            // Funded Phase Rules
            fundedRules: {
              profitSplit: {
                trader: 80,
                propFirm: 20,
                description: '80% dei profitti spettano al trader'
              },
              payoutRules: {
                firstPayout: {
                  minimumDays: 30,
                  description: 'Primo prelievo dopo 30 giorni dal primo trade'
                },
                subsequentPayouts: {
                  intervalDays: 15,
                  description: 'Prelievi successivi ogni 15 giorni'
                }
              }
            },

            // Special Rules and Permissions
            permissions: {
              newsTrading: {
                allowed: true,
                description: 'Trading durante le news ad alto impatto permesso'
              },
              expertAdvisors: {
                allowed: true,
                description: 'Uso di qualsiasi tipo di EA consentito'
              },
              weekendHolding: {
                allowed: true,
                description: 'Mantenimento posizioni durante notte e weekend'
              }
            },

            // Important Distinctions
            specialFeatures: {
              consistencyRule: {
                exists: false,
                description: 'NON ESISTE regola di consistenza - Vantaggio significativo'
              },
              unlimitedTime: {
                available: true,
                description: 'Tempo illimitato per completare le fasi'
              }
            },

            // Risk Management Parameters
            riskParameters: {
              accountSize: config.accountSize,
              currency: 'USD',
              leverage: 'Up to 1:100',
              maxPositionSize: 'No specific limit',
              instruments: 'Forex, Indices, Commodities, Crypto'
            }
          },
          isActive: true
        },
        create: {
          name: config.name,
          propFirmId: propFirm.id,
          accountSize: config.accountSize,
          currency: 'USD',
          rulesJson: {
            // Core Rules (Same for all phases)
            maxDailyLoss: {
              type: 'HARD_RULE',
              percentage: 5,
              amount: config.maxDailyLoss,
              description: '5% del saldo iniziale del conto (Violazione = Fallimento)',
              baseAmount: config.accountSize
            },
            maxTotalLoss: {
              type: 'HARD_RULE', 
              percentage: 10,
              amount: config.maxTotalLoss,
              description: '10% del saldo iniziale del conto (Violazione = Fallimento)',
              baseAmount: config.accountSize
            },
            minTradingDays: {
              type: 'PASSING_REQUIREMENT',
              days: 5,
              description: '5 giorni di trading distinti'
            },
            
            // Phase-specific Profit Targets
            profitTargets: {
              PHASE_1: {
                type: 'PASSING_REQUIREMENT',
                percentage: 8,
                amount: config.phase1ProfitTarget,
                description: 'Challenge: 8% del saldo iniziale'
              },
              PHASE_2: {
                type: 'PASSING_REQUIREMENT',
                percentage: 5,
                amount: config.phase2ProfitTarget,
                description: 'Verification: 5% del saldo iniziale'
              },
              FUNDED: {
                type: 'NO_TARGET',
                description: 'Nessun target di profitto richiesto'
              }
            },

            // Time Constraints
            timeConstraints: {
              PHASE_1: {
                maxDuration: null,
                description: 'Nessun limite di tempo'
              },
              PHASE_2: {
                maxDuration: null,
                description: 'Nessun limite di tempo'
              }
            },

            // Funded Phase Rules
            fundedRules: {
              profitSplit: {
                trader: 80,
                propFirm: 20,
                description: '80% dei profitti spettano al trader'
              },
              payoutRules: {
                firstPayout: {
                  minimumDays: 30,
                  description: 'Primo prelievo dopo 30 giorni dal primo trade'
                },
                subsequentPayouts: {
                  intervalDays: 15,
                  description: 'Prelievi successivi ogni 15 giorni'
                }
              }
            },

            // Special Rules and Permissions
            permissions: {
              newsTrading: {
                allowed: true,
                description: 'Trading durante le news ad alto impatto permesso'
              },
              expertAdvisors: {
                allowed: true,
                description: 'Uso di qualsiasi tipo di EA consentito'
              },
              weekendHolding: {
                allowed: true,
                description: 'Mantenimento posizioni durante notte e weekend'
              }
            },

            // Important Distinctions
            specialFeatures: {
              consistencyRule: {
                exists: false,
                description: 'NON ESISTE regola di consistenza - Vantaggio significativo'
              },
              unlimitedTime: {
                available: true,
                description: 'Tempo illimitato per completare le fasi'
              }
            },

            // Risk Management Parameters
            riskParameters: {
              accountSize: config.accountSize,
              currency: 'USD',
              leverage: 'Up to 1:100',
              maxPositionSize: 'No specific limit',
              instruments: 'Forex, Indices, Commodities, Crypto'
            }
          },
          isActive: true
        }
      })

      console.log(`✅ Template created: ${template.name} - ID: ${template.id}`)
    }

    console.log('\n🎉 FUTURA FUNDING setup completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- PropFirm: ${propFirm.name}`)
    console.log(`- Templates: ${accountConfigs.length} account sizes (10K - 300K)`)
    console.log('- All rules configured with phase-specific targets')
    console.log('- Special features: No consistency rule, unlimited time')
    console.log('- Permissions: News trading, EA usage, weekend holding')
    
  } catch (error) {
    console.error('❌ Error setting up FUTURA FUNDING:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the script
addFuturaFunding()
  .then(() => {
    console.log('🏁 Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })