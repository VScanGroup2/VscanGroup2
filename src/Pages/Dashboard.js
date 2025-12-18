import React, { useState, useEffect, useRef } from 'react';
import bgImage from '../Styles/bg.png';
import { listenVisitorsRealtime, addVisitor as addVisitorDoc, updateVisitor } from '../lib/firestore';
import uploadImageToCloudinary from '../lib/cloudinary';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

export default function Dashboard({ onLogout }) {
  const [visitors, setVisitors] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredSearchQuery, setRegisteredSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [monitoringSearchQuery, setMonitoringSearchQuery] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  // Registration form state
  const [formData, setFormData] = useState({ visitorName: '', roomNumber: '', patientName: '', contactNumber: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [registeredVisitorData, setRegisteredVisitorData] = useState(null);
  const [scannedVisitorData, setScannedVisitorData] = useState(null);
  const [qrScanInput, setQrScanInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  // USB scanner (keyboard-wedge) support
  const [scannerBuffer, setScannerBuffer] = useState('');
  const scannerInputRef = useRef(null);
  const [scannerActive, setScannerActive] = useState(false);
  

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
    const interval = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('[Dashboard] Setting up Firestore listener on mount...');
    // subscribe to Firestore visitors collection
    const unsub = listenVisitorsRealtime((data) => {
      console.log('[Dashboard] Received visitors data from Firestore:', data);
      console.log('[Dashboard] Number of visitors received:', data.length);
      // normalize Firestore fields to match UI expectations, including legacy docs
      const normalized = data.map(v => {
        // date and datetime fallbacks
        let date = v.registrationDate || '';
        if (!date && v.timestamp) {
          date = new Date(v.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        }
        if (!date && v.fullDate) {
          date = new Date(v.fullDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        }
        if (!date) {
          date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        }

        let fullDate = v.registrationFullDate || '';
        if (!fullDate && v.timestamp) {
          fullDate = new Date(v.timestamp).toLocaleString();
        }
        if (!fullDate && v.fullDate) {
          fullDate = v.fullDate;
        }
        if (!fullDate) {
          fullDate = new Date().toLocaleString();
        }

        // status normalization: support legacy values
        const statusRaw = (v.status || '').toLowerCase();
        const status = statusRaw === 'checked-in' || statusRaw === 'active' ? 'active'
          : statusRaw === 'discharged' || statusRaw === 'checked-out' ? 'inactive'
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
          fullDate,
          status,
          photo: v.photoUrl || v.photo || null
        };
      });
      console.log('[Dashboard] Normalized visitors:', normalized);
      setVisitors(normalized);
    });

    return () => {
      console.log('[Dashboard] Cleaning up Firestore listener on unmount...');
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, []);

  const showView = (view) => setCurrentView(view);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setSelectedFile(f || null);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  // Register a new visitor (called by the Register button)
  const handleRegister = async () => {
    if (!formData.visitorName || !formData.roomNumber || !formData.patientName || !formData.contactNumber) {
      setMessage({ type: 'error', text: 'Please fill in all fields!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      if (selectedFile) {
        try {
          setUploadingImage(true);
          const uploadRes = await uploadImageToCloudinary(selectedFile);
          photoUrl = uploadRes.secure_url || uploadRes.url || null;
        } catch (err) {
          console.error('Image upload failed', err);
          const msg = err && err.message ? err.message : 'Image upload failed. Please try again.';
          setMessage({ type: 'error', text: `Image upload failed: ${msg}` });
          setLoading(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const now = new Date();
      const registrationDateTime = now.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      const registrationDate = now.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: '2-digit' 
      });

      const visitorData = {
        visitorName: formData.visitorName,
        roomNumber: formData.roomNumber,
        patientName: formData.patientName,
        contactNumber: formData.contactNumber,
        timestamp: now.toISOString(),
        registrationFullDate: registrationDateTime,
        registrationDate: registrationDate,
        checkInTime: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        }),
        status: 'checked-in',
        photoUrl: photoUrl
      };

      const docId = await addVisitorDoc(visitorData);
      console.log('handleRegister: added visitor', docId);
      
      // Generate QR Code
      const qrData = JSON.stringify({
        id: docId,
        name: formData.visitorName,
        room: formData.roomNumber,
        patient: formData.patientName,
        contact: formData.contactNumber,
        checkIn: visitorData.checkInTime,
        date: registrationDate,
        fullDateTime: registrationDateTime
      });
      
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1a8f6f',
          light: '#ffffff'
        }
      });
      
      setQrCodeUrl(qrUrl);
      setRegisteredVisitorData({
        id: docId,
        name: formData.visitorName,
        room: formData.roomNumber,
        patient: formData.patientName,
        contact: formData.contactNumber,
        checkIn: visitorData.checkInTime,
        registrationDateTime: registrationDateTime
      });
      
      setMessage({ type: 'success', text: `Visitor registered successfully!` });
      setFormData({ visitorName: '', roomNumber: '', patientName: '', contactNumber: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Registration error:', error);
      const errMsg = error && error.message ? error.message : String(error);
      setMessage({ type: 'error', text: `Error registering visitor: ${errMsg}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl && registeredVisitorData) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `visitor-${registeredVisitorData.name.replace(/\s+/g, '-')}-${registeredVisitorData.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintQR = () => {
    if (qrCodeUrl && registeredVisitorData) {
      const printWindow = window.open('', '', 'width=600,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Visitor QR Code - ${registeredVisitorData.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .header { color: #1a8f6f; margin-bottom: 20px; }
              .qr-container { margin: 20px 0; }
              .info { text-align: left; margin: 20px auto; max-width: 400px; }
              .info-row { margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; }
              .label { font-weight: bold; color: #1a8f6f; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>IGNACIO LACSON ARROYO MEMORIAL HOSPITAL</h1>
              <h2>Visitor Pass</h2>
            </div>
            <div class="qr-container">
              <img src="${qrCodeUrl}" alt="Visitor QR Code" />
            </div>
            <div class="info">
              <div class="info-row"><span class="label">Visitor ID:</span> ${registeredVisitorData.id}</div>
              <div class="info-row"><span class="label">Name:</span> ${registeredVisitorData.name}</div>
              <div class="info-row"><span class="label">Room:</span> ${registeredVisitorData.room}</div>
              <div class="info-row"><span class="label">Patient:</span> ${registeredVisitorData.patient}</div>
              <div class="info-row"><span class="label">Contact:</span> ${registeredVisitorData.contact}</div>
              <div class="info-row"><span class="label">Registration Date & Time:</span> ${registeredVisitorData.registrationDateTime}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDischarge = async (visitorId) => {
    try {
      const now = new Date();
      const checkOutTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });

      await updateVisitor(visitorId, {
        status: 'discharged',
        checkOutTime: checkOutTime
      });

      setMessage({ type: 'success', text: 'Visitor discharged successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Discharge error:', error);
      const errMsg = error && error.message ? error.message : String(error);
      setMessage({ type: 'error', text: `Error discharging visitor: ${errMsg}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 6000);
    }
  };

  const handleQRScan = () => {
    try {
      if (!qrScanInput.trim()) {
        setMessage({ type: 'error', text: 'Please enter QR code data!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      const qrData = JSON.parse(qrScanInput);
      const visitor = visitors.find(v => v.id === qrData.id);
      
      if (visitor) {
        // Use visitor from database for most current info
        setScannedVisitorData(visitor);
        setQrScanInput('');
        setMessage({ type: 'success', text: 'Visitor information loaded!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else if (qrData.id && qrData.name) {
        // Use QR data directly if visitor not in database
        const scannedData = {
          id: qrData.id,
          name: qrData.name,
          room: qrData.room,
          patient: qrData.patient,
          contact: qrData.contact,
          timeIn: qrData.checkIn,
          timeOut: null,
          date: qrData.date,
          fullDate: qrData.fullDateTime,
          status: 'active',
          photo: null
        };
        setScannedVisitorData(scannedData);
        setQrScanInput('');
        setMessage({ type: 'success', text: 'Visitor information loaded from QR code!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Visitor not found!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('QR Scan error:', error);
      setMessage({ type: 'error', text: 'Invalid QR code data!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Parse QR/string from scanner and load visitor info (shared logic)
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
          setScannedVisitorData(visitor);
          setMessage({ type: 'success', text: 'Visitor loaded from scanner input.' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
          return true;
        }
        // nothing found
        setMessage({ type: 'error', text: 'Scanned ID not found.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return false;
      }

      if (qrData && (qrData.id || qrData.name)) {
        const visitor = visitors.find(v => v.id === qrData.id) || null;
        if (visitor) {
          setScannedVisitorData(visitor);
        } else {
          const scannedData = {
            id: qrData.id || 'N/A',
            name: qrData.name || 'N/A',
            room: qrData.room || 'N/A',
            patient: qrData.patient || 'N/A',
            contact: qrData.contact || 'N/A',
            timeIn: qrData.checkIn || '',
            timeOut: null,
            date: qrData.date || '',
            fullDate: qrData.fullDateTime || '',
            status: 'active',
            photo: null
          };
          setScannedVisitorData(scannedData);
        }

        setMessage({ type: 'success', text: 'Visitor information loaded from scanner.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return true;
      }
    } catch (err) {
      console.error('parseQrString error', err);
    }
    setMessage({ type: 'error', text: 'Unable to parse scanned data.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    return false;
  };

  const activateUsbScanner = () => {
    setScannerBuffer('');
    setScannerActive(true);
    setTimeout(() => scannerInputRef.current && scannerInputRef.current.focus(), 50);
    setMessage({ type: 'success', text: 'USB scanner activated — ready to scan.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

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

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        
        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(() => {
          scanQRCode();
        }, 500); // Scan every 500ms
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
      setMessage({ type: 'error', text: 'Camera access denied. Please enable camera permissions.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsCameraActive(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to detect QR code using jsQR library
      try {
        // Note: You'll need to install jsQR library
        // For now, we'll use a manual detection approach
        // In production, use: import jsQR from 'jsqr';
        // const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        // Placeholder for actual QR detection
        // When a real QR library is used, it will automatically detect and parse
      } catch (error) {
        console.error('QR detection error:', error);
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
  const filteredMonitoringVisitors = visitors.filter(v => {
    const q = monitoringSearchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.room.toLowerCase().includes(q) || v.patient.toLowerCase().includes(q);
  });
  const attendanceVisitors = attendanceDate ? visitors.filter(v => {
    // Convert attendanceDate from YYYY-MM-DD to MM-DD-YY format to match v.date
    if (!attendanceDate) return false;
    const [year, month, day] = attendanceDate.split('-');
    const formattedDate = `${month}-${day}-${year.slice(-2)}`;
    return v.date === formattedDate;
  }) : visitors;

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ddd', fontSize: '1em', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'white' };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div style={{ background: '#1a8f6f', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', flex: 1, fontSize: '2em', fontWeight: 'bold', letterSpacing: '2px' }}>IGNACIO LACSON ARROYO MEMORIAL HOSPITAL</div>
        <button onClick={onLogout} style={{ padding: '10px 25px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', flex: 1, width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '20px', gap: '20px', overflow: 'hidden' }}>
        {/* Hidden input to receive USB scanner keyboard-wedge input */}
        <input
          ref={scannerInputRef}
          value={scannerBuffer}
          onChange={(e) => setScannerBuffer(e.target.value)}
          onKeyDown={handleScannerKeyDown}
          style={{ position: 'absolute', left: -9999, top: 'auto' }}
          aria-hidden="true"
        />
        <div style={{ width: 320, background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.08)', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h2 style={{ color: '#1a8f6f', marginBottom: '16px', fontSize: '1.3em', textAlign: 'center', borderBottom: '2px solid #1a8f6f', paddingBottom: '10px' }}>VISITOR ID SCANNER</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px', fontSize: '0.9em' }}>Scan Visitor QR Code:</label>
            
            {!isCameraActive ? (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '2px dashed #1a8f6f',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '3em', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '12px' }}>Use your USB scanner or click the button below to activate keyboard-scanner input.</div>
                <button 
                  onClick={activateUsbScanner}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1em',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#0069d9'}
                  onMouseOut={(e) => e.target.style.background = '#007bff'}
                >
                  ACTIVATE USB SCANNER
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
                    borderRadius: '8px', 
                    border: '3px solid #1a8f6f',
                    display: 'block',
                    background: '#000'
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
                  border: '3px solid #1a8f6f',
                  borderRadius: '8px',
                  boxShadow: '0 0 0 99999px rgba(0, 0, 0, 0.3)',
                  pointerEvents: 'none'
                }}>
                  <div style={{ 
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    width: '20px',
                    height: '20px',
                    borderTop: '4px solid #1a8f6f',
                    borderLeft: '4px solid #1a8f6f'
                  }}></div>
                  <div style={{ 
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '20px',
                    height: '20px',
                    borderTop: '4px solid #1a8f6f',
                    borderRight: '4px solid #1a8f6f'
                  }}></div>
                  <div style={{ 
                    position: 'absolute',
                    bottom: '-2px',
                    left: '-2px',
                    width: '20px',
                    height: '20px',
                    borderBottom: '4px solid #1a8f6f',
                    borderLeft: '4px solid #1a8f6f'
                  }}></div>
                  <div style={{ 
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '20px',
                    height: '20px',
                    borderBottom: '4px solid #1a8f6f',
                    borderRight: '4px solid #1a8f6f'
                  }}></div>
                </div>
                <div style={{ 
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(26, 143, 111, 0.9)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85em',
                  fontWeight: 'bold'
                }}>
                  Scanning...
                </div>
                <button 
                  onClick={stopCamera}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginTop: '8px',
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9em',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#c82333'}
                  onMouseOut={(e) => e.target.style.background = '#dc3545'}
                >
                  STOP CAMERA
                </button>
              </div>
            )}
            
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e9ecef' }}>
              <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
                Or manually enter QR data:
              </div>
              <textarea
                placeholder="Paste QR code data here..."
                value={qrScanInput}
                onChange={(e) => setQrScanInput(e.target.value)}
                style={{ 
                  width: '100%', 
                  minHeight: '60px',
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '2px solid #ddd', 
                  fontSize: '0.85em',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  marginBottom: '8px'
                }}
              />
              <button 
                onClick={handleQRScan}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: '#1a8f6f', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9em',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#157a5e'}
                onMouseOut={(e) => e.target.style.background = '#1a8f6f'}
              >
                LOAD VISITOR INFO
              </button>
            </div>
          </div>

          {scannedVisitorData && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
              borderRadius: '12px', 
              border: '3px solid #1a8f6f',
              boxShadow: '0 4px 12px rgba(26, 143, 111, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#1a8f6f', margin: 0, fontSize: '1.2em', fontWeight: 'bold' }}> VISITOR VERIFIED</h3>
                <button 
                  onClick={() => setScannedVisitorData(null)}
                  style={{ 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#c82333'}
                  onMouseOut={(e) => e.target.style.background = '#dc3545'}
                >
                  ✕ Clear
                </button>
              </div>

              {scannedVisitorData.photo && (
                <div style={{ marginBottom: '16px', textAlign: 'center', padding: '12px', background: 'white', borderRadius: '8px' }}>
                  <img 
                    src={scannedVisitorData.photo} 
                    alt="Visitor" 
                    style={{ 
                      width: '140px', 
                      height: '140px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '4px solid #1a8f6f',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '0.75em', 
                    color: '#1a8f6f', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    Verified Photo ID
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visitor Name</div>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1.1em' }}>{scannedVisitorData.name}</div>
              </div>

              <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}> Contact Number</div>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1em' }}>{scannedVisitorData.contact}</div>
              </div>

              <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}> Room Number</div>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1em' }}>{scannedVisitorData.room}</div>
              </div>

              <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}> Patient Name</div>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1em' }}>{scannedVisitorData.patient}</div>
              </div>

              <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}> Check-In Time</div>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1em' }}>{scannedVisitorData.timeIn}</div>
              </div>

              {scannedVisitorData.timeOut && (
                <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}> Check-Out Time</div>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1em' }}>{scannedVisitorData.timeOut}</div>
                </div>
              )}

              <div style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}> Registration Date</div>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '0.9em' }}>{scannedVisitorData.fullDate}</div>
              </div>

              <div style={{ padding: '10px', background: 'white', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}> Current Status</div>
                <span style={{ 
                  padding: '8px 20px', 
                  borderRadius: '20px', 
                  fontSize: '0.9em',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  background: scannedVisitorData.status === 'active' ? '#d4edda' : '#f8d7da',
                  color: scannedVisitorData.status === 'active' ? '#155724' : '#721c24',
                  border: `2px solid ${scannedVisitorData.status === 'active' ? '#28a745' : '#dc3545'}`,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {scannedVisitorData.status === 'active' ? '✓ ACTIVE' : '⊗ DISCHARGED'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', overflow: 'auto' }}>
          <h1 style={{ color: '#1a8f6f', marginBottom: '20px' }}>{currentView === 'dashboard' ? 'DASHBOARD' : currentView === 'visitorInfo' ? "LIST OF VISITORS" : currentView === 'registered' ? 'REGISTERED VISITOR' : currentView === 'monitoring' ? 'MONITORING' : currentView === 'history' ? "VISITOR'S HISTORY" : currentView === 'attendance' ? 'ATTENDANCE' : currentView === 'register' ? 'REGISTER NEW VISITOR' : 'DASHBOARD'}</h1>

          {currentView === 'dashboard' && (
            <>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.1em', color: '#666' }}>TOTAL VISITORS</div>
                  <div style={{ fontSize: '2em', color: '#1a8f6f', fontWeight: '700' }}>{activeVisitors.length}</div>
                </div>
                <div style={{ background: '#1a8f6f', color: 'white', padding: '15px 25px', borderRadius: '8px', fontWeight: '700' }}>
                  <div style={{ fontSize: '1.1em', marginBottom: '5px' }}>DATE: {currentDate}</div>
                  <div style={{ fontSize: '1.3em' }}>TIME: {currentTime}</div>
                </div>
              </div>

              <div style={{ overflow: 'auto', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f1f1f1' }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Room</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Patient</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVisitors.map((v) => (
                      <tr key={v.id}>
                        <td style={{ padding: '10px' }}>{v.name}</td>
                        <td style={{ padding: '10px' }}>{v.room}</td>
                        <td style={{ padding: '10px' }}>{v.patient}</td>
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
              <div style={{ overflow: 'auto', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f1f1f1' }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Room</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Patient</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Contact</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Time In</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Time Out</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((v) => (
                      <tr key={v.id}>
                        <td style={{ padding: '10px' }}>{v.name}</td>
                        <td style={{ padding: '10px' }}>{v.room}</td>
                        <td style={{ padding: '10px' }}>{v.patient}</td>
                        <td style={{ padding: '10px' }}>{v.contact}</td>
                        <td style={{ padding: '10px' }}>{v.timeIn}</td>
                        <td style={{ padding: '10px' }}>{v.timeOut || 'N/A'}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ 
                            padding: '4px 12px', 
                            borderRadius: '12px', 
                            fontSize: '0.85em',
                            fontWeight: 'bold',
                            background: v.status === 'active' ? '#d4edda' : '#f8d7da',
                            color: v.status === 'active' ? '#155724' : '#721c24'
                          }}>
                            {v.status === 'active' ? 'ACTIVE' : 'DISCHARGED'}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {v.status === 'active' ? (
                            <button 
                              onClick={() => handleDischarge(v.id)}
                              style={{ 
                                padding: '6px 16px', 
                                background: '#dc3545', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9em'
                              }}
                            >
                              Discharge
                            </button>
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.9em' }}>Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'registered' && (
            <div>
              <input placeholder="Search registered..." value={registeredSearchQuery} onChange={(e) => setRegisteredSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div>{filteredRegisteredVisitors.map(v => (
                <div key={v.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 700 }}>{v.name}</div>
                  <div style={{ color: '#666' }}>{v.room} — {v.patient}</div>
                  <div style={{ color: '#999', fontSize: '0.9em' }}>Registered: {v.fullDate}</div>
                </div>
              ))}</div>
            </div>
          )}

          {currentView === 'monitoring' && (
            <div>
              {message.text && (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`, fontSize: '1em' }}>
                  {message.text}
                </div>
              )}
              <input placeholder="Search monitoring..." value={monitoringSearchQuery} onChange={(e) => setMonitoringSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div style={{ overflow: 'auto', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f1f1f1' }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Room</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Patient</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Time In</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Time Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonitoringVisitors.map((v) => (
                      <tr key={v.id}>
                        <td style={{ padding: '10px' }}>{v.name}</td>
                        <td style={{ padding: '10px' }}>{v.room}</td>
                        <td style={{ padding: '10px' }}>{v.patient}</td>
                        <td style={{ padding: '10px' }}>{v.timeIn}</td>
                        <td style={{ padding: '10px' }}>{v.timeOut || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'history' && (
            <div>
              <input placeholder="Search history..." value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div>{filteredHistoryVisitors.map(v => (
                <div key={v.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 700 }}>{v.name}</div>
                  <div style={{ color: '#666' }}>{v.room} — {v.patient}</div>
                  <div style={{ color: '#999', fontSize: '0.9em' }}>Registered: {v.fullDate}</div>
                </div>
              ))}</div>
            </div>
          )}

          {currentView === 'attendance' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Select Date</label>
              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />

              <div style={{ marginTop: '12px' }}>{attendanceVisitors.map(v => (
                <div key={v.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 700 }}>{v.name}</div>
                  <div style={{ color: '#666' }}>{v.room} — {v.timeIn} — {v.status}</div>
                  <div style={{ color: '#999', fontSize: '0.9em' }}>Registered: {v.fullDate}</div>
                </div>
              ))}</div>
            </div>
          )}

          {currentView === 'register' && (
            <div>
              {message.text && (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`, fontSize: '1em' }}>
                  {message.text}
                </div>
              )}

              {qrCodeUrl && registeredVisitorData && (
                <div style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '2px solid #1a8f6f' }}>
                  <h3 style={{ color: '#1a8f6f', marginBottom: '16px', textAlign: 'center', fontSize: '1.5em' }}> Registration Successful!</h3>
                  
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <strong style={{ color: '#1a8f6f' }}>Visitor ID:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.id}</span>
                      </div>
                      <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <strong style={{ color: '#1a8f6f' }}>Name:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.name}</span>
                      </div>
                      <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <strong style={{ color: '#1a8f6f' }}>Room:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.room}</span>
                      </div>
                      <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <strong style={{ color: '#1a8f6f' }}>Patient:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.patient}</span>
                      </div>
                      <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <strong style={{ color: '#1a8f6f' }}>Contact:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.contact}</span>
                      </div>
                      <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <strong style={{ color: '#1a8f6f' }}>Registration:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.registrationDateTime}</span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', background: 'white', padding: '15px', borderRadius: '8px' }}>
                      <img src={qrCodeUrl} alt="Visitor QR Code" style={{ borderRadius: '8px', border: '3px solid #1a8f6f', display: 'block' }} />
                      <p style={{ marginTop: '12px', fontSize: '0.9em', color: '#666', fontWeight: 'bold' }}>Scan to view visitor info</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={handleDownloadQR}
                      style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }}
                      onMouseOver={(e) => e.target.style.background = '#157a5e'}
                      onMouseOut={(e) => e.target.style.background = '#1a8f6f'}
                    >
                       Download QR Code
                    </button>
                    <button 
                      onClick={handlePrintQR}
                      style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }}
                      onMouseOver={(e) => e.target.style.background = '#0b5ed7'}
                      onMouseOut={(e) => e.target.style.background = '#0d6efd'}
                    >
                       Print QR Code
                    </button>
                    <button 
                      onClick={() => { setQrCodeUrl(null); setRegisteredVisitorData(null); }}
                      style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }}
                      onMouseOver={(e) => e.target.style.background = '#5c636a'}
                      onMouseOut={(e) => e.target.style.background = '#6c757d'}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Visitor Name:</label>
                  <input type="text" name="visitorName" value={formData.visitorName} onChange={handleInputChange} style={{ ...inputStyle, marginBottom: '16px' }} placeholder="Enter visitor's full name" />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Room Number:</label>
                  <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} style={{ ...inputStyle, marginBottom: '16px' }} placeholder="Enter room number" />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Patient Name:</label>
                  <input type="text" name="patientName" value={formData.patientName} onChange={handleInputChange} style={{ ...inputStyle, marginBottom: '16px' }} placeholder="Enter patient's name" />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Contact Number:</label>
                  <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} style={{ ...inputStyle, marginBottom: '16px' }} placeholder="Enter contact number" />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Photo (optional):</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: '8px' }} />
                {previewUrl && <img src={previewUrl} alt="preview" style={{ maxWidth: '200px', marginTop: '8px', borderRadius: '8px' }} />}
              </div>

              <button onClick={handleRegister} disabled={loading || uploadingImage} style={{ width: '100%', padding: '16px', background: loading || uploadingImage ? '#ccc' : '#1a8f6f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: loading || uploadingImage ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}>
                {uploadingImage ? 'UPLOADING IMAGE...' : loading ? 'REGISTERING...' : 'REGISTER'}
              </button>
            </div>
          )}
        </div>

        <div style={{ width: 260, background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
          <div onClick={() => showView('dashboard')} style={{ fontSize: 28, textAlign: 'center', marginBottom: 12, cursor: 'pointer' }}></div>
          <div onClick={() => showView('dashboard')} style={{ padding: 10, marginBottom: 8, background: currentView === 'dashboard' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'dashboard' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Dashboard</div>
          <div onClick={() => showView('visitorInfo')} style={{ padding: 10, marginBottom: 8, background: currentView === 'visitorInfo' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'visitorInfo' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>List of Visitors</div>
          <div onClick={() => showView('registered')} style={{ padding: 10, marginBottom: 8, background: currentView === 'registered' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'registered' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Registered Visitor</div>
          <div onClick={() => showView('monitoring')} style={{ padding: 10, marginBottom: 8, background: currentView === 'monitoring' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'monitoring' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Monitoring</div>
          <div onClick={() => showView('history')} style={{ padding: 10, marginBottom: 8, background: currentView === 'history' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'history' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Visitor's History</div>
          <div onClick={() => showView('attendance')} style={{ padding: 10, marginBottom: 16, background: currentView === 'attendance' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'attendance' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer' }}>Attendance</div>
          <button onClick={() => showView('register')} style={{ width: '100%', padding: 12, background: '#1a8f6f', color: 'white', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold' }}>REGISTER</button>
        </div>
      </div>
    </div>
  );
}
