const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// PropNumberOne template con regole corrette dalla tabella
const propNumberOneTemplates = {
  propFirmName: "PropNumberOne",
  description: "PropNumberOne - Prop Trading Firm",
  website: "https://propnumberone.com",
  templates: [
    // 7k Account
    {
      name: "PropNumberOne Challenge 7k",
      accountSize: 7000,
      currency: "USD",
      rulesJson: {
        // FASE 1: Evaluation
        phase1: {
          profitTarget: 5,           // 5% del saldo iniziale (CORRETTO)
          profitTargetAmount: 350,   // 7000 * 0.05
          maxDailyLoss: 5,          // 5% del saldo fine giornata precedente
          maxOverallLoss: 10,       // 10% del saldo iniziale
          maxOverallLossAmount: 700, // 7000 * 0.10
          minTradingDays: 1,        // Minimo 1 giorno (CORRETTO dalla specifica)
          
          // Nessuna regola di consistency in Fase 1
          consistencyRules: false,
          dailyProtection: false,
          tradeProtection: false
        },
        
        // FASE 2: Verification 
        phase2: {
          profitTarget: 5,           // 5% del saldo iniziale
          profitTargetAmount: 350,   // 7000 * 0.05
          maxDailyLoss: 5,          // 5% del saldo fine giornata precedente
          maxOverallLoss: 10,       // 10% del saldo iniziale
          maxOverallLossAmount: 700, // 7000 * 0.10
          minTradingDays: 5,        // Minimo 5 giorni
          
          // Simple Protection Rules (Consistency)
          consistencyRules: true,
          dailyProtection: {
            enabled: true,
            name: "50% Daily Protection",
            formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)",
            description: "Il profitto totale deve essere ≥ al doppio del profitto del giorno migliore"
          },
          tradeProtection: {
            enabled: true,
            name: "50% Trade Protection", 
            formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)",
            description: "Il profitto totale deve essere ≥ al doppio del profitto del trade migliore"
          }
        },
        
        // FASE 3: Funded
        funded: {
          profitTarget: null,        // Nessun target nel conto funded
          maxDailyLoss: 5,          // 5% del saldo fine giornata precedente
          maxOverallLoss: 10,       // 10% del saldo iniziale
          maxOverallLossAmount: 700, // 7000 * 0.10
          minTradingDays: null,     // Non si applica
          
          // Simple Protection Rules continuano
          consistencyRules: true,
          dailyProtection: {
            enabled: true,
            name: "50% Daily Protection",
            formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)",
            description: "Il profitto totale deve essere ≥ al doppio del profitto del giorno migliore"
          },
          tradeProtection: {
            enabled: true,
            name: "50% Trade Protection",
            formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)", 
            description: "Il profitto totale deve essere ≥ al doppio del profitto del trade migliore"
          }
        },
        
        // Configurazione generale
        allowedStrategies: ["scalping", "swing", "day_trading", "news_trading"],
        weekendHolding: true,
        hedging: true,
        martingale: false,        // Non specificato, assumiamo false
        maxLotSize: null,         // Non specificato limite
        maxRiskPerTrade: null     // Non specificato limite
      }
    },
    
    // 17k Account
    {
      name: "PropNumberOne Challenge 17k",
      accountSize: 17000,
      currency: "USD",
      rulesJson: {
        phase1: {
          profitTarget: 5,
          profitTargetAmount: 850,   // 17000 * 0.05
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 1700, // 17000 * 0.10
          minTradingDays: 1,
          consistencyRules: false,
          dailyProtection: false,
          tradeProtection: false
        },
        phase2: {
          profitTarget: 5,
          profitTargetAmount: 850,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 1700,
          minTradingDays: 5,
          consistencyRules: true,
          dailyProtection: {
            enabled: true,
            name: "50% Daily Protection",
            formula: "Profitto Totale ≥ (Profitto Giorno Migliore * 2)"
          },
          tradeProtection: {
            enabled: true,
            name: "50% Trade Protection",
            formula: "Profitto Totale ≥ (Profitto Trade Migliore * 2)"
          }
        },
        funded: {
          profitTarget: null,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 1700,
          minTradingDays: null,
          consistencyRules: true,
          dailyProtection: { enabled: true, name: "50% Daily Protection" },
          tradeProtection: { enabled: true, name: "50% Trade Protection" }
        },
        allowedStrategies: ["scalping", "swing", "day_trading", "news_trading"],
        weekendHolding: true,
        hedging: true,
        martingale: false
      }
    },
    
    // 27k Account
    {
      name: "PropNumberOne Challenge 27k", 
      accountSize: 27000,
      currency: "USD",
      rulesJson: {
        phase1: {
          profitTarget: 5,
          profitTargetAmount: 1350,  // 27000 * 0.05
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 2700, // 27000 * 0.10
          minTradingDays: 1,
          consistencyRules: false
        },
        phase2: {
          profitTarget: 5,
          profitTargetAmount: 1350,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 2700,
          minTradingDays: 5,
          consistencyRules: true,
          dailyProtection: { enabled: true, name: "50% Daily Protection" },
          tradeProtection: { enabled: true, name: "50% Trade Protection" }
        },
        funded: {
          profitTarget: null,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 2700,
          consistencyRules: true,
          dailyProtection: { enabled: true },
          tradeProtection: { enabled: true }
        },
        allowedStrategies: ["scalping", "swing", "day_trading", "news_trading"],
        weekendHolding: true,
        hedging: true
      }
    },
    
    // 50k Account
    {
      name: "PropNumberOne Challenge 50k",
      accountSize: 50000,
      currency: "USD", 
      rulesJson: {
        phase1: {
          profitTarget: 5,
          profitTargetAmount: 2500,  // 50000 * 0.05
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 5000, // 50000 * 0.10
          minTradingDays: 1,
          consistencyRules: false
        },
        phase2: {
          profitTarget: 5,
          profitTargetAmount: 2500,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 5000,
          minTradingDays: 5,
          consistencyRules: true,
          dailyProtection: { enabled: true, name: "50% Daily Protection" },
          tradeProtection: { enabled: true, name: "50% Trade Protection" }
        },
        funded: {
          profitTarget: null,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 5000,
          consistencyRules: true,
          dailyProtection: { enabled: true },
          tradeProtection: { enabled: true }
        }
      }
    },
    
    // 100k Account
    {
      name: "PropNumberOne Challenge 100k",
      accountSize: 100000,
      currency: "USD",
      rulesJson: {
        phase1: {
          profitTarget: 5,
          profitTargetAmount: 5000,   // 100000 * 0.05
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 10000, // 100000 * 0.10
          minTradingDays: 1,
          consistencyRules: false
        },
        phase2: {
          profitTarget: 5,
          profitTargetAmount: 5000,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 10000,
          minTradingDays: 5,
          consistencyRules: true,
          dailyProtection: { enabled: true, name: "50% Daily Protection" },
          tradeProtection: { enabled: true, name: "50% Trade Protection" }
        },
        funded: {
          profitTarget: null,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 10000,
          consistencyRules: true,
          dailyProtection: { enabled: true },
          tradeProtection: { enabled: true }
        }
      }
    },
    
    // 200k Account
    {
      name: "PropNumberOne Challenge 200k",
      accountSize: 200000,
      currency: "USD",
      rulesJson: {
        phase1: {
          profitTarget: 5,
          profitTargetAmount: 10000,  // 200000 * 0.05
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 20000, // 200000 * 0.10
          minTradingDays: 1,
          consistencyRules: false
        },
        phase2: {
          profitTarget: 5,
          profitTargetAmount: 10000,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 20000,
          minTradingDays: 5,
          consistencyRules: true,
          dailyProtection: { enabled: true },
          tradeProtection: { enabled: true }
        },
        funded: {
          profitTarget: null,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 20000,
          consistencyRules: true,
          dailyProtection: { enabled: true },
          tradeProtection: { enabled: true }
        }
      }
    },
    
    // 300k Account
    {
      name: "PropNumberOne Challenge 300k",
      accountSize: 300000,
      currency: "USD",
      rulesJson: {
        phase1: {
          profitTarget: 5,
          profitTargetAmount: 15000,  // 300000 * 0.05
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 30000, // 300000 * 0.10
          minTradingDays: 1,
          consistencyRules: false
        },
        phase2: {
          profitTarget: 5,
          profitTargetAmount: 15000,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 30000,
          minTradingDays: 5,
          consistencyRules: true,
          dailyProtection: { enabled: true },
          tradeProtection: { enabled: true }
        },
        funded: {
          profitTarget: null,
          maxDailyLoss: 5,
          maxOverallLoss: 10,
          maxOverallLossAmount: 30000,
          consistencyRules: true,
          dailyProtection: { enabled: true },
          tradeProtection: { enabled: true }
        }
      }
    }
  ]
};

async function addPropNumberOneTemplates() {
  try {
    console.log('🚀 Adding PropNumberOne templates...\n');

    const firmData = propNumberOneTemplates;
    
    // Find or create PropFirm
    let propFirm = await prisma.propFirm.findFirst({
      where: { name: firmData.propFirmName }
    });

    if (!propFirm) {
      console.log(`🔄 Creating PropFirm: ${firmData.propFirmName}`);
      propFirm = await prisma.propFirm.create({
        data: {
          name: firmData.propFirmName,
          description: firmData.description,
          website: firmData.website,
          isActive: true,
          defaultRules: firmData.templates[3].rulesJson // Use 50k as default
        }
      });
    }

    console.log(`✅ PropFirm ID: ${propFirm.id}`);
    console.log(`📋 PropFirm: ${propFirm.name}\n`);

    // Create templates
    for (const template of firmData.templates) {
      try {
        // Check if template already exists
        const existingTemplate = await prisma.propFirmTemplate.findFirst({
          where: {
            propFirmId: propFirm.id,
            name: template.name
          }
        });

        if (existingTemplate) {
          console.log(`⚠️  Template already exists: ${template.name}`);
          continue;
        }

        const createdTemplate = await prisma.propFirmTemplate.create({
          data: {
            name: template.name,
            propFirmId: propFirm.id,
            accountSize: template.accountSize,
            currency: template.currency,
            rulesJson: template.rulesJson,
            isActive: true
          }
        });

        const rules = template.rulesJson;
        console.log(`✅ Created: ${template.name}`);
        console.log(`   💰 Account Size: ${template.accountSize} ${template.currency}`);
        console.log(`   🎯 Phase 1 Target: ${rules.phase1.profitTarget}% (${rules.phase1.profitTargetAmount})`);
        console.log(`   🎯 Phase 2 Target: ${rules.phase2.profitTarget}% (${rules.phase2.profitTargetAmount})`);
        console.log(`   📉 Max Daily Loss: ${rules.phase1.maxDailyLoss}%`);
        console.log(`   🚫 Max Overall Loss: ${rules.phase1.maxOverallLoss}% (${rules.phase1.maxOverallLossAmount})`);
        console.log(`   ⚖️  Consistency Rules: Phase 1: ${rules.phase1.consistencyRules}, Phase 2: ${rules.phase2.consistencyRules}\n`);
        
      } catch (templateError) {
        console.error(`❌ Error creating template ${template.name}:`, templateError.message);
      }
    }

    // Summary
    const totalTemplates = await prisma.propFirmTemplate.count({
      where: { propFirmId: propFirm.id }
    });
    
    console.log(`🎉 PROPNUMBERONE SETUP COMPLETE!`);
    console.log(`📊 Created ${totalTemplates} templates for PropNumberOne`);
    console.log(`🔧 Ready for Rule Engine implementation!`);

  } catch (error) {
    console.error('❌ Error adding PropNumberOne templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPropNumberOneTemplates();