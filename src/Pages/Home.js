import React, { useState, useEffect, useRef } from 'react';
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <Home onLogout={() => setIsLoggedIn(false)} />;
  }

  return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = () => {
    setMessage('');
    setMessageType('');

    if (!email || !password) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email');
      setMessageType('error');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setMessage('Login successful!');
      setMessageType('success');
      setTimeout(() => onLogin(), 1000);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #a8c5c0 0%, #7ba5a0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#1a8f6f', color: 'white', padding: '20px 40px', borderRadius: '10px', marginBottom: '40px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ fontSize: '1.8em', fontWeight: 'bold', letterSpacing: '1px', margin: 0 }}>IGNACIO LACSON ARROYO SR. MEMORIAL DISTRICT HOSPITAL</h1>
      </div>

      <div style={{ background: 'white', borderRadius: '15px', padding: '50px 60px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', maxWidth: '500px', width: '100%' }}>
        <h2 style={{ fontSize: '3em', fontWeight: 'bold', textAlign: 'center', marginBottom: '40px', color: '#333' }}>WELCOME</h2>

        <div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '1.1em', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={handleKeyPress} autoComplete="email" style={{ width: '100%', padding: '15px 50px 15px 15px', fontSize: '1.1em', border: '2px solid #ddd', borderRadius: '8px', outline: 'none', transition: 'border-color 0.3s', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
              <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', fill: '#1a8f6f' }}>
                <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '1.1em', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} autoComplete="current-password" style={{ width: '100%', padding: '15px 50px 15px 15px', fontSize: '1.1em', border: '2px solid #ddd', borderRadius: '8px', outline: 'none', transition: 'border-color 0.3s', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
              <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', fill: '#1a8f6f', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                  {showPassword ? <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/> : <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>}
                </svg>
              </div>
            </div>
          </div>

          {message && (
            <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', background: messageType === 'success' ? '#d4edda' : '#f8d7da', color: messageType === 'success' ? '#155724' : '#721c24', border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}` }}>{message}</div>
          )}

          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '18px', fontSize: '1.3em', fontWeight: 'bold', color: 'white', background: loading ? '#999' : 'linear-gradient(135deg, #1a8f6f 0%, #22a885 100%)', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'transform 0.2s, background 0.3s', boxShadow: '0 4px 15px rgba(26,143,111,0.3)' }} onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.02)')} onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Home({ onLogout }) {
  const [visitors, setVisitors] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [formData, setFormData] = useState({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [registeredSearchQuery, setRegisteredSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRData, setCurrentQRData] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];
    
    const sample = [
      { id: 1, name: 'Steven Perfas', room: '102', patient: 'Maria Santos', timeIn: '9:00AM', timeOut: null, contact: '09326789902', date: today, status: 'active' },
      { id: 2, name: 'Rino Villar', room: '121', patient: 'Juan dela Cruz', timeIn: '3:00PM', timeOut: null, contact: '09326789989', date: today, status: 'active' },
      { id: 3, name: 'Anna Reyes', room: '105', patient: 'Pedro Garcia', timeIn: '10:30AM', timeOut: '2:45PM', contact: '09171234567', date: yesterday, status: 'completed' },
      { id: 4, name: 'Carlos Mendoza', room: '203', patient: 'Rosa Martinez', timeIn: '8:15AM', timeOut: '11:30AM', contact: '09189876543', date: yesterday, status: 'completed' },
      { id: 5, name: 'Lisa Torres', room: '108', patient: 'Miguel Santos', timeIn: '1:00PM', timeOut: '5:30PM', contact: '09123456789', date: twoDaysAgo, status: 'completed' },
      { id: 6, name: 'Mark Silva', room: '210', patient: 'Elena Cruz', timeIn: '9:45AM', timeOut: '12:15PM', contact: '09198765432', date: twoDaysAgo, status: 'completed' }
    ];
    setVisitors(sample);
    setAttendanceDate(today);
  }, []);

  const showView = (view) => setCurrentView(view);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        alert('Photo size should be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const generateQRCode = (visitorData) => {
    setCurrentQRData(visitorData);
    setShowQRModal(true);

    // Wait for modal to render and QRCode library to be available
    const attemptQRGeneration = (attempts = 0) => {
      if (attempts > 10) {
        alert('Unable to generate QR code. Please refresh the page and try again.');
        return;
      }

      if (!window.QRCode) {
        setTimeout(() => attemptQRGeneration(attempts + 1), 300);
        return;
      }

      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = '';
        
        const qrData = JSON.stringify({
          visitorId: visitorData.id,
          name: visitorData.name,
          room: visitorData.room,
          patient: visitorData.patient,
          contact: visitorData.contact,
          timeIn: visitorData.timeIn,
          date: visitorData.date,
          verificationUrl: `https://hospital.com/verify/${visitorData.id}`
        });

        try {
          new window.QRCode(qrCodeRef.current, {
            text: qrData,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel.H
          });
        } catch (error) {
          console.error('QR Code generation error:', error);
          qrCodeRef.current.innerHTML = '<p style="color: red;">Error generating QR code</p>';
        }
      } else {
        setTimeout(() => attemptQRGeneration(attempts + 1), 100);
      }
    };

    setTimeout(() => attemptQRGeneration(), 100);
  };

  const downloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Visitor_QR_${currentQRData.id}_${currentQRData.name.replace(/\s+/g, '_')}.png`;
      link.href = url;
      link.click();
    }
  };

  const submitVisitor = () => {
    if (!formData.visitorName.trim()) {
      alert('Please fill in the visitor name');
      return;
    }
    
    const newVisitor = {
      id: visitors.length + 1,
      name: formData.visitorName,
      room: formData.roomNo || 'N/A',
      patient: formData.patientName || 'N/A',
      timeIn: formData.timeIn || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timeOut: null,
      contact: formData.contactNo || 'N/A',
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      photo: photoPreview
    };
    
    setVisitors(prev => [...prev, newVisitor]);
    setFormData({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
    setPhotoPreview(null);
    
    // Generate QR Code immediately after registration
    generateQRCode(newVisitor);
  };

  const cancelRegister = () => {
    setFormData({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
    setPhotoPreview(null);
    showView('dashboard');
  };

  const completedVisitors = visitors.filter(v => v.status === 'completed');
  
  const filteredRegisteredVisitors = visitors.filter(v => {
    if (!registeredSearchQuery) return true;
    const q = registeredSearchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.room.toLowerCase().includes(q) || v.patient.toLowerCase().includes(q) || v.contact.toLowerCase().includes(q);
  });

  const filteredHistoryVisitors = completedVisitors.filter(v => {
    if (!historySearchQuery) return true;
    const q = historySearchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.room.toLowerCase().includes(q) || v.patient.toLowerCase().includes(q) || v.date.includes(q);
  });

  const attendanceVisitors = visitors.filter(v => v.date === attendanceDate);

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd', fontSize: '1em', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'white' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: 'linear-gradient(135deg, #e8e0d4 0%, #d4c4b0 100%)' }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '40px' }}>
        <div style={{ flex: 1 }}>
          {/* QR Code Modal */}
          {showQRModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', borderRadius: '15px', padding: '40px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '3em', marginBottom: '20px' }}>✅</div>
                <h2 style={{ color: '#1a8f6f', marginBottom: '10px', fontSize: '2em' }}>Registration Successful!</h2>
                <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1em' }}>Visitor has been registered successfully</p>

                {currentQRData && (
                  <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left', marginBottom: '20px' }}>
                      <p style={{ margin: '5px 0' }}><strong>Name:</strong></p>
                      <p style={{ margin: '5px 0', color: '#1a8f6f' }}>{currentQRData.name}</p>
                      <p style={{ margin: '5px 0' }}><strong>Room:</strong></p>
                      <p style={{ margin: '5px 0', color: '#e74c3c', fontWeight: 'bold' }}>{currentQRData.room}</p>
                      <p style={{ margin: '5px 0' }}><strong>Patient:</strong></p>
                      <p style={{ margin: '5px 0' }}>{currentQRData.patient}</p>
                      <p style={{ margin: '5px 0' }}><strong>Contact:</strong></p>
                      <p style={{ margin: '5px 0' }}>{currentQRData.contact}</p>
                    </div>

                    <div ref={qrCodeRef} style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }} />

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={downloadQRCode} style={{ padding: '12px 20px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.background = '#157a5f'} onMouseOut={(e) => e.target.style.background = '#1a8f6f'}>📥 Download QR</button>
                      <button onClick={() => { setShowQRModal(false); showView('registered'); }} style={{ padding: '12px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.background = '#5a6268'} onMouseOut={(e) => e.target.style.background = '#6c757d'}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'dashboard' && (
            <div>
              <h1 style={{ fontSize: '2.5em', color: '#1a8f6f', marginBottom: '30px' }}>Dashboard</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '3em', marginBottom: '15px' }}>👥</div>
                  <h3 style={{ color: '#333', marginBottom: '10px' }}>Total Registered</h3>
                  <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#1a8f6f' }}>{visitors.length}</div>
                </div>
                <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '3em', marginBottom: '15px' }}>🟢</div>
                  <h3 style={{ color: '#333', marginBottom: '10px' }}>Active Visitors</h3>
                  <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#27ae60' }}>{visitors.filter(v => v.status === 'active').length}</div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'registered' && (
            <div>
              <input 
                type="text" 
                placeholder="Search registered visitors..." 
                value={registeredSearchQuery}
                onChange={(e) => setRegisteredSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1em', marginBottom: '20px' }}
              />
              
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '30px' }}>
                <p style={{ color: '#666', fontSize: '1.3em', margin: 0 }}>
                  <strong>Total Registered:</strong> <span style={{ color: '#1a8f6f', fontSize: '1.5em', fontWeight: 'bold' }}>{visitors.length}</span>
                </p>
              </div>

              {filteredRegisteredVisitors.length > 0 ? (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#1a8f6f', color: 'white' }}>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Photo</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Room</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Patient</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Contact</th>
                        <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                        <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: 'bold' }}>QR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegisteredVisitors.map((visitor, index) => (
                        <tr key={visitor.id} style={{ background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>
                            {visitor.photo ? (
                              <div style={{ width: '50px', height: '50px', border: '2px solid #1a8f6f', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={visitor.photo} alt={visitor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ width: '50px', height: '50px', background: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em' }}>👤</div>
                            )}
                          </td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>{visitor.name}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', color: '#e74c3c', fontWeight: 'bold' }}>{visitor.room}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>{visitor.patient}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>{visitor.contact}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold', background: visitor.status === 'active' ? '#d4edda' : '#cce5ff', color: visitor.status === 'active' ? '#155724' : '#004085' }}>
                              {visitor.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                            </span>
                          </td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'center' }}>
                            <button onClick={() => generateQRCode(visitor)} style={{ padding: '8px 15px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.9em', fontWeight: 'bold', cursor: 'pointer' }}>View QR</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '4em', marginBottom: '20px' }}>📝</div>
                  <p style={{ color: '#666', fontSize: '1.2em' }}>No registered visitors yet</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'history' && (
            <div>
              <input 
                type="text" 
                placeholder="Search history..." 
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1em', marginBottom: '20px' }}
              />

              {filteredHistoryVisitors.length > 0 ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {filteredHistoryVisitors.map((visitor) => (
                    <div key={visitor.id} style={{ background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderLeft: '5px solid #6c757d' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div>
                          <h3 style={{ color: '#333', marginBottom: '5px' }}>{visitor.name}</h3>
                          <p style={{ color: '#666', margin: 0 }}>Date: {visitor.date}</p>
                        </div>
                        <span style={{ padding: '6px 15px', borderRadius: '20px', fontSize: '0.9em', fontWeight: 'bold', background: '#cce5ff', color: '#004085' }}>COMPLETED</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <p style={{ margin: 0 }}><strong>Room:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{visitor.room}</span></p>
                        <p style={{ margin: 0 }}><strong>Patient:</strong> {visitor.patient}</p>
                        <p style={{ margin: 0 }}><strong>Time In:</strong> {visitor.timeIn}</p>
                        <p style={{ margin: 0 }}><strong>Time Out:</strong> {visitor.timeOut}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '4em', marginBottom: '20px' }}>📚</div>
                  <p style={{ color: '#666', fontSize: '1.2em' }}>No visitor history available</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'attendance' && (
            <div>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '1.1em' }}>Select Date:</label>
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '1em', width: '250px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: '#d4edda', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>✅</div>
                  <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>Total</h3>
                  <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#155724' }}>{attendanceVisitors.length}</div>
                </div>
                <div style={{ background: '#cce5ff', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>🟢</div>
                  <h3 style={{ color: '#004085', margin: '0 0 10px 0' }}>Active</h3>
                  <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#004085' }}>{attendanceVisitors.filter(v => v.status === 'active').length}</div>
                </div>
                <div style={{ background: '#f8d7da', padding: '25px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>🔴</div>
                  <h3 style={{ color: '#721c24', margin: '0 0 10px 0' }}>Completed</h3>
                  <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#721c24' }}>{attendanceVisitors.filter(v => v.status === 'completed').length}</div>
                </div>
              </div>

              {attendanceVisitors.length > 0 ? (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#1a8f6f', color: 'white' }}>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Room</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Patient</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Time In</th>
                        <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Time Out</th>
                        <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceVisitors.map((visitor, index) => (
                        <tr key={visitor.id} style={{ background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>{visitor.name}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', color: '#e74c3c', fontWeight: 'bold' }}>{visitor.room}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>{visitor.patient}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', color: '#27ae60', fontWeight: '500' }}>{visitor.timeIn}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef' }}>{visitor.timeOut || '-'}</td>
                          <td style={{ padding: '15px', borderBottom: '1px solid #e9ecef', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold', background: visitor.status === 'active' ? '#d4edda' : '#cce5ff', color: visitor.status === 'active' ? '#155724' : '#004085' }}>
                              {visitor.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '4em', marginBottom: '20px' }}>📊</div>
                  <p style={{ color: '#666', fontSize: '1.2em' }}>No attendance records for selected date</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'register' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h2 style={{ marginBottom: '25px', color: '#1a8f6f' }}>Register New Visitor</h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Visitor Name: *</label>
                  <input type="text" name="visitorName" value={formData.visitorName} onChange={handleInputChange} placeholder="Enter visitor's full name" style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Photo:</label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ ...inputStyle, padding: '10px' }} />
                      <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>Max size: 5MB</p>
                    </div>
                    {photoPreview && (
                      <div style={{ width: '100px', height: '100px', border: '2px solid #1a8f6f', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Room Number:</label>
                  <input type="text" name="roomNo" value={formData.roomNo} onChange={handleInputChange} placeholder="e.g. 102, 121" style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Patient Name:</label>
                  <input type="text" name="patientName" value={formData.patientName} onChange={handleInputChange} placeholder="Enter patient's name" style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Contact Number:</label>
                  <input type="tel" name="contactNo" value={formData.contactNo} onChange={handleInputChange} placeholder="e.g. 09123456789" style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Time In:</label>
                  <input type="time" name="timeIn" value={formData.timeIn} onChange={handleInputChange} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
                </div>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={submitVisitor} style={{ flex: 1, padding: '15px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.background = '#157a5f'} onMouseOut={(e) => e.target.style.background = '#1a8f6f'}>Register Visitor</button>
                  <button onClick={cancelRegister} style={{ flex: 1, padding: '15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.background = '#5a6268'} onMouseOut={(e) => e.target.style.background = '#6c757d'}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '280px', background: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <div onClick={() => showView('dashboard')} style={{ fontSize: '3em', textAlign: 'center', marginBottom: '30px', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'} onMouseOut={(e) => e.target.style.transform = 'scale(1)'}>🏠</div>
          
          <div onClick={() => showView('dashboard')} style={{ padding: '15px', marginBottom: '10px', background: currentView === 'dashboard' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'dashboard' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Dashboard</div>
          
          <div onClick={() => showView('registered')} style={{ padding: '15px', marginBottom: '10px', background: currentView === 'registered' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'registered' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Registered Visitor</div>
          
          <div onClick={() => showView('history')} style={{ padding: '15px', marginBottom: '10px', background: currentView === 'history' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'history' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Visitor's History</div>
          
          <div onClick={() => showView('attendance')} style={{ padding: '15px', marginBottom: '25px', background: currentView === 'attendance' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'attendance' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Attendance</div>
          
          <button onClick={() => showView('register')} style={{ width: '100%', padding: '20px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.3em', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(26,143,111,0.3)' }} onMouseOver={(e) => { e.target.style.background = '#157a5f'; e.target.style.transform = 'scale(1.05)'; }} onMouseOut={(e) => { e.target.style.background = '#1a8f6f'; e.target.style.transform = 'scale(1)'; }}>
            REGISTER <span style={{ fontSize: '1.2em' }}></span>
          </button>
        </div>
      </div>
    </div>
  );
}