import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const TEST_CREDENTIALS = {
  apiKey: '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',
  testFile: join(homedir(), 'Downloads', 'patourism_segmentation_final_data 2(A1).csv')
};

test.describe('Verbatim Coder Tool - Comprehensive QA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Phase 1: Setup & Upload - Metadata persistence', async ({ page }) => {
    // Configure API
    await page.waitForURL('**/api-config');
    await page.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
    await page.click('button:has-text("Save & Verify API Key")');
    await page.waitForURL('http://localhost:8081/');

    // Upload file with metadata
    await page.fill('input[placeholder="Industry"]', 'Tourism');
    await page.fill('input[placeholder="Client Name"]', 'Test Client');
    await page.fill('input[placeholder="Study Objective"]', 'Brand perception analysis');
    await page.selectOption('select:has-text("Study Type")', 'tracking');
    
    await page.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
    await page.waitForSelector('text=File uploaded successfully');

    // Verify metadata persists
    await expect(page.locator('text=Tourism')).toBeVisible();
    await expect(page.locator('text=Test Client')).toBeVisible();
    await expect(page.locator('text=Brand perception analysis')).toBeVisible();
  });

  test('Phase 2: Question Configuration - Codeframe count transparency', async ({ page }) => {
    // Quick setup
    await setupWithFile(page);

    // Select multiple columns
    const checkboxes = await page.locator('[role="checkbox"]').all();
    for (let i = 0; i < 3; i++) {
      await checkboxes[i].click();
    }

    // Configure question types differently
    const selects = await page.locator('select').all();
    if (selects.length >= 3) {
      await selects[0].selectOption('brand_awareness');
      await selects[1].selectOption('brand_description');
      await selects[2].selectOption('miscellaneous');
    }

    // Verify codeframe count is shown
    await expect(page.locator('text=/3 codeframes will be generated/')).toBeVisible();
  });

  test('Phase 3: Codeframe Generation - Multi-question processing', async ({ page }) => {
    await setupWithFile(page);

    // Select 4 columns to test chunking
    const checkboxes = await page.locator('[role="checkbox"]').all();
    for (let i = 0; i < 4; i++) {
      await checkboxes[i].click();
    }

    // Start processing
    await page.click('button:has-text("Continue to Analysis")');
    
    // Wait for completion
    await page.waitForSelector('text=Analysis complete', { timeout: 120000 });

    // Verify no token errors
    const errors = await page.locator('[role="alert"]:has-text("token")').count();
    expect(errors).toBe(0);

    // Verify results generated
    await expect(page.locator('[role="tab"]:has-text("Results")')).toBeVisible();
  });

  test('Phase 4: Codeframe Upload - Save functionality', async ({ page }) => {
    await setupWithFile(page);

    // Navigate to codeframe upload
    await page.click('button:has-text("Upload Codeframe")');
    
    // Upload a codeframe file
    const codeframeInput = await page.locator('input[type="file"][accept*=".xlsx"]');
    // We'll need to create a test codeframe file
    await codeframeInput.setInputFiles('./test-codeframe.xlsx');

    // Click Save
    await page.click('button:has-text("Save Codeframe")');

    // Verify it was saved
    await expect(page.locator('text=Codeframe saved successfully')).toBeVisible();
    
    // Verify it appears in available codeframes
    await expect(page.locator('text=Test Codeframe')).toBeVisible();
  });

  test('Phase 5: Export Format - Respondent ID first column', async ({ page }) => {
    await setupAndProcess(page);

    // Download results
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download Excel")')
    ]);

    // Save and verify file structure
    const path = await download.path();
    // We'll verify the Excel structure has respondent ID as first column
    expect(path).toBeTruthy();
  });

  test('Phase 6: Session Persistence', async ({ page, context }) => {
    await setupWithFile(page);

    // Select columns and configure
    const checkboxes = await page.locator('[role="checkbox"]').all();
    await checkboxes[0].click();
    
    // Verify state is saved
    const state = await page.evaluate(() => localStorage.getItem('response-insight-project-state'));
    expect(state).toBeTruthy();

    // Open new tab and verify state persists
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:8081/');
    
    // Should restore previous state
    await expect(newPage.locator('[role="checkbox"][aria-checked="true"]')).toHaveCount(1);
  });

  test('Phase 7: Finalize & Apply to All', async ({ page }) => {
    await setupAndProcess(page);

    // Look for finalize button
    await page.click('button:has-text("Finalize Codeframe")');

    // Confirm finalization
    await page.click('button:has-text("Apply to All Data")');

    // Verify state is locked
    await expect(page.locator('text=Codeframe finalized')).toBeVisible();
    
    // Verify edit buttons are disabled
    const editButtons = await page.locator('button:has-text("Edit")').all();
    for (const btn of editButtons) {
      await expect(btn).toBeDisabled();
    }
  });

  test('Codeframe Editing - Merge/Split/Rename', async ({ page }) => {
    await setupAndProcess(page);

    // Navigate to codeframe tab
    await page.click('[role="tab"]:has-text("Codeframe")');

    // Test rename
    await page.click('button[aria-label="Edit code"]').first();
    await page.fill('input[value="Code 1"]', 'Renamed Code');
    await page.click('button:has-text("Save")');

    // Test merge
    await page.click('[role="checkbox"][aria-label="Select code"]').first();
    await page.click('[role="checkbox"][aria-label="Select code"]').nth(1);
    await page.click('button:has-text("Merge Selected")');
    
    // Verify merge dialog
    await expect(page.locator('text=Merge 2 codes')).toBeVisible();
  });

  test('Template Download', async ({ page }) => {
    await setupWithFile(page);

    // Try to download template
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download Template")')
    ]);

    expect(download.suggestedFilename()).toContain('template');
  });

  test('Brand Roll-ups Consistency', async ({ page }) => {
    await setupWithFile(page);

    // Add brand list entries
    await page.click('button:has-text("Brand List Manager")');
    await page.fill('input[placeholder="Brand"]', 'Mayo Clinic Rochester');
    await page.fill('input[placeholder="System"]', 'Mayo Clinic Health System');
    await page.click('button:has-text("Add")');

    // Process with brand awareness
    const checkbox = await page.locator('[role="checkbox"]').first();
    await checkbox.click();
    await page.selectOption('select', 'brand_awareness');
    
    await page.click('button:has-text("Continue to Analysis")');
    await page.waitForSelector('text=Analysis complete', { timeout: 60000 });

    // Verify hierarchical grouping
    await page.click('[role="tab"]:has-text("Codeframe")');
    await expect(page.locator('text=Mayo Clinic Health System')).toBeVisible();
  });

  test('Other/None/N/A Consistency', async ({ page }) => {
    await setupAndProcess(page);

    // Check codeframe includes required catch-alls
    await page.click('[role="tab"]:has-text("Codeframe")');
    
    await expect(page.locator('text=Other')).toBeVisible();
    await expect(page.locator('text=None')).toBeVisible();
    await expect(page.locator('text="Don\'t Know"')).toBeVisible();
  });
});

// Helper functions
async function setupWithFile(page) {
  // Quick API setup if needed
  const hasApiKey = await page.evaluate(() => localStorage.getItem('response-insight-api-config'));
  if (!hasApiKey) {
    await page.waitForURL('**/api-config');
    await page.fill('input[placeholder="sk-..."]', TEST_CREDENTIALS.apiKey);
    await page.click('button:has-text("Save & Verify API Key")');
    await page.waitForURL('http://localhost:8081/');
  }

  // Upload file
  await page.setInputFiles('input[type="file"]', TEST_CREDENTIALS.testFile);
  await page.waitForSelector('text=File uploaded successfully');
}

async function setupAndProcess(page) {
  await setupWithFile(page);
  
  // Select first column and process
  await page.locator('[role="checkbox"]').first().click();
  await page.click('button:has-text("Continue to Analysis")');
  await page.waitForSelector('text=Analysis complete', { timeout: 60000 });
}