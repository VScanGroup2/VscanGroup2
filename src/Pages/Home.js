import React, { useState } from 'react';
import '../Styles/Home.css';

function Home() {
  const [view, setView] = useState('dashboard');
  const [visitors, setVisitors] = useState([
    { name: "Steven Perfas", room: "102", time: "9:00AM", contact: "09326789902", status: "in" },
    { name: "Rino Villar", room: "121", time: "3:00PM", contact: "09326789989", status: "in" },
    { name: "Rey Javier", room: "105", time: "10:00AM", contact: "09326789889", status: "in" },
    { name: "Carlos Casi", room: "109", time: "7:00PM", contact: "09306759889", status: "in" },
    { name: "John Boni", room: "119", time: "5:00PM", contact: "09986759989", status: "in" },
    { name: "Jireh Bindol", room: "114", time: "9:00PM", contact: "09323459989", status: "in" }
  ]);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    room: '',
    time: '',
    contact: ''
  });

  function getCurrentDate() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}-${day}-${year}`;
  }

  function handleMenuClick(newView) {
    setView(newView);
  }

  function handleRegisterChange(e) {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();
    const { name, room, time, contact } = registerForm;
    if (name && room && time && contact) {
      setVisitors([
        ...visitors,
        { name, room, time, contact, status: 'in' }
      ]);
      setRegisterForm({ name: '', room: '', time: '', contact: '' });
      alert('Visitor registered successfully!');
      setView('dashboard');
    } else {
      alert('Please fill in all fields');
    }
  }

  return (
    <div>
      <div className="header">
        IGNACIO LACSON ARROYO MEMORIAL HOSPITAL
      </div>
      <div className="container">
        <div className="content">
          {/* Dashboard View */}
          {view === 'dashboard' && (
            <div id="dashboardView">
              <div className="title">DASHBOARD</div>
              <div className="stats-container">
                <div className="stat-box">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <div className="stat-label">TOTAL VISITOR'S</div>
                    <div className="stat-value" id="totalVisitors">{visitors.length}</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">✓</div>
                  <div className="stat-info">
                    <div className="stat-label">Discharge Patient</div>
                    <div className="stat-value">45</div>
                  </div>
                </div>
              </div>
              <div className="date-box" id="currentDate">DATE: {getCurrentDate()}</div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room no.</th>
                    <th>Time In/Out</th>
                    <th>Contact No.</th>
                  </tr>
                </thead>
                <tbody id="visitorTableBody">
                  {visitors.map((v, i) => (
                    <tr key={i}>
                      <td>{v.name}</td>
                      <td>{v.room}</td>
                      <td>{v.time}</td>
                      <td>{v.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Register View */}
          {view === 'register' && (
            <div id="registerView">
              <div className="form-container">
                <div className="title">REGISTER NEW VISITOR</div>
                <form className="form-box" onSubmit={handleRegisterSubmit}>
                  <div className="field-group">
                    <label htmlFor="visitorName">Full Name:</label>
                    <input
                      type="text"
                      id="visitorName"
                      name="name"
                      placeholder="Enter full name"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="roomNumber">Room Number:</label>
                    <input
                      type="text"
                      id="roomNumber"
                      name="room"
                      placeholder="Enter room number"
                      value={registerForm.room}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="timeIn">Time In:</label>
                    <input
                      type="text"
                      id="timeIn"
                      name="time"
                      placeholder="e.g., 9:00AM"
                      value={registerForm.time}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="contactNumber">Contact Number:</label>
                    <input
                      type="text"
                      id="contactNumber"
                      name="contact"
                      placeholder="e.g., 09123456789"
                      value={registerForm.contact}
                      onChange={handleRegisterChange}
                    />
                  </div>
                  <button className="submit-btn" type="submit">SUBMIT</button>
                </form>
              </div>
            </div>
          )}

          {/* Registered Visitors View */}
          {view === 'registered' && (
            <div id="registeredView">
              <div className="title">REGISTERED VISITORS</div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room no.</th>
                    <th>Time In</th>
                    <th>Contact No.</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="registeredTableBody">
                  {visitors.map((v, i) => (
                    <tr key={i}>
                      <td>{v.name}</td>
                      <td>{v.room}</td>
                      <td>{v.time}</td>
                      <td>{v.contact}</td>
                      <td className={v.status === 'in' ? 'status-active' : 'status-left'}>
                        {v.status === 'in' ? 'Active' : 'Left'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Visitor History View */}
          {view === 'history' && (
            <div id="historyView">
              <div className="title">VISITOR'S HISTORY</div>
              <div style={{ fontSize: 20, marginBottom: 20, color: '#666' }}>
                Total visits: <span id="totalVisits">{visitors.length}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room no.</th>
                    <th>Time</th>
                    <th>Contact No.</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody id="historyTableBody">
                  {visitors.map((v, i) => (
                    <tr key={i}>
                      <td>{v.name}</td>
                      <td>{v.room}</td>
                      <td>{v.time}</td>
                      <td>{v.contact}</td>
                      <td>{getCurrentDate()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Attendance View */}
          {view === 'attendance' && (
            <div id="attendanceView">
              <div className="title">ATTENDANCE</div>
              <div className="stats-container">
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0d7a5f' }}>Present</div>
                  <div style={{ fontSize: 36, fontWeight: 'bold' }} id="presentCount">{visitors.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#666' }}>Total Registered</div>
                  <div style={{ fontSize: 36, fontWeight: 'bold' }} id="totalRegistered">{visitors.length}</div>
                </div>
              </div>
              <table style={{ marginTop: 30 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room no.</th>
                    <th>Time In</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="attendanceTableBody">
                  {visitors.map((v, i) => (
                    <tr key={i}>
                      <td>{v.name}</td>
                      <td>{v.room}</td>
                      <td>{v.time}</td>
                      <td className="status-active">✓ Present</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="sidebar">
          <div className="home-icon" onClick={() => handleMenuClick('dashboard')}>🏠</div>
          <div className={`menu-item${view === 'dashboard' ? ' active' : ''}`} onClick={() => handleMenuClick('dashboard')}>Dashboard</div>
          <div className={`menu-item${view === 'dashboard' ? ' active' : ''}`} onClick={() => handleMenuClick('dashboard')}>Visitor's Information</div>
          <div className={`menu-item${view === 'registered' ? ' active' : ''}`} onClick={() => handleMenuClick('registered')}>Registered Visitor</div>
          <div className={`menu-item${view === 'history' ? ' active' : ''}`} onClick={() => handleMenuClick('history')}>Visitor's History</div>
          <div className={`menu-item${view === 'attendance' ? ' active' : ''}`} onClick={() => handleMenuClick('attendance')}>Attendance</div>
          <div className="register-btn" onClick={() => handleMenuClick('register')}>REGISTER</div>
        </div>
      </div>
    </div>
  );
}

export default Home;