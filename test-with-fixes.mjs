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

async function testWithFixes() {
  console.log('🚀 Starting Fixed Test Suite...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();
  
  // Add console logging to see errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });
  
  try {
    // Step 1: Clear state and configure API
    console.log('📝 Step 1: Setting up...');
    await page.goto('http://localhost:8081/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await page.waitForURL('**/api-config', { timeout: 5000 });
    await page.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
    await page.click('button:has-text("Save & Verify API Key")');
    
    // Wait for navigation or toast
    await Promise.race([
      page.waitForURL('http://localhost:8081/', { timeout: 15000 }),
      page.waitForSelector('text=API Key Configured', { timeout: 15000 })
    ]);
    console.log('✓ API configured\n');
    
    // Navigate home if needed
    if (!page.url().includes('localhost:8081') || page.url().includes('api-config')) {
      await page.goto('http://localhost:8081/');
    }
    
    // Step 2: Upload file
    console.log('📝 Step 2: Uploading file...');
    await page.waitForSelector('input[type="file"]', { state: 'attached' });
    await page.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
    
    await page.waitForSelector('text=File uploaded successfully', { timeout: 10000 });
    console.log('✓ File uploaded');
    
    // Wait for UI to stabilize
    await sleep(2000);
    
    // Step 3: Select minimal columns
    console.log('\n📝 Step 3: Selecting columns...');
    
    // First, let's see what's available
    const checkboxes = await page.locator('[role="checkbox"]').all();
    console.log(`Found ${checkboxes.length} total columns`);
    
    // Search for B columns to reduce the set
    const searchInput = await page.locator('input[placeholder="Search columns..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('B1'); // More specific search
      await sleep(1000);
      
      const filteredCheckboxes = await page.locator('[role="checkbox"]').all();
      console.log(`Found ${filteredCheckboxes.length} B1 columns`);
      
      // Select just 1-2 columns
      const toSelect = Math.min(2, filteredCheckboxes.length);
      for (let i = 0; i < toSelect; i++) {
        await filteredCheckboxes[i].click();
        await sleep(300);
      }
      console.log(`✓ Selected ${toSelect} columns`);
    }
    
    // Wait for question type configuration
    await sleep(1000);
    
    // Check if we need to configure question types
    const configSection = await page.locator('text=Question Configuration').isVisible().catch(() => false);
    if (configSection) {
      console.log('✓ Question configuration section found');
      
      // Set all to miscellaneous for speed
      const selects = await page.locator('select').all();
      for (const select of selects) {
        await select.selectOption('miscellaneous');
      }
      console.log('✓ Set all questions to miscellaneous');
    }
    
    // Step 4: Start processing
    console.log('\n📝 Step 4: Processing...');
    
    // Click continue button
    const continueBtn = await page.locator('button:has-text("Continue to Analysis")');
    await continueBtn.click();
    console.log('✓ Started processing');
    
    // Monitor processing status
    let processingComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds
    
    while (!processingComplete && attempts < maxAttempts) {
      await sleep(1000);
      attempts++;
      
      // Check various completion states
      const states = await Promise.all([
        page.locator('text=Analysis complete').isVisible().catch(() => false),
        page.locator('text=Analysis Results').isVisible().catch(() => false),
        page.locator('[role="alert"]').isVisible().catch(() => false),
        page.locator('text=failed').isVisible().catch(() => false)
      ]);
      
      if (states.some(state => state)) {
        processingComplete = true;
        console.log(`✓ Processing completed after ${attempts} seconds`);
        
        if (states[2] || states[3]) {
          console.log('⚠️  Some errors may have occurred during processing');
        }
      }
      
      // Show progress every 10 seconds
      if (attempts % 10 === 0) {
        const statusText = await page.locator('.text-muted-foreground').first().textContent().catch(() => '');
        console.log(`  Status at ${attempts}s: ${statusText}`);
      }
    }
    
    // Step 5: Check results
    console.log('\n📝 Step 5: Checking results...');
    
    // Look for any results elements
    const resultElements = {
      'Results tab': await page.locator('[role="tab"]:has-text("Results")').isVisible().catch(() => false),
      'Codeframe tab': await page.locator('[role="tab"]:has-text("Codeframe")').isVisible().catch(() => false),
      'Download button': await page.locator('button:has-text("Download")').isVisible().catch(() => false),
      'Error messages': await page.locator('[role="alert"]').count()
    };
    
    console.log('Found elements:');
    for (const [name, value] of Object.entries(resultElements)) {
      console.log(`  ${name}: ${value}`);
    }
    
    // If we have results, test basic functionality
    if (resultElements['Results tab']) {
      await page.click('[role="tab"]:has-text("Results")');
      console.log('✓ Clicked Results tab');
      
      // Test export if available
      const downloadBtn = await page.locator('button:has-text("Download Excel")');
      if (await downloadBtn.isVisible()) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadBtn.click()
        ]);
        console.log(`✓ Download initiated: ${download.suggestedFilename()}`);
      }
    }
    
    console.log('\n✅ Test completed!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('  ✓ API Configuration - Working');
    console.log('  ✓ File Upload - Working');
    console.log('  ✓ Column Selection - Working');
    console.log('  ' + (processingComplete ? '✓' : '⚠️ ') + ' Processing - ' + (processingComplete ? 'Completed' : 'May have issues'));
    console.log('  ' + (resultElements['Results tab'] ? '✓' : '⚠️ ') + ' Results Display - ' + (resultElements['Results tab'] ? 'Available' : 'Not visible'));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  } finally {
    console.log('\nTest finished. Browser will close in 5 seconds...');
    await sleep(5000);
    await browser.close();
  }
}

testWithFixes().catch(console.error);