import { test, expect } from '@playwright/test';

test.describe('Actual UI Tests', () => {
  test('Check actual UI elements', async ({ page }) => {
    await page.goto('/');
    
    // API Config page
    await expect(page).toHaveURL(/.*api-config/);
    await expect(page.locator('h1:has-text("API Configuration")')).toBeVisible();
    
    // Fill and save API key
    await page.fill('input[type="password"]', 'sk-test-key-12345');
    await page.click('button:has-text("Save & Verify API Key")');
    
    // Wait for navigation or stay on same page
    await page.waitForTimeout(2000);
    
    // Check where we are
    console.log('Current URL after save:', page.url());
    
    // If still on API config, manually navigate
    if (page.url().includes('api-config')) {
      // Set API config in localStorage and navigate
      await page.evaluate(() => {
        localStorage.setItem('response-insight-api-config', JSON.stringify({
          apiKey: 'sk-test-key-12345',
          apiUrl: 'https://api.openai.com/v1/chat/completions'
        }));
      });
      await page.goto('/');
    }
    
    // Check main page elements
    const projectMetadata = await page.locator('text=Project Metadata').count();
    console.log('Project Metadata elements found:', projectMetadata);
    
    // Check for file upload
    const fileInputCount = await page.locator('input[type="file"]').count();
    console.log('File input elements found:', fileInputCount);
    
    // Try Projects navigation
    const projectsButton = await page.locator('button:has-text("Projects")').count();
    console.log('Projects button found:', projectsButton);
    
    if (projectsButton > 0) {
      await page.click('button:has-text("Projects")');
      await page.waitForTimeout(1000);
      console.log('After Projects click, URL:', page.url());
      
      // Check Project Dashboard elements
      const dashboardTitle = await page.locator('text=/Project Dashboard/i').count();
      console.log('Project Dashboard title found:', dashboardTitle);
    }
    
    // Go back to main
    await page.goto('/');
    
    // Test file upload
    const csvContent = 'Column1,Column2\n"Value1","Value2"';
    const buffer = Buffer.from(csvContent, 'utf-8');
    
    try {
      await page.setInputFiles('input[type="file"]', {
        name: 'test.csv',
        mimeType: 'text/csv',
        buffer: buffer
      });
      console.log('File upload successful');
      
      // Wait for processing
      await page.waitForTimeout(2000);
      
      // Check for column selection
      const columnSelection = await page.locator('text=Column Selection').count();
      console.log('Column Selection found:', columnSelection);
      
      // Check for codeframe count
      const codeframeCount = await page.locator('text=/codeframe/i').count();
      console.log('Codeframe text found:', codeframeCount);
      
    } catch (e) {
      console.log('File upload error:', e);
    }
  });
  
  test('Test individual components', async ({ page }) => {
    // Bypass API config
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('response-insight-api-config', JSON.stringify({
        apiKey: 'sk-test-key-12345',
        apiUrl: 'https://api.openai.com/v1/chat/completions'
      }));
    });
    await page.goto('/');
    
    // Test 1: Project Metadata
    const projectFields = {
      name: await page.locator('input[placeholder*="project name"]').count(),
      client: await page.locator('input[placeholder*="client name"]').count(),
      industry: await page.locator('input[placeholder*="Technology"]').count(),
      objectives: await page.locator('textarea[placeholder*="objectives"]').count()
    };
    console.log('Project metadata fields:', projectFields);
    
    // Test 2: Upload and process file
    if (await page.locator('input[type="file"]').count() > 0) {
      const csv = 'Q1,Q2,Q3\n"Answer1","Answer2","Answer3"';
      await page.setInputFiles('input[type="file"]', {
        name: 'test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csv, 'utf-8')
      });
      
      await page.waitForTimeout(3000);
      
      // Check results
      const hasColumns = await page.locator('text=/Q1|Column/').count() > 0;
      console.log('Columns detected:', hasColumns);
      
      // Try selecting first column
      const firstColumn = page.locator('text=Q1').first();
      if (await firstColumn.count() > 0) {
        await firstColumn.click();
        console.log('Clicked first column');
        
        // Check for advanced controls
        const advancedControls = await page.locator('text=Advanced Controls').count();
        console.log('Advanced Controls found:', advancedControls);
        
        // Check for Question Grouping
        const questionGrouping = await page.locator('text=Question Grouping').count();
        console.log('Question Grouping found:', questionGrouping);
        
        // Check for Codeframe Count
        const codeframeDisplay = await page.locator('text=/codeframe.*generated/i').count();
        console.log('Codeframe count display found:', codeframeDisplay);
      }
    }
  });
});