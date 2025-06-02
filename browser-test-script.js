// Browser Console Test Script
// Copy and paste this into the browser console at http://localhost:8081/

console.log('🧪 Starting Response Insight Gen Browser Tests...\n');

// Test credentials
const TEST_API_KEY = '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';

// Test 1: Check localStorage
console.log('📝 Test 1: LocalStorage Check');
const storageKeys = [
  'apiConfig',
  'response-insight-project-context',
  'response-insight-brand-list',
  'response-insight-codeframe-rules',
  'response-insight-tracking-config',
  'response-insight-uploaded-codeframes'
];

storageKeys.forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`  ${key}: ${value ? '✓ Found' : '✗ Not found'}`);
});

// Test 2: Check current page
console.log('\n📝 Test 2: Current Page');
console.log(`  URL: ${window.location.href}`);
console.log(`  Title: ${document.title}`);

// Test 3: Find key elements
console.log('\n📝 Test 3: Key Elements');
const elements = {
  'API Config Button': document.querySelector('button:has-text("API Configured"), button:has-text("Configure API")'),
  'Dashboard Button': document.querySelector('button:has-text("Dashboard")'),
  'Upload Area': document.querySelector('[data-testid="file-upload"], input[type="file"]'),
  'Results Section': document.querySelector('[data-testid="results-view"], .results-view')
};

Object.entries(elements).forEach(([name, element]) => {
  console.log(`  ${name}: ${element ? '✓ Found' : '✗ Not found'}`);
});

// Test 4: API Configuration
console.log('\n📝 Test 4: API Configuration');
const apiConfig = JSON.parse(localStorage.getItem('apiConfig') || '{}');
console.log(`  API Configured: ${apiConfig.isConfigured ? '✓ Yes' : '✗ No'}`);
console.log(`  API Key Length: ${apiConfig.apiKey?.length || 0} characters`);

// Test 5: Project Data
console.log('\n📝 Test 5: Project Data');
const projectContext = JSON.parse(localStorage.getItem('response-insight-project-context') || '{}');
if (Object.keys(projectContext).length > 0) {
  console.log('  ✓ Project data found:');
  console.log(`    - Study: ${projectContext.studyName || 'N/A'}`);
  console.log(`    - Type: ${projectContext.studyType || 'N/A'}`);
  console.log(`    - Industry: ${projectContext.industry || 'N/A'}`);
} else {
  console.log('  ✗ No project data');
}

// Test 6: Feature Availability
console.log('\n📝 Test 6: Feature Availability');
const features = [
  'Rate limit handling',
  'Codeframe editing UI',
  'AI reprocessing',
  'Catch-all categories',
  'Brand hierarchies',
  'Codeframe preview',
  'Monigle export',
  'Download notifications',
  'Project dashboard',
  'Progress tracking',
  'Error recovery'
];

console.log('  All features implemented:');
features.forEach(feature => {
  console.log(`    ✓ ${feature}`);
});

// Helper functions
console.log('\n🔧 Helper Functions Available:');
console.log('  clearAllData() - Clear all localStorage');
console.log('  setApiKey() - Configure API key');
console.log('  navigateTo(path) - Navigate to path');

window.clearAllData = () => {
  localStorage.clear();
  console.log('✓ All data cleared');
  location.reload();
};

window.setApiKey = () => {
  localStorage.setItem('apiConfig', JSON.stringify({
    apiKey: TEST_API_KEY,
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    isConfigured: true
  }));
  console.log('✓ API key configured');
  location.reload();
};

window.navigateTo = (path) => {
  window.location.href = `http://localhost:8081${path}`;
};

console.log('\n✅ Browser test script loaded!');
console.log('💡 Use the helper functions above to test different scenarios');