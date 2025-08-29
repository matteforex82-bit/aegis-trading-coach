const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function deleteOldTemplates() {
  try {
    console.log('🗑️ Eliminazione template FTMO e MyForexFunds...\n');

    // Find PropFirms to delete
    const propFirmsToDelete = await db.propFirm.findMany({
      where: {
        OR: [
          { name: 'FTMO' },
          { name: 'MyForexFunds' }
        ]
      },
      include: {
        templates: true,
        accounts: true
      }
    });

    if (propFirmsToDelete.length === 0) {
      console.log('ℹ️ Nessun template FTMO o MyForexFunds trovato.');
      return;
    }

    for (const propFirm of propFirmsToDelete) {
      console.log(`🔍 PropFirm trovata: ${propFirm.name}`);
      console.log(`   📋 Templates: ${propFirm.templates.length}`);
      console.log(`   👤 Accounts collegati: ${propFirm.accounts.length}`);

      // Check if there are accounts using this PropFirm
      if (propFirm.accounts.length > 0) {
        console.log(`⚠️ ATTENZIONE: ${propFirm.accounts.length} account collegati a ${propFirm.name}`);
        console.log('   Scollegamento account prima dell\'eliminazione...');
        
        // Disconnect accounts from PropFirm
        await db.account.updateMany({
          where: { propFirmId: propFirm.id },
          data: {
            propFirmId: null,
            propFirmTemplateId: null,
            accountType: 'DEMO',
            currentPhase: 'DEMO'
          }
        });
        
        console.log(`   ✅ ${propFirm.accounts.length} account scollegati`);
      }

      // Delete templates first (due to foreign key constraints)
      if (propFirm.templates.length > 0) {
        const deletedTemplates = await db.propFirmTemplate.deleteMany({
          where: { propFirmId: propFirm.id }
        });
        console.log(`   🗑️ ${deletedTemplates.count} template eliminati`);
      }

      // Delete PropFirm
      await db.propFirm.delete({
        where: { id: propFirm.id }
      });
      
      console.log(`   ✅ PropFirm ${propFirm.name} eliminata\n`);
    }

    // Summary
    const remainingFirms = await db.propFirm.findMany({
      include: {
        templates: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log('📈 RIEPILOGO FINALE:');
    console.log(`   PropFirms rimanenti: ${remainingFirms.length}`);
    
    remainingFirms.forEach(firm => {
      console.log(`   📊 ${firm.name}: ${firm.templates.length} template`);
    });
    
    console.log('\n🎯 Eliminazione completata con successo!');

  } catch (error) {
    console.error('❌ Errore durante l\'eliminazione:', error);
  } finally {
    await db.$disconnect();
  }
}

deleteOldTemplates();