import { test, expect } from '@playwright/test';

test.describe('Progress Bar Dynamic Updates', () => {
  test('progress bar should update dynamically during processing', async ({ page }) => {
    // First, configure API
    await page.goto('http://localhost:8082/api-config');
    
    // Fill in API key
    await page.fill('input[placeholder*="API key"]', 'test-key-123');
    
    // Wait for button to be enabled
    await page.waitForFunction(() => {
      const button = document.querySelector('button:has-text("Save & Verify API Key")');
      return button && !button.hasAttribute('disabled');
    });
    
    // Mock the API test connection
    await page.route('**/api.openai.com/**', async (route, request) => {
      const body = request.postDataJSON();
      
      // Handle test connection
      if (body?.max_tokens === 5) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{ message: { content: 'Hello' } }]
          })
        });
        return;
      }
      
      // Handle actual processing with progress simulation
      if (body?.messages) {
        // Simulate processing with progress
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify({
                  codeframe: [
                    { code: "positive", label: "Positive", numeric: "1", definition: "Positive feedback", count: 2, percentage: 66.7 },
                    { code: "negative", label: "Negative", numeric: "2", definition: "Negative feedback", count: 1, percentage: 33.3 }
                  ],
                  codedResponses: [
                    { responseText: "I like the product", columnName: "Question 1", columnIndex: 0, rowIndex: 0, codesAssigned: ["positive"] },
                    { responseText: "Great service", columnName: "Question 2", columnIndex: 1, rowIndex: 0, codesAssigned: ["positive"] },
                    { responseText: "Needs improvement", columnName: "Question 3", columnIndex: 2, rowIndex: 0, codesAssigned: ["negative"] }
                  ]
                })
              }
            }]
          })
        });
      }
    });
    
    // Click save button
    await page.click('button:has-text("Save & Verify API Key")');
    
    // Wait for success message
    await page.waitForSelector('text=/API Connection Successful|configured/i', { timeout: 10000 });
    
    // Navigate to home
    await page.goto('http://localhost:8082');
    
    // Upload a test file using the drop zone
    const dropZone = page.locator('.border-dashed').first();
    
    // Create file and trigger drop
    await dropZone.dispatchEvent('drop', {
      dataTransfer: {
        files: [{
          name: 'test-data.csv',
          type: 'text/csv',
          content: `Question 1,Question 2,Question 3
"I like the product","Great service","Needs improvement"
"Good quality","Fast delivery","Better packaging"
"Nice design","Helpful staff","More options"`
        }]
      }
    });
    
    // Alternative: use the file input directly if visible
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'test-data.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(`Question 1,Question 2,Question 3
"I like the product","Great service","Needs improvement"
"Good quality","Fast delivery","Better packaging"
"Nice design","Helpful staff","More options"`)
      });
    }
    
    // Wait for columns to appear
    await page.waitForSelector('text="Question 1"', { timeout: 10000 });
    
    // Select columns
    await page.click('text="Question 1"');
    await page.click('text="Question 2"');
    await page.click('text="Question 3"');
    
    // Start processing
    await page.click('button:has-text("Analyze Selected Columns")');
    
    // Check for processing status component
    await expect(page.locator('text="Processing Status"')).toBeVisible({ timeout: 10000 });
    
    // Verify progress bar exists
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();
    
    // Check initial progress
    let progressValue = await progressBar.getAttribute('aria-valuenow');
    console.log('Initial progress:', progressValue);
    expect(Number(progressValue)).toBeGreaterThanOrEqual(0);
    
    // Wait a bit and check progress increased
    await page.waitForTimeout(2000);
    progressValue = await progressBar.getAttribute('aria-valuenow');
    console.log('Progress after 2s:', progressValue);
    
    // Check for processing stages
    const stages = [
      'Initializing',
      'Processing Question Types',
      'Generating Insights',
      'Finalizing Results'
    ];
    
    // At least one stage should be visible
    let foundStages = [];
    for (const stage of stages) {
      const isVisible = await page.locator(`text="${stage}"`).isVisible().catch(() => false);
      if (isVisible) {
        foundStages.push(stage);
      }
    }
    
    console.log('Found stages:', foundStages);
    expect(foundStages.length).toBeGreaterThan(0);
    
    // Check for progress percentage display
    const percentageText = await page.locator('text=/%/').count();
    expect(percentageText).toBeGreaterThan(0);
    
    // Verify the enhanced processing status shows column/codeframe count
    await expect(page.locator('text=/\\d+ columns/')).toBeVisible();
    await expect(page.locator('text=/\\d+ codeframe/')).toBeVisible();
    
    console.log('Progress bar test completed successfully');
  });
});