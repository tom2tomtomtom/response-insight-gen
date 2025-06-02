# Response Insight Gen - Manual Testing Guide

## 🚀 Quick Start
1. Open http://localhost:8081/ in your browser
2. Use the test helper page at: file:///Users/thomasdowuona-hyde/response-insight-gen/test-helper.html

## 📋 Test Credentials
```
API Key: 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
Test File: ~/Downloads/patourism_segmentation_final_data 2(A1).csv
```

## ✅ Step-by-Step Testing

### 1. Initial Setup (2 min)
- [ ] Open http://localhost:8081/
- [ ] You should be redirected to `/api-config`
- [ ] Paste the API key in the textarea
- [ ] Click "Save Configuration"
- [ ] ✓ Should redirect to home page

### 2. File Upload (2 min)
- [ ] Drag and drop the CSV file from Downloads
- [ ] ✓ Should show "File uploaded successfully"
- [ ] ✓ Should display column preview
- [ ] ✓ Should show file statistics

### 3. Column Configuration (3 min)
- [ ] Click "Select All" to select all columns
- [ ] Set first column to "brand_awareness"
- [ ] Set second column to "brand_description"
- [ ] Leave others as "miscellaneous"
- [ ] ✓ Should show selected column count

### 4. Processing (5-10 min)
- [ ] Click "Continue to Analysis"
- [ ] ✓ Should show enhanced processing status
- [ ] ✓ Should display:
  - Step-by-step progress
  - Elapsed time
  - Column/codeframe counts
  - Sampling notification (if applicable)
- [ ] Wait for "Analysis complete!"

### 5. Results - Codeframe Tab (5 min)
- [ ] Click "Codeframe" tab
- [ ] ✓ Verify all codes have Other/None/Don't Know
- [ ] ✓ Check brand awareness has hierarchical structure
- [ ] Test editing features:
  - [ ] Select 2 codes and click "Merge"
  - [ ] Click edit icon and rename a code
  - [ ] Click delete to remove a code
  - [ ] Click "Add Code" to create new
  - [ ] Drag codes to reorder

### 6. AI Reprocessing (3 min)
- [ ] Make some manual edits to codeframe
- [ ] Click "Reprocess with AI"
- [ ] Add instructions: "Keep my manual edits"
- [ ] ✓ Verify edits are preserved
- [ ] ✓ Check responses are recoded

### 7. Export Functions (3 min)
- [ ] Click "Download Excel"
  - [ ] ✓ Should show success notification
  - [ ] ✓ File should download
- [ ] Click "Binary Matrix" tab
  - [ ] Click "Download Binary Matrix"
  - [ ] ✓ Should show success notification
- [ ] Click "Output Format" tab
  - [ ] Click "Export Monigle Format"
  - [ ] ✓ Should show success notification

### 8. Dashboard (2 min)
- [ ] Click "Dashboard" in header
- [ ] ✓ Should show saved projects
- [ ] ✓ Should show saved codeframes
- [ ] Click on a project to resume
- [ ] ✓ Should load project data

### 9. Error Recovery Test (Optional)
- [ ] Process a very large file
- [ ] If rate limit occurs:
  - [ ] ✓ Partial results should be saved
  - [ ] ✓ Recovery UI should appear
  - [ ] Click "Retry Failed Types"
  - [ ] ✓ Should complete missing types

### 10. Session Persistence (1 min)
- [ ] Refresh the page (Cmd+R)
- [ ] ✓ All data should persist
- [ ] ✓ Should stay on same tab
- [ ] Click "Settings" tab
- [ ] Click "Reset All"
- [ ] ✓ Should clear everything

## 🎯 Expected Results

### ✅ All Features Working:
1. **Rate Limiting** - Handles 429 errors gracefully
2. **Codeframe Editor** - Full CRUD operations
3. **AI Reprocessing** - Preserves manual edits
4. **Catch-all Categories** - Always includes Other/None/DK
5. **Brand Hierarchies** - Proper parent/child grouping
6. **Preview Counts** - Shows before generation
7. **Monigle Export** - Correct formatting
8. **Success Notifications** - All downloads show ✅
9. **Project Dashboard** - History and resume
10. **Progress Tracking** - Detailed status updates
11. **Error Recovery** - Partial results can retry

### 📊 Performance Expectations:
- Page load: < 3 seconds
- File upload: < 5 seconds
- Processing: 30-120 seconds (depends on size)
- Export: < 10 seconds

### 🐛 Common Issues:
1. **Rate limit errors** → Should show partial results UI
2. **Large files** → Should handle with sampling
3. **Network errors** → Should show clear error messages
4. **Session timeout** → Data persists in localStorage

## 📝 Notes
- Test with different file sizes
- Try various column combinations
- Test with poor network (throttle in DevTools)
- Check console for any errors
- Verify all notifications appear

## 🎉 Completion
If all checkboxes are marked, the application is working at 100% functionality!