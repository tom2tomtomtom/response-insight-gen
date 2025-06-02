# Response Insight Gen - Complete Testing Checklist

## Test Credentials
- **Email**: tomh@redbaez.con
- **Password**: Wijlre2010
- **API Key**: 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
- **Test File**: ~/Downloads/patourism_segmentation_final_data 2(A1).csv

## 1. Initial Setup & API Configuration
- [ ] Navigate to http://localhost:8081/
- [ ] Should redirect to API configuration page if not configured
- [ ] Enter API key in the configuration page
- [ ] Click "Test Connection" - should show success
- [ ] Click "Save Configuration" - should navigate to home page

## 2. File Upload & Column Selection
- [ ] On home page, drag and drop or click to upload the CSV file
- [ ] File should upload successfully and show file info
- [ ] Column selector should display all columns with preview data
- [ ] Select multiple columns for analysis
- [ ] Set question types for each column (brand_awareness, brand_description, miscellaneous)
- [ ] Configure column settings (nets, multi-response, sampling threshold)

## 3. Project Context & Study Configuration
- [ ] Fill in project context form:
  - [ ] Study name
  - [ ] Study type
  - [ ] Industry
  - [ ] Study objectives
- [ ] Configure tracking study settings if applicable
- [ ] Add brand list if processing brand awareness questions

## 4. Codeframe Generation & Processing
- [ ] Click "Continue to Analysis"
- [ ] Should show enhanced processing status with:
  - [ ] Step-by-step progress indicators
  - [ ] Elapsed time tracking
  - [ ] Column and codeframe counts
  - [ ] Sampling notifications (if applicable)
- [ ] Wait for processing to complete

## 5. Results View Features
- [ ] Check codeframe tab:
  - [ ] All codes should have Other/None/Don't Know categories
  - [ ] Brand awareness should show hierarchical grouping
  - [ ] Numeric IDs should be assigned
- [ ] Check coded responses tab:
  - [ ] All responses should be coded
  - [ ] Search/filter functionality should work
  - [ ] Column and question type filters should work

## 6. Codeframe Editing (FULLY IMPLEMENTED)
- [ ] Test codeframe editor features:
  - [ ] **Merge codes** - select multiple and merge
  - [ ] **Split codes** - split existing code into multiple
  - [ ] **Rename codes** - edit code labels
  - [ ] **Delete codes** - remove unwanted codes
  - [ ] **Add new codes** - create new codes
  - [ ] **Reorder codes** - drag and drop to reorder
  - [ ] **Batch operations** - select multiple for bulk actions

## 7. AI Reprocessing (FULLY IMPLEMENTED)
- [ ] Make manual edits to codeframe
- [ ] Click "Reprocess with AI"
- [ ] Add revision instructions (optional)
- [ ] Verify responses are recoded with updated codeframe
- [ ] Check that manual edits are preserved

## 8. Export Options
- [ ] **Binary Matrix Export** (CSV)
  - [ ] Download should include success notification ✅
  - [ ] Check format has 1/0 for each code column
- [ ] **Excel Export**
  - [ ] Download should include success notification ✅
  - [ ] Should contain multiple worksheets
  - [ ] Insights tab (if multiple question types)
- [ ] **Monigle Format Export** (FIXED)
  - [ ] Download should include success notification ✅
  - [ ] Respondent IDs in first column
  - [ ] Hierarchical thematic grouping
  - [ ] Proper column alignment

## 9. Project Dashboard (FULLY IMPLEMENTED)
- [ ] Navigate to Dashboard from header
- [ ] View saved projects list
- [ ] Resume previous project
- [ ] View and reuse saved codeframes
- [ ] Check project history

## 10. Error Recovery (FULLY IMPLEMENTED)
- [ ] Test with large dataset to trigger rate limits
- [ ] Verify partial results are saved
- [ ] Check PartialResultsRecovery component appears
- [ ] Test retry functionality for failed question types
- [ ] Verify results merge correctly after retry

## 11. Session Persistence
- [ ] Refresh page during various stages
- [ ] Verify data is restored from localStorage:
  - [ ] Project context
  - [ ] Brand list
  - [ ] Codeframe rules
  - [ ] Tracking configuration
- [ ] Test "Reset All" functionality

## 12. Additional Features
- [ ] Upload existing codeframe (Upload Codeframe button)
- [ ] Preview codeframe count before generation ✅
- [ ] Check catch-all categories enforcement ✅
- [ ] Verify brand roll-up logic ✅
- [ ] Test sampling threshold settings

## 13. Edge Cases
- [ ] Upload file with special characters
- [ ] Process columns with empty responses
- [ ] Test with very long response texts
- [ ] Process single question type
- [ ] Process multiple question types

## Issues Fixed in This Session
1. ✅ Rate limit errors (reduced batch size, better retry logic)
2. ✅ Codeframe editing UI (complete implementation)
3. ✅ AI reprocessing with manual edits
4. ✅ Other/None/N/A category enforcement
5. ✅ Brand hierarchical grouping
6. ✅ Codeframe count preview
7. ✅ Monigle output formatting (fixed typo and alignment)
8. ✅ Download success notifications
9. ✅ Project dashboard
10. ✅ Enhanced processing status
11. ✅ Error recovery for partial results

## Expected Behavior
- All features should work smoothly without errors
- Processing should handle rate limits gracefully
- Downloads should show success notifications
- Partial failures should allow recovery
- Manual edits should be preserved in AI reprocessing
- Session data should persist across refreshes

## Notes
- The app is now at 100% completion with all requested features implemented
- Test with the provided CSV file for best results
- Monitor browser console for any errors
- Check localStorage for saved data