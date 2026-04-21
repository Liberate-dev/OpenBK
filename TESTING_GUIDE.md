# Forum & Survey Debugging Guide

## Changes Made

### 1. Forum Feature Improvements
- ✅ Added console logging for all CRUD operations (create, edit, comment, delete)
- ✅ Added success message feedback for edit and comment operations
- ✅ Enhanced error handling with detailed error messages

### 2. Survey Feature Improvements
- ✅ Added console logging for survey create/edit/load operations
- ✅ Enhanced error handling with detailed error messages
- ✅ Better feedback during save operations

### 3. Files Modified
- `apps/web/src/routes/admin.forum.tsx` - Added logging to thread creation
- `apps/web/src/routes/admin.forum.$threadId.tsx` - Added logging + success messages for edit & comment
- `apps/web/src/routes/admin.surveys.tsx` - Added logging to survey creation
- `apps/web/src/routes/admin.surveys.$id_.edit.tsx` - Added logging to survey edit/load/save

---

## How to Test

### Prerequisites
1. **Login with correct role:**
   - **Forum**: Requires `guru_bk` or `guru` role to create/edit threads
   - **Survey**: Requires `guru_bk` role to create/edit surveys
   
2. **Default test accounts:**
   - **Guru BK**: `guru_bk` / `gurubk123` (role: `guru_bk`) ✅ Can use ALL features
   - **Admin IT**: `admin` / `rahasiabk` (role: `admin`) ⚠️ Can view forum but limited survey access
   - **Guru**: Need to create manually with role `guru`

---

### Testing Forum Feature

#### 1. Create Thread
1. Login as `guru_bk`
2. Navigate to `/admin/forum`
3. Click "Buat Thread"
4. Fill title and body, optionally add files
5. Click "Post Thread"
6. **Expected**: Redirect to thread detail page, success message appears

**Console logs to check:**
```
[Forum] Creating thread: { title: "...", body: "...", files: 0 }
[Forum] Create response: { success: true, id: 123 }
```

#### 2. Edit Thread
1. Open any thread (must be owner or `guru_bk`)
2. Click edit icon (pencil)
3. Modify title and/or body
4. Click "Simpan"
5. **Expected**: Success alert "Thread berhasil diperbarui.", changes reflected immediately

**Console logs to check:**
```
[Forum] Editing thread: { threadId: 123, title: "...", body: "..." }
[Forum] Edit response: { success: true }
```

#### 3. Add Comment
1. Open any thread
2. Scroll to comment section
3. Type a comment in the text field
4. Click send icon or press Ctrl+Enter
5. **Expected**: Comment appears immediately, success message "Komentar berhasil ditambahkan."

**Console logs to check:**
```
[Forum] Posting comment: { threadId: 123, body: "..." }
[Forum] Comment response: { success: true, comment: {...} }
```

---

### Testing Survey Feature

#### 1. Create Survey
1. Login as `guru_bk`
2. Navigate to `/admin/surveys`
3. Click "Buat Survei"
4. Fill in title (required), description (optional), settings
5. Click "Buat & Tambah Pertanyaan"
6. **Expected**: Auto-redirect to edit page for adding questions

**Console logs to check:**
```
[Survey] Creating survey: { title: "...", is_active: true, ... }
[Survey] Create response: { success: true, id: 456, slug: "abc-xyz" }
```

#### 2. Add/Edit Questions
1. On survey edit page (from step 1 or clicking "Edit" on survey list)
2. Click "Tambah Pertanyaan"
3. Select question type (Teks Pendek, Pilihan Ganda, etc.)
4. Fill question label
5. For choice types, add at least 2 options
6. Mark as required if needed
7. Click "Simpan Survei"
8. **Expected**: Success message "Survei berhasil disimpan!"

**Console logs to check:**
```
[Survey] Loaded survey: { id: 456, title: "...", questions: [...] }
[Survey] Saving survey: { id: 456, payload: {...} }
[Survey] Save response: { success: true }
```

#### 3. View Survey Responses
1. Navigate to `/admin/surveys`
2. Click "Respons" on any survey
3. **Expected**: Shows response summary with answer statistics

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Cause**: Wrong role or expired session

**Solution**:
1. Check session: Open browser console → run:
   ```javascript
   JSON.parse(sessionStorage.getItem('openbk_admin_session'))
   ```
2. Verify `role` is `guru_bk` (for full access) or `guru` (for forum only)
3. If expired or wrong role, logout and login again

### Issue 2: Edit Button Not Showing
**Cause**: Not the thread owner AND not `guru_bk` role

**Solution**: 
- Login as `guru_bk` to edit any thread
- Or create a new thread (you'll be the owner)

### Issue 3: Comment Not Posting
**Cause**: Empty comment body or network error

**Solution**:
1. Check console for `[Forum] Posting comment:` log
2. If error appears, check the error message
3. Verify API is running: `http://localhost:8000/api/v1/admin/forum/threads/1`

### Issue 4: Survey Questions Not Saving
**Cause**: Validation error (missing label, insufficient options)

**Solution**:
1. Ensure all questions have non-empty labels
2. Choice-type questions (Pilihan Ganda, Kotak Centang, Dropdown) need minimum 2 options
3. Check console for validation error messages

### Issue 5: "Gagal memuat survei" Error
**Cause**: API not running or network issue

**Solution**:
1. Verify Laravel API is running: `cd apps/api && php artisan serve`
2. Test API directly: `curl http://localhost:8000/api/v1/admin/surveys`
3. Check browser console for network errors

---

## Debugging Tips

### Check Console Logs
Open browser DevTools (F12) → Console tab

Look for logs prefixed with:
- `[Forum]` - All forum operations
- `[Survey]` - All survey operations

### Check Network Tab
Open browser DevTools (F12) → Network tab

1. Filter by `Fetch/XHR`
2. Look for requests to `/api/v1/admin/forum/*` or `/api/v1/admin/surveys/*`
3. Check:
   - **Status Code**: Should be `200`, `201`, or `204`
   - **Response**: Should contain `{ "success": true }` or data
   - **Request Payload**: Verify data being sent is correct

### Check Session State
In browser console:
```javascript
// Check admin session
console.log(JSON.parse(sessionStorage.getItem('openbk_admin_session')))

// Expected output:
// {
//   username: "guru_bk",
//   token: "long_token_string...",
//   role: "guru_bk",
//   expiresAt: 1234567890
// }
```

### Quick API Health Check
```bash
# Test forum endpoint
curl -H "Accept: application/json" http://localhost:8000/api/v1/admin/forum/threads

# Test survey endpoint  
curl -H "Accept: application/json" http://localhost:8000/api/v1/admin/surveys
```

---

## Error Message Guide

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "Unauthorized." | Not logged in or expired session | Logout and login again |
| "Unauthorized. Guru BK atau Guru saja." | Wrong role (e.g., admin, kepala_sekolah) | Login as guru_bk or guru |
| "Unauthorized. Guru BK only." | Wrong role | Login as guru_bk |
| "Gagal memuat thread/survey" | Network/API error | Check if API is running |
| "Data yang dikirim tidak valid" | Validation error | Check form fields, ensure required fields filled |
| "Gagal mengirim komentar" | Empty comment or API error | Ensure comment has text, check console |

---

## Next Steps

If issues persist after following this guide:

1. **Check backend logs**:
   ```bash
   cd apps/api
   tail -f storage/logs/laravel.log
   ```

2. **Test API directly with curl/Postman**:
   - Get token from session
   - Make direct API calls to test endpoints

3. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear all site data for localhost

4. **Restart development servers**:
   ```bash
   # Terminal 1 - API
   cd apps/api && php artisan serve

   # Terminal 2 - Web
   cd apps/web && npm run dev
   ```

---

## Contact

If you find any bugs or need clarification, please provide:
1. Console logs (copy from DevTools)
2. Network request details (from Network tab)
3. Steps to reproduce
4. Expected vs actual behavior
