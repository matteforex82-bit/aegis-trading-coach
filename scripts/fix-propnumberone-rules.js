const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPropNumberOneRules() {
  try {
    console.log('🔧 Fixing PropNumberOne template rules...\n');

    // Get PropNumberOne firm
    const propFirm = await prisma.propFirm.findFirst({
      where: { name: "PropNumberOne" }
    });

    if (!propFirm) {
      console.log('❌ PropNumberOne firm not found');
      return;
    }

    // Get all PropNumberOne templates
    const templates = await prisma.propFirmTemplate.findMany({
      where: { propFirmId: propFirm.id }
    });

    console.log(`📊 Found ${templates.length} templates to fix`);

    for (const template of templates) {
      const currentRules = template.rulesJson;
      const accountSize = template.accountSize;
      
      // Calculate correct values
      const phase1Target = Math.round(accountSize * 0.05); // 5% for Phase 1
      const phase2Target = Math.round(accountSize * 0.08); // 8% for Phase 2 (CORRETTO!)
      const maxOverallLossAmount = Math.round(accountSize * 0.10); // 10% max loss
      
      // Fix the rules
      const updatedRules = {
        ...currentRules,
        // FASE 1: Evaluation (5% target)
        phase1: {
          ...currentRules.phase1,
          profitTarget: 5,
          profitTargetAmount: phase1Target,
          maxOverallLossAmount: maxOverallLossAmount
        },
        
        // FASE 2: Verification (8% target - CORRETTO!)
        phase2: {
          ...currentRules.phase2,
          profitTarget: 8,                    // 8% invece di 5%
          profitTargetAmount: phase2Target,   // Calcolo corretto
          maxOverallLossAmount: maxOverallLossAmount
        },
        
        // FUNDED: No profit target (CORRETTO!)
        funded: {
          ...currentRules.funded,
          profitTarget: null,                 // Nessun target
          profitTargetAmount: null,           // Nessun target
          maxOverallLossAmount: maxOverallLossAmount
        }
      };

      // Update template
      await prisma.propFirmTemplate.update({
        where: { id: template.id },
        data: {
          rulesJson: updatedRules
        }
      });

      console.log(`✅ Fixed: ${template.name}`);
      console.log(`   Phase 1: ${updatedRules.phase1.profitTarget}% (${updatedRules.phase1.profitTargetAmount})`);
      console.log(`   Phase 2: ${updatedRules.phase2.profitTarget}% (${updatedRules.phase2.profitTargetAmount})`);
      console.log(`   Funded: No target`);
      console.log('');
    }

    console.log('🎉 All PropNumberOne templates fixed!');
    console.log('✅ Phase 1: 5% profit target');
    console.log('✅ Phase 2: 8% profit target (CORRECTED)');
    console.log('✅ Funded: No profit target');

  } catch (error) {
    console.error('❌ Error fixing rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPropNumberOneRules();