import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import QRCodeLib from 'qrcode';
import bgImage from '../Styles/bg.png';

export default function Dashboard({ onLogout }) {
  const [visitors, setVisitors] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState('');
  const [formData, setFormData] = useState({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredSearchQuery, setRegisteredSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [lastQRCode, setLastQRCode] = useState(null);
  const [lastVisitorId, setLastVisitorId] = useState(null);
  const [lastQRCodeDataUrl, setLastQRCodeDataUrl] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

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
    const file = e.target.files && e.target.files[0];
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

  const submitVisitor = async () => {
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
    // prepare QR data: encode visitor id, name, room, and date
    const qrData = JSON.stringify({ id: newVisitor.id, name: newVisitor.name, room: newVisitor.room, date: newVisitor.date });
    setLastQRCode(qrData);
    setLastVisitorId(newVisitor.id);
    // also generate a PNG data URL for more reliable rendering and download
    try {
      const dataUrl = await QRCodeLib.toDataURL(qrData, { margin: 1, width: 300 });
      setLastQRCodeDataUrl(dataUrl);
      setShowQRModal(true);
    } catch (err) {
      console.warn('QR generation failed', err);
      setLastQRCodeDataUrl(null);
    }
    setFormData({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
    setPhotoPreview(null);
    // show registered view and display the QR for the latest registration
    showView('registered');
  };

  const cancelRegister = () => {
    setFormData({ visitorName: '', roomNo: '', patientName: '', contactNo: '', timeIn: '', photo: null });
    setPhotoPreview(null);
    showView('dashboard');
  };

  const downloadQRCode = () => {
    if (lastQRCodeDataUrl) {
      const a = document.createElement('a');
      a.href = lastQRCodeDataUrl;
      a.download = `visitor-${lastVisitorId}.png`;
      a.click();
      return;
    }

    // fallback: try to download canvas if present
    try {
      const canvas = document.querySelector('#latest-qr-canvas canvas');
      if (!canvas) return alert('QR canvas not found');
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `visitor-${lastVisitorId}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      alert('Unable to download QR image');
    }
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
  const filteredHistoryVisitors = visitors.filter(v => {
    const q = historySearchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.room.toLowerCase().includes(q) || v.patient.toLowerCase().includes(q) || v.date.toLowerCase().includes(q);
  });
  const attendanceVisitors = attendanceDate ? visitors.filter(v => v.date === attendanceDate) : visitors;

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd', fontSize: '1em', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'white' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div style={{ background: '#1a8f6f', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', flex: 1, fontSize: '2em', fontWeight: 'bold', letterSpacing: '2px' }}>IGNACIO LACSON ARROYO MEMORIAL HOSPITAL</div>
        <button onClick={onLogout} style={{ padding: '10px 25px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      {showQRModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 10, width: 360, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginTop: 0 }}>Registration Successful</h3>
            <p style={{ margin: '8px 0 12px' }}>Visitor #{lastVisitorId} — scan this QR</p>
            <div style={{ marginBottom: 12 }}>
              {lastQRCodeDataUrl ? (
                <img src={lastQRCodeDataUrl} alt={`QR-${lastVisitorId}`} style={{ width: 200, height: 200 }} />
              ) : (
                <div id="latest-qr-canvas" style={{ display: 'inline-block', padding: 8, background: 'white', borderRadius: 8 }}>
                  <QRCodeCanvas value={lastQRCode} size={160} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={downloadQRCode} style={{ padding: '8px 12px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: 6 }}>Download QR</button>
              <button onClick={() => setShowQRModal(false)} style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '20px', gap: '20px' }}>
        <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#1a8f6f', marginBottom: '20px' }}>{currentView === 'dashboard' ? 'DASHBOARD' : currentView === 'visitorInfo' ? "VISITOR'S INFORMATION" : currentView === 'registered' ? 'REGISTERED VISITOR' : currentView === 'history' ? "VISITOR'S HISTORY" : currentView === 'attendance' ? 'ATTENDANCE' : currentView === 'register' ? 'REGISTER NEW VISITOR' : 'DASHBOARD'}</h1>

          {currentView === 'dashboard' && (
            <>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.1em', color: '#666' }}>TOTAL VISITORS</div>
                  <div style={{ fontSize: '2em', color: '#1a8f6f', fontWeight: '700' }}>{activeVisitors.length}</div>
                </div>
                <div style={{ background: '#1a8f6f', color: 'white', padding: '15px 25px', borderRadius: '8px', fontWeight: '700' }}>DATE: {currentDate}</div>
              </div>

              <div style={{ overflow: 'auto', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f1f1f1' }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Room</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Patient</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Time In</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVisitors.map((v) => (
                      <tr key={v.id}>
                        <td style={{ padding: '10px' }}>{v.name}</td>
                        <td style={{ padding: '10px' }}>{v.room}</td>
                        <td style={{ padding: '10px' }}>{v.patient}</td>
                        <td style={{ padding: '10px' }}>{v.timeIn}</td>
                        <td style={{ padding: '10px' }}>{v.contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {currentView === 'visitorInfo' && (
            <div>
              <input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div>{filteredVisitors.map(v => (
                <div key={v.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 700 }}>{v.name}</div>
                  <div style={{ color: '#666' }}>{v.patient} — {v.room} — {v.date}</div>
                </div>
              ))}</div>
            </div>
          )}

          {currentView === 'registered' && (
            <div>
              {lastQRCode && (
                <div style={{ marginBottom: 16, padding: 12, border: '1px dashed #ddd', borderRadius: 8, background: '#fbfbfb' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>QR for latest registration (visitor #{lastVisitorId})</div>
                  <div id="latest-qr-canvas" style={{ display: 'inline-block', padding: 8, background: 'white', borderRadius: 8 }}>
                    {/* Prefer the generated PNG (more portable). Keep canvas as fallback. */}
                    {lastQRCodeDataUrl ? (
                      <img src={lastQRCodeDataUrl} alt={`QR-${lastVisitorId}`} style={{ width: 160, height: 160, display: 'block' }} />
                    ) : (
                      <QRCodeCanvas value={lastQRCode} size={160} />
                    )}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                      try {
                        const canvas = document.querySelector('#latest-qr-canvas canvas');
                        if (!canvas) return alert('QR canvas not found');
                        const url = canvas.toDataURL('image/png');
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `visitor-${lastVisitorId}.png`;
                        a.click();
                      } catch (err) {
                        console.error(err);
                        alert('Unable to download QR image');
                      }
                    }} style={{ padding: '8px 12px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: 6 }}>Download QR</button>
                    <button onClick={() => setLastQRCode(null)} style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6 }}>Hide QR</button>
                  </div>
                </div>
              )}
              <input placeholder="Search registered..." value={registeredSearchQuery} onChange={(e) => setRegisteredSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div>{filteredRegisteredVisitors.map(v => (
                <div key={v.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{v.name} — {v.room} — {v.date}</div>
              ))}</div>
            </div>
          )}

          {currentView === 'history' && (
            <div>
              <input placeholder="Search history..." value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div>{filteredHistoryVisitors.map(v => (
                <div key={v.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{v.name} — {v.room} — {v.date}</div>
              ))}</div>
            </div>
          )}

          {currentView === 'attendance' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Select Date</label>
              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />

              <div style={{ marginTop: '12px' }}>{attendanceVisitors.map(v => (
                <div key={v.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{v.name} — {v.room} — {v.timeIn} — {v.status}</div>
              ))}</div>
            </div>
          )}

          {currentView === 'register' && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ marginBottom: 12 }}>
                <label>Visitor Name</label>
                <input name="visitorName" value={formData.visitorName} onChange={handleInputChange} style={{ ...inputStyle, marginTop: 6 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Room No</label>
                  <input name="roomNo" value={formData.roomNo} onChange={handleInputChange} style={{ ...inputStyle, marginTop: 6 }} />
                </div>
                <div>
                  <label>Patient</label>
                  <input name="patientName" value={formData.patientName} onChange={handleInputChange} style={{ ...inputStyle, marginTop: 6 }} />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Contact</label>
                <input name="contactNo" value={formData.contactNo} onChange={handleInputChange} style={{ ...inputStyle, marginTop: 6 }} />
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ marginTop: 6 }} />
                {photoPreview && <div style={{ width: 90, height: 90, marginTop: 8 }}><img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={submitVisitor} style={{ padding: '10px 12px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: 6 }}>Register</button>
                <button onClick={cancelRegister} style={{ padding: '10px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 260, background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
          <div onClick={() => showView('dashboard')} style={{ fontSize: 28, textAlign: 'center', marginBottom: 12, cursor: 'pointer' }}>🏠</div>
          <div onClick={() => showView('dashboard')} style={{ padding: 10, marginBottom: 8, background: currentView === 'dashboard' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'dashboard' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Dashboard</div>
          <div onClick={() => showView('visitorInfo')} style={{ padding: 10, marginBottom: 8, background: currentView === 'visitorInfo' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'visitorInfo' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Visitor's Information</div>
          <div onClick={() => showView('registered')} style={{ padding: 10, marginBottom: 8, background: currentView === 'registered' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'registered' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Registered Visitor</div>
          <div onClick={() => showView('history')} style={{ padding: 10, marginBottom: 8, background: currentView === 'history' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'history' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Visitor's History</div>
          <div onClick={() => showView('attendance')} style={{ padding: 10, marginBottom: 16, background: currentView === 'attendance' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'attendance' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Attendance</div>
          <button onClick={() => showView('register')} style={{ width: '100%', padding: 12, background: '#1a8f6f', color: 'white', border: 'none', borderRadius: 30 }}>REGISTER 👆</button>
        </div>
      </div>
    </div>
  );
}
