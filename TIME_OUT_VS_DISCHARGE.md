# Time-Out vs Discharge Operations

## Overview
The system now clearly separates two distinct visitor operations:
1. **Time-Out (Checkout)** - Temporary departure
2. **Discharge** - Permanent removal from the system

---

## Time-Out (Checkout) - 2nd Scan/Button
When a visitor scans out using the QR code scanner (second scan), a **Time-Out** operation is recorded.

### What Happens:
- **Visitor Status**: Remains `'active'` (visitor can check back in later)
- **Fields Updated**:
  - `timeOut`: Set to checkout time (HH:MM:SS AM/PM)
  - `checkOutTime`: Set to checkout time (alternative field name)
  - `checkOutDate`: Set to date (MM-DD-YY format)
- **Attendance Record Created**:
  - `eventType: 'checkout'`
  - `status: 'checked-out'`
  - `checkoutTime`, `timeOut`, `scanDate`, `checkOutDate` fields populated

### Recorded In:
- **Firestore `attendance` collection**: Creates a new document with `eventType: 'checkout'`
- **Function**: `recordCheckout(visitorId, visitorName, checkoutDate, checkoutTime)`

### Display:
- Shows in **Visitor History Report** as "Time Out" column (red text)
- Appears in **Monitoring View** as "Time Out" value
- Report groups check-in and checkout into single row per visitor per date

---

## Discharge - Permanent Removal
When a visitor is discharged using the **Discharge Button** in the monitoring view, a **Discharge** operation is recorded.

### What Happens:
- **Visitor Status**: Changed to `'discharged'` (visitor is permanently removed)
- **Fields Updated**:
  - `status: 'discharged'`
  - `dischargeTime`: Set to discharge timestamp (ISO format)
- **Attendance Record Created**:
  - `eventType: 'discharge'`
  - `status: 'discharged'`
  - `dischargeTime`, `dischargeDate` fields populated

### Recorded In:
- **Firestore `attendance` collection**: Creates a new document with `eventType: 'discharge'`
- **Function**: `recordDischarge(visitorId, visitorName, dischargeDate, dischargeTime)`

### Display:
- Visitor moves from **Active Visitors** tab to **Discharged Visitors** tab
- Appears in **Visitor History Report** as separate discharge record
- Discharge records can be filtered/viewed separately

---

## Key Differences

| Aspect | Time-Out (Checkout) | Discharge |
|--------|-------------------|-----------|
| **Trigger** | 2nd QR code scan | Discharge button click |
| **Visitor Status** | `'active'` (unchanged) | `'discharged'` |
| **Can Check Back In** | ✅ Yes | ❌ No |
| **Event Type** | `'checkout'` | `'discharge'` |
| **User Action** | Automatic (2nd scan) | Manual (button click) |
| **Fields Set** | `timeOut`, `checkOutTime`, `checkOutDate` | `status: 'discharged'`, `dischargeTime` |

---

## Data Flow Example

### Visitor Lifecycle with Time-Out:
1. **Registration** → Status: `'active'`, Time In recorded
2. **Second Scan (Time-Out)** → Status: `'active'`, Time Out recorded, `eventType: 'checkout'` created
3. **Later Re-Entry** → Can scan in again (2nd scan triggers time-out, then next scan triggers new time-in)

### Visitor Lifecycle with Discharge:
1. **Registration** → Status: `'active'`, Time In recorded
2. **Second Scan (Time-Out)** → Status: `'active'`, Time Out recorded
3. **Discharge Button** → Status: `'discharged'`, `eventType: 'discharge'` created
4. **Cannot Check Back In** → Visitor permanently removed from active list

---

## Firestore Collections

### `attendance` Collection Structure
```javascript
// Check-In Event (1st Scan)
{
  eventType: 'check-in',
  visitorId: 'abc123',
  visitorName: 'John Doe',
  scanDate: '01-15-25',
  checkInTime: '10:30:45 AM',
  status: 'checked-in',
  recordedAt: Timestamp
}

// Checkout Event (2nd Scan - Time-Out)
{
  eventType: 'checkout',
  visitorId: 'abc123',
  visitorName: 'John Doe',
  scanDate: '01-15-25',
  checkoutTime: '2:45:20 PM',
  timeOut: '2:45:20 PM',
  checkOutDate: '01-15-25',
  status: 'checked-out',
  recordedAt: Timestamp
}

// Discharge Event (Manual Discharge)
{
  eventType: 'discharge',
  visitorId: 'abc123',
  visitorName: 'John Doe',
  scanDate: '01-15-25',
  dischargeTime: '3:30:00 PM',
  dischargeDate: '01-15-25',
  status: 'discharged',
  recordedAt: Timestamp
}
```

---

## Implementation Files Modified

### `/src/lib/firestore.js`
- ✅ `recordCheckout()` - Records checkout events (eventType: 'checkout')
- ✅ `recordDischarge()` - **NEW** Records discharge events (eventType: 'discharge')

### `/src/Pages/Dashboard.js`
- ✅ `parseQrString()` - Calls `recordCheckout()` on 2nd scan
- ✅ `handleDischarge()` - **UPDATED** Now calls `recordDischarge()` when discharge button is clicked
- ✅ Import statement updated to include `recordDischarge`

---

## Testing Checklist

- [ ] First scan creates check-in event (eventType: 'check-in')
- [ ] Second scan records time-out, creates checkout event (eventType: 'checkout')
- [ ] Visitor status remains 'active' after time-out
- [ ] Discharge button changes status to 'discharged'
- [ ] Discharge button records discharge event (eventType: 'discharge')
- [ ] Visitor History Report shows all three event types
- [ ] Active Visitors tab shows only status='active' visitors
- [ ] Discharged Visitors tab shows only status='discharged' visitors
- [ ] Time-out and discharge appear as separate records in attendance collection
