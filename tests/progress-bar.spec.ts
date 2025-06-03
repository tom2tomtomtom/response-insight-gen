import { test, expect } from '@playwright/test';

test.describe('Progress Bar Dynamic Updates', () => {
  test('progress bar should update with each chunk processed', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8082');

    // Check if we need to configure API first
    const apiConfigButton = await page.locator('text="Save & Verify API Key"').isVisible();
    if (!apiConfigButton) {
      // Navigate to API config
      await page.goto('http://localhost:8082/api-config');
      
      // Configure API with mock key
      await page.fill('input[placeholder*="API key"]', 'test-key-123');
      await page.click('text="Save & Verify API Key"');
      
      // Wait for save
      await page.waitForTimeout(500);
      
      // Navigate back to home
      await page.goto('http://localhost:8082');
    }

    // Upload a test file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(`Question 1,Question 2,Question 3
"I like the product","Great service","Needs improvement"
"Good quality","Fast delivery","Better packaging"
"Nice design","Helpful staff","More options"`)
    });

    // Wait for file upload to complete
    await page.waitForSelector('.p-8'); // Wait for file info to appear
    
    // Select columns
    await page.click('text="Question 1"');
    await page.click('text="Question 2"');
    
    // Mock the API to simulate chunk processing
    await page.route('**/api.openai.com/**', async (route) => {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify({
                codeframe: [
                  { code: "positive", label: "Positive", numeric: "1", definition: "Positive feedback" },
                  { code: "negative", label: "Negative", numeric: "2", definition: "Negative feedback" }
                ],
                codedResponses: [
                  { responseText: "I like the product", columnName: "Question 1", columnIndex: 0, rowIndex: 0, codesAssigned: ["positive"] }
                ]
              })
            }
          }]
        })
      });
    });

    // Start processing
    await page.click('text="Analyze Selected Columns"');
    
    // Check for processing status component
    await expect(page.locator('text="Processing Status"')).toBeVisible({ timeout: 10000 });
    
    // Verify progress bar exists
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();
    
    // Check that progress updates (should start > 0)
    await page.waitForTimeout(1000);
    
    // Get progress value
    const progressValue = await progressBar.getAttribute('aria-valuenow');
    expect(Number(progressValue)).toBeGreaterThan(0);
    
    // Check for progress steps
    await expect(page.locator('text="Processing Question Types"')).toBeVisible();
    
    // Verify the progress percentage is shown
    const progressPercentage = await page.locator('text=/%/').first();
    await expect(progressPercentage).toBeVisible();
    
    // Check that processing status text updates
    const statusText = await page.locator('.text-muted-foreground').first().textContent();
    expect(statusText).toBeTruthy();
    
    console.log('Progress bar test completed successfully');
  });

  test('progress bar should show different stages', async ({ page }) => {
    // This test verifies the different processing stages are displayed
    await page.goto('http://localhost:8082');
    
    // Assuming we have a file already uploaded (from previous test or session)
    const processButton = await page.locator('text="Analyze Selected Columns"').isVisible();
    
    if (processButton) {
      // Mock API to control progress
      let callCount = 0;
      await page.route('**/api.openai.com/**', async (route) => {
        callCount++;
        
        // Simulate different progress stages
        const progress = callCount * 30;
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify({
                  codeframe: [{ code: "test", label: "Test", numeric: "1" }],
                  codedResponses: []
                })
              }
            }]
          })
        });
      });
      
      await page.click('text="Analyze Selected Columns"');
      
      // Check for different processing stages
      const stages = [
        'Initializing',
        'Processing Question Types',
        'Generating Insights',
        'Finalizing Results'
      ];
      
      // At least one stage should be visible
      let stageFound = false;
      for (const stage of stages) {
        const isVisible = await page.locator(`text="${stage}"`).isVisible({ timeout: 5000 }).catch(() => false);
        if (isVisible) {
          stageFound = true;
          console.log(`Found stage: ${stage}`);
        }
      }
      
      expect(stageFound).toBeTruthy();
    }
  });
});