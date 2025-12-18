# Firestore Debugging Guide

## Check Console Logs
1. Open the browser (http://localhost:3001)
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for these debug messages:

```
[Firestore] Setting up real-time listener for visitors...
[Dashboard] Setting up Firestore listener on mount...
[Dashboard] Received visitors data from Firestore: [...]
[Dashboard] Number of visitors received: X
[Dashboard] Normalized visitors: [...]
```

## Common Issues & Solutions

### Issue: "Received visitors data from Firestore: []" (Empty Array)
- **Cause:** Firestore collection might be empty OR security rules block read access
- **Solution:** Check Firestore Console → Check if "visitors" collection exists and has documents

### Issue: No console logs appear at all
- **Cause:** Listener wasn't set up properly
- **Solution:** Check browser console for JavaScript errors

### Issue: "Real-time query error" messages
- **Cause:** Most likely Firestore security rules issue
- **Solution:** Go to Firebase Console → Firestore → Rules → Set to test mode (allow read/write)

### Issue: "[Firestore] orderBy timestamp failed"
- **Cause:** Some documents don't have a timestamp field
- **Solution:** App now has fallback - should work anyway

## Quick Firestore Check
1. Go to Firebase Console (https://console.firebase.google.com/)
2. Select project: **vscan-fbbb6**
3. Go to **Firestore Database**
4. Check **Data** tab:
   - Do you see a "visitors" collection?
   - Are there documents inside?
   - What fields do the documents have?

## Test Login Credentials
- Email: `vscangroup@gmail.com`
- Password: `@dmin1234`
