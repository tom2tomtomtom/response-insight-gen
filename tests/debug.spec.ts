import { test, expect } from '@playwright/test';

test('Debug - Check page structure', async ({ page }) => {
  await page.goto('/');
  
  // Take screenshot
  await page.screenshot({ path: 'debug-homepage.png' });
  
  // Log page title
  console.log('Page title:', await page.title());
  
  // Log all visible text
  const visibleText = await page.locator('body').innerText();
  console.log('Visible text:', visibleText.substring(0, 500));
  
  // Check if we're redirected to API config
  console.log('Current URL:', page.url());
  
  // Look for any input fields
  const inputs = await page.locator('input').all();
  console.log('Number of input fields:', inputs.length);
  
  // Look for specific elements
  const hasProjectNameInput = await page.locator('input[placeholder*="project"]').count() > 0;
  console.log('Has project name input:', hasProjectNameInput);
  
  const hasFileInput = await page.locator('input[type="file"]').count() > 0;
  console.log('Has file input:', hasFileInput);
  
  // Check for API config elements
  const hasApiKeyInput = await page.locator('input[type="password"]').count() > 0;
  console.log('Has API key input:', hasApiKeyInput);
});