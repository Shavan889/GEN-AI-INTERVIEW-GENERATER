# Testing & Deployment Checklist

## Pre-Deployment

- [ ] Back up current code
- [ ] Verify all .env variables are set correctly:
  - [ ] GOOGLE_API_KEY
  - [ ] MONGO_URI
  - [ ] JWT_SECRET_KEY
  - [ ] NODE_ENV (optional)

---

## Code Updates Verification

### Backend Updates
- [ ] `src/services/ai.services.js` - Model name changed to `gemini-2.0-pro`
- [ ] `src/controllers/interview.controller.js` - PDF parsing fixed and logging added
- [ ] Run `npm install` to ensure all dependencies are up-to-date

### Frontend Updates
- [ ] `src/features/interview/hooks/useInterview.js` - Error handling improved

---

## Manual Testing Steps

### Test 1: Interview Generation (Happy Path)
1. [ ] Navigate to home page
2. [ ] Enter a valid job description (at least 50 characters)
3. [ ] Enter self description OR upload a resume PDF
4. [ ] Click "Generate Report"
5. [ ] Check browser console for logs:
   - [ ] "Full API Response:" - should show object with interviewReport
   - [ ] "Interview Report Data:" - should show report object with _id
6. [ ] Should navigate to `/interview/[reportId]`
7. [ ] Report should display with all sections

### Test 2: Error Handling - Missing Fields
1. [ ] Try submitting without job description
2. [ ] Should see error: "Invalid Input: selfDescription and jobDescription are required fields."
3. [ ] Should NOT navigate away

### Test 3: Error Handling - Invalid PDF
1. [ ] Upload a corrupted or non-PDF file
2. [ ] Should show server error message
3. [ ] Check backend logs for PDF parsing error

### Test 4: Authentication Error
1. [ ] Clear cookies
2. [ ] Try to generate report
3. [ ] Should see: "Authentication failed. Please login again."

### Test 5: PDF Generation
1. [ ] On a successfully generated report page
2. [ ] Click "Download PDF" button
3. [ ] Should download resume_[id].pdf file
4. [ ] PDF should contain the preparation plan

---

## Monitoring During Deployment

### Backend Logs to Watch For
```
✓ Parsing resume PDF...
✓ Generating interview report...
✓ Interview report created successfully: [id]
```

### Frontend Console Should Show
```
✓ Full API Response: {message: "...", interviewReport: {...}}
✓ Interview Report Data: {_id: "...", matchScore: ..., ...}
✓ Navigating to: /interview/[id]
```

### Browser Console Errors to Avoid
```
❌ "Invalid response structure. Expected data to have _id"
❌ "Cannot read property '_id' of null"
❌ "Error: Empty response from AI model"
```

---

## Performance Benchmarks

| Operation | Expected Time | Status |
|-----------|---------------|--------|
| PDF Parsing | < 1s | ✓ |
| AI Generation | 30-60s | ✓ (First time) |
| Database Save | < 1s | ✓ |
| Total First Time | ~35-65s | ✓ |
| Total Subsequent | < 5s (if cached) | ✓ |

---

## Rollback Plan

If issues occur:

1. **Revert Backend**:
   ```bash
   git revert HEAD~1  # or restore from backup
   npm start
   ```

2. **Revert Frontend**:
   ```bash
   git revert HEAD~1  # or restore from backup
   npm run build
   ```

3. **Monitor Logs** for error messages

---

## Success Criteria ✅

The deployment is successful when:
- [ ] Users can generate interview reports without 500 errors
- [ ] Console shows proper logging at each step
- [ ] Errors are user-friendly with specific messages
- [ ] Reports contain all expected data (_id, matchScore, questions, etc.)
- [ ] PDF generation works (if applicable)
- [ ] No "Invalid response structure" errors

---

## Troubleshooting Reference

### Issue: Still Getting 500 Error
**Solution**:
1. Check Google Gemini API key validity
2. Verify API quota
3. Try model: `gemini-1.5-pro`
4. Check MongoDB connection

### Issue: "Empty response from AI model"
**Solution**:
1. Verify GOOGLE_API_KEY format
2. Check Google Cloud API limits
3. Ensure request parameters are valid

### Issue: "PDF parsing failed"
**Solution**:
1. Use a standard text-based PDF
2. Verify file size < 3MB
3. Try with a different PDF file

### Issue: Navigation not happening
**Solution**:
1. Check response has `_id` property
2. Check console for actual response
3. Verify authentication token is valid

---

## Support Contacts

- **Google Gemini API**: https://console.cloud.google.com
- **MongoDB Connection**: Check your connection string
- **Backend Logs**: Check server console output
- **Frontend Logs**: Check browser DevTools console

---

## Documentation Links

- Google Gemini Models: [Supported Models](https://ai.google.dev/gemini-api/docs)
- MongoDB: [Connection Guide](https://docs.mongodb.com/guides/server/drivers/)
- Express.js: [Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)

---

