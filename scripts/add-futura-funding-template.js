const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

// Template FUTURA FUNDING con regole specifiche
const futuraFundingTemplates = {
  propFirmName: "FUTURA FUNDING",
  description: "Prop trading firm senza regole di consistenza e con flessibilità massima",
  website: "https://futurafunding.com",
  templates: [
    {
      name: "FUTURA FUNDING Challenge 10k",
      accountSize: 10000,
      currency: "USD",
      rulesJson: {
        // FASE 1: Challenge
        profitTargets: {
          PHASE_1: {
            percentage: 8,
            amount: 800,
            description: "8% profit target per passare alla Fase 2"
          },
          PHASE_2: {
            percentage: 5,
            amount: 500,
            description: "5% profit target per diventare funded"
          },
          FUNDED: {
            percentage: null,
            amount: null,
            description: "Nessun target di profitto - potenziale di guadagno illimitato"
          }
        },
        
        // Limiti di perdita giornaliera
        dailyLossLimits: {
          PHASE_1: {
            percentage: 5,
            amount: 500,
            description: "5% del saldo iniziale (Violazione = Fallimento)",
            isBreachable: true,
            breachConsequence: "Fallimento immediato"
          },
          PHASE_2: {
            percentage: 5,
            amount: 500,
            description: "5% del saldo iniziale (Violazione = Fallimento)",
            isBreachable: true,
            breachConsequence: "Fallimento immediato"
          },
          FUNDED: {
            percentage: 5,
            amount: 500,
            description: "5% del saldo iniziale (Violazione = Perdita del conto)",
            isBreachable: true,
            breachConsequence: "Perdita del conto"
          }
        },
        
        // Limiti di perdita totale
        overallLossLimits: {
          PHASE_1: {
            percentage: 10,
            amount: 1000,
            description: "10% del saldo iniziale (Violazione = Fallimento)",
            isBreachable: true,
            breachConsequence: "Fallimento immediato"
          },
          PHASE_2: {
            percentage: 10,
            amount: 1000,
            description: "10% del saldo iniziale (Violazione = Fallimento)",
            isBreachable: true,
            breachConsequence: "Fallimento immediato"
          },
          FUNDED: {
            percentage: 10,
            amount: 1000,
            description: "10% del saldo iniziale (Violazione = Perdita del conto)",
            isBreachable: true,
            breachConsequence: "Perdita del conto"
          }
        },
        
        // Giorni minimi di trading
        minimumTradingDays: {
          PHASE_1: {
            days: 5,
            description: "5 giorni di trading distinti richiesti"
          },
          PHASE_2: {
            days: 5,
            description: "5 giorni di trading distinti richiesti"
          },
          FUNDED: {
            days: 0,
            description: "Nessun requisito di giorni minimi"
          }
        },
        
        // Durata massima
        maxDuration: {
          PHASE_1: null,
          PHASE_2: null,
          FUNDED: null,
          description: "Nessun limite di tempo per completare le fasi"
        },
        
        // Regole di consistenza
        consistencyRules: {
          PHASE_1: {
            enabled: false,
            description: "NON ESISTE regola di consistenza - Vantaggio significativo"
          },
          PHASE_2: {
            enabled: false,
            description: "NON ESISTE regola di consistenza - Vantaggio significativo"
          },
          FUNDED: {
            enabled: false,
            description: "NON ESISTE regola di consistenza - Vantaggio significativo"
          }
        },
        
        // Informazioni sui prelievi
        payoutInfo: {
          profitSplit: {
            trader: 80,
            propFirm: 20,
            description: "80% dei profitti spettano al trader"
          },
          firstPayoutAfterDays: 30,
          payoutFrequencyDays: 15,
          description: "Primo prelievo dopo 30 giorni dal primo trade, successivi ogni 15 giorni"
        },
        
        // Restrizioni di trading
        tradingRestrictions: {
          newsTrading: true,
          expertAdvisors: true,
          copyTrading: true,
          weekendTrading: true,
          weekendHolding: true,
          hedging: true,
          martingale: true,
          description: "Massima flessibilità - Tutte le strategie permesse"
        },
        
        // Caratteristiche speciali
        specialFeatures: [
          "Nessuna regola di consistenza",
          "Trading durante le news ad alto impatto permesso",
          "Uso di Expert Advisor (EA) consentito",
          "Mantenimento posizioni weekend permesso",
          "Nessun limite di tempo per le fasi",
          "Profit split 80% trader / 20% prop firm",
          "Prelievi ogni 15 giorni dopo il primo"
        ]
      }
    },
    
    {
      name: "FUTURA FUNDING Challenge 25k",
      accountSize: 25000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 2000, description: "8% profit target per passare alla Fase 2" },
          PHASE_2: { percentage: 5, amount: 1250, description: "5% profit target per diventare funded" },
          FUNDED: { percentage: null, amount: null, description: "Nessun target di profitto" }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 1250, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          PHASE_2: { percentage: 5, amount: 1250, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          FUNDED: { percentage: 5, amount: 1250, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 2500, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          PHASE_2: { percentage: 10, amount: 2500, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          FUNDED: { percentage: 10, amount: 2500, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti" },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti" },
          FUNDED: { days: 0, description: "Nessun requisito" }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "NON ESISTE regola di consistenza" },
          PHASE_2: { enabled: false, description: "NON ESISTE regola di consistenza" },
          FUNDED: { enabled: false, description: "NON ESISTE regola di consistenza" }
        },
        payoutInfo: {
          profitSplit: { trader: 80, propFirm: 20, description: "80% trader / 20% prop firm" },
          firstPayoutAfterDays: 30,
          payoutFrequencyDays: 15
        },
        tradingRestrictions: {
          newsTrading: true, expertAdvisors: true, weekendHolding: true
        },
        specialFeatures: ["Nessuna regola di consistenza", "Massima flessibilità trading"]
      }
    },
    
    {
      name: "FUTURA FUNDING Challenge 50k",
      accountSize: 50000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 4000, description: "8% profit target per passare alla Fase 2" },
          PHASE_2: { percentage: 5, amount: 2500, description: "5% profit target per diventare funded" },
          FUNDED: { percentage: null, amount: null, description: "Nessun target di profitto" }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 2500, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          PHASE_2: { percentage: 5, amount: 2500, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          FUNDED: { percentage: 5, amount: 2500, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 5000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          PHASE_2: { percentage: 10, amount: 5000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          FUNDED: { percentage: 10, amount: 5000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti" },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti" },
          FUNDED: { days: 0, description: "Nessun requisito" }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "NON ESISTE regola di consistenza" },
          PHASE_2: { enabled: false, description: "NON ESISTE regola di consistenza" },
          FUNDED: { enabled: false, description: "NON ESISTE regola di consistenza" }
        },
        payoutInfo: {
          profitSplit: { trader: 80, propFirm: 20, description: "80% trader / 20% prop firm" },
          firstPayoutAfterDays: 30,
          payoutFrequencyDays: 15
        },
        tradingRestrictions: {
          newsTrading: true, expertAdvisors: true, weekendHolding: true
        },
        specialFeatures: ["Nessuna regola di consistenza", "Massima flessibilità trading"]
      }
    },
    
    {
      name: "FUTURA FUNDING Challenge 100k",
      accountSize: 100000,
      currency: "USD",
      rulesJson: {
        profitTargets: {
          PHASE_1: { percentage: 8, amount: 8000, description: "8% profit target per passare alla Fase 2" },
          PHASE_2: { percentage: 5, amount: 5000, description: "5% profit target per diventare funded" },
          FUNDED: { percentage: null, amount: null, description: "Nessun target di profitto" }
        },
        dailyLossLimits: {
          PHASE_1: { percentage: 5, amount: 5000, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          PHASE_2: { percentage: 5, amount: 5000, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          FUNDED: { percentage: 5, amount: 5000, description: "5% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto" }
        },
        overallLossLimits: {
          PHASE_1: { percentage: 10, amount: 10000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          PHASE_2: { percentage: 10, amount: 10000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Fallimento" },
          FUNDED: { percentage: 10, amount: 10000, description: "10% del saldo iniziale", isBreachable: true, breachConsequence: "Perdita conto" }
        },
        minimumTradingDays: {
          PHASE_1: { days: 5, description: "5 giorni di trading distinti" },
          PHASE_2: { days: 5, description: "5 giorni di trading distinti" },
          FUNDED: { days: 0, description: "Nessun requisito" }
        },
        consistencyRules: {
          PHASE_1: { enabled: false, description: "NON ESISTE regola di consistenza" },
          PHASE_2: { enabled: false, description: "NON ESISTE regola di consistenza" },
          FUNDED: { enabled: false, description: "NON ESISTE regola di consistenza" }
        },
        payoutInfo: {
          profitSplit: { trader: 80, propFirm: 20, description: "80% trader / 20% prop firm" },
          firstPayoutAfterDays: 30,
          payoutFrequencyDays: 15
        },
        tradingRestrictions: {
          newsTrading: true, expertAdvisors: true, weekendHolding: true
        },
        specialFeatures: ["Nessuna regola di consistenza", "Massima flessibilità trading"]
      }
    }
  ]
};

async function addFuturaFundingTemplates() {
  try {
    console.log('🚀 Adding FUTURA FUNDING templates...\n');

    const firmData = futuraFundingTemplates;
    
    // Find or create PropFirm
    let propFirm = await db.propFirm.findFirst({
      where: { name: firmData.propFirmName }
    });

    if (!propFirm) {
      console.log(`🔄 Creating PropFirm: ${firmData.propFirmName}`);
      propFirm = await db.propFirm.create({
        data: {
          name: firmData.propFirmName,
          description: firmData.description,
          website: firmData.website,
          isActive: true,
          defaultRules: firmData.templates[2].rulesJson // Use 50k as default
        }
      });
    }

    console.log(`✅ PropFirm ID: ${propFirm.id}`);
    console.log(`📋 PropFirm: ${propFirm.name}\n`);

    // Create templates
    for (const template of firmData.templates) {
      try {
        // Check if template already exists
        const existingTemplate = await db.propFirmTemplate.findFirst({
          where: {
            propFirmId: propFirm.id,
            name: template.name
          }
        });

        if (existingTemplate) {
          console.log(`⚠️  Template already exists: ${template.name}`);
          continue;
        }

        const createdTemplate = await db.propFirmTemplate.create({
          data: {
            name: template.name,
            propFirmId: propFirm.id,
            accountSize: template.accountSize,
            currency: template.currency,
            rulesJson: template.rulesJson,
            isActive: true
          }
        });

        console.log(`✅ Created template: ${template.name} ($${template.accountSize.toLocaleString()} ${template.currency})`);
        
        // Show key rules for verification
        const rules = template.rulesJson;
        console.log(`   🎯 Phase 1 Target: ${rules.profitTargets.PHASE_1.percentage}% ($${rules.profitTargets.PHASE_1.amount.toLocaleString()})`);
        console.log(`   🎯 Phase 2 Target: ${rules.profitTargets.PHASE_2.percentage}% ($${rules.profitTargets.PHASE_2.amount.toLocaleString()})`);
        console.log(`   🚫 Max Daily Loss: ${rules.dailyLossLimits.PHASE_1.percentage}% ($${rules.dailyLossLimits.PHASE_1.amount.toLocaleString()})`);
        console.log(`   🚫 Max Total Loss: ${rules.overallLossLimits.PHASE_1.percentage}% ($${rules.overallLossLimits.PHASE_1.amount.toLocaleString()})`);
        console.log(`   📅 Min Trading Days: ${rules.minimumTradingDays.PHASE_1.days}`);
        console.log(`   ⚖️  Consistency Rule: ${rules.consistencyRules.PHASE_1.enabled ? 'YES' : 'NO (Vantaggio!)'}`);
        console.log(`   💰 Profit Split: ${rules.payoutInfo.profitSplit.trader}% trader`);
        console.log('');
        
      } catch (templateError) {
        console.error(`❌ Error creating template ${template.name}:`, templateError.message);
      }
    }

    // Summary
    const totalTemplates = await db.propFirmTemplate.count({
      where: { propFirmId: propFirm.id }
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   PropFirm: ${propFirm.name}`);
    console.log(`   Templates Created: ${totalTemplates}`);
    console.log('\n🎯 FUTURA FUNDING templates created successfully!');
    console.log('\n🌟 KEY FEATURES:');
    console.log('   ✅ NO Consistency Rules (Major Advantage)');
    console.log('   ✅ News Trading Allowed');
    console.log('   ✅ Expert Advisors Allowed');
    console.log('   ✅ Weekend Holding Allowed');
    console.log('   ✅ No Time Limits');
    console.log('   ✅ 80% Profit Split');
    console.log('   ✅ Payouts every 15 days after first');

  } catch (error) {
    console.error('❌ Error adding FUTURA FUNDING templates:', error);
  } finally {
    await db.$disconnect();
  }
}

addFuturaFundingTemplates();