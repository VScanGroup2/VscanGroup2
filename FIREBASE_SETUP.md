# Firebase Account Setup Guide

## Overview
This guide explains how to set up the Firebase authentication accounts for the VscanGroup2 system.

## Automatic Account Creation

The system is designed to **automatically create user accounts on first login attempt**. When users try to log in with the correct credentials, if their account doesn't exist in Firebase, it will be created automatically.

### How It Works:
1. User enters email and password on the login page
2. System validates credentials against the allowed users list
3. If credentials are valid:
   - System attempts to sign in
   - If user exists: signs in successfully
   - If user doesn't exist: automatically creates the account and signs in
4. User is authenticated and redirected to their dashboard

## Manual Account Setup (Optional)

If you prefer to manually create accounts in Firebase before users log in, follow these steps:

### Option 1: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Users**
4. Click **Add user**
5. Create the following accounts:

#### Account 1: Administrator
- **Email:** `vscangroup@gmail.com`
- **Password:** `@dmin1234`

#### Account 2: Security Personnel
- **Email:** `security@hospital.com`
- **Password:** `security123`

### Option 2: Using the Setup Script (Programmatic)

1. Import the setup function in your app:
```javascript
import initializeAllAccounts from './lib/setupAccounts';
```

2. Call the function to create accounts:
```javascript
// This can be called from a dev console or a one-time setup page
initializeAllAccounts();
```

3. Check the browser console for success messages

## Account Credentials

### Administrator Account
```
Email: vscangroup@gmail.com
Password: @dmin1234
Dashboard: Full Admin Dashboard
Features:
  - Register new visitors
  - View list of visitors
  - Monitor visitor activity
  - Generate reports
  - View visitor history
  - Access security monitoring
```

### Security Personnel Account
```
Email: security@hospital.com
Password: security123
Dashboard: Security Monitor
Features:
  - Scan QR codes for visitor check-out
  - View active visitors
  - View discharged visitors
  - Search for visitors
```

## Important Notes

- ⚠️ **Keep credentials secure** - Do not share these credentials publicly
- 🔐 **Change passwords** - Change the default passwords in production
- 📝 **Update auth.js** - If you change credentials, update them in `src/lib/auth.js`
- 🔄 **Auto-creation** - If accounts don't exist, they'll be created automatically on first login

## Troubleshooting

### Issue: "Access denied. Invalid credentials."
- Verify email and password are correct
- Check that credentials match the allowed users list in `src/lib/auth.js`

### Issue: Account already exists error
- User account is already created in Firebase
- Try logging in again
- Check Firebase Console > Authentication > Users

### Issue: Firebase initialization error
- Ensure Firebase is properly configured in `src/firebase.js`
- Check your Firebase project credentials
- Verify internet connection

## Related Files

- `src/lib/auth.js` - Authentication logic with user roles
- `src/lib/setupAccounts.js` - Account initialization helper
- `src/Pages/LoginPage.js` - Login interface
- `src/App.js` - Role-based routing

## Support

For issues with Firebase configuration or authentication:
1. Check Firebase Console for errors
2. Review browser console for error messages
3. Verify Firebase credentials in `src/firebase.js`
4. Ensure Firebase Authentication is enabled in your project
