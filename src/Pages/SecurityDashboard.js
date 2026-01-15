import React, { useState, useEffect, useRef } from 'react';
import bgImage from '../Styles/bg.png';
import { listenVisitorsRealtime, updateVisitor, getAllAttendance, recordAttendance, recordCheckout, recordDischarge } from '../lib/firestore';
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
  // Alternating scan system: odd scans (1,3,5...) = Time-in, even scans (2,4,6...) = Time-out
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

      // Get today's date for scan counting
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      }).replace(/\//g, '-');

      // Count scans for this visitor today
      const todayScans = allAttendanceRecords.filter(record => {
        const recordDate = record.scanDate || record.checkInDate || record.date || '';
        return record.visitorId === visitor.id && recordDate === currentDate;
      });

      const scanCount = todayScans.length + 1; // +1 for current scan
      const isOddScan = scanCount % 2 === 1; // 1, 3, 5... are odd scans = time-in
      console.log('[SecurityDashboard] Visitor:', visitor.name, 'ID:', visitor.id, 'ScanCount:', scanCount, 'isOddScan:', isOddScan, 'todayScansCount:', todayScans.length);

      const checkTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      if (isOddScan) {
        // ODD SCAN - Check in the visitor (Time-in)
        handleCheckIn(visitor.id, checkTime, scanCount);
        return true;
      } else {
        // EVEN SCAN - Check out the visitor (Time-out)
        handleCheckOut(visitor.id, checkTime, scanCount);
        return true;
      }
    } catch (err) {
      console.error('parseQrString error', err);
    }
    setMessage({ type: 'error', text: 'Unable to parse scanned data.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    return false;
  }

  // Calculate next scan prediction for a visitor
  const getNextScanPrediction = (visitorId) => {
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    }).replace(/\//g, '-');

    // Count scans for this visitor today
    const todayScans = allAttendanceRecords.filter(record => {
      const recordDate = record.scanDate || record.checkInDate || record.date || '';
      return record.visitorId === visitorId && recordDate === currentDate;
    });

    const scanCount = todayScans.length + 1; // +1 for next scan
    const isOddScan = scanCount % 2 === 1; // 1, 3, 5... are odd scans = time-in

    if (isOddScan) {
      return 'Time-In';
    } else {
      return 'Time-Out';
    }
  };

  const handleCheckIn = async (visitorId, checkInTime, scanCount = 1) => {
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
      }).replace(/\//g, '-');

      const visitor = visitors.find(v => v.id === visitorId);

      // Only update main checkInTime if this is the first scan (scan 1)
      if (scanCount === 1) {
        await updateVisitor(visitorId, {
          checkInTime: time,
          registrationDate: checkInDate,
          status: 'active',
          checkOutTime: null,
          checkOutDate: null
        });
      } else {
        // For scan 3+, just mark as active and clear timeout, but don't overwrite original checkInTime
        await updateVisitor(visitorId, {
          status: 'active',
          checkOutTime: null,
          checkOutDate: null
        });
      }

      // Record attendance event (check-in)
      await recordAttendance(visitorId, visitor.name, checkInDate, time);
      console.log('[SecurityDashboard] Check-in attendance recorded for:', visitor.name);

      // Refresh attendance records to show in history
      await refreshAttendanceRecords();

      setMessage({ type: 'success', text: `${visitor.name} - Scan #${scanCount} (TIME-IN) recorded at ${time}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error timing in visitor:', err);
      setMessage({ type: 'error', text: 'Error timing in visitor. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleCheckOut = async (visitorId, checkOutTime, scanCount = 2) => {
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
      }).replace(/\//g, '-');

      const visitor = visitors.find(v => v.id === visitorId);

      // Record checkout event (time-out) FIRST
      await recordCheckout(visitorId, visitor.name, checkOutDate, time);
      console.log('[SecurityDashboard] Checkout attendance recorded for:', visitor.name);

      // Then update visitor - keep status as active (visitor can check back in)
      await updateVisitor(visitorId, {
        checkOutTime: time,
        checkOutDate: checkOutDate,
        status: 'active'
      });

      // Refresh attendance records to show in history
      await refreshAttendanceRecords();

      setMessage({ type: 'success', text: `${visitor.name} - Scan #${scanCount} (TIME-OUT) recorded at ${time}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error timing out visitor:', err);
      setMessage({ type: 'error', text: 'Error timing out visitor. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDischarge = async (visitorId) => {
    try {
      const now = new Date();
      const visitor = visitors.find(v => v.id === visitorId);

      // Record discharge date and time
      const dischargeDate = now.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
      const dischargeTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Create a visitation record
      const visitationRecord = {
        checkInDate: visitor.date,
        checkInTime: visitor.timeIn,
        checkOutDate: visitor.checkOutDate || visitor.date,
        checkOutTime: visitor.timeOut || 'N/A',
        dischargeDate: dischargeDate,
        dischargeTime: dischargeTime,
        timestamp: new Date().toISOString()
      };

      // Add to visitation history array
      const currentVisitations = visitor.visitations || [];
      const updatedVisitations = [...currentVisitations, visitationRecord];

      await updateVisitor(visitorId, {
        status: 'discharged',
        visitations: updatedVisitations,
        dischargeTime: now.toISOString()
      });

      // Record discharge event in attendance collection
      await recordDischarge(visitorId, visitor.name, dischargeDate, dischargeTime);
      console.log('[SecurityDashboard] Discharge recorded for:', visitor.name);

      // Refresh attendance records to show in history
      await refreshAttendanceRecords();

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
      
      // Set camera active first to render video element
      setIsCameraActive(true);
      setCameraError('');
      
      // Then assign stream once video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          scanQRCode();
        } else {
          console.error('Video element not initialized');
          setCameraError('Video element not initialized. Please try again.');
          setIsCameraActive(false);
        }
      }, 0);
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

  // Get visitors who haven't timed out after visiting hours (8 AM - 6 PM)
  const getVisitorReminders = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const visitingEndTime = 18; // 6 PM
    const visitingStartTime = 8; // 8 AM
    
    // Only show reminders after 6 PM
    if (currentHour < visitingEndTime) {
      return [];
    }
    
    return activeVisitors.filter(v => {
      // Check if visitor hasn't timed out
      return !v.timeOut;
    });
  };
  
  const visitorReminders = getVisitorReminders();

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
                  <div style={{ fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Patient Name</div>
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
                    {selectedVisitor.status === 'active' ? 'Active' : 'Discharged (Patient)'}
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #1a8f6f' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#1a8f6f', fontSize: '0.95em', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Attendance Records</h4>
                  {allAttendanceRecords && allAttendanceRecords.filter(r => r.visitorId === selectedVisitor.id).length > 0 ? (
                    <div style={{ maxHeight: '250px', overflowY: 'auto', scrollbarGutter: 'stable' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em' }}>
                        <thead>
                          <tr style={{ background: '#1a8f6f', color: 'white' }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700', fontSize: '0.8em', borderBottom: '2px solid #0d5443' }}>Date</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700', fontSize: '0.8em', borderBottom: '2px solid #0d5443' }}>Time</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700', fontSize: '0.8em', borderBottom: '2px solid #0d5443' }}>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAttendanceRecords.filter(r => r.visitorId === selectedVisitor.id).sort((a, b) => {
                            const dateA = new Date(a.scanDate || a.checkInDate || a.date || '');
                            const dateB = new Date(b.scanDate || b.checkInDate || b.date || '');
                            return dateB - dateA;
                          }).map((record, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f9fdf7', borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '6px', fontSize: '0.75em', color: '#333' }}>{record.scanDate || record.checkInDate || record.date || 'N/A'}</td>
                              <td style={{ padding: '6px', fontSize: '0.75em', color: '#333' }}>{record.scanTime || record.checkInTime || record.checkoutTime || record.timeOut || 'N/A'}</td>
                              <td style={{ padding: '6px', fontSize: '0.75em', fontWeight: '600', color: record.eventType === 'checkout' ? '#dc3545' : '#28a745' }}>
                                {record.eventType === 'checkout' ? 'OUT' : 'IN'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ color: '#999', fontSize: '0.8em', textAlign: 'center', padding: '12px', fontStyle: 'italic' }}>No records found</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h2 style={{ color: '#1a8f6f', marginTop: 0, textAlign: 'center' }}>USB Scanner</h2>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '18px', 
                borderRadius: '8px', 
                border: '2px dashed #1a8f6f',
                textAlign: 'center',
                marginBottom: '12px',
                width: '100%'
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
              Discharged (Patient) ({dischargedVisitors.length})
            </button>
            <button
              onClick={() => setSecurityTab('reminders')}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '1em',
                fontWeight: securityTab === 'reminders' ? '700' : '500',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: securityTab === 'reminders' ? '4px solid #ff9800' : 'none',
                color: securityTab === 'reminders' ? '#ff9800' : '#666',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Reminders ({visitorReminders.length})
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead style={{ background: '#d4edda', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Room</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Patient Name</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time Out</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeVisitors.map((v) => {
                    // Get all attendance records for this visitor today
                    const now = new Date();
                    const currentDate = now.toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit'
                    }).replace(/\//g, '-');

                    const todayRecords = allAttendanceRecords.filter(record => {
                      const recordDate = record.scanDate || record.checkInDate || record.checkOutDate || record.dischargeDate || record.date || '';
                      return record.visitorId === v.id && recordDate === currentDate;
                    });

                    // Extract all time values from records and sort them
                    let allTimes = [];
                    todayRecords.forEach(record => {
                      const time = record.checkInTime || record.scanTime || record.timeIn || record.checkoutTime || record.timeOut || '';
                      if (time) {
                        allTimes.push(time);
                      }
                    });

                    // Sort times chronologically (HH:MM:SS AM/PM format)
                    allTimes.sort((a, b) => {
                      const timeA = new Date(`2000-01-01 ${a}`).getTime();
                      const timeB = new Date(`2000-01-01 ${b}`).getTime();
                      return timeA - timeB;
                    });

                    // Earliest time is time-in, latest time is time-out
                    const earliestTimeIn = allTimes.length > 0 ? allTimes[0] : (v.timeIn || '');
                    const latestTimeOut = allTimes.length > 0 ? allTimes[allTimes.length - 1] : (v.timeOut || '');

                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #eee' }} onMouseOver={(e) => e.currentTarget.style.background = '#f0f8f5'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 8px' }}>{v.name}</td>
                        <td style={{ padding: '10px 8px' }}>{v.room}</td>
                        <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                        <td style={{ padding: '10px 8px' }}>{v.contact}</td>
                        <td style={{ padding: '10px 8px' }}>{v.date}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '600', color: earliestTimeIn ? '#155724' : '#999' }}>{earliestTimeIn || 'N/A'}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '600', color: latestTimeOut ? '#dc3545' : '#999' }}>{latestTimeOut || '-'}</td>
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
              {activeVisitors.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No active visitors</div>
              )}
            </div>
          )}

          {/* Reminders - Visitors Not Timed Out After 6 PM */}
          {securityTab === 'reminders' && (
            <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
              {visitorReminders.length > 0 ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', color: '#856404' }}>
                    <div style={{ fontWeight: '700', fontSize: '1em', marginBottom: '5px' }}>Visiting Hours Exceeded</div>
                    <div style={{ fontSize: '0.9em' }}>The following visitors did not time out after the visiting hours (8:00 AM - 6:00 PM). Please remind them to time out.</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                    <thead style={{ background: '#fff3cd', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Room</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Patient Name</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Hours Visited</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorReminders.map((v) => {
                        const timeInParts = v.timeIn.split(':');
                        const timeInDate = new Date();
                        timeInDate.setHours(parseInt(timeInParts[0]), parseInt(timeInParts[1]), parseInt(timeInParts[2]) || 0);
                        const now = new Date();
                        const hoursVisited = ((now - timeInDate) / (1000 * 60 * 60)).toFixed(1);
                        
                        return (
                          <tr key={v.id} style={{ borderBottom: '1px solid #eee', background: '#fffbf0' }} onMouseOver={(e) => e.currentTarget.style.background = '#fff8e1'} onMouseOut={(e) => e.currentTarget.style.background = '#fffbf0'}>
                            <td style={{ padding: '10px 8px', fontWeight: '600' }}>{v.name}</td>
                            <td style={{ padding: '10px 8px' }}>{v.room}</td>
                            <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                            <td style={{ padding: '10px 8px' }}>{v.contact}</td>
                            <td style={{ padding: '10px 8px', color: '#155724', fontWeight: '600' }}>{v.timeIn}</td>
                            <td style={{ padding: '10px 8px', color: '#ff9800', fontWeight: '600', fontSize: '1.1em' }}>{hoursVisited} hrs</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: '3em', marginBottom: '10px' }}>✓</div>
                  <div style={{ fontSize: '1em', fontWeight: '600' }}>All visitors timed out</div>
                  <div style={{ fontSize: '0.9em', marginTop: '5px' }}>No reminders needed at this time</div>
                </div>
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
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Patient Name</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Reg Date</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time In</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Time Out</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Discharge Date</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600' }}>Discharge Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dischargedVisitors.map((v) => {
                    // Get ALL discharge records for this visitor
                    const dischargeRecords = allAttendanceRecords.filter(r => r.visitorId === v.id && r.eventType === 'discharge');
                    
                    // Get all attendance records for this visitor to extract time-in and time-out
                    const visitorRecords = allAttendanceRecords.filter(r => r.visitorId === v.id);
                    
                    // Extract all time values and sort them
                    let allTimes = [];
                    visitorRecords.forEach(record => {
                      const time = record.checkInTime || record.scanTime || record.timeIn || record.checkoutTime || record.timeOut || '';
                      if (time) {
                        allTimes.push(time);
                      }
                    });

                    // Sort times chronologically
                    allTimes.sort((a, b) => {
                      const timeA = new Date(`2000-01-01 ${a}`).getTime();
                      const timeB = new Date(`2000-01-01 ${b}`).getTime();
                      return timeA - timeB;
                    });

                    const displayTimeIn = allTimes.length > 0 ? allTimes[0] : (v.timeIn || '-');
                    const displayTimeOut = allTimes.length > 0 ? allTimes[allTimes.length - 1] : (v.timeOut || '-');
                    
                    // Build discharge dates and times from ALL records
                    let allDischargeDates = [];
                    let allDischargeTimes = [];
                    
                    dischargeRecords.forEach(record => {
                      if (record.dischargeDate && !allDischargeDates.includes(record.dischargeDate)) {
                        allDischargeDates.push(record.dischargeDate);
                      }
                      if (record.dischargeTime && !allDischargeTimes.includes(record.dischargeTime)) {
                        allDischargeTimes.push(record.dischargeTime);
                      }
                    });
                    
                    // Fallback to visitor object if no records found
                    if (allDischargeDates.length === 0 && v.dischargeTime) {
                      allDischargeDates.push(new Date(v.dischargeTime).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }));
                    }
                    if (allDischargeTimes.length === 0 && v.dischargeTime) {
                      allDischargeTimes.push(new Date(v.dischargeTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
                    }

                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #eee' }} onMouseOver={(e) => e.currentTarget.style.background = '#fdf7f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 8px' }}>{v.name}</td>
                        <td style={{ padding: '10px 8px' }}>{v.room}</td>
                        <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                        <td style={{ padding: '10px 8px' }}>{v.contact}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '600', color: '#007bff' }}>{v.date}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '600', color: '#155724' }}>{displayTimeIn}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '600', color: displayTimeOut && displayTimeOut !== '-' ? '#721c24' : '#999' }}>{displayTimeOut}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '600', color: allDischargeDates.length > 0 ? '#dc3545' : '#999' }}>
                          {allDischargeDates.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {allDischargeDates.map((date, idx) => (
                                <div key={idx} style={{ padding: '4px 8px', background: '#ffcccc', borderRadius: '3px', fontSize: '0.85em' }}>
                                  {date}
                                </div>
                              ))}
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '10px 8px', fontWeight: '600', color: allDischargeTimes.length > 0 ? '#dc3545' : '#999' }}>
                          {allDischargeTimes.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {allDischargeTimes.map((time, idx) => (
                                <div key={idx} style={{ padding: '4px 8px', background: '#ffcccc', borderRadius: '3px', fontSize: '0.85em' }}>
                                  {time}
                                </div>
                              ))}
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Discharge Date</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Discharge Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendanceRecords.length > 0 ? (
                      allAttendanceRecords.map((record, idx) => {
                        const recordDate = (record.scanDate || record.checkOutDate || record.dischargeDate || '').replace(/\//g, '-');
                        const isCheckout = record.eventType === 'checkout' || !!(record.checkoutTime || record.timeOut);
                        const isCheckin = record.eventType === 'check-in' || !!(record.checkInTime || record.scanTime);
                        const isDischarge = record.eventType === 'discharge';
                        
                        const timeIn = isCheckin ? (record.checkInTime || record.scanTime || '') : '';
                        const timeOut = isCheckout ? (record.checkoutTime || record.timeOut || '') : '';
                        const dischargeDate = isDischarge ? (record.dischargeDate || '') : '';
                        const dischargeTime = isDischarge ? (record.dischargeTime || '') : '';
                        
                        return (
                          <tr key={record.id || idx} style={{ 
                            borderBottom: '1px solid #eee', 
                            transition: 'background 0.2s',
                            background: isCheckout ? '#fff3cd' : isDischarge ? '#f8d7da' : 'transparent'
                          }} onMouseOver={(e) => e.currentTarget.style.background = isCheckout ? '#ffeaa7' : isDischarge ? '#f5c6cb' : '#f5f5f5'} onMouseOut={(e) => e.currentTarget.style.background = isCheckout ? '#fff3cd' : isDischarge ? '#f8d7da' : 'transparent'}>
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
                            <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600', color: dischargeDate ? '#dc3545' : '#999' }}>{dischargeDate || '-'}</td>
                            <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600', color: dischargeTime ? '#dc3545' : '#999' }}>{dischargeTime || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No visitor records found</td>
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
              
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div>
                  <strong>Date:</strong> 
                  <input 
                    type="date" 
                    value={dailyLogDate ? (() => {
                      const [month, day, year] = dailyLogDate.split('-');
                      return `20${year}-${month}-${day}`;
                    })() : ''} 
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
                        setDailyLogDate(formattedDate);
                      }
                    }}
                    style={{ padding: '6px 10px', fontSize: '0.9em', border: '1px solid #ddd', borderRadius: '4px', marginLeft: '10px' }}
                  />
                </div>
                <div>
                  <strong>Total Records:</strong> {allAttendanceRecords.filter(r => (r.scanDate || r.checkInDate || r.checkOutDate || r.dischargeDate || r.date || '') === dailyLogDate).length}
                </div>
              </div>

              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 380px)', minWidth: 0, border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', minWidth: '100%' }}>
                  <thead style={{ background: '#fff3cd', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Date</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Visitor Name</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time In</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time Out</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Event Type</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Discharge Date</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Discharge Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendanceRecords && allAttendanceRecords.length > 0 ? (
                      allAttendanceRecords
                        .filter(r => (r.scanDate || r.checkInDate || r.checkOutDate || r.dischargeDate || r.date || '') === dailyLogDate)
                        .sort((a, b) => {
                          const timeA = new Date(a.recordedAt || 0).getTime();
                          const timeB = new Date(b.recordedAt || 0).getTime();
                          return timeA - timeB; // oldest first
                        })
                        .map((record, idx) => {
                          const isCheckout = record.eventType === 'checkout';
                          const isCheckin = record.eventType === 'check-in';
                          const isDischarge = record.eventType === 'discharge';
                          
                          const timeIn = isCheckin ? (record.checkInTime || record.scanTime || '') : '';
                          const timeOut = isCheckout ? (record.checkoutTime || record.timeOut || '') : '';
                          const dischargeDate = isDischarge ? (record.dischargeDate || '') : '';
                          const dischargeTime = isDischarge ? (record.dischargeTime || '') : '';
                          
                          return (
                            <tr key={record.id || idx} style={{ 
                              borderBottom: '1px solid #eee', 
                              background: isCheckout ? '#fff3cd' : isDischarge ? '#f8d7da' : 'transparent'
                            }} onMouseOver={(e) => e.currentTarget.style.background = isCheckout ? '#ffeaa7' : isDischarge ? '#f5c6cb' : '#fffbf0'} onMouseOut={(e) => e.currentTarget.style.background = isCheckout ? '#fff3cd' : isDischarge ? '#f8d7da' : 'transparent'}>
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: '#fd7e14' }}>{record.scanDate || record.checkInDate || record.checkOutDate || record.dischargeDate || record.date || 'N/A'}</td>
                              <td style={{ padding: '10px 8px' }}>{record.visitorName || 'N/A'}</td>
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: timeIn ? '#155724' : '#999' }}>{timeIn || '-'}</td>
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: timeOut ? '#dc3545' : '#999' }}>{timeOut || '-'}</td>
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
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: dischargeDate ? '#dc3545' : '#999' }}>{dischargeDate || '-'}</td>
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: dischargeTime ? '#dc3545' : '#999' }}>{dischargeTime || '-'}</td>
                            </tr>
                          );
                        })
                    ) : null}
                  </tbody>
                </table>
              </div>
              {allAttendanceRecords.filter(r => (r.scanDate || r.checkInDate || r.checkOutDate || r.dischargeDate || r.date || '') === dailyLogDate).length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999', marginTop: '20px' }}>No records found for selected date</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
