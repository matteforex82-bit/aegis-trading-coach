const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOldPositions() {
  try {
    console.log('🧹 PULIZIA POSIZIONI VECCHIE...\n');
    
    // Rimuovi le posizioni aperte obsolete
    const deleted = await prisma.trade.deleteMany({
      where: { 
        closeTime: null,
        OR: [
          { ticketId: '32902935' },  // NZDUSD vecchia
          { ticketId: '32619002' }   // EURUSD vecchia
        ]
      }
    });
    
    console.log(`✅ Rimosse ${deleted.count} posizioni obsolete`);
    console.log('📡 Ora riavvia l\'EA per sincronizzare le 4 posizioni correnti!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOldPositions();