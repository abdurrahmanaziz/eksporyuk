# Optin Form Builder - Manual Testing Checklist

## ✅ Pre-Testing Setup
- [ ] Dev server running: `npm run dev`
- [ ] Database migrated: `npx prisma db push`
- [ ] Login as affiliate user

## 🧪 Test Cases

### 1. Page Load & UI
- [ ] Navigate to `/affiliate/optin-forms/builder`
- [ ] Verify 3-column layout loads correctly
- [ ] Verify left sidebar shows all components
- [ ] Verify middle canvas shows mobile frame
- [ ] Verify right settings panel visible

### 2. Drag & Drop - Component to Canvas
- [ ] Drag "Heading" from sidebar to canvas
- [ ] Drag "Text Input" to canvas
- [ ] Drag "Email" to canvas
- [ ] Drag "Image" to canvas
- [ ] Drag "Countdown Timer" to canvas
- [ ] Verify elements appear in canvas in correct order

### 3. Reorder Elements
- [ ] Drag Text Input element above Heading
- [ ] Verify order changes in canvas
- [ ] Drag Email below Image
- [ ] Verify reordering works smoothly

### 4. Element Hover Actions
- [ ] Hover over any element in canvas
- [ ] Verify "Move Up", "Move Down", "Delete" buttons appear
- [ ] Click "Move Up" - verify element moves
- [ ] Click "Move Down" - verify element moves
- [ ] Click "Delete" - verify element is removed

### 5. Settings Panel
- [ ] Click on Text Input element
- [ ] Verify settings panel shows input-specific options
- [ ] Change label text - verify updates in canvas
- [ ] Toggle "Required" - verify asterisk appears
- [ ] Click "Style" tab - verify color picker appears
- [ ] Change text color - verify applies to element

### 6. Image Upload
- [ ] Drag Image element to canvas
- [ ] Click "Upload Image" button
- [ ] Select image from device
- [ ] Verify image displays in canvas
- [ ] Verify image is responsive in mobile frame

### 7. Cover Image
- [ ] Click "Upload Cover" button at top
- [ ] Select cover image from device
- [ ] Verify cover image appears at top of form

### 8. Countdown Timer
- [ ] Drag Countdown element to canvas
- [ ] Set target date in settings
- [ ] Verify countdown displays correctly
- [ ] Verify countdown updates

### 9. Mobile Preview
- [ ] Verify mobile frame (375px width)
- [ ] Verify status bar (9:41, signal icons)
- [ ] Scroll canvas content
- [ ] Verify scrolling works smoothly

### 10. Form Save (CRITICAL)
- [ ] Add multiple elements to form
- [ ] Configure settings for each
- [ ] Click "Save Form" button
- [ ] Verify success message appears
- [ ] Check console for errors
- [ ] Verify no 500 errors in Network tab

### 11. Form Load (CRITICAL)
- [ ] Save a form with ID
- [ ] Navigate to `/affiliate/optin-forms/builder?id={formId}`
- [ ] Verify form loads with all elements
- [ ] Verify element settings preserved
- [ ] Verify images load correctly

### 12. Error Handling
- [ ] Try saving form without required fields
- [ ] Verify appropriate error message
- [ ] Try uploading invalid image format
- [ ] Verify error handling works

## 🐛 Known Issues to Check

### Database Schema Issues
- [ ] User-MentorProfile relation exists
- [ ] LeadMagnet model exists
- [ ] AffiliateOptinForm has all fields

### API Endpoints
- [ ] `/api/affiliate/optin-forms` returns 401 (not 500)
- [ ] `/api/affiliate/onboarding` returns 401 (not 500)
- [ ] POST to save form works without 500 error

### UI/UX Issues
- [ ] No console errors in browser
- [ ] No React hydration errors
- [ ] Drag overlay displays correctly
- [ ] Drop zones highlight on drag

## 📊 Test Results

### Browser Console Errors
```
[Note any errors here]
```

### Network Errors
```
[Note any 500 errors here]
```

### Functionality Issues
```
[Note any broken features here]
```

## ✅ Sign-off

**Tested By:** _________________
**Date:** 24 Desember 2025
**Status:** [ ] Pass [ ] Fail
**Notes:**
```
[Add any additional notes]
```

---

## 🚀 After Testing

If all tests pass:
1. ✅ Commit changes with descriptive message
2. ✅ Push to GitHub
3. ✅ Deploy to Vercel production
4. ✅ Test on production URL
5. ✅ Monitor Vercel logs for errors

If tests fail:
1. ❌ Document all issues
2. ❌ Fix issues one by one
3. ❌ Re-test after each fix
4. ❌ Do NOT deploy until all pass
