const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugEASync() {
  try {
    console.log('🔍 DEBUG EA SYNC - Stato attuale database...\n');
    
    // Controlla tutte le posizioni aperte
    const openTrades = await prisma.trade.findMany({
      where: { closeTime: null },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`📊 Posizioni aperte nel database: ${openTrades.length}\n`);
    
    openTrades.forEach(trade => {
      console.log(`❌ POSIZIONE VECCHIA DA RIMUOVERE:`);
      console.log(`   Ticket: ${trade.ticketId}`);
      console.log(`   Symbol: ${trade.symbol}`);
      console.log(`   Ultimo aggiornamento: ${trade.updatedAt}`);
      console.log(`   Creato: ${trade.createdAt}`);
      console.log('');
    });

    // Rimuovi TUTTE le posizioni aperte obsolete
    console.log('🧹 PULIZIA COMPLETA di tutte le posizioni aperte...');
    
    const deleted = await prisma.trade.deleteMany({
      where: { closeTime: null }
    });
    
    console.log(`✅ Rimosse ${deleted.count} posizioni obsolete dal database`);
    console.log('📡 Database ora VUOTO per posizioni aperte');
    console.log('🔄 L\'EA dovrebbe ora sincronizzare le 4 posizioni correnti:');
    console.log('   - sp_stp #35313389 (buy 0.25) - Profit: 74.63€');
    console.log('   - nsdq_stp #35313390 (sell 0.14) - Profit: 334.14€');
    console.log('   - audusd_stp #35226648 (buy 1.22) - Profit: -773.31€');
    console.log('   - nzdusd_stp #35226649 (sell 1.29) - Profit: 697.15€');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEASync();