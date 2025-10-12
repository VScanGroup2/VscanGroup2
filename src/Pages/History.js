 import React, { useState, useRef, useEffect } from 'react';
import '../Styles/History.css';
                const statsContainer = document.getElementById('statsContainer');
                const totalVisitors = this.visitors.length;
                const todayVisitors = this.getTodayVisitorsCount();
                const averageVisitTime = this.calculateAverageVisitTime();
                const mostVisitedRoom = this.getMostVisitedRoom();

                statsContainer.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-number">${totalVisitors}</div>
                        <div class="stat-label">Total Visitors</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${todayVisitors}</div>
                        <div class="stat-label">Today's Visitors</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${averageVisitTime}</div>
                        <div class="stat-label">Avg Visit Time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${mostVisitedRoom}</div>
                        <div class="stat-label">Popular Room</div>
                    </div>
                `;
        

            animateRows() 
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
            

            getTodayVisitorsCount() 
                const today = new Date().toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                });
            // Line 48 - closing bracket
return this.visitors.filter(visitor => visitor.date === today).length; // Line 49 - ERROR! return this.visitors.filter(visitor => visitor.date === today).length;
            

            calculateAverageVisitTime() 
                let totalMinutes = 0;
                this.visitors.forEach(visitor => {
                    const timeInMinutes = this.timeToMinutes(visitor.timeIn);
                    const timeOutMinutes = this.timeToMinutes(visitor.timeOut);
                    totalMinutes += timeOutMinutes - timeInMinutes;
                });
                const avgMinutes = totalMinutes / this.visitors.length;
                const hours = Math.floor(avgMinutes / 60);
                const minutes = Math.floor(avgMinutes % 60);
                return `${hours}h ${minutes}m`;
            

            function timeToMinutes(timeStr) {
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
            }

            getMostVisitedRoom() 
                const roomCounts = {};
                this.visitors.forEach(visitor => {
                    roomCounts[visitor.roomNo] = (roomCounts[visitor.roomNo] || 0) + 1;
                });
                
                let maxCount = 0;
                let popularRoom = '';
                for (const room in roomCounts) {
                    if (roomCounts[room] > maxCount) {
                        maxCount = roomCounts[room];
                        popularRoom = room;
                    }
                }
                
                return popularRoom;
            

            showVisitorDetails(visitor) 
                alert(`Visitor Details:\n\nName: ${visitor.name}\nAddress: ${visitor.address}\nTime In: ${visitor.timeIn}\nTime Out: ${visitor.timeOut}\nDate: ${visitor.date}\nRoom: ${visitor.roomNo}`);
            

            addVisitor(visitorData) 
                this.visitors.push(visitorData);
                this.renderTable();
                this.renderStats();
            

            removeVisitor(index) 
                this.visitors.splice(index, 1);
                this.renderTable();
                this.renderStats();
            

            searchVisitors(searchTerm) 
                const filteredVisitors = this.visitors.filter(visitor => 
                    visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    visitor.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    visitor.roomNo.includes(searchTerm)
                );
                
                this.renderFilteredTable(filteredVisitors);
            

            renderFilteredTable(filteredVisitors) 
                const tbody = document.getElementById('visitorTableBody');
                tbody.innerHTML = '';

                filteredVisitors.forEach((visitor, index) => {
                    const row = document.createElement('tr');
                    row.className = 'visitor-row';
                    
                    row.innerHTML = `
                        <td class="name-cell">${visitor.name}</td>
                        <td class="address-cell">${visitor.address}</td>
                        <td class="time-cell">${visitor.timeIn}</td>
                        <td class="time-cell">${visitor.timeOut}</td>
                        <td class="date-cell">${visitor.date}</td>
                        <td class="room-cell">${visitor.roomNo}</td>
                    `;
                    
                    row.addEventListener('click', () => this.showVisitorDetails(visitor));
                    tbody.appendChild(row);
                });
            

            setupEventListeners() 
                // Add keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'f') {
                        e.preventDefault();
                        this.showSearchDialog();
                    }
                });
            

            showSearchDialog() 
                const searchTerm = prompt('Search visitors by name, address, or room number:');
                if (searchTerm) {
                    this.searchVisitors(searchTerm);
                } else if (searchTerm === '') {
                    this.renderTable(); // Show all visitors if empty search
                }
            

            exportToCSV() 
                const headers = ['Name', 'Address', 'Time In', 'Time Out', 'Date', 'Room No'];
                const csvContent = [
                    headers.join(','),
                    ...this.visitors.map(visitor => 
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
            
        

        // Initialize the system
        let visitorSystem;

        document.addEventListener('DOMContentLoaded', function() {
            visitorSystem = new VisitorHistorySystem();
        });

        // Global functions
        function addNewVisitor() {
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
            visitorSystem.addVisitor(newVisitor);
        }

        function searchVisitors() {
            visitorSystem.showSearchDialog();
        }

        function exportData() {
            visitorSystem.exportToCSV();
        }

        // Global API for external access
        window.VisitorHistoryAPI = {
            addVisitor: (data) => visitorSystem?.addVisitor(data),
            searchVisitors: (term) => visitorSystem?.searchVisitors(term),
            exportCSV: () => visitorSystem?.exportToCSV(),
            getAllVisitors: () => visitorSystem?.visitors || []
        };