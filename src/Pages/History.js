import React, { useState, useRef, useEffect } from 'react';
import '../Styles/History.css';
import { getAllAttendance, getVisitors } from '../lib/firestore';
import { calculateVisitDuration } from '../lib/visitationTracking';

const History = () => {
    const [visitors, setVisitors] = useState([]);
    const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // 'all', 'today', 'date'
    const [selectedDate, setSelectedDate] = useState('');

    // Load visitor data on component mount
    useEffect(() => {
        loadVisitorData();
    }, []);

    const loadVisitorData = async () => {
        try {
            setLoading(true);
            
            // Fetch all visitors
            const visitorList = await getVisitors();
            
            // Fetch all attendance records
            const attendanceRecords = await getAllAttendance();
            
            console.log('Loaded visitors:', visitorList);
            console.log('Loaded attendance records:', attendanceRecords);
            
            // Merge visitor data with attendance records
            const mergedData = visitorList.map(visitor => {
                // Find check-in and check-out records for this visitor
                const checkInRecord = attendanceRecords.find(
                    record => record.visitorId === visitor.id && 
                    (record.eventType === 'check-in' || record.scanTime)
                );
                
                const checkOutRecord = attendanceRecords.find(
                    record => record.visitorId === visitor.id && 
                    record.eventType === 'checkout'
                );
                
                return {
                    id: visitor.id,
                    name: visitor.visitorName,
                    visitorName: visitor.visitorName,
                    address: 'N/A', // Not stored in visitor record
                    timeIn: checkInRecord?.checkInTime || visitor.checkInTime || 'N/A',
                    timeOut: checkOutRecord?.checkoutTime || visitor.checkOutTime || 'Not checked out',
                    date: visitor.registrationDate || checkInRecord?.scanDate || 'N/A',
                    roomNo: visitor.roomNumber || 'N/A',
                    patientName: visitor.patientName || 'N/A',
                    contactNumber: visitor.contactNumber || 'N/A',
                    status: visitor.status || 'active',
                    checkInRecord: checkInRecord,
                    checkOutRecord: checkOutRecord,
                    timestamp: visitor.timestamp
                };
            });
            
            setVisitors(mergedData);
            setAllAttendanceRecords(attendanceRecords);
        } catch (error) {
            console.error('Error loading visitor data:', error);
            // Show dummy data as fallback
            setVisitors([
                { name: 'John Doe', address: '123 Main St', timeIn: '9:00 AM', timeOut: '5:00 PM', date: '10/12/25', roomNo: '101', patientName: 'Patient A', contactNumber: '555-1234', status: 'checked-out' },
                { name: 'Jane Smith', address: '456 Oak Ave', timeIn: '10:30 AM', timeOut: '4:15 PM', date: '10/12/25', roomNo: '205', patientName: 'Patient B', contactNumber: '555-5678', status: 'checked-out' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        animateRows();
    }, [visitors]);

    const animateRows = () => {
        const rows = document.querySelectorAll('.visitor-row');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                row.style.transition = 'all 0.5s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 100);
        });
    };

    const getTodayVisitorsCount = () => {
        const today = new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
        });
        return visitors.filter(visitor => visitor.date === today).length;
    };

    const timeToMinutes = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalMinutes = minutes;
        
        if (period === 'PM' && hours !== 12) {
            totalMinutes += (hours + 12) * 60;
        } else if (period === 'AM' && hours === 12) {
            totalMinutes += 0;
        } else {
            totalMinutes += hours * 60;
        }
        
        return totalMinutes;
    };

    const calculateAverageVisitTime = () => {
        if (visitors.length === 0) return '0h 0m';
        
        let totalMinutes = 0;
        visitors.forEach(visitor => {
            const timeInMinutes = timeToMinutes(visitor.timeIn);
            const timeOutMinutes = timeToMinutes(visitor.timeOut);
            totalMinutes += timeOutMinutes - timeInMinutes;
        });
        const avgMinutes = totalMinutes / visitors.length;
        const hours = Math.floor(avgMinutes / 60);
        const minutes = Math.floor(avgMinutes % 60);
        return `${hours}h ${minutes}m`;
    };

    const getMostVisitedRoom = () => {
        const roomCounts = {};
        visitors.forEach(visitor => {
            roomCounts[visitor.roomNo] = (roomCounts[visitor.roomNo] || 0) + 1;
        });
        
        let maxCount = 0;
        let popularRoom = '-';
        for (const room in roomCounts) {
            if (roomCounts[room] > maxCount) {
                maxCount = roomCounts[room];
                popularRoom = room;
            }
        }
        
        return popularRoom;
    };

    const showVisitorDetails = (visitor) => {
        const duration = calculateVisitDuration(visitor.timeIn, visitor.timeOut);
        const durationStr = duration ? duration.formatted : 'N/A';
        
        alert(`Visitor Details:\n\nName: ${visitor.name}\nPatient: ${visitor.patientName}\nRoom: ${visitor.roomNo}\nContact: ${visitor.contactNumber}\n\nCheck-In Time: ${visitor.timeIn}\nCheck-Out Time: ${visitor.timeOut}\nVisit Duration: ${durationStr}\n\nDate: ${visitor.date}\nStatus: ${visitor.status}`);
    };

    const getFilteredVisitors = () => {
        let filtered = visitors;
        
        // Apply date filter
        if (filterType === 'today') {
            const today = new Date().toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit'
            });
            filtered = filtered.filter(visitor => visitor.date === today);
        } else if (filterType === 'date' && selectedDate) {
            filtered = filtered.filter(visitor => visitor.date === selectedDate);
        }
        
        // Apply search filter
        if (!searchTerm) return filtered;
        
        return filtered.filter(visitor => 
            visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visitor.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visitor.roomNo.includes(searchTerm) ||
            visitor.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visitor.contactNumber.includes(searchTerm)
        );
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Patient Name', 'Room No', 'Contact Number', 'Check-In Time', 'Check-Out Time', 'Date', 'Visit Status'];
        const filteredVisitors = getFilteredVisitors();
        const csvContent = [
            headers.join(','),
            ...filteredVisitors.map(visitor => {
                const duration = calculateVisitDuration(visitor.timeIn, visitor.timeOut);
                const durationStr = duration ? duration.formatted : 'N/A';
                return [
                    `"${visitor.name}"`,
                    `"${visitor.patientName}"`,
                    `"${visitor.roomNo}"`,
                    `"${visitor.contactNumber}"`,
                    `"${visitor.timeIn}"`,
                    `"${visitor.timeOut}"`,
                    `"${visitor.date}"`,
                    `"${visitor.status}"`
                ].join(',');
            })
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-history-${new Date().toLocaleDateString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const addNewVisitor = () => {
        // This feature is now managed through the Dashboard registration
        alert('Please register new visitors through the Dashboard page.');
    };

    const removeVisitor = (index) => {
        // This feature is now managed through the Dashboard
        alert('Visitor management is done through the Dashboard page.');
    };

    return (
        <div className="history-container">
            <div className="history-header">
                <h1>Visitor History & Visitation Records</h1>
                <div className="action-buttons">
                    <button onClick={loadVisitorData} disabled={loading}>
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                    <button onClick={exportToCSV} disabled={loading}>Export CSV</button>
                </div>
            </div>

            <div className="search-and-filter">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by name, patient, room, or contact..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                
                <div className="filter-controls">
                    <select 
                        value={filterType} 
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setSelectedDate('');
                        }}
                    >
                        <option value="all">All Visitors</option>
                        <option value="today">Today's Visitors</option>
                        <option value="date">Select Date</option>
                    </select>
                    
                    {filterType === 'date' && (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                const date = new Date(e.target.value);
                                const formatted = date.toLocaleDateString('en-US', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    year: '2-digit'
                                });
                                setSelectedDate(formatted);
                            }}
                        />
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#1a8f6f', fontSize: '1.2em' }}>
                    Loading visitor data...
                </div>
            ) : (
                <>
                    <div id="statsContainer" className="stats-container">
                        <div className="stat-card">
                            <div className="stat-number">{visitors.length}</div>
                            <div className="stat-label">Total Visitors</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{getTodayVisitorsCount()}</div>
                            <div className="stat-label">Today's Visitors</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{calculateAverageVisitTime()}</div>
                            <div className="stat-label">Avg Visit Time</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{getMostVisitedRoom()}</div>
                            <div className="stat-label">Popular Room</div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="visitor-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Patient</th>
                                    <th>Room</th>
                                    <th>Contact</th>
                                    <th>Check-In</th>
                                    <th>Check-Out</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="visitorTableBody">
                                {getFilteredVisitors().length > 0 ? (
                                    getFilteredVisitors().map((visitor) => (
                                        <tr 
                                            key={visitor.id} 
                                            className="visitor-row"
                                            onClick={() => showVisitorDetails(visitor)}
                                        >
                                            <td className="name-cell">{visitor.name}</td>
                                            <td className="patient-cell">{visitor.patientName}</td>
                                            <td className="room-cell">{visitor.roomNo}</td>
                                            <td className="contact-cell">{visitor.contactNumber}</td>
                                            <td className="time-cell">{visitor.timeIn}</td>
                                            <td className="time-cell">{visitor.timeOut}</td>
                                            <td className="date-cell">{visitor.date}</td>
                                            <td className="status-cell">{visitor.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                            No visitors found matching your criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default History;