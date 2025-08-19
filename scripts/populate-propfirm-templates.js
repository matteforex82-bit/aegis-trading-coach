const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Template delle regole per le principali prop firm
const propFirmTemplates = [
  // FTMO Templates
  {
    propFirmName: "FTMO",
    templates: [
      {
        name: "FTMO Challenge 10k",
        accountSize: 10000,
        currency: "USD",
        rulesJson: {
          profitTarget: 1000,      // 10% profit target
          maxDailyLoss: 500,       // 5% max daily loss
          maxTotalLoss: 1000,      // 10% max total loss
          maxDrawdown: 10,         // 10% max drawdown
          minTradingDays: 5,       // Minimum trading days
          maxTradingDays: 30,      // Maximum trading days
          
          // Rule specifics
          newsTrading: false,      // No trading during high impact news
          weekendHolding: false,   // No weekend holding
          hedging: false,          // No hedging allowed
          martingale: false,       // No martingale
          
          // Additional constraints
          maxLotSize: 1.0,         // Max 1 lot per trade
          maxRiskPerTrade: 2,      // Max 2% risk per trade
          
          // Phase specific rules
          phase1: {
            profitTarget: 1000,
            maxDrawdown: 10,
            minTradingDays: 5
          },
          phase2: {
            profitTarget: 500,     // 5% in phase 2
            maxDrawdown: 5,        // 5% max drawdown
            minTradingDays: 5
          }
        }
      },
      {
        name: "FTMO Challenge 25k",
        accountSize: 25000,
        currency: "USD", 
        rulesJson: {
          profitTarget: 2500,
          maxDailyLoss: 1250,
          maxTotalLoss: 2500,
          maxDrawdown: 10,
          minTradingDays: 5,
          maxTradingDays: 30,
          newsTrading: false,
          weekendHolding: false,
          hedging: false,
          martingale: false,
          maxLotSize: 2.5,
          maxRiskPerTrade: 2,
          phase1: {
            profitTarget: 2500,
            maxDrawdown: 10,
            minTradingDays: 5
          },
          phase2: {
            profitTarget: 1250,
            maxDrawdown: 5,
            minTradingDays: 5
          }
        }
      },
      {
        name: "FTMO Challenge 50k",
        accountSize: 50000,
        currency: "USD",
        rulesJson: {
          profitTarget: 5000,
          maxDailyLoss: 2500,
          maxTotalLoss: 5000,
          maxDrawdown: 10,
          minTradingDays: 5,
          maxTradingDays: 30,
          newsTrading: false,
          weekendHolding: false,
          hedging: false,
          martingale: false,
          maxLotSize: 5.0,
          maxRiskPerTrade: 2,
          phase1: {
            profitTarget: 5000,
            maxDrawdown: 10,
            minTradingDays: 5
          },
          phase2: {
            profitTarget: 2500,
            maxDrawdown: 5,
            minTradingDays: 5
          }
        }
      },
      {
        name: "FTMO Challenge 100k", 
        accountSize: 100000,
        currency: "USD",
        rulesJson: {
          profitTarget: 10000,
          maxDailyLoss: 5000,
          maxTotalLoss: 10000,
          maxDrawdown: 10,
          minTradingDays: 5,
          maxTradingDays: 30,
          newsTrading: false,
          weekendHolding: false,
          hedging: false,
          martingale: false,
          maxLotSize: 10.0,
          maxRiskPerTrade: 2,
          phase1: {
            profitTarget: 10000,
            maxDrawdown: 10,
            minTradingDays: 5
          },
          phase2: {
            profitTarget: 5000,
            maxDrawdown: 5,
            minTradingDays: 5
          }
        }
      }
    ]
  },
  
  // MyForexFunds Templates
  {
    propFirmName: "MyForexFunds",
    templates: [
      {
        name: "MyFF Rapid 25k",
        accountSize: 25000,
        currency: "USD",
        rulesJson: {
          profitTarget: 2000,      // 8% profit target
          maxDailyLoss: 1250,      // 5% max daily loss
          maxTotalLoss: 2500,      // 10% max total loss
          maxDrawdown: 12,         // 12% max drawdown
          minTradingDays: 3,       // Lower minimum
          maxTradingDays: 30,
          
          newsTrading: true,       // News trading allowed
          weekendHolding: true,    // Weekend holding allowed
          hedging: true,           // Hedging allowed
          martingale: false,
          
          maxLotSize: 2.5,
          maxRiskPerTrade: 3,      // Higher risk allowed
          
          phase1: {
            profitTarget: 2000,
            maxDrawdown: 12,
            minTradingDays: 3
          }
        }
      },
      {
        name: "MyFF Rapid 100k",
        accountSize: 100000,
        currency: "USD",
        rulesJson: {
          profitTarget: 8000,
          maxDailyLoss: 5000,
          maxTotalLoss: 10000,
          maxDrawdown: 12,
          minTradingDays: 3,
          maxTradingDays: 30,
          newsTrading: true,
          weekendHolding: true,
          hedging: true,
          martingale: false,
          maxLotSize: 10.0,
          maxRiskPerTrade: 3,
          phase1: {
            profitTarget: 8000,
            maxDrawdown: 12,
            minTradingDays: 3
          }
        }
      }
    ]
  }
];

async function populateTemplates() {
  try {
    console.log('🚀 Populating PropFirm templates...\n');

    for (const firmData of propFirmTemplates) {
      console.log(`📊 Processing ${firmData.propFirmName}...`);
      
      // Find or create PropFirm
      let propFirm = await prisma.propFirm.findFirst({
        where: { name: firmData.propFirmName }
      });

      if (!propFirm) {
        console.log(`  🔄 Creating PropFirm: ${firmData.propFirmName}`);
        propFirm = await prisma.propFirm.create({
          data: {
            name: firmData.propFirmName,
            description: `${firmData.propFirmName} Prop Trading Firm`,
            isActive: true,
            defaultRules: firmData.templates[0].rulesJson // Use first template as default
          }
        });
      }

      console.log(`  ✅ PropFirm ID: ${propFirm.id}`);

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
            console.log(`  ⚠️  Template already exists: ${template.name}`);
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

          console.log(`  ✅ Created template: ${template.name} (${template.accountSize} ${template.currency})`);
          
        } catch (templateError) {
          console.error(`  ❌ Error creating template ${template.name}:`, templateError.message);
        }
      }
      
      console.log(''); // Empty line between firms
    }

    // Summary
    const totalFirms = await prisma.propFirm.count();
    const totalTemplates = await prisma.propFirmTemplate.count();
    
    console.log('📈 SUMMARY:');
    console.log(`   PropFirms: ${totalFirms}`);
    console.log(`   Templates: ${totalTemplates}`);
    console.log('\n🎯 PropFirm templates populated successfully!');

    // Show created templates
    console.log('\n📋 CREATED TEMPLATES:');
    const allTemplates = await prisma.propFirmTemplate.findMany({
      include: {
        propFirm: {
          select: { name: true }
        }
      },
      orderBy: [
        { propFirm: { name: 'asc' } },
        { accountSize: 'asc' }
      ]
    });

    allTemplates.forEach(template => {
      const rules = template.rulesJson;
      console.log(`   ${template.propFirm.name} - ${template.name}: ${template.accountSize} ${template.currency} (Target: ${rules.profitTarget})`);
    });

  } catch (error) {
    console.error('❌ Error populating templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateTemplates();