import React, { useState, useRef, useEffect } from 'react';
import '../Styles/History.css';

const History = () => {
    const [visitors, setVisitors] = useState([
        { name: 'John Doe', address: '123 Main St', timeIn: '9:00 AM', timeOut: '5:00 PM', date: '10/12/25', roomNo: '101' },
        { name: 'Jane Smith', address: '456 Oak Ave', timeIn: '10:30 AM', timeOut: '4:15 PM', date: '10/12/25', roomNo: '205' },
        { name: 'Bob Johnson', address: '789 Pine Rd', timeIn: '8:45 AM', timeOut: '3:30 PM', date: '10/11/25', roomNo: '101' },
        { name: 'Alice Brown', address: '321 Elm St', timeIn: '11:00 AM', timeOut: '6:00 PM', date: '10/11/25', roomNo: '303' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

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
        alert(`Visitor Details:\n\nName: ${visitor.name}\nAddress: ${visitor.address}\nTime In: ${visitor.timeIn}\nTime Out: ${visitor.timeOut}\nDate: ${visitor.date}\nRoom: ${visitor.roomNo}`);
    };

    const addVisitor = (visitorData) => {
        setVisitors([...visitors, visitorData]);
    };

    const removeVisitor = (index) => {
        const newVisitors = visitors.filter((_, i) => i !== index);
        setVisitors(newVisitors);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const getFilteredVisitors = () => {
        if (!searchTerm) return visitors;
        
        return visitors.filter(visitor => 
            visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visitor.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visitor.roomNo.includes(searchTerm)
        );
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Address', 'Time In', 'Time Out', 'Date', 'Room No'];
        const csvContent = [
            headers.join(','),
            ...visitors.map(visitor => 
                Object.values(visitor).map(value => `"${value}"`).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visitor-history.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const addNewVisitor = () => {
        const name = prompt('Enter visitor name:');
        if (!name) return;
        
        const address = prompt('Enter visitor address:');
        if (!address) return;
        
        const timeIn = prompt('Enter time in (e.g., 9:00 AM):');
        if (!timeIn) return;
        
        const timeOut = prompt('Enter time out (e.g., 5:00 PM):');
        if (!timeOut) return;
        
        const date = new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
        });
        
        const roomNo = prompt('Enter room number:');
        if (!roomNo) return;
        
        const newVisitor = { name, address, timeIn, timeOut, date, roomNo };
        addVisitor(newVisitor);
    };

    const filteredVisitors = getFilteredVisitors();
    const totalVisitors = visitors.length;
    const todayVisitors = getTodayVisitorsCount();
    const averageVisitTime = calculateAverageVisitTime();
    const mostVisitedRoom = getMostVisitedRoom();

    return (
        <div className="history-container">
            <div className="history-header">
                <h1>Visitor History</h1>
                <div className="action-buttons">
                    <button onClick={addNewVisitor}>Add Visitor</button>
                    <button onClick={exportToCSV}>Export CSV</button>
                </div>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by name, address, or room number..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <div id="statsContainer" className="stats-container">
                <div className="stat-card">
                    <div className="stat-number">{totalVisitors}</div>
                    <div className="stat-label">Total Visitors</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{todayVisitors}</div>
                    <div className="stat-label">Today's Visitors</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{averageVisitTime}</div>
                    <div className="stat-label">Avg Visit Time</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{mostVisitedRoom}</div>
                    <div className="stat-label">Popular Room</div>
                </div>
            </div>

            <div className="table-container">
                <table className="visitor-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>Date</th>
                            <th>Room No</th>
                        </tr>
                    </thead>
                    <tbody id="visitorTableBody">
                        {filteredVisitors.map((visitor, index) => (
                            <tr 
                                key={index} 
                                className="visitor-row"
                                onClick={() => showVisitorDetails(visitor)}
                            >
                                <td className="name-cell">{visitor.name}</td>
                                <td className="address-cell">{visitor.address}</td>
                                <td className="time-cell">{visitor.timeIn}</td>
                                <td className="time-cell">{visitor.timeOut}</td>
                                <td className="date-cell">{visitor.date}</td>
                                <td className="room-cell">{visitor.roomNo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;