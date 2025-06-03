import { test, expect } from '@playwright/test';

test.describe('Progress Bar Manual Test', () => {
  test('manual test to verify progress bar updates', async ({ page }) => {
    // Set up API mocking first
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
      
      // Handle actual processing - simulate delay and progress
      if (body?.messages) {
        console.log('API request received, simulating processing...');
        
        // Wait to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify({
                  codeframe: [
                    { 
                      code: "positive", 
                      label: "Positive", 
                      numeric: "1", 
                      definition: "Positive feedback",
                      count: 2,
                      percentage: 66.7
                    },
                    { 
                      code: "negative", 
                      label: "Negative", 
                      numeric: "2", 
                      definition: "Negative feedback",
                      count: 1,
                      percentage: 33.3
                    },
                    {
                      code: "Other",
                      label: "Other",
                      numeric: "99",
                      definition: "Other responses",
                      count: 0,
                      percentage: 0
                    }
                  ],
                  codedResponses: [
                    { 
                      responseText: "I like the product", 
                      columnName: "Question 1", 
                      columnIndex: 0, 
                      rowIndex: 0, 
                      codesAssigned: ["positive"] 
                    },
                    { 
                      responseText: "Great service", 
                      columnName: "Question 2", 
                      columnIndex: 1, 
                      rowIndex: 0, 
                      codesAssigned: ["positive"] 
                    },
                    { 
                      responseText: "Needs improvement", 
                      columnName: "Question 3", 
                      columnIndex: 2, 
                      rowIndex: 0, 
                      codesAssigned: ["negative"] 
                    }
                  ],
                  codeSummary: [
                    { code: "positive", numeric: "1", label: "Positive", count: 2, percentage: 66.7 },
                    { code: "negative", numeric: "2", label: "Negative", count: 1, percentage: 33.3 },
                    { code: "Other", numeric: "99", label: "Other", count: 0, percentage: 0 }
                  ]
                })
              }
            }]
          })
        });
      }
    });
    
    // Navigate to API config
    await page.goto('http://localhost:8082/api-config');
    
    // Fill in API key using the correct placeholder
    await page.fill('input[placeholder="sk-..."]', 'test-key-123');
    
    // Click save button
    await page.click('button:has-text("Save & Verify API Key")');
    
    // Wait for success
    await page.waitForSelector('text=/API Connection Successful|Your API key has been verified/i', { timeout: 10000 });
    
    // Navigate to home
    await page.goto('http://localhost:8082');
    
    // Create a test CSV file
    const csvContent = `Question 1,Question 2,Question 3
"I like the product","Great service","Needs improvement"
"Good quality","Fast delivery","Better packaging"
"Nice design","Helpful staff","More options"`;
    
    // Use file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    // Wait for columns to load
    await page.waitForSelector('text="Question 1"', { timeout: 10000 });
    
    // Select all columns
    await page.click('label:has-text("Question 1")');
    await page.click('label:has-text("Question 2")');
    await page.click('label:has-text("Question 3")');
    
    // Take screenshot before processing
    await page.screenshot({ path: 'test-results/before-processing.png' });
    
    // Start processing
    console.log('Starting processing...');
    await page.click('button:has-text("Analyze Selected Columns")');
    
    // Wait for processing status to appear
    await expect(page.locator('text="Processing Status"')).toBeVisible({ timeout: 10000 });
    console.log('Processing status component visible');
    
    // Take screenshot during processing
    await page.screenshot({ path: 'test-results/during-processing.png' });
    
    // Check for progress bar
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();
    console.log('Progress bar visible');
    
    // Monitor progress updates
    let previousProgress = 0;
    let progressUpdates = [];
    
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      
      const currentProgress = await progressBar.getAttribute('aria-valuenow');
      const progressValue = Number(currentProgress);
      
      if (progressValue !== previousProgress) {
        progressUpdates.push({
          time: i * 0.5,
          progress: progressValue
        });
        console.log(`Progress update at ${i * 0.5}s: ${progressValue}%`);
        previousProgress = progressValue;
      }
      
      // Check for stage visibility
      const stages = ['Initializing', 'Processing Question Types', 'Generating Insights', 'Finalizing Results'];
      for (const stage of stages) {
        const isVisible = await page.locator(`text="${stage}"`).isVisible().catch(() => false);
        if (isVisible) {
          console.log(`Stage visible: ${stage}`);
        }
      }
      
      // Break if processing is complete
      if (progressValue >= 100) {
        console.log('Processing complete!');
        break;
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/after-processing.png' });
    
    // Verify we got progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);
    console.log('Total progress updates:', progressUpdates);
    
    // Check for completion
    await expect(page.locator('text=/Analysis complete|Successfully analyzed/i')).toBeVisible({ timeout: 20000 });
    
    console.log('✅ Progress bar test completed successfully');
    console.log('Progress updates recorded:', progressUpdates);
  });
});