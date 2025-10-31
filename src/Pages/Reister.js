import React, { useState, useEffect } from 'react';

export default function VisitorRegistration() {
  const [activeTab, setActiveTab] = useState('register');
  const [formData, setFormData] = useState({
    visitorName: '',
    roomNumber: '',
    patientName: '',
    contactNumber: ''
  });
  const [visitors, setVisitors] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const result = await window.storage.list('visitor:');
      if (result && result.keys && result.keys.length > 0) {
        const visitorPromises = result.keys.map(async key => {
          try {
            return await window.storage.get(key);
          } catch (error) {
            console.log('Error loading key:', key);
            return null;
          }
        });
        const visitorResults = await Promise.all(visitorPromises);
        const loadedVisitors = visitorResults
          .filter(r => r && r.value)
          .map(r => JSON.parse(r.value))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setVisitors(loadedVisitors);
      } else {
        setVisitors([]);
      }
    } catch (error) {
      console.log('No visitors yet or error loading:', error);
      setVisitors([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async () => {
    if (!formData.visitorName || !formData.roomNumber || !formData.patientName || !formData.contactNumber) {
      setMessage({ type: 'error', text: 'Please fill in all fields!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    
    try {
      const visitorData = {
        ...formData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        checkInTime: new Date().toLocaleString(),
        status: 'checked-in'
      };

      const result = await window.storage.set(`visitor:${visitorData.id}`, JSON.stringify(visitorData));
      
      if (result) {
        setMessage({ type: 'success', text: '✓ Visitor registered successfully!' });
        setFormData({
          visitorName: '',
          roomNumber: '',
          patientName: '',
          contactNumber: ''
        });
        await loadVisitors();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
          setActiveTab('registered');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error registering visitor. Please try again.' });
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOutVisitor = async (id) => {
    try {
      const visitorKey = `visitor:${id}`;
      const result = await window.storage.get(visitorKey);
      
      if (result && result.value) {
        const visitor = JSON.parse(result.value);
        visitor.status = 'checked-out';
        visitor.checkOutTime = new Date().toLocaleString();
        
        await window.storage.set(visitorKey, JSON.stringify(visitor));
        await loadVisitors();
        setMessage({ type: 'success', text: 'Visitor checked out successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error checking out visitor.' });
      console.error('Check out error:', error);
    }
  };

  const deleteVisitor = async (id) => {
    try {
      await window.storage.delete(`visitor:${id}`);
      await loadVisitors();
      setMessage({ type: 'success', text: 'Visitor record deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting visitor record.' });
      console.error('Delete error:', error);
    }
  };

  const getActiveVisitors = () => visitors.filter(v => v.status === 'checked-in');
  const getTodayVisitors = () => {
    const today = new Date().toDateString();
    return visitors.filter(v => new Date(v.timestamp).toDateString() === today);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-teal-700 text-white py-5 px-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center tracking-wider">
          IGNACIO LACSON ARROYO MEMORIAL HOSPITAL
        </h1>
        <p className="text-center text-teal-100 mt-1">Visitor Management System</p>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-3xl font-bold text-teal-700 mb-8">Register New Visitor</h2>

            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-xl font-semibold text-gray-700 mb-2">
                  Visitor Name:
                </label>
                <input
                  type="text"
                  name="visitorName"
                  value={formData.visitorName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-lg"
                  placeholder="Enter visitor's full name"
                />
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-700 mb-2">
                  Room Number:
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-lg"
                  placeholder="Enter room number"
                />
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-700 mb-2">
                  Patient Name:
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-lg"
                  placeholder="Enter patient's name"
                />
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-700 mb-2">
                  Contact Number:
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-lg"
                  placeholder="Enter contact number"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-full text-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'REGISTERING...' : 'REGISTER 👆'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                    activeTab === 'info' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Visitor's Information
                </button>
                
                <button
                  onClick={() => setActiveTab('registered')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                    activeTab === 'registered' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Registered Visitor
                </button>
                
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                    activeTab === 'history' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  Visitor's History
                </button>
                
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition flex items-center justify-between ${
                    activeTab === 'attendance' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <span>Attendance</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {activeTab === 'info' && (
              <div className="bg-white rounded-lg shadow-xl p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Visitor Statistics</h4>
                <div className="space-y-3">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Registered</p>
                    <p className="text-3xl font-bold text-teal-700">{visitors.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Currently Checked In</p>
                    <p className="text-3xl font-bold text-green-700">{getActiveVisitors().length}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Today's Visitors</p>
                    <p className="text-3xl font-bold text-blue-700">{getTodayVisitors().length}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'registered' && (
              <div className="bg-white rounded-lg shadow-xl p-6 max-h-96 overflow-y-auto">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Registered Visitors ({visitors.length})</h4>
                {visitors.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No visitors registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {visitors.map((visitor) => (
                      <div key={visitor.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-teal-700">{visitor.visitorName}</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                              visitor.status === 'checked-in' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {visitor.status === 'checked-in' ? '● Active' : '○ Checked Out'}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteVisitor(visitor.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">Room: {visitor.roomNumber}</p>
                        <p className="text-sm text-gray-600">Patient: {visitor.patientName}</p>
                        <p className="text-sm text-gray-600">Contact: {visitor.contactNumber}</p>
                        <p className="text-xs text-gray-400 mt-2">Check-in: {visitor.checkInTime}</p>
                        {visitor.checkOutTime && (
                          <p className="text-xs text-gray-400">Check-out: {visitor.checkOutTime}</p>
                        )}
                        {visitor.status === 'checked-in' && (
                          <button
                            onClick={() => checkOutVisitor(visitor.id)}
                            className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 px-3 rounded"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-lg shadow-xl p-6 max-h-96 overflow-y-auto">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Visitor's History</h4>
                <p className="text-gray-600 mb-4">Total visits recorded: {visitors.length}</p>
                {visitors.length > 0 && (
                  <div className="space-y-2">
                    {visitors.slice(0, 10).map((visitor) => (
                      <div key={visitor.id} className="border-l-4 border-teal-500 pl-3 py-2">
                        <p className="font-semibold text-gray-800">{visitor.visitorName}</p>
                        <p className="text-sm text-gray-600">Visited: {visitor.patientName} (Room {visitor.roomNumber})</p>
                        <p className="text-xs text-gray-400">{visitor.checkInTime}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="bg-white rounded-lg shadow-xl p-6 max-h-96 overflow-y-auto">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Active Visitors</h4>
                <p className="text-gray-600 mb-4">Currently checked in: {getActiveVisitors().length}</p>
                {getActiveVisitors().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active visitors.</p>
                ) : (
                  <div className="space-y-3">
                    {getActiveVisitors().map((visitor) => (
                      <div key={visitor.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-gray-800">{visitor.visitorName}</p>
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Active</span>
                        </div>
                        <p className="text-sm text-gray-600">Room: {visitor.roomNumber}</p>
                        <p className="text-sm text-gray-600">Patient: {visitor.patientName}</p>
                        <p className="text-xs text-gray-500 mt-2">Since: {visitor.checkInTime}</p>
                        <button
                          onClick={() => checkOutVisitor(visitor.id)}
                          className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded"
                        >
                          Check Out Visitor
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}