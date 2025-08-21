const data = require('./trades_response.json');

console.log('=== ANALISI POSIZIONI ===');

// Posizioni aperte
const openTrades = data.trades.filter(t => !t.closeTime);
console.log('\n📈 POSIZIONI APERTE:');
openTrades.forEach(t => {
  const pnl = t.pnlGross + (t.commission || 0) + (t.swap || 0);
  console.log(`${t.symbol} #${t.ticketId}: P&L=${pnl.toFixed(2)}`);
});

// Posizioni chiuse
const closedTrades = data.trades.filter(t => t.closeTime);
console.log('\n💰 POSIZIONI CHIUSE:');
const totalClosedPnL = closedTrades.reduce((sum, t) => {
  return sum + t.pnlGross + (t.commission || 0) + (t.swap || 0);
}, 0);
console.log(`Totale operazioni chiuse: ${closedTrades.length}`);
console.log(`P&L totale chiuse: ${totalClosedPnL.toFixed(2)}`);

// Cerca XAGUSD #162527
const xagTrade = data.trades.find(t => t.ticketId === '162527');
console.log('\n🔍 XAGUSD #162527:');
if (xagTrade) {
  console.log('Status:', xagTrade.closeTime ? 'CLOSED' : 'OPEN');
  console.log('P&L:', (xagTrade.pnlGross + (xagTrade.commission || 0) + (xagTrade.swap || 0)).toFixed(2));
  console.log('Open Time:', xagTrade.openTime);
  if (xagTrade.closeTime) console.log('Close Time:', xagTrade.closeTime);
} else {
  console.log('❌ NON TROVATA NEL DATABASE');
}

// Calcolo Balance ed Equity
const startingBalance = 50000;
const balance = startingBalance + totalClosedPnL;
const openPnL = openTrades.reduce((sum, t) => sum + t.pnlGross + (t.commission || 0) + (t.swap || 0), 0);
const equity = balance + openPnL;

console.log('\n💳 CALCOLI CORRETTI:');
console.log(`Starting Balance: $${startingBalance.toFixed(2)}`);
console.log(`Balance (Starting + Closed P&L): $${balance.toFixed(2)}`);
console.log(`Open P&L: $${openPnL.toFixed(2)}`);
console.log(`Equity (Balance + Open P&L): $${equity.toFixed(2)}`);
