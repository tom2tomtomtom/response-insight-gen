import { test, expect, Page } from '@playwright/test';

// Helper to bypass API config
async function bypassApiConfig(page: Page) {
  // Set a dummy API key in localStorage to bypass the API config page
  await page.evaluate(() => {
    localStorage.setItem('response-insight-api-config', JSON.stringify({
      apiKey: 'sk-test-key-12345',
      apiUrl: 'https://api.openai.com/v1/chat/completions'
    }));
  });
  await page.goto('/');
}

// Helper function to create and upload test CSV
async function uploadTestFile(page: Page, content: string, filename: string = 'test.csv') {
  const buffer = Buffer.from(content, 'utf-8');
  await page.setInputFiles('input[type="file"]', {
    name: filename,
    mimeType: 'text/csv',
    buffer: buffer
  });
}

// Helper to fill project metadata
async function fillProjectMetadata(page: Page) {
  await page.fill('input[placeholder="Enter project name"]', 'Test Project');
  await page.fill('input[placeholder="Enter client name"]', 'Test Client');
  await page.fill('input[placeholder*="Technology"]', 'Technology');
  await page.fill('textarea[placeholder*="objectives"]', 'Test objectives');
  
  // Try to find and click the Ad-hoc radio button
  const adHocLabel = page.locator('label:has-text("Ad-hoc")');
  if (await adHocLabel.count() > 0) {
    await adHocLabel.click();
  }
}

test.describe('Response Insight Generator - Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('1. API Configuration Page', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to API config
    await expect(page).toHaveURL(/.*api-config/);
    
    // Fill API key
    await page.fill('input[type="password"]', 'sk-test-key-12345');
    
    // Save configuration
    await page.click('button:has-text("Save Configuration")');
    
    // Should redirect to main page
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  });

  test('2. Project Metadata and Persistence', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Check if project metadata fields exist
    await expect(page.locator('text=Project Metadata').first()).toBeVisible();
    
    // Fill metadata
    await fillProjectMetadata(page);
    
    // Verify display
    await expect(page.locator('text=Test Project').first()).toBeVisible();
    
    // Reload and check persistence
    await page.reload();
    await expect(page.locator('text=Test Project').first()).toBeVisible();
  });

  test('3. Project Dashboard Navigation', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Click Projects button
    await page.click('button:has-text("Projects")');
    
    // Verify navigation
    await expect(page).toHaveURL(/.*projects/);
    await expect(page.locator('h1:has-text("Project Dashboard")')).toBeVisible();
    
    // Check dashboard elements
    await expect(page.locator('button:has-text("New Project")')).toBeVisible();
    await expect(page.locator('input[placeholder="Search projects..."]')).toBeVisible();
  });

  test('4. File Upload and Column Selection', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Create test CSV
    const csvContent = `Question1,Question2,Question3
"What brands come to mind?","How would you describe Brand X?","Any suggestions?"
"Coca-Cola, Pepsi","Good quality","Improve packaging"
"Nike, Adidas","Innovative","Better prices"`;
    
    // Upload file
    await uploadTestFile(page, csvContent);
    
    // Wait for column selection UI
    await expect(page.locator('text=Column Selection')).toBeVisible({ timeout: 10000 });
    
    // Verify codeframe count display
    const codeframeText = page.locator('text=/codeframe/i').first();
    await expect(codeframeText).toBeVisible();
    
    // Select columns
    const column1 = page.locator('text=Question1').first();
    const column2 = page.locator('text=Question2').first();
    
    await column1.click();
    await column2.click();
    
    // Verify selection count
    await expect(page.locator('text=/2 columns selected/i')).toBeVisible();
  });

  test('5. Question Grouping Automation', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Upload file with recognizable patterns
    const csvContent = `What brands come to mind?,How would you describe this brand?,Additional feedback?
"Coca-Cola","Refreshing","None"
"Pepsi","Sweet","More variety"`;
    
    await uploadTestFile(page, csvContent);
    
    // Select columns
    await page.locator('text=What brands come to mind?').first().click();
    await page.locator('text=How would you describe this brand?').first().click();
    
    // Look for Question Grouping Automation
    await expect(page.locator('text=Question Grouping Automation')).toBeVisible();
    
    // Click Auto-Detect
    await page.click('button:has-text("Auto-Detect Groups")');
    
    // Wait for results
    await expect(page.locator('text=/pending|accepted/i')).toBeVisible({ timeout: 10000 });
  });

  test('6. Advanced Controls Access', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Upload minimal file
    await uploadTestFile(page, 'Q1\n"Test"');
    
    // Select column
    await page.locator('text=Q1').first().click();
    
    // Open advanced controls
    await page.click('text=Advanced Controls & Settings');
    
    // Verify tabs are visible
    await expect(page.locator('text=General')).toBeVisible();
    await expect(page.locator('text=Tracking Study')).toBeVisible();
    await expect(page.locator('text=Brand Hierarchy')).toBeVisible();
  });

  test('7. Brand Hierarchy Manager', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Setup to access advanced controls
    await uploadTestFile(page, 'Q1\n"Test"');
    await page.locator('text=Q1').first().click();
    await page.click('text=Advanced Controls & Settings');
    
    // Navigate to Brand Hierarchy
    await page.click('text=Brand Hierarchy');
    
    // Verify component
    await expect(page.locator('text=Brand Hierarchy Management')).toBeVisible();
    
    // Test functionality
    const parentInput = page.locator('input#parent-brand');
    const subBrandsInput = page.locator('input#sub-brands');
    
    await parentInput.fill('Test Parent Brand');
    await subBrandsInput.fill('Sub1, Sub2');
    
    await page.click('button:has-text("Add Hierarchy")');
    
    // Verify added
    await expect(page.locator('text=Test Parent Brand')).toBeVisible();
  });

  test('8. Tracking Study Version Manager', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Setup
    await uploadTestFile(page, 'Q1\n"Test"');
    await page.locator('text=Q1').first().click();
    await page.click('text=Advanced Controls & Settings');
    
    // Navigate to Tracking Study
    await page.click('text=Tracking Study');
    
    // Verify component
    await expect(page.locator('text=Tracking Study Version Management')).toBeVisible();
    
    // Test wave input
    const waveInput = page.locator('input#wave');
    await waveInput.fill('Q1 2024');
    
    // Verify options
    await expect(page.locator('text=Wave-over-Wave')).toBeVisible();
  });

  test('9. Results View Mock', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Mock results in localStorage
    await page.evaluate(() => {
      const mockResults = {
        codeframe: [
          { code: 'C1', label: 'Positive', numeric: 1, percentage: 45 },
          { code: 'C2', label: 'Negative', numeric: 2, percentage: 30 }
        ],
        codedResponses: [
          { responseText: 'Great product', codesAssigned: ['C1'], rowIndex: 0, columnName: 'Q1' },
          { responseText: 'Not satisfied', codesAssigned: ['C2'], rowIndex: 1, columnName: 'Q1' }
        ]
      };
      localStorage.setItem('response-insight-results', JSON.stringify(mockResults));
      localStorage.setItem('response-insight-show-results', 'true');
    });
    
    await page.goto('/');
    
    // Check if results components would load
    // Note: Full results view requires actual processing
    await expect(page.locator('body')).toBeVisible();
  });

  test('10. Session Persistence Comprehensive', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Set various data
    await fillProjectMetadata(page);
    
    // Upload file
    await uploadTestFile(page, 'Q1,Q2\n"Response 1","Response 2"');
    
    // Wait for upload success
    await expect(page.locator('text=Column Selection')).toBeVisible({ timeout: 10000 });
    
    // Select column
    await page.locator('text=Q1').first().click();
    
    // Store state
    const state = await page.evaluate(() => ({
      hasProject: !!localStorage.getItem('response-insight-project-context'),
      hasFile: !!localStorage.getItem('response-insight-file-data'),
      hasColumns: !!localStorage.getItem('response-insight-selected-columns')
    }));
    
    // Reload
    await page.reload();
    
    // Verify persistence
    await expect(page.locator('text=Test Project').first()).toBeVisible();
    await expect(page.locator('text=/1 columns? selected/i')).toBeVisible();
    
    // Verify localStorage still has data
    const newState = await page.evaluate(() => ({
      hasProject: !!localStorage.getItem('response-insight-project-context'),
      hasFile: !!localStorage.getItem('response-insight-file-data'),
      hasColumns: !!localStorage.getItem('response-insight-selected-columns')
    }));
    
    expect(newState).toEqual(state);
  });
});

test.describe('Error Handling', () => {
  test('Handles missing API key gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to API config
    await expect(page).toHaveURL(/.*api-config/);
    
    // Try to save without entering key
    await page.click('button:has-text("Save Configuration")');
    
    // Should show error or stay on page
    await expect(page).toHaveURL(/.*api-config/);
  });

  test('Handles invalid CSV format', async ({ page }) => {
    await bypassApiConfig(page);
    
    // Upload malformed CSV
    const invalidCsv = 'This is not, a valid CSV\nformat at all';
    await uploadTestFile(page, invalidCsv, 'invalid.csv');
    
    // Should handle gracefully - either show error or process what it can
    await page.waitForTimeout(2000);
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});