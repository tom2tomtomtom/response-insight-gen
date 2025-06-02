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

async function debugColumns() {
  console.log('🔍 Debugging column selection...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newContext().then(c => c.newPage());
  
  try {
    // Configure API
    await page.goto('http://localhost:8081/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await page.waitForURL('**/api-config');
    await page.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
    await page.click('button:has-text("Save & Verify API Key")');
    await page.waitForURL('http://localhost:8081/');
    console.log('✓ API configured');
    
    // Upload file
    await page.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
    await page.waitForSelector('text=File uploaded successfully');
    console.log('✓ File uploaded');
    
    // Wait a bit for columns to render
    await page.waitForTimeout(2000);
    
    // Debug column elements
    console.log('\n📊 Column Analysis:');
    
    // Check for various column-related elements
    const elements = {
      'Cards with bg-blue': await page.locator('.bg-blue-50\\/50').count(),
      'Cards': await page.locator('.card, [class*="card"]').count(),
      'Checkbox components': await page.locator('[role="checkbox"]').count(),
      'Input checkboxes': await page.locator('input[type="checkbox"]').count(),
      'Visible checkboxes': await page.locator('input[type="checkbox"]:visible').count(),
      'Select dropdowns': await page.locator('select').count(),
      'Labels': await page.locator('label').count()
    };
    
    for (const [name, count] of Object.entries(elements)) {
      console.log(`  ${name}: ${count}`);
    }
    
    // Try to find actual column structure
    const columnTexts = await page.locator('.font-medium, h3, h4').allTextContents();
    console.log('\nFound text elements:', columnTexts.slice(0, 10));
    
    // Look for checkbox elements with role
    const checkboxes = await page.locator('[role="checkbox"]').all();
    console.log(`\nFound ${checkboxes.length} checkbox components`);
    
    // Try clicking first checkbox
    if (checkboxes.length > 0) {
      await checkboxes[0].click();
      console.log('✓ Clicked first checkbox');
      
      // Select a few more
      for (let i = 1; i < Math.min(3, checkboxes.length); i++) {
        await checkboxes[i].click();
        console.log(`✓ Clicked checkbox ${i + 1}`);
      }
      
      // Check if Continue button appears
      const continueBtn = await page.locator('button:has-text("Continue to Analysis")');
      console.log(`\nContinue button visible: ${await continueBtn.isVisible()}`);
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'column-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as column-debug.png');
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  } finally {
    await page.waitForTimeout(5000); // Keep open for inspection
    await browser.close();
  }
}

debugColumns().catch(console.error);