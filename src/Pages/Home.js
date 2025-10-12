import React, { useState } from 'react';
import { Users, UserCheck, History, Calendar, ClipboardList } from 'lucide-react';
import '../Styles/Home.css';

export default function HospitalVisitorSystem() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const visitors = [
    { id: 1, patientName: 'Anna Garcia', room: '103', visitorName: 'Tom Wilson', time: '4:00 PM', contact: '09345678901' },
    { id: 2, patientName: 'Jose Reyes', room: '120', visitorName: 'Mary Taylor', time: '6:00 PM', contact: '09456789012' },
    { id: 3, patientName: 'Linda Martinez', room: '107', visitorName: 'Chris Evans', time: '8:00 AM', contact: '09567890123' },
    { id: 4, patientName: 'Robert Garcia', room: '112', visitorName: 'Emma Stone', time: '1:00 PM', contact: '09678901234' }
  ];

  const handleCheckOut = (id) => {
    alert(`Checking out visitor ID: ${id}`);
  };

  return (
    <div className="hospital-system">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <h1>IGNACIO LACSON ARROYO MEMORIAL HOSPITAL</h1>
          <p>VISITOR MANAGEMENT SYSTEM</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <div className="nav-container">
          <button className={activeTab === 'dashboard' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('dashboard')}>
            <ClipboardList size={18} />
            <span>Dashboard</span>
          </button>
          <button className={activeTab === 'info' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('info')}>
            <Users size={18} />
            <span>Visitor's Information</span>
          </button>
          <button className={activeTab === 'registered' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('registered')}>
            <UserCheck size={18} />
            <span>Registered Visitor</span>
          </button>
          <button className={activeTab === 'history' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('history')}>
            <History size={18} />
            <span>Visitor's History</span>
          </button>
          <button className={activeTab === 'attendance' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('attendance')}>
            <Calendar size={18} />
            <span>Attendance</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-text">
                <p className="stat-label">Active Visitors</p>
                <p className="stat-value">4</p>
              </div>
              <div className="stat-icon stat-blue">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-text">
                <p className="stat-label">Registered</p>
                <p className="stat-value">4</p>
              </div>
              <div className="stat-icon stat-green">
                <UserCheck size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-text">
                <p className="stat-label">Total Visits</p>
                <p className="stat-value">3</p>
              </div>
              <div className="stat-icon stat-purple">
                <History size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-text">
                <p className="stat-label">Today's Date</p>
                <p className="stat-value">Oct 09, 2025</p>
              </div>
              <div className="stat-icon stat-orange">
                <Calendar size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Current Visitors Table */}
        <div className="table-container">
          <div className="table-header">
            <h2>
              <Calendar size={24} />
              <span>Current Visitors</span>
            </h2>
          </div>
          
          <div className="table-wrapper">
            <table className="visitors-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Room</th>
                  <th>Visitor Name</th>
                  <th>Time</th>
                  <th>Contact</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor) => (
                  <tr key={visitor.id}>
                    <td>{visitor.patientName}</td>
                    <td>{visitor.room}</td>
                    <td>{visitor.visitorName}</td>
                    <td>{visitor.time}</td>
                    <td>{visitor.contact}</td>
                    <td>
                      <button onClick={() => handleCheckOut(visitor.id)} className="checkout-btn">
                        Check Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}