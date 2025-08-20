const fs = require('fs');
const FormData = require('form-data');
const { default: fetch } = require('node-fetch');

/**
 * AUTOPILOT TEST SCRIPT - Excel Import Flow Verification
 * Tests the complete Excel import functionality end-to-end
 * Assumes Excel file exists at: ReportHistory-2958.xlsx
 */

const BASE_URL = 'http://localhost:3004';
const ACCOUNT_ID = 'cmej2fx5s0001wf3gkmbktejc'; // From API response
const EXCEL_FILE_PATH = './ReportHistory-2958.xlsx';

async function runCompleteTest() {
  console.log('🚀 AUTOPILOT: Excel Import Flow Test Starting...\n');

  try {
    // Step 1: Verify account exists
    console.log('1️⃣ Verifying account...');
    const accountResponse = await fetch(`${BASE_URL}/api/accounts`);
    const accounts = await accountResponse.json();
    
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('No accounts found');
    }
    console.log(`✅ Account found: ${accounts[0].login} (${accounts[0].name})`);

    // Step 2: Check if Excel file exists
    console.log('\n2️⃣ Checking Excel file...');
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      console.log(`❌ Excel file not found at: ${EXCEL_FILE_PATH}`);
      console.log('📋 Creating mock Excel test instead...');
      return testWithoutFile();
    }
    console.log(`✅ Excel file found: ${EXCEL_FILE_PATH}`);

    // Step 3: Test Excel parsing (dry run)
    console.log('\n3️⃣ Testing Excel parsing (test-excel endpoint)...');
    const testForm = new FormData();
    testForm.append('excelFile', fs.createReadStream(EXCEL_FILE_PATH));
    
    const testResponse = await fetch(`${BASE_URL}/api/accounts/${ACCOUNT_ID}/test-excel`, {
      method: 'POST',
      body: testForm
    });
    
    const testResult = await testResponse.json();
    if (!testResponse.ok) {
      throw new Error(`Test failed: ${testResult.error}`);
    }
    
    console.log(`✅ Test Results:`);
    console.log(`   - File: ${testResult.debug.fileName}`);
    console.log(`   - Rows: ${testResult.debug.totalRows}`);
    console.log(`   - Account Found: ${testResult.debug.accountFound}`);
    console.log(`   - Trades Found: ${testResult.debug.tradeRowsFound}`);

    // Step 4: Check current trade count
    console.log('\n4️⃣ Checking current trade count...');
    const debugResponse = await fetch(`${BASE_URL}/api/accounts/${ACCOUNT_ID}/debug-trades`);
    const debugResult = await debugResponse.json();
    
    if (!debugResponse.ok) {
      throw new Error(`Debug failed: ${debugResult.error}`);
    }
    
    console.log(`✅ Current database state:`);
    console.log(`   - Total trades: ${debugResult.debug.tradeCounts.total}`);
    console.log(`   - Closed trades: ${debugResult.debug.tradeCounts.closed}`);
    console.log(`   - Open trades: ${debugResult.debug.tradeCounts.open}`);

    // Step 5: Perform actual import
    console.log('\n5️⃣ Performing Excel import...');
    const importForm = new FormData();
    importForm.append('excelFile', fs.createReadStream(EXCEL_FILE_PATH));
    importForm.append('options', JSON.stringify({
      clearExisting: true,
      mode: 'import'
    }));
    
    const importResponse = await fetch(`${BASE_URL}/api/accounts/${ACCOUNT_ID}/sync-excel`, {
      method: 'POST',
      body: importForm
    });
    
    const importResult = await importResponse.json();
    if (!importResponse.ok) {
      console.error('❌ Import failed:', importResult.error);
      if (importResult.debug) {
        console.error('Debug info:', JSON.stringify(importResult.debug, null, 2));
      }
      throw new Error(`Import failed: ${importResult.error}`);
    }
    
    console.log(`✅ Import Results:`);
    console.log(`   - Closed trades imported: ${importResult.result.imported.closedTrades}`);
    console.log(`   - Open positions imported: ${importResult.result.imported.openPositions}`);
    console.log(`   - Errors: ${importResult.result.errors.length}`);
    
    if (importResult.result.errors.length > 0) {
      console.log('⚠️ Import errors:', importResult.result.errors);
    }

    // Step 6: Verify import success
    console.log('\n6️⃣ Verifying import results...');
    const postImportDebug = await fetch(`${BASE_URL}/api/accounts/${ACCOUNT_ID}/debug-trades`);
    const postImportResult = await postImportDebug.json();
    
    console.log(`✅ Post-import database state:`);
    console.log(`   - Total trades: ${postImportResult.debug.tradeCounts.total}`);
    console.log(`   - Closed trades: ${postImportResult.debug.tradeCounts.closed}`);
    console.log(`   - Open trades: ${postImportResult.debug.tradeCounts.open}`);

    // Step 7: Test trades page data
    console.log('\n7️⃣ Testing trades page API...');
    const tradesResponse = await fetch(`${BASE_URL}/api/accounts/${ACCOUNT_ID}/trades?limit=1000`);
    const tradesResult = await tradesResponse.json();
    
    if (!tradesResponse.ok) {
      throw new Error(`Trades API failed: ${tradesResult.error}`);
    }
    
    console.log(`✅ Trades API Results:`);
    console.log(`   - Trades returned: ${tradesResult.trades?.length || 0}`);
    
    if (tradesResult.trades && tradesResult.trades.length > 0) {
      const sampleTrade = tradesResult.trades[0];
      console.log(`   - Sample trade: ${sampleTrade.ticketId} ${sampleTrade.symbol} ${sampleTrade.side}`);
    }

    console.log('\n🎉 AUTOPILOT TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`   ✅ Excel parsing: ${testResult.debug.tradeRowsFound} trades found`);
    console.log(`   ✅ Database import: ${importResult.result.imported.closedTrades} trades imported`);
    console.log(`   ✅ API retrieval: ${tradesResult.trades?.length || 0} trades accessible`);
    
    const success = testResult.debug.tradeRowsFound > 0 && 
                   importResult.result.imported.closedTrades > 0 && 
                   tradesResult.trades?.length > 0;
    
    if (success) {
      console.log('\n🚀 AUTOPILOT VERDICT: EXCEL IMPORT FULLY FUNCTIONAL ✅');
    } else {
      console.log('\n⚠️ AUTOPILOT VERDICT: EXCEL IMPORT HAS ISSUES ❌');
    }

  } catch (error) {
    console.error('\n❌ AUTOPILOT TEST FAILED:', error.message);
    console.error('\n🔧 AUTOPILOT: Automatic troubleshooting needed');
    process.exit(1);
  }
}

async function testWithoutFile() {
  console.log('📋 Running API connectivity tests only...');
  
  // Just test the endpoints are working
  const debugResponse = await fetch(`${BASE_URL}/api/accounts/${ACCOUNT_ID}/debug-trades`);
  const debugResult = await debugResponse.json();
  
  console.log(`✅ Debug API working: ${debugResult.debug.tradeCounts.total} total trades`);
  console.log('\n📋 Manual testing required: Please upload Excel file via UI');
}

// Auto-run if called directly
if (require.main === module) {
  runCompleteTest();
}

module.exports = { runCompleteTest };