import React, { useState, useEffect, useRef } from 'react';
import bgImage from '../Styles/bg.png';
import { listenVisitorsRealtime, updateVisitor, getAllAttendance, recordAttendance, recordCheckout } from '../lib/firestore';
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
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [dailyLogDate, setDailyLogDate] = useState('');
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
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
      const formattedDate = `${month}-${day}-${year}`;
      setCurrentDate(formattedDate);
      
      // Set daily log date to current date on mount
      if (!dailyLogDate) {
        setDailyLogDate(formattedDate);
      }
      
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
  }, [dailyLogDate]);

  // Listen to visitors
  useEffect(() => {
    const unsub = listenVisitorsRealtime((data) => {
      // Use only real Firestore data
      const allData = data;

      const normalized = allData.map(v => {
        let date = v.registrationDate || '';
        if (!date && v.timestamp) {
          date = new Date(v.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        }
        if (!date) {
          date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        }

        // Get checkout date if available
        let checkOutDate = v.checkOutDate || '';
        if (!checkOutDate && v.timeOut) {
          // If no checkOutDate but has timeOut, use the check-in date
          checkOutDate = date;
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
          checkOutDate,
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

  // Fetch all attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      const records = await getAllAttendance();
      setAllAttendanceRecords(records);
    };
    fetchAttendance();
  }, []);

  // Refresh attendance records (used after check-in/check-out)
  const refreshAttendanceRecords = async () => {
    const records = await getAllAttendance();
    setAllAttendanceRecords(records);
  };

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
      let visitorId = null;

      try {
        qrData = JSON.parse(trimmed);
        visitorId = qrData.id;
      } catch (e) {
        // Not JSON — treat as ID lookup
        visitorId = trimmed.replace(/\r|\n/g, '');
      }

      if (!visitorId) {
        setMessage({ type: 'error', text: 'Unable to parse scanned data.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return false;
      }

      const visitor = visitors.find(v => v.id === visitorId);

      if (!visitor) {
        // Visitor doesn't exist - need to create new check-in
        // But we can't create from just ID, need full visitor data
        setMessage({ type: 'error', text: 'Visitor not found in system. Please register first.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return false;
      }

      setSelectedVisitor(visitor);

      if (visitor.status === 'active') {
        // Second swipe - Check out the visitor
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
        // First swipe - Check in the visitor
        const now = new Date();
        const checkInTime = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        
        handleCheckIn(visitor.id, checkInTime);
        return true;
      }
    } catch (err) {
      console.error('parseQrString error', err);
    }
    setMessage({ type: 'error', text: 'Unable to parse scanned data.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    return false;
  }

  const handleCheckIn = async (visitorId, checkInTime) => {
    try {
      const now = new Date();
      const time = checkInTime || now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Record check-in date
      const checkInDate = now.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });

      const visitor = visitors.find(v => v.id === visitorId);

      await updateVisitor(visitorId, {
        checkInTime: time,
        registrationDate: checkInDate,
        status: 'active',
        checkOutTime: null,
        checkOutDate: null
      });

      // Record attendance event (check-in)
      await recordAttendance(visitorId, visitor.name, checkInDate, time);
      console.log('[SecurityDashboard] Check-in attendance recorded for:', visitor.name);

      // Refresh attendance records to show in history
      await refreshAttendanceRecords();

      setMessage({ type: 'success', text: `${visitor.name} has been timed in at ${time}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error timing in visitor:', err);
      setMessage({ type: 'error', text: 'Error timing in visitor. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleCheckOut = async (visitorId, checkOutTime) => {
    try {
      const now = new Date();
      const time = checkOutTime || now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Record checkout date
      const checkOutDate = now.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });

      const visitor = visitors.find(v => v.id === visitorId);

      // Record time-out but keep status as active (visitor can check back in)
      await updateVisitor(visitorId, {
        checkOutTime: time,
        checkOutDate: checkOutDate
      });

      // Record checkout event (time-out - second swipe)
      await recordCheckout(visitorId, visitor.name, checkOutDate, time);
      console.log('[SecurityDashboard] Checkout attendance recorded for:', visitor.name);

      // Refresh attendance records to show in history
      await refreshAttendanceRecords();

      setMessage({ type: 'success', text: `${visitor.name} has been timed out at ${time}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error timing out visitor:', err);
      setMessage({ type: 'error', text: 'Error timing out visitor. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDischarge = async (visitorId) => {
    try {
      const visitor = visitors.find(v => v.id === visitorId);

      // Create a visitation record
      const visitationRecord = {
        checkInDate: visitor.date,
        checkInTime: visitor.timeIn,
        checkOutDate: visitor.checkOutDate || visitor.date,
        checkOutTime: visitor.timeOut || 'N/A',
        timestamp: new Date().toISOString()
      };

      // Add to visitation history array
      const currentVisitations = visitor.visitations || [];
      const updatedVisitations = [...currentVisitations, visitationRecord];

      await updateVisitor(visitorId, {
        status: 'discharged',
        visitations: updatedVisitations
      });

      setMessage({ type: 'success', text: `${visitor.name} has been discharged successfully` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error discharging visitor:', err);
      setMessage({ type: 'error', text: 'Error discharging visitor. Please try again.' });
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
        {/* Left Sidebar - Visitor Details */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {selectedVisitor ? (
            <>
              {/* Visitor Photo */}
              <div style={{ background: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                {selectedVisitor.photo ? (
                  <img 
                    src={selectedVisitor.photo} 
                    alt={selectedVisitor.name} 
                    style={{ width: '100%', height: '180px', borderRadius: '8px', objectFit: 'cover', marginBottom: '10px' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '180px', borderRadius: '8px', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', color: '#999', fontSize: '3em' }}>
                    
                  </div>
                )}
                <button 
                  onClick={() => setSelectedVisitor(null)}
                  style={{ width: '100%', padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}
                >
                  Clear
                </button>
              </div>

              {/* Visitor Details Card */}
              <div style={{ background: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flex: 1, overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1a8f6f', fontSize: '1.1em', borderBottom: '2px solid #1a8f6f', paddingBottom: '8px' }}>Visitor Information</h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>ID</div>
                  <div style={{ fontSize: '0.95em', fontWeight: 'bold', color: '#1a8f6f' }}>{selectedVisitor.id}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Name</div>
                  <div style={{ fontSize: '0.95em', fontWeight: 'bold', color: '#333' }}>{selectedVisitor.name}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Room</div>
                  <div style={{ fontSize: '0.95em', color: '#333' }}>{selectedVisitor.room}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Patient</div>
                  <div style={{ fontSize: '0.95em', color: '#333' }}>{selectedVisitor.patient}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Contact</div>
                  <div style={{ fontSize: '0.95em', color: '#333' }}>{selectedVisitor.contact}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Date</div>
                  <div style={{ fontSize: '0.95em', color: '#333' }}>{selectedVisitor.date}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Time In</div>
                  <div style={{ fontSize: '0.95em', color: '#155724', fontWeight: '600' }}>{selectedVisitor.timeIn}</div>
                </div>

                {selectedVisitor.timeOut && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Time Out</div>
                    <div style={{ fontSize: '0.95em', color: '#721c24', fontWeight: '600' }}>{selectedVisitor.timeOut}</div>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Status</div>
                  <div style={{ fontSize: '0.95em', fontWeight: '600', padding: '4px 8px', borderRadius: '4px', textAlign: 'center', background: selectedVisitor.status === 'active' ? '#d4edda' : '#f8d7da', color: selectedVisitor.status === 'active' ? '#155724' : '#721c24' }}>
                    {selectedVisitor.status === 'active' ? 'Active' : 'Discharged'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              <div style={{ fontSize: '3em', marginBottom: '10px' }}></div>
              <div style={{ fontSize: '0.95em' }}>Scan a visitor</div>
              <div style={{ fontSize: '0.85em', marginTop: '5px' }}>ID or QR code to view</div>
              <div style={{ fontSize: '0.85em' }}>visitor details</div>
            </div>
          )}
        </div>

        {/* Right Side - Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ color: '#dc3545', margin: '0 0 5px 0', fontSize: '1.8em', fontWeight: 'bold' }}>SECURITY PERSONNEL DASHBOARD</h1>
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

          {/* Hidden input to receive USB scanner keyboard-wedge input */}
          <input
            ref={scannerInputRef}
            value={scannerBuffer}
            onChange={(e) => setScannerBuffer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const data = scannerBuffer;
                setScannerBuffer('');
                parseQrString(data);
                setTimeout(() => scannerInputRef.current && scannerInputRef.current.focus(), 50);
              }
            }}
            style={{ position: 'absolute', left: -9999, top: 'auto' }}
            aria-hidden="true"
          />

          {/* QR Scanner Section */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a8f6f', marginTop: 0 }}>USB Scanner</h2>
            
            {!isCameraActive ? (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '18px', 
                borderRadius: '8px', 
                border: '2px dashed #1a8f6f',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '3.2em', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '1em', color: '#666', marginBottom: '12px', lineHeight: '1.4' }}>Ready to scan</div>
                <button 
                  onClick={() => {
                    setScannerBuffer('');
                    setScannerActive(true);
                    setTimeout(() => scannerInputRef.current && scannerInputRef.current.focus(), 50);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#1a8f6f', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.95em',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 6px rgba(26, 143, 111, 0.2)'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#158f6f'}
                  onMouseOut={(e) => e.target.style.background = '#1a8f6f'}
                >
                  ACTIVATE
                </button>
              </div>
            ) : (
              <div style={{ 
                marginBottom: '12px',
                position: 'relative'
              }}>
                <video 
                  ref={videoRef}
                  style={{ 
                    width: '100%', 
                    height: '280px',
                    borderRadius: '8px', 
                    border: '3px solid #1a8f6f',
                    display: 'block',
                    background: '#000',
                    objectFit: 'cover',
                    boxShadow: '0 2px 8px rgba(26, 143, 111, 0.15)'
                  }}
                  autoPlay
                  playsInline
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  border: '3px solid rgba(26, 143, 111, 0.5)',
                  borderRadius: '8px'
                }} />
                <button 
                  onClick={stopCamera}
                  style={{ 
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    padding: '8px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.85em'
                  }}
                >
                  STOP
                </button>
              </div>
            )}
            {cameraError && <div style={{ color: '#dc3545', fontSize: '0.9em', marginTop: '12px' }}>{cameraError}</div>}
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
            <button
              onClick={() => setSecurityTab('history')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '1em',
                fontWeight: securityTab === 'history' ? '700' : '500',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: securityTab === 'history' ? '4px solid #0d6efd' : 'none',
                color: securityTab === 'history' ? '#0d6efd' : '#666',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              History
            </button>
            <button
              onClick={() => setSecurityTab('daily')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '1em',
                fontWeight: securityTab === 'daily' ? '700' : '500',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: securityTab === 'daily' ? '4px solid #fd7e14' : 'none',
                color: securityTab === 'daily' ? '#fd7e14' : '#666',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Daily Log
            </button>
          </div>

          {/* Active Visitors Table */}
          {securityTab === 'active' && (
            <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                <strong>Active Visitors:</strong> {activeVisitors.length}
              </div>
              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 320px)', minWidth: 0, border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', background: 'white' }}>
                  <thead style={{ background: '#d4edda', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Room</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Patient</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time Out</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVisitors.map((v) => {
                      // Find latest checkout time from attendance records for this visitor
                      const checkoutRecords = allAttendanceRecords.filter(r => 
                        r.visitorId === v.id && (r.eventType === 'checkout' || r.checkoutTime || r.timeOut)
                      );
                      const latestCheckout = checkoutRecords.length > 0 ? checkoutRecords[0] : null;
                      const timeOut = latestCheckout ? (latestCheckout.checkoutTime || latestCheckout.timeOut || '') : (v.timeOut || '-');
                      
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #eee' }} onMouseOver={(e) => e.currentTarget.style.background = '#f0f8f5'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 8px' }}>{v.name}</td>
                          <td style={{ padding: '10px 8px' }}>{v.room}</td>
                          <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                          <td style={{ padding: '10px 8px' }}>{v.contact}</td>
                          <td style={{ padding: '10px 8px' }}>{v.date}</td>
                          <td style={{ padding: '10px 8px' }}>{v.timeIn}</td>
                          <td style={{ padding: '10px 8px', fontWeight: timeOut !== '-' ? '600' : '400', color: timeOut !== '-' ? '#dc3545' : '#999' }}>{timeOut}</td>
                          <td style={{ padding: '10px 8px', display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleCheckOut(v.id)}
                              style={{
                                padding: '6px 10px',
                                background: '#1a8f6f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.8em'
                              }}
                            >
                              Time Out
                            </button>
                            <button
                              onClick={() => handleDischarge(v.id)}
                              style={{
                                padding: '6px 10px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.8em'
                              }}
                            >
                              Discharge
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {activeVisitors.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No active visitors</div>
              )}
            </div>
          )}

          {/* Discharged Visitors Table */}
          {securityTab === 'discharged' && (
            <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                <strong>Discharged Visitors:</strong> {dischargedVisitors.length}
              </div>
              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 320px)', minWidth: 0, border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', background: 'white' }}>
                  <thead style={{ background: '#f8d7da', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Room</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Patient</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Date of Discharge</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dischargedVisitors.map((v) => {
                      // Find latest checkout time from attendance records for this visitor
                      const checkoutRecords = allAttendanceRecords.filter(r => 
                        r.visitorId === v.id && (r.eventType === 'checkout' || r.checkoutTime || r.timeOut)
                      );
                      const latestCheckout = checkoutRecords.length > 0 ? checkoutRecords[0] : null;
                      const timeOut = latestCheckout ? (latestCheckout.checkoutTime || latestCheckout.timeOut || 'N/A') : (v.timeOut || 'N/A');
                      
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #eee' }} onMouseOver={(e) => e.currentTarget.style.background = '#fdf7f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 8px' }}>{v.name}</td>
                          <td style={{ padding: '10px 8px' }}>{v.room}</td>
                          <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                          <td style={{ padding: '10px 8px' }}>{v.date}</td>
                          <td style={{ padding: '10px 8px' }}>{v.timeIn}</td>
                          <td style={{ padding: '10px 8px', fontWeight: timeOut !== 'N/A' ? '600' : '400', color: timeOut !== 'N/A' ? '#dc3545' : '#999' }}>{timeOut}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {dischargedVisitors.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No discharged visitors</div>
              )}
            </div>
          )}

          {/* History Report - Complete Visitation Records */}
          {securityTab === 'history' && (
            <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, color: '#0d6efd', marginBottom: '15px' }}>Visitor Visitations - Complete Records</h3>
              <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.95em' }}>Total Records: <strong>{allAttendanceRecords.length}</strong></p>
              
              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 380px)', minWidth: 0, border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%', fontSize: '0.9em', background: 'white' }}>
                  <thead style={{ background: '#0d6efd', color: 'white', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Visitor Name</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Date</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time In</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time Out</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Event Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendanceRecords.length > 0 ? (
                      allAttendanceRecords.map((record, idx) => {
                        const recordDate = (record.scanDate || record.checkOutDate || '').replace(/\//g, '-');
                        const isCheckout = record.eventType === 'checkout' || !!(record.checkoutTime || record.timeOut);
                        const isCheckin = record.eventType === 'check-in' || !!(record.checkInTime || record.scanTime);
                        
                        const timeIn = isCheckin ? (record.checkInTime || record.scanTime || '') : '';
                        const timeOut = isCheckout ? (record.checkoutTime || record.timeOut || '') : '';
                        
                        return (
                          <tr key={record.id || idx} style={{ 
                            borderBottom: '1px solid #eee', 
                            transition: 'background 0.2s',
                            background: isCheckout ? '#fff3cd' : 'transparent'
                          }} onMouseOver={(e) => e.currentTarget.style.background = isCheckout ? '#ffeaa7' : '#f5f5f5'} onMouseOut={(e) => e.currentTarget.style.background = isCheckout ? '#fff3cd' : 'transparent'}>
                            <td style={{ padding: '10px 10px', fontSize: '0.95em' }}>{record.visitorName || 'N/A'}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.95em' }}>{recordDate || 'N/A'}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600', color: timeIn ? '#155724' : '#999' }}>{timeIn || '-'}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600', color: timeOut ? '#dc3545' : '#999' }}>{timeOut || '-'}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.85em' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontWeight: '600',
                                background: record.eventType === 'checkout' ? '#fff3cd' : record.eventType === 'check-in' ? '#d4edda' : '#f8d7da',
                                color: record.eventType === 'checkout' ? '#856404' : record.eventType === 'check-in' ? '#155724' : '#721c24'
                              }}>
                                {record.eventType === 'checkout' ? 'Time Out' : record.eventType === 'check-in' ? 'Check In' : 'Discharge'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No visitor records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Log Table */}
          {securityTab === 'daily' && (
            <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, color: '#fd7e14', marginBottom: '15px' }}>Daily Time Log - All Check-In/Check-Out Records</h3>
              
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                <strong>Total Records:</strong> {allAttendanceRecords.length}
              </div>
              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 320px)', minWidth: 0, border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', background: 'white' }}>
                  <thead style={{ background: '#fff3cd', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Visitor Name</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time Out</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Event Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendanceRecords.length > 0 ? (
                      allAttendanceRecords.map((record, idx) => {
                        const recordDate = (record.scanDate || record.checkOutDate || '').replace(/\//g, '-');
                        const isCheckout = record.eventType === 'checkout' || !!(record.checkoutTime || record.timeOut);
                        const isCheckin = record.eventType === 'check-in' || !!(record.checkInTime || record.scanTime);
                        
                        const timeIn = isCheckin ? (record.checkInTime || record.scanTime || '') : '';
                        const timeOut = isCheckout ? (record.checkoutTime || record.timeOut || '') : '';
                        
                        return (
                          <tr key={record.id || idx} style={{ 
                            borderBottom: '1px solid #eee',
                            background: isCheckout ? '#fff3cd' : 'transparent'
                          }} onMouseOver={(e) => e.currentTarget.style.background = isCheckout ? '#ffeaa7' : '#fffbf0'} onMouseOut={(e) => e.currentTarget.style.background = isCheckout ? '#fff3cd' : 'transparent'}>
                            <td style={{ padding: '10px 8px', fontWeight: '600', color: '#fd7e14' }}>{recordDate || 'N/A'}</td>
                            <td style={{ padding: '10px 8px' }}>{record.visitorName || 'N/A'}</td>
                            <td style={{ padding: '10px 8px', fontWeight: '600', color: timeIn ? '#155724' : '#999' }}>{timeIn || '-'}</td>
                            <td style={{ padding: '10px 8px', fontWeight: '600', color: timeOut ? '#721c24' : '#999' }}>{timeOut || '-'}</td>
                            <td style={{ padding: '10px 8px', fontSize: '0.85em' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '3px',
                                fontWeight: '600',
                                background: record.eventType === 'checkout' ? '#fff3cd' : record.eventType === 'check-in' ? '#d4edda' : '#f8d7da',
                                color: record.eventType === 'checkout' ? '#856404' : record.eventType === 'check-in' ? '#155724' : '#721c24'
                              }}>
                                {record.eventType === 'checkout' ? 'Time Out' : record.eventType === 'check-in' ? 'Check In' : 'Discharge'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No visitor records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
