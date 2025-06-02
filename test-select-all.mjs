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

async function testSelectAll() {
  console.log('🚀 Testing Select All Functionality...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();
  
  try {
    // Step 1: Setup
    console.log('📝 Step 1: Setting up...');
    await page.goto('http://localhost:8081/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await page.waitForURL('**/api-config', { timeout: 5000 });
    await page.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
    await page.click('button:has-text("Save & Verify API Key")');
    
    await Promise.race([
      page.waitForURL('http://localhost:8081/', { timeout: 15000 }),
      page.waitForSelector('text=API Key Configured', { timeout: 15000 })
    ]);
    console.log('✓ API configured\n');
    
    if (!page.url().includes('localhost:8081') || page.url().includes('api-config')) {
      await page.goto('http://localhost:8081/');
    }
    
    // Step 2: Upload file
    console.log('📝 Step 2: Uploading file...');
    await page.waitForSelector('input[type="file"]', { state: 'attached' });
    await page.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
    
    await page.waitForSelector('text=File uploaded successfully', { timeout: 10000 });
    console.log('✓ File uploaded');
    
    await sleep(2000);
    
    // Step 3: Test Select All with Search
    console.log('\n📝 Step 3: Testing Select All with Search...');
    
    // Count total columns
    const totalCheckboxes = await page.locator('[role="checkbox"]').count();
    console.log(`Total columns: ${totalCheckboxes}`);
    
    // Test 1: Search for "B1" and use Select All
    const searchInput = await page.locator('input[placeholder="Search columns..."]');
    await searchInput.fill('B1');
    await sleep(1000);
    
    const filteredCheckboxes = await page.locator('[role="checkbox"]').count();
    console.log(`Filtered columns for "B1": ${filteredCheckboxes}`);
    
    // Click Select All
    const selectAllBtn = await page.locator('button:has-text("Select All")');
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
      console.log('✓ Clicked Select All for filtered columns');
      await sleep(1000);
      
      // Count selected
      const selectedAfterSelectAll = await page.locator('[role="checkbox"][aria-checked="true"]').count();
      console.log(`Selected after Select All: ${selectedAfterSelectAll}`);
      
      // Verify only filtered columns are selected
      if (selectedAfterSelectAll === filteredCheckboxes) {
        console.log('✅ PASS: Select All correctly selected only filtered columns');
      } else {
        console.log(`❌ FAIL: Expected ${filteredCheckboxes} selected, got ${selectedAfterSelectAll}`);
      }
      
      // Test 2: Deselect All
      const deselectBtn = await page.locator('button:has-text("Deselect All")');
      if (await deselectBtn.isVisible()) {
        await deselectBtn.click();
        console.log('✓ Clicked Deselect All');
        await sleep(1000);
        
        const selectedAfterDeselect = await page.locator('[role="checkbox"][aria-checked="true"]').count();
        console.log(`Selected after Deselect All: ${selectedAfterDeselect}`);
        
        if (selectedAfterDeselect === 0) {
          console.log('✅ PASS: Deselect All correctly deselected all filtered columns');
        } else {
          console.log(`❌ FAIL: Expected 0 selected, got ${selectedAfterDeselect}`);
        }
      }
    }
    
    // Test 3: Clear search and check behavior
    console.log('\n📝 Test 3: Clear search and check state...');
    await searchInput.clear();
    await sleep(1000);
    
    const allColumnsAfterClear = await page.locator('[role="checkbox"]').count();
    console.log(`All columns visible after clearing search: ${allColumnsAfterClear}`);
    
    // Test 4: Different search term
    console.log('\n📝 Test 4: Testing with different search term...');
    await searchInput.fill('B2');
    await sleep(1000);
    
    const b2Columns = await page.locator('[role="checkbox"]').count();
    console.log(`Filtered columns for "B2": ${b2Columns}`);
    
    if (b2Columns > 0) {
      const selectAllB2 = await page.locator('button:has-text("Select All")');
      if (await selectAllB2.isVisible()) {
        await selectAllB2.click();
        await sleep(1000);
        
        const selectedB2 = await page.locator('[role="checkbox"][aria-checked="true"]').count();
        console.log(`Selected B2 columns: ${selectedB2}`);
        
        if (selectedB2 === b2Columns) {
          console.log('✅ PASS: Select All works correctly with different search terms');
        } else {
          console.log(`❌ FAIL: Expected ${b2Columns} selected, got ${selectedB2}`);
        }
      }
    }
    
    console.log('\n✅ Select All testing completed!');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'select-all-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  } finally {
    console.log('\nTest finished. Browser will close in 5 seconds...');
    await sleep(5000);
    await browser.close();
  }
}

testSelectAll().catch(console.error);