# Visitor Visitation Tracking System

## Overview

The Visitor Visitation Tracking System comprehensively records all visitor timestamps and visitation data in your VscanGroup2 application. Every visitor check-in and check-out is logged with precise date and time information, creating a complete audit trail of all visitations.

## Features Implemented

### 1. **Check-In Timestamp Recording**
When a visitor is registered in the Dashboard, their check-in time and date are automatically recorded:
- **Date Format**: MM-DD-YY (e.g., "01-06-26")
- **Time Format**: HH:MM:SS AM/PM (e.g., "09:30:45 AM")
- **Database Fields**:
  - `checkInTime`: Visitor's check-in time
  - `registrationDate`: Date of registration
  - `timestamp`: ISO 8601 format for precise ordering

### 2. **Check-Out Timestamp Recording**
When a visitor is discharged or scans out using QR code, check-out is recorded:
- **Automatic Recording**: Via `recordCheckout()` function
- **Database Fields**:
  - `checkOutTime`: Visitor's check-out time
  - `checkOutDate`: Date of check-out
  - `eventType`: Set to 'checkout'
  - `status`: Updated to 'checked-out' or 'discharged'

### 3. **Attendance Log Collection**
All visitation events are stored in the `attendance` collection in Firestore:
```
attendance/
├── Record 1 (Check-in)
│   ├── visitorId: "..."
│   ├── visitorName: "John Doe"
│   ├── scanDate: "01-06-26"
│   ├── checkInTime: "09:30:45 AM"
│   ├── eventType: "check-in"
│   ├── timestamp: "2026-01-06T09:30:45.123Z"
│   └── recordedAt: Date object
│
├── Record 2 (Check-out)
│   ├── visitorId: "..."
│   ├── visitorName: "John Doe"
│   ├── scanDate: "01-06-26"
│   ├── checkoutTime: "05:15:30 PM"
│   ├── eventType: "checkout"
│   ├── timestamp: "2026-01-06T17:15:30.789Z"
│   └── recordedAt: Date object
```

### 4. **Visitation History Tracking**
Complete history of all visitations for each visitor:
- Get all visits for a specific visitor using `getVisitorVisitationHistory(visitorId)`
- Sorted by most recent visit first
- Includes both check-in and check-out records

### 5. **Enhanced History Page**
The History page now displays:
- **Real visitor data** from Firestore (not dummy data)
- **Check-in and Check-out times** for each visitor
- **Visit duration** calculation
- **Filter options**:
  - All visitors
  - Today's visitors
  - Visitors by specific date
- **Search functionality** across visitor names, patient names, room numbers, and contact information
- **CSV export** with complete visitation records
- **Live data refresh** button to reload current visitor data

### 6. **Visitation Tracking Module** (`visitationTracking.js`)
New utility module provides functions for:

```javascript
// Record visitor check-in
recordVisitorCheckIn(visitorId, visitorName, checkInDateTime)

// Record visitor check-out
recordVisitorCheckOut(visitorId, visitorName, checkOutDateTime)

// Get visitations by date
getVisitationsByDate(date) // Returns all visitors for a specific date

// Get visitor's complete history
getVisitorHistory(visitorId) // Returns all visits for a visitor

// Get comprehensive statistics
getVisitationStatistics() // Returns counts, unique visitors, grouped data

// Calculate visit duration
calculateVisitDuration(checkInTime, checkOutTime) // Returns { hours, minutes, seconds, formatted }

// Format records for display
formatVisitationRecord(record) // Returns formatted record object
```

## Database Schema

### Visitors Collection
```javascript
{
  id: "doc-id",
  visitorName: "John Doe",
  roomNumber: "101",
  patientName: "Jane Smith",
  contactNumber: "555-1234",
  timestamp: "2026-01-06T09:30:45.123Z",
  registrationDate: "01-06-26",
  registrationFullDate: "01/06/2026 09:30:45 AM",
  checkInTime: "09:30:45 AM",
  checkOutTime: "05:15:30 PM",
  checkOutDate: "01-06-26",
  status: "checked-out",
  photoUrl: "https://..."
}
```

### Attendance Collection
```javascript
{
  id: "record-id",
  visitorId: "visitor-id",
  visitorName: "John Doe",
  scanDate: "01-06-26",
  checkInTime: "09:30:45 AM",
  checkoutTime: "05:15:30 PM",
  timestamp: "2026-01-06T09:30:45.123Z",
  recordedAt: Date object,
  eventType: "check-in" | "checkout",
  status: "checked-in" | "checked-out" | "discharged"
}
```

## Usage Examples

### In Dashboard Component
```javascript
// Automatically records check-in when visitor is registered
const visitorData = {
  visitorName: 'John Doe',
  roomNumber: '101',
  patientName: 'Jane Smith',
  contactNumber: '555-1234',
  timestamp: now.toISOString(),
  checkInTime: '09:30:45 AM',
  registrationDate: '01-06-26'
};

const docId = await addVisitorDoc(visitorData);

// Automatically records check-out when visitor is discharged
await recordAttendance(docId, 'John Doe', '01-06-26', '09:30:45 AM');
```

### Using Visitation Tracking Module
```javascript
import { recordVisitorCheckOut, getVisitorHistory, calculateVisitDuration } from '../lib/visitationTracking';

// Record checkout
await recordVisitorCheckOut(visitorId, visitorName);

// Get visitor's complete history
const history = await getVisitorHistory(visitorId);

// Calculate visit duration
const duration = calculateVisitDuration('09:30:45 AM', '05:15:30 PM');
console.log(duration); // { hours: 7, minutes: 45, seconds: 0, formatted: "7h 45m 0s" }
```

## Data Retrieval Queries

### Get All Attendance Records
```javascript
import { getAllAttendance } from '../lib/firestore';

const allRecords = await getAllAttendance();
```

### Get Attendance by Date
```javascript
import { getAttendanceByDate } from '../lib/firestore';

const todayRecords = await getAttendanceByDate('01-06-26');
```

### Get Visitor's Complete History
```javascript
import { getVisitorVisitationHistory } from '../lib/firestore';

const visitorHistory = await getVisitorVisitationHistory('visitor-id');
```

## Key Components Updated

### 1. **firestore.js**
- Enhanced `recordAttendance()` with explicit eventType and status fields
- Added `recordCheckout()` function
- Added `getVisitorVisitationHistory()` function
- Added `getAllAttendance()` function with sorting and fallback

### 2. **Dashboard.js**
- Updated imports to include new checkout and history functions
- Enhanced `handleDischarge()` to record checkout timestamps
- Updated `handleQRScan()` to record checkout when visitor scans out
- Now async to support Promise-based operations

### 3. **History.js**
- Integrated with real Firestore visitor and attendance data
- Removed dummy data and replaced with live database queries
- Added date filtering (all, today, custom date)
- Enhanced search across multiple fields
- Added loading state and error handling
- Improved CSV export with all relevant fields
- Added visit duration calculation in display

### 4. **visitationTracking.js** (New)
- Comprehensive utility module for visitation tracking
- Helper functions for common operations
- Duration calculation with time parsing
- Statistics compilation

## Firestore Indexes Required

To optimize queries, ensure the following indexes exist in Firestore:

```
Collection: attendance
Fields: visitorId (Ascending), timestamp (Descending)
```

```
Collection: visitors
Fields: timestamp (Descending)
```

## Future Enhancements

Potential additions to expand functionality:
- Real-time dashboard showing active visitors
- Visitation analytics (peak times, average duration, frequently visited areas)
- Export to Excel with formatting
- Visitor frequency reports
- Suspicious activity alerts
- Integration with security camera systems
- Mobile check-in/out via QR code scanning
- Email/SMS notifications for security personnel

## Testing Checklist

- [ ] Visitor check-in timestamps are recorded in `attendance` collection
- [ ] Visitor check-out timestamps are recorded when discharged
- [ ] QR code scan records checkout timestamp correctly
- [ ] History page displays real visitor data
- [ ] Date filtering works (today, specific date)
- [ ] Search functionality filters across all fields
- [ ] CSV export includes all visitor information
- [ ] Visit duration is calculated correctly
- [ ] Real-time listener updates show new visitors immediately
- [ ] Data persists correctly in Firestore

## Troubleshooting

### Issue: Check-out not recording
**Solution**: Ensure `recordCheckout()` function is being called. Check browser console for errors.

### Issue: History page shows no data
**Solution**: 
- Verify Firestore has visitor and attendance records
- Check Firebase authentication and permissions
- Ensure visitors were registered through Dashboard

### Issue: Timestamps appear as "N/A"
**Solution**: 
- Verify old visitor records have timestamp fields
- Use Dashboard to register new visitors (will include timestamps)

## Performance Notes

- Attendance records are indexed by visitorId and timestamp for quick retrieval
- Real-time listeners on History page update as new visitors check in/out
- CSV exports only export filtered records (not all records)
- Sorted results default to most recent visits first

---

**Last Updated**: January 6, 2026
**Version**: 1.0
