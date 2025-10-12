import React, { useState } from 'react';
import { Users, UserCheck, ClipboardList, History, Calendar } from 'lucide-react';
import '../Styles/LoginPage.css';

const HospitalVisitorSystem = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [visitors, setVisitors] = useState([
    { id: 1, patientName: 'Anna Garcia', room: '103', visitorName: 'Tom Wilson', time: '4:00PM', phone: '09345678901', date: '2025-10-09', status: 'checked-in' },
    { id: 2, patientName: 'Jose Reyes', room: '120', visitorName: 'Mary Taylor', time: '6:00PM', phone: '09456789012', date: '2025-10-09', status: 'checked-in' },
    { id: 3, patientName: 'Linda Martinez', room: '107', visitorName: 'Chris Evans', time: '8:00AM', phone: '09567890123', date: '2025-10-09', status: 'checked-in' },
    { id: 4, patientName: 'Robert Garcia', room: '112', visitorName: 'Emma Stone', time: '1:00PM', phone: '09678901234', date: '2025-10-09', status: 'checked-in' }
  ]);

  const [registeredVisitors, setRegisteredVisitors] = useState([
    { id: 1, name: 'Tom Wilson', phone: '09345678901', address: 'Iloilo City', relationship: 'Son', registeredDate: '2025-10-01' },
    { id: 2, name: 'Mary Taylor', phone: '09456789012', address: 'Bacolod City', relationship: 'Daughter', registeredDate: '2025-10-02' },
    { id: 3, name: 'Chris Evans', phone: '09567890123', address: 'Roxas City', relationship: 'Friend', registeredDate: '2025-10-05' },
    { id: 4, name: 'Emma Stone', phone: '09678901234', address: 'Kalibo', relationship: 'Spouse', registeredDate: '2025-10-07' }
  ]);

  const [visitorHistory, setVisitorHistory] = useState([
    { id: 1, patientName: 'Anna Garcia', room: '103', visitorName: 'Tom Wilson', checkIn: '2025-10-08 3:00PM', checkOut: '2025-10-08 5:00PM', duration: '2 hours' },
    { id: 2, patientName: 'Jose Reyes', room: '120', visitorName: 'Mary Taylor', checkIn: '2025-10-07 2:00PM', checkOut: '2025-10-07 4:30PM', duration: '2.5 hours' },
    { id: 3, patientName: 'Linda Martinez', room: '107', visitorName: 'Chris Evans', checkIn: '2025-10-06 10:00AM', checkOut: '2025-10-06 11:30AM', duration: '1.5 hours' }
  ]);

  const [newVisitor, setNewVisitor] = useState({
    patientName: '',
    room: '',
    visitorName: '',
    time: '',
    phone: ''
  });

  const [newRegistration, setNewRegistration] = useState({
    name: '',
    phone: '',
    address: '',
    relationship: ''
  });

  const handleAddVisitor = () => {
    if (newVisitor.patientName && newVisitor.room && newVisitor.visitorName && newVisitor.time && newVisitor.phone) {
      setVisitors([...visitors, {
        id: visitors.length + 1,
        ...newVisitor,
        date: new Date().toISOString().split('T')[0],
        status: 'checked-in'
      }]);
      setNewVisitor({ patientName: '', room: '', visitorName: '', time: '', phone: '' });
    }
  };

  const handleRegisterVisitor = () => {
    if (newRegistration.name && newRegistration.phone && newRegistration.address && newRegistration.relationship) {
      setRegisteredVisitors([...registeredVisitors, {
        id: registeredVisitors.length + 1,
        ...newRegistration,
        registeredDate: new Date().toISOString().split('T')[0]
      }]);
      setNewRegistration({ name: '', phone: '', address: '', relationship: '' });
    }
  };

  const handleCheckOut = (id) => {
    const visitor = visitors.find(v => v.id === id);
    if (visitor) {
      const checkOutTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setVisitorHistory([{
        id: visitorHistory.length + 1,
        patientName: visitor.patientName,
        room: visitor.room,
        visitorName: visitor.visitorName,
        checkIn: `${visitor.date} ${visitor.time}`,
        checkOut: `${new Date().toISOString().split('T')[0]} ${checkOutTime}`,
        duration: 'N/A'
      }, ...visitorHistory]);
      setVisitors(visitors.filter(v => v.id !== id));
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Visitors</p>
              <p className="text-3xl font-bold mt-2">{visitors.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Registered</p>
              <p className="text-3xl font-bold mt-2">{registeredVisitors.length}</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Visits</p>
              <p className="text-3xl font-bold mt-2">{visitorHistory.length}</p>
            </div>
            <History className="w-12 h-12 text-purple-200" />
          </div>
        </div>
        <div className="bg-orange-500 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Today's Date</p>
              <p className="text-xl font-bold mt-2">Oct 09, 2025</p>
            </div>
            <Calendar className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-teal-700 text-white px-6 py-4">
          <h2 className="text-xl font-bold">Current Visitors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Visitor Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.patientName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.room}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.visitorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.time}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.phone}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleCheckOut(visitor.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Check Out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVisitorInfo = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-teal-700 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Add New Visitor</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
              <input
                type="text"
                value={newVisitor.patientName}
                onChange={(e) => setNewVisitor({...newVisitor, patientName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
              <input
                type="text"
                value={newVisitor.room}
                onChange={(e) => setNewVisitor({...newVisitor, room: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visitor Name</label>
              <input
                type="text"
                value={newVisitor.visitorName}
                onChange={(e) => setNewVisitor({...newVisitor, visitorName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visit Time</label>
              <input
                type="text"
                value={newVisitor.time}
                onChange={(e) => setNewVisitor({...newVisitor, time: e.target.value})}
                placeholder="e.g., 3:00PM"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
              <input
                type="text"
                value={newVisitor.phone}
                onChange={(e) => setNewVisitor({...newVisitor, phone: e.target.value})}
                placeholder="09XXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleAddVisitor}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Visitor
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegisteredVisitor = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-teal-700 text-white px-6 py-4">
          <h2 className="text-xl font-bold">Register New Visitor</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newRegistration.name}
                  onChange={(e) => setNewRegistration({...newRegistration, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={newRegistration.phone}
                  onChange={(e) => setNewRegistration({...newRegistration, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={newRegistration.address}
                  onChange={(e) => setNewRegistration({...newRegistration, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship to Patient</label>
                <input
                  type="text"
                  value={newRegistration.relationship}
                  onChange={(e) => setNewRegistration({...newRegistration, relationship: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={handleRegisterVisitor}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Register Visitor
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-teal-700 text-white px-6 py-4">
          <h2 className="text-xl font-bold">Registered Visitors List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Address</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Relationship</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registeredVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.address}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.relationship}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.registeredDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVisitorHistory = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-teal-700 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Visitor History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Visitor Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check In</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check Out</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visitorHistory.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{record.patientName}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{record.room}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{record.visitorName}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{record.checkIn}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{record.checkOut}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{record.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-teal-700 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Daily Attendance Report</h2>
      </div>
      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-600 text-sm font-medium">Total Check-ins Today</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{visitors.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-600 text-sm font-medium">Total Check-outs Today</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{visitorHistory.filter(v => v.checkOut.includes('2025-10-09')).length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-purple-600 text-sm font-medium">Active Now</p>
            <p className="text-3xl font-bold text-purple-700 mt-2">{visitors.length}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Visitor Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check-in Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.visitorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.patientName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.room}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{visitor.time}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-teal-700 text-white px-6 py-6 shadow-lg">
        <h1 className="text-3xl font-bold">IGNACIO LACSON ARROYO MEMORIAL HOSPITAL</h1>
        <p className="text-teal-100 mt-1">Visitor Management System</p>
      </div>

      <div className="flex">
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'dashboard' ? 'bg-teal-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('visitor-info')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'visitor-info' ? 'bg-teal-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Visitor's Information</span>
            </button>
            <button
              onClick={() => setCurrentView('registered')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'registered' ? 'bg-teal-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="font-medium">Registered Visitor</span>
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'history' ? 'bg-teal-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="font-medium">Visitor's History</span>
            </button>
            <button
              onClick={() => setCurrentView('attendance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'attendance' ? 'bg-teal-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Attendance</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 p-6">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'visitor-info' && renderVisitorInfo()}
          {currentView === 'registered' && renderRegisteredVisitor()}
          {currentView === 'history' && renderVisitorHistory()}
          {currentView === 'attendance' && renderAttendance()}
        </div>
      </div>
    </div>
  );
};

export default HospitalVisitorSystem;