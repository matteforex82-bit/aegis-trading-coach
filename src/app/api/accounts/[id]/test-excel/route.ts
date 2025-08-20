import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const formData = await request.formData()
    const excelFile = formData.get('excelFile') as File

    if (!excelFile) {
      return NextResponse.json({ error: 'No Excel file provided' }, { status: 400 })
    }

    // Read and parse Excel content
    const arrayBuffer = await excelFile.arrayBuffer()
    console.log('📄 TEST PARSING MT5 Excel report...')

    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    console.log('📋 Available sheets:', workbook.SheetNames)

    const mainSheet = workbook.Sheets[workbook.SheetNames[0]]
    const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 }) as any[][]
    
    console.log(`📊 Total rows: ${mainData.length}`)
    
    // Show first 50 rows
    const first50Rows = mainData.slice(0, 50)
    
    // Look for account info
    let accountFound = false
    let accountLogin = ''
    
    for (let i = 0; i < Math.min(mainData.length, 20); i++) {
      const row = mainData[i] || []
      const rowText = row.join(' ').toLowerCase()
      
      if (rowText.includes('account') && rowText.includes('2958')) {
        accountFound = true
        accountLogin = '2958'
        console.log(`✅ Found account in row ${i}:`, row)
        break
      }
    }
    
    // Look for Positions section
    let positionsFound = false
    let positionsRowIndex = -1
    
    for (let i = 0; i < mainData.length; i++) {
      const row = mainData[i] || []
      const rowText = row.join('').toLowerCase()
      
      if (rowText.includes('positions') && !rowText.includes('open')) {
        positionsFound = true
        positionsRowIndex = i
        console.log(`✅ Found Positions section at row ${i}:`, row)
        break
      }
    }
    
    // Look for actual trade data
    let tradeRowsFound = []
    
    if (positionsRowIndex >= 0) {
      // Look for data rows after positions header
      for (let i = positionsRowIndex + 1; i < Math.min(positionsRowIndex + 100, mainData.length); i++) {
        const row = mainData[i] || []
        
        // Stop if we reach Orders or Deals sections
        const firstCell = String(row[0] || '').toLowerCase().trim()
        if (firstCell.includes('orders') || firstCell.includes('deals')) {
          console.log(`📋 Stopping at row ${i} - reached ${firstCell} section`)
          break
        }
        
        // Skip empty rows but continue parsing
        if (row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
          continue
        }
        
        // Look for rows that might be trades (have ticket numbers)
        if (row.length > 5) {
          const possibleTicket = String(row[1] || '')
          if (possibleTicket.match(/^\d+$/)) {
            tradeRowsFound.push({
              rowIndex: i,
              data: row.slice(0, 10) // Limit data to prevent type issues
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        fileName: excelFile.name,
        fileSize: excelFile.size,
        totalRows: mainData.length,
        sheets: workbook.SheetNames,
        accountFound,
        accountLogin,
        positionsFound,
        positionsRowIndex,
        tradeRowsFound: tradeRowsFound.length,
        sampleRows: first50Rows,
        sampleTrades: tradeRowsFound.slice(0, 5)
      }
    })

  } catch (error: any) {
    console.error('❌ Error testing Excel:', error)
    return NextResponse.json({ 
      error: 'Failed to test Excel file',
      details: error.message 
    }, { status: 500 })
  }
}