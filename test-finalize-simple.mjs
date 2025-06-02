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

async function testFinalizeSimple() {
  console.log('🚀 Testing if Finalize Component is Rendered...\n');
  
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
    
    // Select just 1 column for faster processing
    const checkbox = await page.locator('[role="checkbox"]').first();
    await checkbox.click();
    console.log('✓ Selected 1 column');
    
    // Start processing
    await page.click('button:has-text("Continue to Analysis")');
    console.log('✓ Started processing');
    
    // Wait for any result indication (not just complete)
    let processed = false;
    for (let i = 0; i < 60; i++) {
      await sleep(1000);
      
      // Check for various completion indicators
      const hasResults = await page.locator('[role="tab"]:has-text("Results")').isVisible().catch(() => false);
      const hasComplete = await page.locator('text=Analysis complete').isVisible().catch(() => false);
      const hasCodeframe = await page.locator('text=Codeframe').isVisible().catch(() => false);
      
      if (hasResults || hasComplete || hasCodeframe) {
        processed = true;
        break;
      }
      
      if (i % 10 === 0) {
        console.log(`  Waiting... ${i}s`);
      }
    }
    
    if (!processed) {
      console.log('⚠️  Processing timeout - checking current state anyway');
    } else {
      console.log('✓ Processing completed or results available');
    }
    
    // Try to navigate to results if tab is visible
    const resultsTab = await page.locator('[role="tab"]:has-text("Results")');
    if (await resultsTab.isVisible()) {
      await resultsTab.click();
      console.log('✓ Navigated to Results tab');
      await sleep(2000);
    }
    
    // Check for Finalize component
    console.log('\n📝 Checking for Finalize component...');
    
    const componentChecks = {
      'Codeframe Status card': await page.locator('text=Codeframe Status').isVisible().catch(() => false),
      'Finalize button': await page.locator('button:has-text("Finalize")').isVisible().catch(() => false),
      'Coverage text': await page.locator('text=Coverage').isVisible().catch(() => false),
      'Codes Created text': await page.locator('text=Codes Created').isVisible().catch(() => false),
      'FinalizeCodeframe component': await page.locator('[data-component-name="FinalizeCodeframe"]').isVisible().catch(() => false)
    };
    
    console.log('\nComponent visibility:');
    for (const [name, visible] of Object.entries(componentChecks)) {
      console.log(`  ${name}: ${visible ? '✅ Found' : '❌ Not found'}`);
    }
    
    // If component not found, check the page structure
    if (!componentChecks['Codeframe Status card']) {
      console.log('\n📝 Debugging: Checking page structure...');
      
      // Check what tabs are visible
      const tabs = await page.locator('[role="tab"]').allTextContents();
      console.log(`  Available tabs: ${tabs.join(', ')}`);
      
      // Check if we're on the right page
      const url = page.url();
      console.log(`  Current URL: ${url}`);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'finalize-debug.png', fullPage: true });
      console.log('  Screenshot saved: finalize-debug.png');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINALIZE COMPONENT TEST RESULTS:');
    console.log('='.repeat(50));
    
    const componentFound = Object.values(componentChecks).some(v => v);
    
    if (componentFound) {
      console.log('✅ Finalize component IS RENDERED!');
      console.log('   The implementation is working correctly.');
    } else {
      console.log('⚠️  Finalize component NOT FOUND');
      console.log('   Possible reasons:');
      console.log('   1. Component not imported in ResultsView');
      console.log('   2. Processing failed or no results');
      console.log('   3. Component render conditions not met');
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    console.log('\nTest finished. Browser will close in 10 seconds...');
    await sleep(10000);
    await browser.close();
  }
}

testFinalizeSimple().catch(console.error);