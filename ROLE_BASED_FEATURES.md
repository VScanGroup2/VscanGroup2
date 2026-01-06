# Role-Based Access Control & Feature Separation

## Overview
The VscanGroup2 system now has clearly separated dashboards for Admin and Security Personnel, with distinct features and permissions for each role.

---

## 👤 ADMIN DASHBOARD

**Access Level:** Full System Control

### Available Features:
1. **Dashboard** - System overview with visitor statistics
2. **List of Visitors** - View all registered and active visitors
3. **Registered Visitor** - Manage registered visitor records
4. **Monitoring** - Active/Discharged visitor tabs with real-time updates
5. **Report** - Generate visitor activity reports
6. **REGISTER** - Register new visitors with QR code generation

### Admin Responsibilities:
- Register new visitors into the system
- Maintain visitor database and records
- Monitor overall visitor activity
- Generate and analyze reports
- Manage system settings and configuration

### Access via:
- Login with **admin** role credentials
- Redirected to `Dashboard.js`

### Visual Indicator:
- Header displays: **👤 ADMIN DASHBOARD**
- Green theme (#1a8f6f)
- Access info card explaining admin capabilities

---

## 🛡️ SECURITY PERSONNEL DASHBOARD

**Access Level:** Check-In/Check-Out & Monitoring

### Available Features:
1. **Scan Visitor QR Code** - USB Scanner & Camera QR scanning
2. **Active Visitors Tab** - Monitor currently checked-in visitors
3. **Discharged Visitors Tab** - View checkout records

### Security Responsibilities:
- Scan visitor QR codes at entry/exit points
- Process visitor check-in and check-out
- Maintain real-time visitor status
- Ensure facility security protocols

### Access via:
- Login with **security** role credentials
- Redirected to `SecurityDashboard.js`

### Visual Indicator:
- Header displays: **🛡️ SECURITY PERSONNEL DASHBOARD**
- Red theme (#dc3545)
- Access info card explaining security capabilities

### Restrictions:
- Cannot register new visitors
- Cannot view historical data
- Cannot generate reports
- Cannot modify visitor records
- Read-only access to visitor information

---

## Authentication & Routing

### Login Process
1. User enters email and password in `LoginPage.js`
2. Credentials verified in Firebase Authentication
3. User role stored in localStorage as `userRole`
4. System routes based on role:
   - `userRole === 'security'` → SecurityDashboard (ONLY)
   - `userRole === 'admin'` → Dashboard (ONLY) (default)

### Role Verification & Access Control
- **Dashboard (Admin):** Verifies user role on mount. If `userRole === 'security'`, user is logged out immediately
- **SecurityDashboard:** Verifies user role on mount. If `userRole !== 'security'`, user is logged out immediately
- This prevents unauthorized access attempts and ensures users can only view their assigned dashboard

### User Accounts
- **Admin Account:** admin@hospital.com (role: admin)
- **Security Account:** security@hospital.com (role: security)

---

## Feature Comparison Table

| Feature | Admin | Security |
|---------|-------|----------|
| Register Visitors | ✅ Yes | ❌ No |
| View All Visitors | ✅ Yes | ✅ Yes (Real-time) |
| Scan QR Codes | ❌ No | ✅ Yes |
| Check-In/Check-Out | ❌ No | ✅ Yes |
| View History | ✅ Yes | ❌ No |
| Generate Reports | ✅ Yes | ❌ No |
| Modify Records | ✅ Yes | ⚠️ Check-Out Only |
| System Settings | ✅ Yes | ❌ No |

---

## Data Access & Security

### Admin Access:
- Full read/write access to all visitor records
- Can modify any visitor information
- Can access historical data and reports
- Cannot logout other users

### Security Access:
- Real-time visitor status only
- Can only update check-out time
- No access to personal details beyond name/room
- Cannot access historical data

---

## Implementation Files

### Core Files:
- `src/App.js` - Role-based routing logic
- `src/Pages/Dashboard.js` - Admin dashboard (1741 lines)
- `src/Pages/SecurityDashboard.js` - Security dashboard (444 lines)
- `src/Pages/LoginPage.js` - Authentication UI
- `src/lib/auth.js` - Authentication logic

### Recent Enhancements:
- Added role indicator badges to both dashboards
- Removed "Security Monitor" from Admin navigation
- Added feature access cards to dashboard headers
- Enhanced visual distinction between roles (green vs red theme)

---

## Role Enforcement & Access Protection

### How It Works
The system enforces role-based access at multiple levels:

1. **Routing Level (App.js)**
   - After login, routing decisions are made based on the `userRole` stored in localStorage
   - Security personnel (`userRole === 'security'`) are always routed to SecurityDashboard
   - All other users are routed to Dashboard (Admin)

2. **Component Level (Dashboard & SecurityDashboard)**
   - Both dashboards verify their user's role when they mount
   - **Dashboard.js:** If security personnel try to access, they are immediately logged out
   - **SecurityDashboard.js:** If admin or any non-security user tries to access, they are immediately logged out

3. **Session Management**
   - `onLogout()` clears localStorage and redirects to LoginPage
   - Session state is cleared to prevent any residual access

### Example Scenarios

**Scenario 1: Admin Login**
```
1. Admin enters credentials: admin@hospital.com / password
2. Authentication succeeds, userRole = 'admin' stored
3. App.js routes to Dashboard
4. Dashboard.js mounts, verifies role is 'admin' ✓
5. Dashboard displays → Admin has full access
```

**Scenario 2: Security Personnel Login**
```
1. Security enters credentials: security@hospital.com / password
2. Authentication succeeds, userRole = 'security' stored
3. App.js routes to SecurityDashboard
4. SecurityDashboard.js mounts, verifies role is 'security' ✓
5. SecurityDashboard displays → Security has scanner access only
```

**Scenario 3: Unauthorized Access Attempt**
```
1. Admin user somehow navigates/redirects to SecurityDashboard (shouldn't happen)
2. SecurityDashboard mounts, checks if role === 'security'
3. Role is 'admin' → NOT 'security'
4. User is immediately logged out
5. Redirected to LoginPage with cleared session
```

---

## Summary

The system now provides:
- ✅ Clear role separation
- ✅ Appropriate feature access for each role
- ✅ Visual indicators for active role
- ✅ Secure data access based on permissions
- ✅ Dedicated interfaces optimized for each workflow
