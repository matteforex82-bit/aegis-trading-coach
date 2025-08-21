const data = require('./trades_response.json');
const xagTrades = data.trades.filter(t => t.ticketId === '162527');
console.log('XAGUSD #162527 TROVATE:', xagTrades.length);
xagTrades.forEach((t, i) => {
  console.log(i+1 + '. Status: ' + (t.closeTime ? 'CLOSED' : 'OPEN'));
  console.log('   Open: ' + t.openTime);
  if (t.closeTime) console.log('   Close: ' + t.closeTime);
  console.log('   PnL: ' + (t.pnlGross + (t.commission || 0) + (t.swap || 0)).toFixed(2));
  console.log('');
});

console.log('=== VERIFICA PROBLEMA ===');
if (xagTrades.length === 1 && xagTrades[0].closeTime) {
  console.log('❌ PROBLEMA: XAGUSD #162527 è CHIUSA nel DB ma EA la vede APERTA');
  console.log('🔧 SOLUZIONE: EA deve inviare la NUOVA posizione aperta con stesso ticket');
}
