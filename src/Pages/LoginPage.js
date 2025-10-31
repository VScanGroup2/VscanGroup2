import React, { useState, useEffect } from 'react';
import '../Styles/LoginPage.css';
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <Dashboard onLogout={() => setIsLoggedIn(false)} />;
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

function Dashboard({ onLogout }) {
  const [visitors, setVisitors] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState('');
  const [formData, setFormData] = useState({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredSearchQuery, setRegisteredSearchQuery] = useState('');

  useEffect(() => {
    const sample = [
      { id: 1, name: 'Steven Perfas', room: '102', patient: 'Maria Santos', timeIn: '9:00AM', timeOut: null, contact: '09326789902', date: new Date().toISOString().split('T')[0], status: 'active' },
      { id: 2, name: 'Rino Villar', room: '121', patient: 'Juan dela Cruz', timeIn: '3:00PM', timeOut: null, contact: '09326789989', date: new Date().toISOString().split('T')[0], status: 'active' }
    ];
    setVisitors(sample);
    
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    setCurrentDate(`${month}-${day}-${year}`);
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
    showView('dashboard');
    alert('Visitor registered successfully!');
  };

  const cancelRegister = () => {
    setFormData({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
    setPhotoPreview(null);
    showView('dashboard');
  };

  const activeVisitors = visitors.filter(v => v.status === 'active');
  const filteredVisitors = visitors.filter(v => {
    const q = searchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.room.toLowerCase().includes(q) || v.patient.toLowerCase().includes(q);
  });
  const filteredRegisteredVisitors = visitors.filter(v => {
    const q = registeredSearchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.room.toLowerCase().includes(q) || v.patient.toLowerCase().includes(q) || v.contact.toLowerCase().includes(q);
  });

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd', fontSize: '1em', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'white' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: 'linear-gradient(135deg, #e8e0d4 0%, #d4c4b0 100%)' }}>
      <div style={{ background: '#1a8f6f', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', flex: 1, fontSize: '2em', fontWeight: 'bold', letterSpacing: '2px' }}>IGNACIO LACSON ARROYO MEMORIAL HOSPITAL</div>
        <button onClick={onLogout} style={{ padding: '10px 25px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.background = '#c82333'} onMouseOut={(e) => e.target.style.background = '#dc3545'}>Logout</button>
      </div>
      
      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '20px', gap: '20px' }}>
        <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#1a8f6f', marginBottom: '30px', fontSize: '2.5em' }}>
            {currentView === 'dashboard' ? 'DASHBOARD' : currentView === 'visitorInfo' ? "VISITOR'S INFORMATION" : currentView === 'registered' ? 'REGISTERED VISITOR' : currentView === 'history' ? "VISITOR'S HISTORY" : currentView === 'attendance' ? 'ATTENDANCE' : currentView === 'register' ? 'REGISTER NEW VISITOR' : 'DASHBOARD'}
          </h1>

          {currentView === 'dashboard' && (
            <>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center' }}>
                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '10px', flex: 1, display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '3em' }}>👥</div>
                  <div>
                    <h3 style={{ color: '#666', marginBottom: '5px', fontSize: '0.9em' }}>TOTAL VISITORS</h3>
                    <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#1a8f6f' }}>{activeVisitors.length}</div>
                  </div>
                </div>
                <div style={{ background: '#1a8f6f', color: 'white', padding: '20px 40px', borderRadius: '10px', fontSize: '1.3em', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>DATE: {currentDate}</div>
              </div>

              <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                      <th style={{ padding: '20px 15px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Name</th>
                      <th style={{ padding: '20px 15px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Room no.</th>
                      <th style={{ padding: '20px 15px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Patient Name</th>
                      <th style={{ padding: '20px 15px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Time In/Out</th>
                      <th style={{ padding: '20px 15px', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Contact No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVisitors.map((visitor, index) => (
                      <tr key={visitor.id} style={{ background: index % 2 === 0 ? 'white' : '#f8f9fa', transition: 'background 0.2s' }}>
                        <td style={{ padding: '18px 15px', borderBottom: '1px solid #e9ecef', fontWeight: '600', color: '#2c3e50' }}>{visitor.name}</td>
                        <td style={{ padding: '18px 15px', borderBottom: '1px solid #e9ecef', color: '#e74c3c', fontWeight: 'bold', textAlign: 'center' }}>{visitor.room}</td>
                        <td style={{ padding: '18px 15px', borderBottom: '1px solid #e9ecef', color: '#333' }}>{visitor.patient}</td>
                        <td style={{ padding: '18px 15px', borderBottom: '1px solid #e9ecef', color: '#27ae60', fontWeight: '500' }}>{visitor.timeIn}</td>
                        <td style={{ padding: '18px 15px', borderBottom: '1px solid #e9ecef', color: '#333' }}>{visitor.contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {currentView === 'register' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '10px' }}>
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
                      <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>Max size: 5MB (JPG, PNG, GIF)</p>
                    </div>
                    {photoPreview && (
                      <div style={{ width: '100px', height: '100px', border: '2px solid #1a8f6f', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Room Number: *</label>
                  <input type="text" name="roomNo" value={formData.roomNo} onChange={handleInputChange} placeholder="e.g. 102, 121" style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Patient Name: *</label>
                  <input type="text" name="patientName" value={formData.patientName} onChange={handleInputChange} placeholder="Enter patient's name" style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#1a8f6f'} onBlur={(e) => e.target.style.borderColor = '#ddd'} />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Contact Number: *</label>
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
          
          <div onClick={() => showView('visitorInfo')} style={{ padding: '15px', marginBottom: '10px', background: currentView === 'visitorInfo' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'visitorInfo' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Visitor's Information</div>
          
          <div onClick={() => showView('registered')} style={{ padding: '15px', marginBottom: '10px', background: currentView === 'registered' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'registered' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Registered Visitor</div>
          
          <div onClick={() => showView('history')} style={{ padding: '15px', marginBottom: '10px', background: currentView === 'history' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'history' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Visitor's History</div>
          
          <div onClick={() => showView('attendance')} style={{ padding: '15px', marginBottom: '25px', background: currentView === 'attendance' ? '#1a8f6f' : '#f8f9fa', color: currentView === 'attendance' ? 'white' : '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s' }}>Attendance ➜</div>
          
          <button onClick={() => showView('register')} style={{ width: '100%', padding: '20px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.3em', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(26,143,111,0.3)' }} onMouseOver={(e) => { e.target.style.background = '#157a5f'; e.target.style.transform = 'scale(1.05)'; }} onMouseOut={(e) => { e.target.style.background = '#1a8f6f'; e.target.style.transform = 'scale(1)'; }}>
            REGISTER <span style={{ fontSize: '1.2em' }}>👆</span>
          </button>
        </div>
      </div>
    </div>
  );
}