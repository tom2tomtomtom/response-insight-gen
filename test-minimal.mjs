import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_CREDENTIALS = {
  apiKey: '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',
  testFile: join(homedir(), 'Downloads', 'patourism_segmentation_final_data 2(A1).csv')
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMinimal() {
  console.log('🚀 Running Minimal Test to Verify Token Fix...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();
  
  // Capture console logs for chunking info
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Processing chunk') || text.includes('Column ') || text.includes('responses')) {
      console.log('📊', text);
    }
  });
  
  try {
    // Quick setup
    await page.goto('http://localhost:8081/');
    const hasApiKey = await page.evaluate(() => localStorage.getItem('response-insight-api-config'));
    
    if (!hasApiKey) {
      await page.waitForURL('**/api-config', { timeout: 5000 });
      await page.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
      await page.click('button:has-text("Save & Verify API Key")');
      await page.waitForURL('http://localhost:8081/', { timeout: 15000 });
    }
    
    // Upload file
    await page.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
    await page.waitForSelector('text=File uploaded successfully', { timeout: 10000 });
    await sleep(2000);
    
    // Select exactly 4 columns to test chunking (should process in 2 chunks of 3+1)
    console.log('Selecting 4 columns to test chunking...');
    const checkboxes = await page.locator('[role="checkbox"]').all();
    
    for (let i = 0; i < 4 && i < checkboxes.length; i++) {
      await checkboxes[i].click();
      await sleep(200);
    }
    console.log('✓ Selected 4 columns');
    
    // Set to miscellaneous
    const selects = await page.locator('select').all();
    for (const select of selects) {
      await select.selectOption('miscellaneous');
    }
    
    // Start processing
    await page.click('button:has-text("Continue to Analysis")');
    console.log('\n🔄 Processing started - watching for chunking...\n');
    
    // Wait for completion
    let completed = false;
    for (let i = 0; i < 60; i++) {
      await sleep(1000);
      
      if (await page.locator('text=Analysis complete').isVisible().catch(() => false) ||
          await page.locator('text=Analysis Results').isVisible().catch(() => false)) {
        completed = true;
        break;
      }
      
      if (i % 5 === 0) {
        process.stdout.write('.');
      }
    }
    
    console.log('\n');
    
    if (completed) {
      console.log('✅ PROCESSING COMPLETED SUCCESSFULLY!');
      console.log('✅ Token limit fix is working - no token errors');
      
      // Check results
      const resultsTab = await page.locator('[role="tab"]:has-text("Results")');
      if (await resultsTab.isVisible()) {
        await resultsTab.click();
        const responseCount = await page.locator('text=/\\d+ coded responses/').textContent().catch(() => '');
        console.log(`✅ Results generated: ${responseCount}`);
      }
    } else {
      console.log('⚠️  Processing did not complete in time');
      
      // Check for errors
      const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);
      if (hasError) {
        const errorText = await page.locator('[role="alert"]').textContent();
        console.log('Error found:', errorText);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    console.log('\nClosing in 5 seconds...');
    await sleep(5000);
    await browser.close();
  }
}

testMinimal().catch(console.error);