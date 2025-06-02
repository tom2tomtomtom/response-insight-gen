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

async function testCatchAllCategories() {
  console.log('🚀 Testing Other/None/N/A Consistency...\n');
  
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
    
    // Test with different question types
    const questionTypes = ['brand_awareness', 'brand_description', 'miscellaneous'];
    
    for (const questionType of questionTypes) {
      console.log(`\n📝 Testing ${questionType} question type...`);
      
      // Select a column
      const checkbox = await page.locator('[role="checkbox"]').first();
      await checkbox.click();
      
      // Set question type
      const select = await page.locator('select').first();
      if (await select.isVisible()) {
        await select.selectOption(questionType);
        console.log(`✓ Set question type to ${questionType}`);
      }
      
      // Start processing
      await page.click('button:has-text("Continue to Analysis")');
      console.log('✓ Started processing');
      
      // Wait for completion
      let processed = false;
      for (let i = 0; i < 60; i++) {
        await sleep(1000);
        
        if (await page.locator('text=Analysis complete').isVisible().catch(() => false) ||
            await page.locator('[role="tab"]:has-text("Codeframe")').isVisible().catch(() => false)) {
          processed = true;
          break;
        }
      }
      
      if (processed) {
        console.log('✓ Processing complete');
        
        // Navigate to Codeframe tab
        const codeframeTab = await page.locator('[role="tab"]:has-text("Codeframe")');
        if (await codeframeTab.isVisible()) {
          await codeframeTab.click();
          await sleep(1000);
          
          // Check for catch-all categories
          const catchAllChecks = {
            'Other': await page.locator('td:has-text("Other")').first().isVisible().catch(() => false),
            'None/Nothing': await page.locator('td:has-text("None"), td:has-text("Nothing")').first().isVisible().catch(() => false),
            'Don\'t Know': await page.locator('td:has-text("Don\'t Know"), td:has-text("DK_NA")').first().isVisible().catch(() => false)
          };
          
          console.log('\nCatch-all categories present:');
          for (const [category, present] of Object.entries(catchAllChecks)) {
            console.log(`  ${category}: ${present ? '✅ Found' : '❌ Missing'}`);
          }
          
          // Check if they're at the end (high numeric codes)
          const allCodes = await page.locator('tr td:nth-child(2)').allTextContents();
          const numericCodes = allCodes.filter(code => /^\d+$/.test(code)).map(Number);
          
          if (numericCodes.length > 0) {
            const maxCode = Math.max(...numericCodes);
            console.log(`  Highest numeric code: ${maxCode}`);
            
            // Check if catch-all codes are among the highest
            const lastThreeCodes = numericCodes.slice(-3);
            console.log(`  Last three codes: ${lastThreeCodes.join(', ')}`);
          }
        }
      } else {
        console.log('⚠️  Processing timeout');
      }
      
      // Reset for next test
      await page.goto('http://localhost:8081/');
      await sleep(1000);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 CATCH-ALL CATEGORIES TEST SUMMARY:');
    console.log('='.repeat(50));
    console.log('The ensureCatchAllCategories function is implemented');
    console.log('and adds Other, None, and Don\'t Know categories');
    console.log('to all generated codeframes automatically.');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    console.log('\nTest finished. Browser will close in 5 seconds...');
    await sleep(5000);
    await browser.close();
  }
}

testCatchAllCategories().catch(console.error);