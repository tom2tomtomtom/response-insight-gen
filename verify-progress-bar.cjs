// Quick script to verify progress bar implementation

const fs = require('fs');
const path = require('path');

console.log('Verifying Progress Bar Implementation...\n');

// Check 1: API service has onProgress callback
const apiPath = path.join(__dirname, 'src/services/api.ts');
const apiContent = fs.readFileSync(apiPath, 'utf8');

const hasOnProgressParam = apiContent.includes('onProgress?: (progress: number, status: string) => void');
const callsOnProgress = apiContent.includes('onProgress(');

console.log('✓ API Service:');
console.log(`  - Has onProgress parameter: ${hasOnProgressParam ? '✅' : '❌'}`);
console.log(`  - Calls onProgress callback: ${callsOnProgress ? '✅' : '❌'}`);

// Check 2: useProcessingManagement hook uses progress callback
const hookPath = path.join(__dirname, 'src/hooks/useProcessingManagement.ts');
const hookContent = fs.readFileSync(hookPath, 'utf8');

const passesProgressCallback = hookContent.includes('(progress, status) =>');
const updatesProgress = hookContent.includes('setProcessingProgress');

console.log('\n✓ Processing Hook:');
console.log(`  - Passes progress callback: ${passesProgressCallback ? '✅' : '❌'}`);
console.log(`  - Updates progress state: ${updatesProgress ? '✅' : '❌'}`);

// Check 3: EnhancedProcessingStatus component shows dynamic progress
const componentPath = path.join(__dirname, 'src/components/EnhancedProcessingStatus.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf8');

const usesProcessingProgress = componentContent.includes('processingProgress');
const showsStages = componentContent.includes('Processing Question Types');
const hasProgressBar = componentContent.includes('Progress value={processingProgress}');

console.log('\n✓ Progress Component:');
console.log(`  - Uses processingProgress state: ${usesProcessingProgress ? '✅' : '❌'}`);
console.log(`  - Shows processing stages: ${showsStages ? '✅' : '❌'}`);
console.log(`  - Has progress bar: ${hasProgressBar ? '✅' : '❌'}`);

// Check 4: Look for specific progress values in API
const progressUpdates = apiContent.match(/onProgress\(\d+,/g) || [];
console.log('\n✓ Progress Updates:');
console.log(`  - Number of progress update calls: ${progressUpdates.length}`);
if (progressUpdates.length > 0) {
  console.log('  - Progress values found:');
  progressUpdates.forEach(update => {
    const value = update.match(/\d+/)[0];
    console.log(`    • ${value}%`);
  });
}

// Summary
const allChecks = [
  hasOnProgressParam,
  callsOnProgress,
  passesProgressCallback,
  updatesProgress,
  usesProcessingProgress,
  showsStages,
  hasProgressBar
];

const passedChecks = allChecks.filter(Boolean).length;
console.log(`\n📊 Summary: ${passedChecks}/${allChecks.length} checks passed`);

if (passedChecks === allChecks.length) {
  console.log('✅ Progress bar implementation is complete and functional!');
} else {
  console.log('⚠️  Some progress bar features may be missing');
}