/**
 * Visitation Tracking Module
 * Provides utilities for recording and retrieving visitor timestamps and visitation history
 */

import {
  recordAttendance,
  recordCheckout,
  getAttendanceByDate,
  getVisitorVisitationHistory,
  getAllAttendance
} from './firestore';

/**
 * Record a visitor check-in with full timestamp details
 * @param {string} visitorId - Unique visitor identifier
 * @param {string} visitorName - Visitor's full name
 * @param {Date} checkInDateTime - Check-in date and time
 * @returns {Promise<string>} - Attendance record ID
 */
export async function recordVisitorCheckIn(visitorId, visitorName, checkInDateTime = new Date()) {
  try {
    const checkInDate = checkInDateTime.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });

    const checkInTime = checkInDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    console.log(`[VisitationTracking] Recording check-in for ${visitorName} at ${checkInDate} ${checkInTime}`);
    const recordId = await recordAttendance(visitorId, visitorName, checkInDate, checkInTime);
    return recordId;
  } catch (err) {
    console.error('[VisitationTracking] Error recording check-in:', err);
    throw err;
  }
}

/**
 * Record a visitor check-out with full timestamp details
 * @param {string} visitorId - Unique visitor identifier
 * @param {string} visitorName - Visitor's full name
 * @param {Date} checkOutDateTime - Check-out date and time
 * @returns {Promise<string>} - Attendance record ID
 */
export async function recordVisitorCheckOut(visitorId, visitorName, checkOutDateTime = new Date()) {
  try {
    const checkOutDate = checkOutDateTime.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });

    const checkOutTime = checkOutDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    console.log(`[VisitationTracking] Recording check-out for ${visitorName} at ${checkOutDate} ${checkOutTime}`);
    const recordId = await recordCheckout(visitorId, visitorName, checkOutDate, checkOutTime);
    return recordId;
  } catch (err) {
    console.error('[VisitationTracking] Error recording check-out:', err);
    throw err;
  }
}

/**
 * Get all visitation records for a specific date
 * @param {string} date - Date in MM-DD-YY format
 * @returns {Promise<Array>} - Array of visitation records
 */
export async function getVisitationsByDate(date) {
  try {
    console.log(`[VisitationTracking] Fetching visitations for date: ${date}`);
    const records = await getAttendanceByDate(date);
    return records;
  } catch (err) {
    console.error('[VisitationTracking] Error fetching visitations by date:', err);
    return [];
  }
}

/**
 * Get complete visitation history for a specific visitor
 * @param {string} visitorId - Unique visitor identifier
 * @returns {Promise<Array>} - Array of all visitation records for the visitor
 */
export async function getVisitorHistory(visitorId) {
  try {
    console.log(`[VisitationTracking] Fetching visitation history for visitor: ${visitorId}`);
    const records = await getVisitorVisitationHistory(visitorId);
    return records;
  } catch (err) {
    console.error('[VisitationTracking] Error fetching visitor history:', err);
    return [];
  }
}

/**
 * Get comprehensive visitation statistics
 * @returns {Promise<Object>} - Statistics object with counts and metrics
 */
export async function getVisitationStatistics() {
  try {
    console.log('[VisitationTracking] Calculating visitation statistics...');
    const allRecords = await getAllAttendance();

    const stats = {
      totalVisitations: allRecords.length,
      totalCheckIns: allRecords.filter(r => r.eventType === 'check-in').length,
      totalCheckOuts: allRecords.filter(r => r.eventType === 'checkout').length,
      uniqueVisitors: new Set(allRecords.map(r => r.visitorId)).size,
      visitationsByDate: {},
      visitationsByVisitor: {}
    };

    // Group by date
    allRecords.forEach(record => {
      const date = record.scanDate || record.checkOutDate;
      if (!stats.visitationsByDate[date]) {
        stats.visitationsByDate[date] = [];
      }
      stats.visitationsByDate[date].push(record);
    });

    // Group by visitor
    allRecords.forEach(record => {
      if (!stats.visitationsByVisitor[record.visitorId]) {
        stats.visitationsByVisitor[record.visitorId] = {
          visitorName: record.visitorName,
          visits: []
        };
      }
      stats.visitationsByVisitor[record.visitorId].visits.push(record);
    });

    console.log('[VisitationTracking] Statistics calculated:', stats);
    return stats;
  } catch (err) {
    console.error('[VisitationTracking] Error calculating statistics:', err);
    return {};
  }
}

/**
 * Format a visitation record for display
 * @param {Object} record - Visitation record from database
 * @returns {Object} - Formatted record
 */
export function formatVisitationRecord(record) {
  return {
    id: record.id,
    visitorId: record.visitorId,
    visitorName: record.visitorName,
    date: record.scanDate || record.checkOutDate,
    checkInTime: record.checkInTime || record.scanTime,
    checkOutTime: record.checkOutTime,
    eventType: record.eventType,
    status: record.status,
    recordedAt: record.recordedAt,
    timestamp: record.timestamp
  };
}

/**
 * Calculate visit duration from check-in and check-out times
 * @param {string} checkInTime - Time in HH:MM:SS AM/PM format
 * @param {string} checkOutTime - Time in HH:MM:SS AM/PM format
 * @returns {Object} - Duration object with hours, minutes, seconds
 */
export function calculateVisitDuration(checkInTime, checkOutTime) {
  try {
    if (!checkInTime || !checkOutTime) return null;

    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes, seconds] = time.split(':').map(Number);
      let totalMinutes = minutes + (seconds / 60);

      if (period === 'PM' && hours !== 12) {
        totalMinutes += (hours + 12) * 60;
      } else if (period === 'AM' && hours === 12) {
        totalMinutes += 0;
      } else {
        totalMinutes += hours * 60;
      }

      return totalMinutes;
    };

    const checkInMinutes = parseTime(checkInTime);
    const checkOutMinutes = parseTime(checkOutTime);
    let diffMinutes = checkOutMinutes - checkInMinutes;

    // Handle day boundary crossing
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = Math.floor(diffMinutes % 60);
    const seconds = Math.round((diffMinutes % 1) * 60);

    return {
      hours,
      minutes,
      seconds,
      totalMinutes: Math.round(diffMinutes),
      formatted: `${hours}h ${minutes}m ${seconds}s`
    };
  } catch (err) {
    console.error('[VisitationTracking] Error calculating duration:', err);
    return null;
  }
}

export default {
  recordVisitorCheckIn,
  recordVisitorCheckOut,
  getVisitationsByDate,
  getVisitorHistory,
  getVisitationStatistics,
  formatVisitationRecord,
  calculateVisitDuration
};
