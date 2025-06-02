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

async function testSessionPersistence() {
  console.log('🚀 Testing Session Persistence...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  try {
    // PART 1: Setup initial session
    console.log('📝 PART 1: Setting up initial session...');
    const context1 = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });
    const page1 = await context1.newPage();
    
    await page1.goto('http://localhost:8081/');
    await page1.evaluate(() => localStorage.clear());
    await page1.reload();
    
    // Configure API
    const needsApiConfig = await page1.url().includes('api-config');
    if (needsApiConfig) {
      await page1.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
      await page1.click('button:has-text("Save & Verify API Key")');
      await page1.waitForURL('http://localhost:8081/', { timeout: 15000 });
    }
    console.log('✓ API configured');
    
    // Upload file with metadata
    await page1.fill('input[placeholder="Industry"]', 'Tourism');
    await page1.fill('input[placeholder="Client Name"]', 'Test Client ABC');
    await page1.fill('input[placeholder="Study Objective"]', 'Brand tracking study Q1 2024');
    
    // Check if study type select exists
    const studyTypeSelect = await page1.locator('select').first();
    if (await studyTypeSelect.isVisible()) {
      await studyTypeSelect.selectOption('tracking');
    }
    
    await page1.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
    await page1.waitForSelector('text=File uploaded successfully');
    console.log('✓ File uploaded with metadata');
    
    await sleep(2000);
    
    // Select specific columns
    const checkboxes = await page1.locator('[role="checkbox"]').all();
    if (checkboxes.length >= 3) {
      await checkboxes[0].click();
      await checkboxes[2].click();
      await checkboxes[4].click();
      console.log('✓ Selected 3 specific columns (1, 3, 5)');
    }
    
    // Configure question types
    const selects = await page1.locator('select').all();
    if (selects.length >= 3) {
      await selects[0].selectOption('brand_awareness');
      await selects[1].selectOption('miscellaneous');
      await selects[2].selectOption('brand_description');
      console.log('✓ Configured question types');
    }
    
    // Add brand list
    const brandManagerBtn = await page1.locator('button:has-text("Brand List Manager")').first();
    if (await brandManagerBtn.isVisible()) {
      await brandManagerBtn.click();
      await sleep(500);
      
      // Add a brand entry
      const brandInput = await page1.locator('input[placeholder*="Brand"]').first();
      const systemInput = await page1.locator('input[placeholder*="System"]').first();
      if (await brandInput.isVisible() && await systemInput.isVisible()) {
        await brandInput.fill('Coca Cola Zero');
        await systemInput.fill('Coca Cola Company');
        await page1.keyboard.press('Enter');
        console.log('✓ Added brand list entry');
      }
    }
    
    // Check persisted data
    const persistedData = await page1.evaluate(() => {
      return {
        selectedColumns: localStorage.getItem('response-insight-selected-columns'),
        columnConfigs: localStorage.getItem('response-insight-column-configs'),
        projectContext: localStorage.getItem('response-insight-project-context'),
        brandList: localStorage.getItem('response-insight-brand-list')
      };
    });
    
    console.log('\n📊 Persisted data check:');
    console.log(`  Selected columns: ${persistedData.selectedColumns ? '✓ Saved' : '❌ Not saved'}`);
    console.log(`  Column configs: ${persistedData.columnConfigs ? '✓ Saved' : '❌ Not saved'}`);
    console.log(`  Project context: ${persistedData.projectContext ? '✓ Saved' : '❌ Not saved'}`);
    console.log(`  Brand list: ${persistedData.brandList ? '✓ Saved' : '❌ Not saved'}`);
    
    // Close first session
    await page1.close();
    await context1.close();
    console.log('\n✓ First session closed');
    
    // PART 2: Open new session and verify persistence
    console.log('\n📝 PART 2: Opening new session to verify persistence...');
    await sleep(2000);
    
    const context2 = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });
    const page2 = await context2.newPage();
    
    await page2.goto('http://localhost:8081/');
    console.log('✓ New session opened');
    
    // Check if state was restored
    await sleep(2000);
    
    // Check metadata
    const industryVisible = await page2.locator('text=Tourism').isVisible().catch(() => false);
    const clientVisible = await page2.locator('text=Test Client ABC').isVisible().catch(() => false);
    const objectiveVisible = await page2.locator('text=Brand tracking study Q1 2024').isVisible().catch(() => false);
    
    console.log('\n📊 Restored state check:');
    console.log(`  Industry (Tourism): ${industryVisible ? '✅ Restored' : '❌ Not restored'}`);
    console.log(`  Client (Test Client ABC): ${clientVisible ? '✅ Restored' : '❌ Not restored'}`);
    console.log(`  Objective: ${objectiveVisible ? '✅ Restored' : '❌ Not restored'}`);
    
    // Check selected columns
    const selectedCheckboxes = await page2.locator('[role="checkbox"][aria-checked="true"]').count();
    console.log(`  Selected columns: ${selectedCheckboxes > 0 ? `✅ ${selectedCheckboxes} restored` : '❌ Not restored'}`);
    
    // Check brand list
    const brandListVisible = await page2.locator('text=Coca Cola Company').isVisible().catch(() => false);
    console.log(`  Brand list: ${brandListVisible ? '✅ Restored' : '❌ Not restored'}`);
    
    // Check if file needs re-upload
    const needsFileUpload = await page2.locator('input[type="file"]').isVisible().catch(() => false);
    console.log(`  File state: ${!needsFileUpload ? '✅ Previous file state preserved' : '⚠️  Needs re-upload (expected)'}`);
    
    // PART 3: Test clearing session
    console.log('\n📝 PART 3: Testing session clear...');
    
    // Look for a reset or clear button
    const clearBtn = await page2.locator('button:has-text("Clear"), button:has-text("Reset"), button:has-text("Start New")').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      console.log('✓ Clicked clear/reset button');
    } else {
      // Manually clear
      await page2.evaluate(() => {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('response-insight-')) {
            localStorage.removeItem(key);
          }
        });
      });
      console.log('✓ Manually cleared session data');
    }
    
    await page2.reload();
    await sleep(2000);
    
    // Verify cleared
    const dataAfterClear = await page2.evaluate(() => {
      return Object.keys(localStorage).filter(key => key.startsWith('response-insight-')).length;
    });
    
    console.log(`\n✅ Session clear test: ${dataAfterClear === 0 ? 'All data cleared' : `${dataAfterClear} items remain`}`);
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SESSION PERSISTENCE TEST SUMMARY:');
    console.log('='.repeat(50));
    
    const allPersisted = persistedData.selectedColumns && persistedData.projectContext;
    const someRestored = industryVisible || clientVisible || selectedCheckboxes > 0;
    
    if (allPersisted && someRestored) {
      console.log('✅ Session persistence is WORKING!');
      console.log('   - Data is saved to localStorage');
      console.log('   - State is restored on page reload');
      console.log('   - Selected columns and configs persist');
    } else if (allPersisted && !someRestored) {
      console.log('⚠️  Session persistence is PARTIALLY working');
      console.log('   - Data is saved to localStorage ✓');
      console.log('   - State restoration needs improvement ✗');
    } else {
      console.log('❌ Session persistence needs implementation');
      console.log('   - Need to save state to localStorage');
      console.log('   - Need to restore state on page load');
    }
    
    console.log('='.repeat(50));
    
    await page2.close();
    await context2.close();
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    console.log('\nTest finished. Browser will close in 5 seconds...');
    await sleep(5000);
    await browser.close();
  }
}

testSessionPersistence().catch(console.error);