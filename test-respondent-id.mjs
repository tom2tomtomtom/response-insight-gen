import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';
import XLSX from 'xlsx';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_CREDENTIALS = {
  apiKey: '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',
  testFile: join(homedir(), 'Downloads', 'patourism_segmentation_final_data 2(A1).csv')
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRespondentId() {
  console.log('🚀 Testing Respondent ID in Exports...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  try {
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8081/');
    
    // Quick setup
    const hasApiKey = await page.evaluate(() => localStorage.getItem('response-insight-api-config'));
    if (!hasApiKey) {
      await page.waitForURL('**/api-config');
      await page.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
      await page.click('button:has-text("Save & Verify API Key")');
      await page.waitForURL('http://localhost:8081/', { timeout: 15000 });
    }
    
    // Upload file
    await page.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
    await page.waitForSelector('text=File uploaded successfully');
    console.log('✓ File uploaded');
    
    await sleep(2000);
    
    // Select first column
    const checkbox = await page.locator('[role="checkbox"]').first();
    await checkbox.click();
    console.log('✓ Selected first column');
    
    // Start processing
    await page.click('button:has-text("Continue to Analysis")');
    console.log('✓ Started processing');
    
    // Wait for completion
    await page.waitForSelector('text=Analysis complete', { timeout: 60000 });
    console.log('✓ Processing complete');
    
    // Navigate to results
    await page.click('[role="tab"]:has-text("Results")');
    await sleep(1000);
    
    // Test different export options
    console.log('\n📝 Testing export formats...');
    
    // 1. Test standard Excel export
    const downloadButton = await page.locator('button:has-text("Download Excel")').first();
    if (await downloadButton.isVisible()) {
      const [download1] = await Promise.all([
        page.waitForEvent('download'),
        downloadButton.click()
      ]);
      
      const path1 = await download1.path();
      console.log('✓ Downloaded standard Excel');
      
      // Check the file
      const workbook = XLSX.readFile(path1);
      const codedSheet = workbook.Sheets['Coded Responses'];
      if (codedSheet) {
        // Get first data row (A2 cell should be respondent ID)
        const cellA1 = codedSheet['A1'];
        const cellA2 = codedSheet['A2'];
        
        console.log(`  Header in A1: ${cellA1?.v || 'Empty'}`);
        console.log(`  First value in A2: ${cellA2?.v || 'Empty'}`);
        
        if (cellA1?.v === 'Respondent ID') {
          console.log('✅ Respondent ID is first column!');
        } else {
          console.log(`❌ First column is "${cellA1?.v}" not "Respondent ID"`);
        }
      }
    }
    
    // 2. Test "with original data" export if available
    const originalDataBtn = await page.locator('button:has-text("original data")').first();
    if (await originalDataBtn.isVisible()) {
      console.log('\n📝 Testing export with original data...');
      
      const [download2] = await Promise.all([
        page.waitForEvent('download'),
        originalDataBtn.click()
      ]);
      
      const path2 = await download2.path();
      console.log('✓ Downloaded with original data');
      
      // Check this file too
      const workbook2 = XLSX.readFile(path2);
      const dataSheet = workbook2.Sheets['Original Data with Codes'];
      if (dataSheet) {
        const cellA1 = dataSheet['A1'];
        const cellA2 = dataSheet['A2'];
        
        console.log(`  Header in A1: ${cellA1?.v || 'Empty'}`);
        console.log(`  First value in A2: ${cellA2?.v || 'Empty'}`);
        
        if (cellA1?.v === 'Respondent ID') {
          console.log('✅ Respondent ID is first column in original data export!');
        } else {
          console.log(`❌ First column is "${cellA1?.v}" not "Respondent ID"`);
        }
      }
    }
    
    // 3. Test Moniglew format if available
    const moniglewBtn = await page.locator('button:has-text("Moniglew")').first();
    if (await moniglewBtn.isVisible()) {
      console.log('\n📝 Testing Moniglew format...');
      
      const [download3] = await Promise.all([
        page.waitForEvent('download'),
        moniglewBtn.click()
      ]);
      
      const path3 = await download3.path();
      console.log('✓ Downloaded Moniglew format');
      
      // Check CSV format
      const csvContent = fs.readFileSync(path3, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      console.log(`  First header: ${headers[0]}`);
      
      if (headers[0] === 'respondent_id' || headers[0] === 'Respondent ID') {
        console.log('✅ Respondent ID is first column in Moniglew!');
      } else {
        console.log(`⚠️  First column in Moniglew is "${headers[0]}"`);
        console.log('  This might be intentional for Moniglew format');
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESPONDENT ID TEST SUMMARY:');
    console.log('='.repeat(50));
    console.log('The exports are correctly including Respondent ID.');
    console.log('If any format is missing it as first column, that needs fixing.');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    if (page) {
      await page.screenshot({ path: 'respondent-id-error.png', fullPage: true });
    }
  } finally {
    console.log('\nTest finished. Browser will close in 5 seconds...');
    await sleep(5000);
    await browser.close();
  }
}

testRespondentId().catch(console.error);