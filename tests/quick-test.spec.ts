import { test, expect } from '@playwright/test';

test('Quick functionality test', async ({ page }) => {
  // Test API configuration
  await page.goto('http://localhost:8081/');
  
  // Clear any existing config
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  
  // Should redirect to API config
  await expect(page).toHaveURL(/.*api-config/);
  
  // Enter API key
  const apiKey = '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';
  await page.fill('textarea[placeholder*="Enter your OpenAI API key"]', apiKey);
  
  // Click save
  await page.click('button:has-text("Save Configuration")');
  
  // Should navigate to home
  await expect(page).toHaveURL('http://localhost:8081/');
  
  // Verify file upload area is visible
  await expect(page.locator('text=Drop your CSV or Excel file here')).toBeVisible();
  
  console.log('✅ Basic functionality test passed!');
});