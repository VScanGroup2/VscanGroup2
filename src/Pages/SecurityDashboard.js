import React, { useState, useEffect, useRef } from 'react';
import bgImage from '../Styles/bg.png';
import { listenVisitorsRealtime, updateVisitor } from '../lib/firestore';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

export default function SecurityDashboard({ onLogout }) {
  const [visitors, setVisitors] = useState([]);
  const [securityTab, setSecurityTab] = useState('active');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [qrScanInput, setQrScanInput] = useState('');
  const [scannerBuffer, setScannerBuffer] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const scannerInputRef = useRef(null);

  // Update current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Format date as MM-DD-YY
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      setCurrentDate(`${month}-${day}-${year}`);
      
      // Format time as HH:MM:SS AM/PM
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${displayHours}:${minutes}:${seconds} ${ampm}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen to visitors
  useEffect(() => {
    const unsub = listenVisitorsRealtime((data) => {
      const normalized = data.map(v => {
        let date = v.registrationDate || '';
        if (!date && v.timestamp) {
          date = new Date(v.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        }
        if (!date) {
          date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        }

        const statusRaw = (v.status || '').toLowerCase();
        const status = statusRaw === 'checked-in' || statusRaw === 'active' ? 'active'
          : statusRaw === 'discharged' || statusRaw === 'checked-out' ? 'discharged'
          : 'inactive';

        return {
          id: v.id,
          name: v.visitorName || v.name || '',
          room: v.roomNumber || v.room || 'N/A',
          patient: v.patientName || v.patient || 'N/A',
          timeIn: v.checkInTime || v.timeIn || '',
          timeOut: v.checkOutTime || v.timeOut || null,
          contact: v.contactNumber || v.contact || 'N/A',
          date,
          status,
          photo: v.photoUrl || v.photo || null
        };
      });
      setVisitors(normalized);
    });

    return () => {
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, []);

  // Auto-activate USB scanner
  useEffect(() => {
    setScannerBuffer('');
    setScannerActive(true);
    setTimeout(() => {
      if (scannerInputRef.current) {
        scannerInputRef.current.focus();
      }
    }, 100);
  }, []);

  // Handle scanner key input
  useEffect(() => {
    const handleScannerKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const data = scannerBuffer;
        setScannerBuffer('');
        parseQrString(data);
        // keep input focused for next scan
        setTimeout(() => scannerInputRef.current && scannerInputRef.current.focus(), 50);
      }
    };

    if (scannerActive && scannerInputRef.current) {
      scannerInputRef.current.addEventListener('keydown', handleScannerKeyDown);
    }

    return () => {
      if (scannerInputRef.current) {
        scannerInputRef.current.removeEventListener('keydown', handleScannerKeyDown);
      }
    };
  }, [scannerActive, scannerBuffer]);

  // Parse QR/string from scanner and load visitor info
  const parseQrString = (raw) => {
    try {
      if (!raw || !raw.trim()) return false;
      const trimmed = raw.trim();
      let qrData;
      try {
        qrData = JSON.parse(trimmed);
      } catch (e) {
        // Not JSON — treat as ID lookup
        const visitor = visitors.find(v => v.id === trimmed || v.id === trimmed.replace(/\r|\n/g, ''));
        if (visitor) {
          if (visitor.status === 'active') {
            // Discharge the visitor
            const now = new Date();
            const checkOutTime = now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
            
            handleCheckOut(visitor.id, checkOutTime);
            return true;
          } else {
            setMessage({ type: 'info', text: 'Visitor is already discharged.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return true;
          }
        }
        setMessage({ type: 'error', text: 'Scanned ID not found.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return false;
      }

      if (qrData && (qrData.id || qrData.name)) {
        const visitor = visitors.find(v => v.id === qrData.id);
        if (visitor) {
          if (visitor.status === 'active') {
            // Discharge the visitor
            const now = new Date();
            const checkOutTime = now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
            
            handleCheckOut(visitor.id, checkOutTime);
            return true;
          } else {
            setMessage({ type: 'info', text: 'Visitor is already discharged.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return true;
          }
        }
        setMessage({ type: 'error', text: 'Visitor not found in the system.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return false;
      }
    } catch (err) {
      console.error('parseQrString error', err);
    }
    setMessage({ type: 'error', text: 'Unable to parse scanned data.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    return false;
  }

  const handleCheckOut = async (visitorId, checkOutTime) => {
    try {
      const now = new Date();
      const time = checkOutTime || now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const visitor = visitors.find(v => v.id === visitorId);

      await updateVisitor(visitorId, {
        checkOutTime: time,
        status: 'discharged'
      });

      setMessage({ type: 'success', text: `${visitor.name} has been checked out successfully at ${time}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error checking out visitor:', err);
      setMessage({ type: 'error', text: 'Error checking out visitor. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setCameraError('');
        scanQRCode();
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const scanQRCode = () => {
    scanIntervalRef.current = setInterval(() => {
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code) {
          parseQrString(code.data);
          stopCamera();
        }
      }
    }, 200);
  };

  const filteredVisitors = visitors.filter(v => {
    const q = searchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || 
           v.room.toLowerCase().includes(q) || 
           v.patient.toLowerCase().includes(q) ||
           v.contact.toLowerCase().includes(q);
  });

  const activeVisitors = filteredVisitors.filter(v => v.status === 'active');
  const dischargedVisitors = filteredVisitors.filter(v => v.status === 'discharged');

  const inputStyle = {
    padding: '10px 12px',
    fontSize: '1em',
    border: '1px solid #ddd',
    borderRadius: '6px',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif'
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    onLogout();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 40px)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ color: '#dc3545', margin: '0 0 5px 0', fontSize: '1.8em', fontWeight: 'bold' }}>🛡️ SECURITY PERSONNEL DASHBOARD</h1>
                <div style={{ color: '#666', fontSize: '0.95em' }}>
                  <span>{currentDate}</span> | <span>{currentTime}</span>
                </div>
              </div>
              <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Logout
              </button>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div style={{ padding: '12px', borderRadius: '8px', background: message.type === 'success' ? '#d4edda' : message.type === 'error' ? '#f8d7da' : '#cfe2ff', color: message.type === 'success' ? '#155724' : message.type === 'error' ? '#721c24' : '#084298', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : message.type === 'error' ? '#f5c6cb' : '#b6d4fe'}`, fontSize: '1em' }}>
              {message.text}
            </div>
          )}

          {/* QR Scanner Section */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a8f6f', marginTop: 0 }}>Scan Visitor QR Code</h2>
            <input
              ref={scannerInputRef}
              type="text"
              value={qrScanInput}
              onChange={(e) => setQrScanInput(e.target.value)}
              placeholder="USB Scanner will input here..."
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button
                onClick={startCamera}
                disabled={isCameraActive}
                style={{ flex: 1, padding: '10px', background: isCameraActive ? '#ccc' : '#1a8f6f', color: 'white', border: 'none', borderRadius: '6px', cursor: isCameraActive ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {isCameraActive ? 'Camera Active' : 'Start Camera Scan'}
              </button>
              <button
                onClick={stopCamera}
                disabled={!isCameraActive}
                style={{ flex: 1, padding: '10px', background: !isCameraActive ? '#ccc' : '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: !isCameraActive ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                Stop Camera
              </button>
            </div>
            {isCameraActive && (
              <div style={{ marginBottom: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  style={{ width: '100%', display: 'block', borderRadius: '6px' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}
            {cameraError && <div style={{ color: '#dc3545', fontSize: '0.9em' }}>{cameraError}</div>}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name, room, patient, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, padding: '12px' }}
          />

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #ddd' }}>
            <button
              onClick={() => setSecurityTab('active')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '1em',
                fontWeight: securityTab === 'active' ? '700' : '500',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: securityTab === 'active' ? '4px solid #1a8f6f' : 'none',
                color: securityTab === 'active' ? '#1a8f6f' : '#666',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Active Visitors ({activeVisitors.length})
            </button>
            <button
              onClick={() => setSecurityTab('discharged')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '1em',
                fontWeight: securityTab === 'discharged' ? '700' : '500',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: securityTab === 'discharged' ? '4px solid #dc3545' : 'none',
                color: securityTab === 'discharged' ? '#dc3545' : '#666',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Discharged ({dischargedVisitors.length})
            </button>
          </div>

          {/* Active Visitors Table */}
          {securityTab === 'active' && (
            <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead style={{ background: '#d4edda', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Room</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Patient</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeVisitors.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #eee' }} onMouseOver={(e) => e.currentTarget.style.background = '#f0f8f5'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 8px' }}>{v.name}</td>
                      <td style={{ padding: '10px 8px' }}>{v.room}</td>
                      <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                      <td style={{ padding: '10px 8px' }}>{v.contact}</td>
                      <td style={{ padding: '10px 8px' }}>{v.timeIn}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <button
                          onClick={() => handleCheckOut(v.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#1a8f6f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85em'
                          }}
                        >
                          Check Out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activeVisitors.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No active visitors</div>
              )}
            </div>
          )}

          {/* Discharged Visitors Table */}
          {securityTab === 'discharged' && (
            <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead style={{ background: '#f8d7da', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Room</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Patient</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time Out</th>
                  </tr>
                </thead>
                <tbody>
                  {dischargedVisitors.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #eee' }} onMouseOver={(e) => e.currentTarget.style.background = '#fdf7f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 8px' }}>{v.name}</td>
                      <td style={{ padding: '10px 8px' }}>{v.room}</td>
                      <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                      <td style={{ padding: '10px 8px' }}>{v.timeIn}</td>
                      <td style={{ padding: '10px 8px' }}>{v.timeOut || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dischargedVisitors.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No discharged visitors</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
