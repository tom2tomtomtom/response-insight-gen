import { test, expect } from '@playwright/test';

test.describe('Progress Bar Direct Test', () => {
  test('test progress bar with localStorage setup', async ({ page }) => {
    // Set up localStorage to bypass API config
    await page.addInitScript(() => {
      localStorage.setItem('response-insight-api-config', JSON.stringify({
        apiKey: 'test-key',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        isConfigured: true
      }));
    });
    
    // Set up API mocking
    await page.route('**/api.openai.com/**', async (route, request) => {
      const body = request.postDataJSON();
      
      // Simulate processing with a delay
      if (body?.messages) {
        console.log('Processing API request...');
        
        // Wait 2 seconds to allow progress bar to show
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify({
                  codeframe: [
                    { code: "pos", label: "Positive", numeric: "1", definition: "Positive", count: 1, percentage: 50 },
                    { code: "neg", label: "Negative", numeric: "2", definition: "Negative", count: 1, percentage: 50 }
                  ],
                  codedResponses: [
                    { responseText: "Good", columnName: "Q1", columnIndex: 0, rowIndex: 0, codesAssigned: ["pos"] },
                    { responseText: "Bad", columnName: "Q1", columnIndex: 0, rowIndex: 1, codesAssigned: ["neg"] }
                  ]
                })
              }
            }]
          })
        });
      }
    });
    
    // Go directly to home
    await page.goto('http://localhost:8082');
    
    // Upload a simple CSV
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'simple.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Q1\nGood\nBad')
    });
    
    // Wait for column to appear
    await page.waitForSelector('text="Q1"', { timeout: 10000 });
    
    // Select the column
    await page.click('label:has-text("Q1")');
    
    // Start processing
    await page.click('button:has-text("Analyze Selected Columns")');
    
    // Wait for processing status component
    const processingStatus = page.locator('text="Processing Status"');
    await expect(processingStatus).toBeVisible({ timeout: 10000 });
    console.log('✓ Processing Status visible');
    
    // Check for progress bar
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();
    console.log('✓ Progress bar visible');
    
    // Check initial progress
    let progress1 = await progressBar.getAttribute('aria-valuenow');
    console.log(`Initial progress: ${progress1}%`);
    
    // Wait and check progress again
    await page.waitForTimeout(1000);
    let progress2 = await progressBar.getAttribute('aria-valuenow');
    console.log(`Progress after 1s: ${progress2}%`);
    
    // Check for stage indicators
    const possibleStages = [
      'Initializing',
      'Processing Question Types',
      'Generating Insights',
      'Finalizing Results'
    ];
    
    let foundStages = [];
    for (const stage of possibleStages) {
      if (await page.locator(`text="${stage}"`).isVisible().catch(() => false)) {
        foundStages.push(stage);
      }
    }
    console.log('✓ Found stages:', foundStages);
    
    // Check for badges showing column/codeframe count
    const columnBadge = await page.locator('text=/\\d+ column/').isVisible().catch(() => false);
    const codeframeBadge = await page.locator('text=/\\d+ codeframe/').isVisible().catch(() => false);
    console.log(`✓ Column badge visible: ${columnBadge}`);
    console.log(`✓ Codeframe badge visible: ${codeframeBadge}`);
    
    // Wait for completion
    await page.waitForSelector('text=/Analysis complete|Successfully analyzed/i', { timeout: 30000 });
    console.log('✓ Analysis completed');
    
    // Verify final progress
    let finalProgress = await progressBar.getAttribute('aria-valuenow');
    console.log(`Final progress: ${finalProgress}%`);
    
    // The test passes if we got here
    console.log('✅ Progress bar test completed successfully');
  });
});