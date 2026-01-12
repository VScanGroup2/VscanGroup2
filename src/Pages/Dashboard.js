import React, { useState, useEffect, useRef } from 'react';
import bgImage from '../Styles/bg.png';
import { listenVisitorsRealtime, addVisitor as addVisitorDoc, updateVisitor, recordAttendance, getAttendanceByDate, recordCheckout, recordDischarge, getVisitorVisitationHistory, getAllAttendance, deleteVisitor, deleteVisitorAttendance } from '../lib/firestore';
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
  const [monitoringTab, setMonitoringTab] = useState('active');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportDateFilter, setReportDateFilter] = useState('');
  const [reportTab, setReportTab] = useState('summary'); // 'summary' only
  const [securitySearchQuery, setSecuritySearchQuery] = useState('');
  const [securityTab, setSecurityTab] = useState('active');
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
  const [faceDetected, setFaceDetected] = useState(false);
  const [autoCaptureAttempted, setAutoCaptureAttempted] = useState(false);
  const [showVisitorSelector, setShowVisitorSelector] = useState(false);
  const [selectedVisitorForRegistration, setSelectedVisitorForRegistration] = useState(null);
  const [patientFormData, setPatientFormData] = useState({ patientName: '', roomNumber: '' });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const faceDetectionIntervalRef = useRef(null);
  // USB scanner (keyboard-wedge) support
  const [scannerBuffer, setScannerBuffer] = useState('');
  const scannerInputRef = useRef(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  // Admin delete functionality
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [deleteVisitorName, setDeleteVisitorName] = useState('');
  

  // Verify admin role access on mount
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'security') {
      // Security personnel trying to access admin dashboard - logout
      console.warn('Security personnel attempted to access admin dashboard');
      localStorage.removeItem('userRole');
      onLogout();
    }
  }, [onLogout]);

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

  // Debug scannedVisitorData state changes
  useEffect(() => {
    console.log('[Dashboard] scannedVisitorData changed:', scannedVisitorData);
  }, [scannedVisitorData]);

  useEffect(() => {
    console.log('[Dashboard] Setting up Firestore listener on mount...');
    // subscribe to Firestore visitors collection
    const unsub = listenVisitorsRealtime((data) => {
      console.log('[Dashboard] Received visitors data from Firestore:', data);
      console.log('[Dashboard] Number of visitors received:', data.length);
      // normalize Firestore fields to match UI expectations, including legacy docs
      const normalized = data.map(v => {
        // date and datetime fallbacks - ensure MM-DD-YY format
        let date = v.date || v.registrationDate || '';
        if (date && date.includes('/')) {
          // Convert MM/DD/YY to MM-DD-YY
          date = date.replace(/\//g, '-');
        }
        if (!date && v.timestamp) {
          date = new Date(v.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
        }
        if (!date && v.fullDate) {
          date = new Date(v.fullDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
        }
        if (!date) {
          date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
        }

        let fullDate = v.registrationFullDate || '';
        if (!fullDate && v.timestamp) {
          fullDate = new Date(v.timestamp).toLocaleString('en-US', { 
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        }
        if (!fullDate && v.fullDate) {
          fullDate = v.fullDate;
        }
        if (!fullDate) {
          fullDate = new Date().toLocaleString('en-US', { 
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        }

        // status normalization: support legacy values
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
          checkOutTime: v.checkOutTime || null,
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

  // Auto-activate USB scanner on mount
  useEffect(() => {
    console.log('[Dashboard] Auto-activating USB scanner on mount...');
    setScannerBuffer('');
    setScannerActive(true);
    setTimeout(() => {
      if (scannerInputRef.current) {
        scannerInputRef.current.focus();
        console.log('[Dashboard] USB scanner input focused');
      }
    }, 100);
  }, []);

  // Load attendance records when attendance date changes
  useEffect(() => {
    if (attendanceDate && currentView === 'attendance') {
      const loadAttendance = async () => {
        try {
          // Convert from YYYY-MM-DD to MM-DD-YY format
          const [year, month, day] = attendanceDate.split('-');
          const formattedDate = `${month}-${day}-${year.slice(-2)}`;
          
          console.log('[Dashboard] Loading attendance for date:', formattedDate);
          const records = await getAttendanceByDate(formattedDate);
          setAttendanceRecords(records);
          console.log('[Dashboard] Loaded', records.length, 'attendance records');
        } catch (err) {
          console.error('[Dashboard] Error loading attendance:', err);
          setAttendanceRecords([]);
        }
      };
      loadAttendance();
    }
  }, [attendanceDate, currentView]);

  // Load all attendance records for scan counting
  useEffect(() => {
    const loadAllAttendance = async () => {
      try {
        const records = await getAllAttendance();
        setAllAttendanceRecords(records);
        console.log('[Dashboard] Loaded', records.length, 'total attendance records for scan counting');
      } catch (error) {
        console.error('[Dashboard] Error loading attendance records:', error);
      }
    };
    
    loadAllAttendance();
  }, []);

  const showView = async (view) => {
    setCurrentView(view);
    
    // Load attendance records when viewing the report
    if (view === 'report') {
      try {
        console.log('[Dashboard] Loading attendance records for report...');
        const records = await getAllAttendance();
        setAllAttendanceRecords(records);
        console.log('[Dashboard] Loaded', records.length, 'attendance records');
      } catch (error) {
        console.error('[Dashboard] Error loading attendance records:', error);
        setMessage({ type: 'error', text: 'Error loading attendance records' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limit contact number to 11 digits only
    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, ''); // Remove all non-digits
      if (digitsOnly.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setSelectedFile(f || null);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  // Register a new visitor (called by the Register button)
  const handleRegister = async () => {
    if (!formData.visitorName || !formData.contactNumber) {
      setMessage({ type: 'error', text: 'Please fill in visitor name and contact number!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Check if a visitor was selected
    if (!selectedVisitorForRegistration) {
      setMessage({ type: 'error', text: 'Please select a visitor and room!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Check if a face photo was captured
    if (!previewUrl) {
      setMessage({ type: 'error', text: 'Please capture a face photo first!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Validate contact number has exactly 11 digits
    const contactNumberDigits = formData.contactNumber.replace(/\D/g, '');
    if (contactNumberDigits.length !== 11) {
      setMessage({ type: 'error', text: 'Contact number must consist of exactly 11 digits!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      
      // Convert captured photo (Data URL) to Blob and upload
      if (previewUrl) {
        try {
          setUploadingImage(true);
          console.log('[Dashboard] Starting face photo upload from camera capture');
          
          // Convert Data URL to Blob
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          const file = new File([blob], `face-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          const uploadRes = await uploadImageToCloudinary(file);
          photoUrl = uploadRes.secure_url || uploadRes.url || null;
          console.log('[Dashboard] Face photo uploaded successfully:', photoUrl);
        } catch (err) {
          console.error('[Dashboard] Face photo upload error:', err);
          let msg = 'Face photo upload failed. ';
          
          if (err.message.includes('too large')) {
            msg += 'File is too large. Please try capturing again.';
          } else if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
            msg += 'Network error - check your internet connection.';
          } else if (err.message.includes('configuration missing')) {
            msg += 'Cloudinary is not configured. Please contact administrator.';
          } else {
            msg += err.message;
          }
          
          setMessage({ type: 'error', text: msg });
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
      
      // Format date in MM-DD-YY format
      const registrationDate = now.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: '2-digit' 
      }).replace(/\//g, '-');

      const visitorData = {
        visitorName: formData.visitorName,
        roomNumber: selectedVisitorForRegistration.room,
        patientName: selectedVisitorForRegistration.patient,
        contactNumber: formData.contactNumber,
        timestamp: now.toISOString(),
        registrationFullDate: registrationDateTime,
        registrationDate: registrationDate,
        date: registrationDate,
        checkInTime: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        }),
        timeIn: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        }),
        status: 'active',
        justRegistered: true,
        photoUrl: photoUrl
      };

      const docId = await addVisitorDoc(visitorData);
      console.log('handleRegister: added visitor', docId);
      
      // Record attendance for the check-in
      try {
        const scanDate = visitorData.registrationDate;
        const scanTime = visitorData.checkInTime;
        await recordAttendance(docId, formData.visitorName, scanDate, scanTime);
        console.log('handleRegister: attendance recorded for', formData.visitorName);
      } catch (attendanceError) {
        console.error('handleRegister: error recording attendance:', attendanceError);
      }
      
      // Generate QR Code with photo included
      const qrData = JSON.stringify({
        id: docId,
        name: formData.visitorName,
        room: selectedVisitorForRegistration.room,
        patient: selectedVisitorForRegistration.patient,
        contact: formData.contactNumber,
        checkIn: visitorData.checkInTime,
        date: registrationDate,
        fullDateTime: registrationDateTime,
        photo: photoUrl
      });
      
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 800,
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
        room: selectedVisitorForRegistration.room,
        patient: selectedVisitorForRegistration.patient,
        contact: formData.contactNumber,
        checkIn: visitorData.checkInTime,
        registrationDateTime: registrationDateTime,
        photo: photoUrl
      });
      
      setMessage({ type: 'success', text: `Visitor registered successfully!` });
      setFormData({ visitorName: '', contactNumber: '' });
      setSelectedVisitorForRegistration(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsCameraActive(false);
      setFaceDetected(false);
      setAutoCaptureAttempted(false);
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
            <title>Visitor ID Card - ${registeredVisitorData.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background: #f5f5f5; }
              @media print {
                body { padding: 0; margin: 0; background: white; }
              }
              .id-card {
                width: 350px;
                height: 220px;
                margin: 20px auto;
                background: white;
                border: 3px solid #1a8f6f;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                page-break-after: avoid;
              }
              .card-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
              }
              .card-logo {
                text-align: left;
                flex: 1;
              }
              .card-logo h3 {
                margin: 0;
                font-size: 11px;
                color: #1a8f6f;
                line-height: 1.2;
              }
              .card-qr {
                flex-shrink: 0;
                margin-left: 10px;
              }
              .card-qr img {
                width: 120px;
                height: 120px;
                border: 2px solid #1a8f6f;
                padding: 2px;
                background: white;
              }
              .card-id-section {
                background: linear-gradient(135deg, #1a8f6f 0%, #158560 100%);
                color: white;
                border-radius: 6px;
                padding: 10px;
                margin: 5px 0;
                text-align: center;
              }
              .card-id-label {
                font-size: 10px;
                font-weight: bold;
                letter-spacing: 1px;
                margin-bottom: 3px;
              }
              .card-id-value {
                font-size: 24px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                letter-spacing: 2px;
              }
              .card-info {
                text-align: left;
                font-size: 10px;
                line-height: 1.4;
              }
              .card-info-row {
                display: flex;
                margin: 2px 0;
              }
              .card-label {
                font-weight: bold;
                width: 40px;
                color: #1a8f6f;
              }
              .card-value {
                flex: 1;
              }
            </style>
          </head>
          <body>
            <div class="id-card">
              <div class="card-top">
                <div class="card-logo">
                  <h3>IGNACIO LACSON<br/>ARROYO MEMORIAL<br/>HOSPITAL</h3>
                </div>
                <div class="card-qr">
                  <img src="${qrCodeUrl}" alt="QR Code" />
                </div>
              </div>
              
              <div class="card-id-section">
                <div class="card-id-label">VISITOR ID</div>
                <div class="card-id-value">${registeredVisitorData.id}</div>
              </div>
              
              <div class="card-info">
                <div class="card-info-row">
                  <span class="card-label">Name:</span>
                  <span class="card-value">${registeredVisitorData.name}</span>
                </div>
              </div>
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

      // Find visitor to get their name for attendance record
      const visitor = visitors.find(v => v.id === visitorId);

      if (!visitor) {
        setMessage({ type: 'error', text: 'Visitor not found!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      // Update visitor status to discharged
      await updateVisitor(visitorId, {
        status: 'discharged',
        dischargeTime: now.toISOString()
      });

      // Record discharge event in attendance collection (SEPARATE from checkout/time-out)
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
      
      await recordDischarge(visitorId, visitor.name, dischargeDate, dischargeTime);
      console.log('[Dashboard] DISCHARGE event recorded for attendance report');

      setMessage({ type: 'success', text: 'Visitor discharged successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Discharge error:', error);
      const errMsg = error && error.message ? error.message : String(error);
      setMessage({ type: 'error', text: `Error discharging visitor: ${errMsg}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 6000);
    }
  };

  const handleQRScan = async () => {
    try {
      if (!qrScanInput.trim()) {
        setMessage({ type: 'error', text: 'Please enter QR code data!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }

      const qrData = JSON.parse(qrScanInput);
      const visitor = visitors.find(v => v.id === qrData.id);
      
      if (visitor) {
        // Check if visitor is already checked-in (active)
        if (visitor.status === 'checked-in' || visitor.status === 'active') {
          // Check if this is a second scan (already has checkOutTime) or first scan (no checkOutTime)
          if (visitor.checkOutTime) {
            // Already has time-out recorded, just show info
            setScannedVisitorData(visitor);
            setMessage({ type: 'info', text: `${visitor.visitorName} already timed out at ${visitor.checkOutTime}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
          } else {
            // First scan after check-in - record as time-out on second scan
            const now = new Date();
            const checkOutTime = now.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: true 
            });

            const checkOutDate = now.toLocaleDateString('en-US', { 
              month: '2-digit', 
              day: '2-digit', 
              year: '2-digit' 
            }).replace(/\//g, '-');
            
            updateVisitor(visitor.id, {
              checkOutTime: checkOutTime,
              checkOutDate: checkOutDate,
              status: 'checked-out'
            });

            // Record checkout in attendance
            try {
              await recordCheckout(visitor.id, visitor.visitorName, checkOutDate, checkOutTime);
              console.log('handleQRScan: checkout recorded for', visitor.visitorName);
            } catch (attendanceError) {
              console.warn('handleQRScan: error recording checkout:', attendanceError);
            }
            
            const updatedVisitor = { ...visitor, checkOutTime: checkOutTime, checkOutDate: checkOutDate };
            setScannedVisitorData(updatedVisitor);
            setMessage({ type: 'success', text: `${visitor.visitorName} has timed out at ${checkOutTime}!` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
          }
        } else {
          // Visitor already discharged - show their info
          setScannedVisitorData(visitor);
          setMessage({ type: 'info', text: 'Visitor status: ' + visitor.status });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
        setQrScanInput('');
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

  // Record attendance scan
  const recordScan = async (visitorId, visitorName) => {
    try {
      const now = new Date();
      const scanDate = now.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: '2-digit' 
      }).replace(/\//g, '-');
      const scanTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      
      await recordAttendance(visitorId, visitorName, scanDate, scanTime);
      console.log('[Dashboard] Attendance recorded for:', visitorName);
      
      // Refresh attendance records after recording
      await refreshAttendanceRecords();
    } catch (err) {
      console.error('[Dashboard] Error recording attendance:', err);
    }
  };

  // Refresh all attendance records
  const refreshAttendanceRecords = async () => {
    try {
      const records = await getAllAttendance();
      setAllAttendanceRecords(records);
      console.log('[Dashboard] Refreshed attendance records:', records.length);
    } catch (err) {
      console.error('[Dashboard] Error refreshing attendance records:', err);
    }
  };

  // Delete visitor records by name
  const deleteVisitorByName = async (visitorName) => {
    try {
      setLoading(true);
      const nameLower = visitorName.toLowerCase().trim();
      const visitorToDelete = visitors.find(v => (v.visitorName || v.name || '').toLowerCase() === nameLower);
      
      if (!visitorToDelete) {
        setMessage({ type: 'error', text: `Visitor "${visitorName}" not found in system.` });
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return false;
      }

      console.log('[Dashboard] Starting deletion for visitor:', visitorToDelete.id, visitorName);
      
      // Delete all attendance records for this visitor first
      let deletedAttendanceCount = 0;
      try {
        deletedAttendanceCount = await deleteVisitorAttendance(visitorToDelete.id);
        console.log(`[Dashboard] Deleted ${deletedAttendanceCount} attendance record(s)`);
      } catch (attendanceErr) {
        console.error('[Dashboard] Error deleting attendance records:', attendanceErr);
        setMessage({ type: 'error', text: `Error deleting attendance records: ${attendanceErr.message}` });
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        return false;
      }
      
      // Delete the visitor document
      try {
        await deleteVisitor(visitorToDelete.id);
        console.log(`[Dashboard] Deleted visitor document`);
      } catch (visitorErr) {
        console.error('[Dashboard] Error deleting visitor document:', visitorErr);
        setMessage({ type: 'error', text: `Error deleting visitor: ${visitorErr.message}` });
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        return false;
      }
      
      // Wait a moment then refresh the data
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshAttendanceRecords();
      
      setMessage({ type: 'success', text: `Successfully deleted "${visitorName}" and ${deletedAttendanceCount} record(s).` });
      setDeleteVisitorName('');
      setShowDeletePanel(false);
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return true;
    } catch (err) {
      console.error('[Dashboard] Error in deleteVisitorByName:', err);
      setMessage({ type: 'error', text: `Deletion error: ${err.message}` });
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return false;
    }
  };

  // Batch delete multiple visitors
  const deleteMultipleVisitors = async (visitorNames) => {
    console.log('[Dashboard] Starting batch deletion for:', visitorNames);
    setLoading(true);
    
    let successCount = 0;
    let failCount = 0;

    for (const name of visitorNames) {
      const result = await deleteVisitorByName(name);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setLoading(false);
    const summaryMsg = `Deletion complete: ${successCount} deleted, ${failCount} failed.`;
    setMessage({ type: successCount > 0 ? 'success' : 'error', text: summaryMsg });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

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

  // Parse QR/string from scanner and load visitor info (shared logic)
  // Alternating scan system: odd scans (1,3,5...) = Time-in, even scans (2,4,6...) = Time-out
  const parseQrString = async (raw) => {
    try {
      console.log('[parseQrString] ENTERED with raw:', raw, 'typeof:', typeof raw, 'length:', raw ? raw.length : 'null');
      if (!raw || !raw.trim()) return false;
      const trimmed = raw.trim();
      let qrData;
      try {
        qrData = JSON.parse(trimmed);
      } catch (e) {
        // Not JSON — treat as ID lookup
        const visitor = visitors.find(v => v.id === trimmed || v.id === trimmed.replace(/\r|\n/g, ''));
        if (visitor) {
          // Get today's date for scan counting
          const now = new Date();
          const currentDate = now.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: '2-digit' 
          }).replace(/\//g, '-'); // Convert slashes to dashes: MM-DD-YY
          
          // Count scans for this visitor today
          const todayScans = allAttendanceRecords.filter(record => {
            const recordDate = (record.scanDate || record.checkInDate || record.date || '').replace(/\//g, '-');
            return record.visitorId === visitor.id && recordDate === currentDate;
          });
          
          const scanCount = todayScans.length + 1; // +1 for current scan
          const isOddScan = scanCount % 2 === 1; // 1, 3, 5... are odd scans = time-in
          console.log('[Dashboard NON-JSON] Visitor:', visitor.name, 'ID:', visitor.id, 'ScanCount:', scanCount, 'isOddScan:', isOddScan, 'todayScansCount:', todayScans.length);
          
          const currentTime = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
          });
          const checkInDate = now.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: '2-digit' 
          }).replace(/\//g, '-'); // Convert slashes to dashes: MM-DD-YY

          if (isOddScan) {
            // ODD SCAN - Record as Time-in
            console.log('[Dashboard] Scan #' + scanCount + ' for:', visitor.name, ' - Recording as TIME-IN at', currentTime);
            
            // Record check-in attendance scan
            await recordScan(visitor.id, visitor.name);
            
            // Only update main fields if this is the first scan (scan 1)
            if (scanCount === 1) {
              await updateVisitor(visitor.id, {
                checkInTime: currentTime,
                timeIn: currentTime,
                registrationDate: checkInDate,
                date: checkInDate,
                status: 'active'
              });
            } else {
              // For scan 3+, just mark as active but don't overwrite the original timeIn
              await updateVisitor(visitor.id, {
                status: 'active',
                checkOutTime: null,
                checkOutDate: null
              });
            }
            console.log('[Dashboard] TIME-IN update sent to Firestore');
            
            const updatedVisitor = { 
              ...visitor, 
              timeIn: currentTime, 
              date: checkInDate, 
              fullDate: checkInDate,
              status: 'active'
            };
            console.log('[parseQrString-ID-TIMEIN] About to call setScannedVisitorData with:', updatedVisitor);
            setScannedVisitorData(updatedVisitor);
            setMessage({ type: 'success', text: `${visitor.name} - Scan #${scanCount} (TIME-IN) recorded at ${currentTime}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
          } else {
            // EVEN SCAN - Record as Time-out (visitor can check back in)
            console.log('[Dashboard] Scan #' + scanCount + ' for:', visitor.name, ' - Recording as TIME-OUT at', currentTime);
            const checkOutDate = now.toLocaleDateString('en-US', { 
              month: '2-digit', 
              day: '2-digit', 
              year: '2-digit' 
            }).replace(/\//g, '-');
            
            // Record checkout event in attendance collection FIRST
            await recordCheckout(visitor.id, visitor.name, checkOutDate, currentTime);
            console.log('[Dashboard] Checkout event recorded for attendance report');
            
            // Refresh attendance records after recording checkout
            await refreshAttendanceRecords();
            
            // Then update visitor status
            await updateVisitor(visitor.id, {
              checkOutTime: currentTime,
              timeOut: currentTime,
              checkOutDate: checkOutDate,
              status: 'active'
            });
            console.log('[Dashboard] TIME-OUT update sent to Firestore');
            
            const updatedVisitor = { ...visitor, timeOut: currentTime, fullDate: visitor.date || checkInDate, status: 'active' };
            console.log('[parseQrString-ID-TIMEOUT] About to call setScannedVisitorData with:', updatedVisitor);
            setScannedVisitorData(updatedVisitor);
            setMessage({ type: 'success', text: `${visitor.name} - Scan #${scanCount} (TIME-OUT) recorded at ${currentTime}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
          }
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
          console.log('[Dashboard JSON] Visitor:', visitor.name, 'ID:', visitor.id, 'ScanCount:', scanCount, 'isOddScan:', isOddScan, 'todayScansCount:', todayScans.length);
          
          const currentTime = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
          });
          const checkInDate = now.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: '2-digit' 
          }).replace(/\//g, '-');

          if (isOddScan) {
            // ODD SCAN - Record as Time-in
            console.log('[Dashboard] Scan #' + scanCount + ' for:', visitor.name, ' - Recording as TIME-IN at', currentTime);
            
            // Record check-in attendance scan
            await recordScan(visitor.id, visitor.name);
            
            // Only update main fields if this is the first scan (scan 1)
            if (scanCount === 1) {
              await updateVisitor(visitor.id, {
                checkInTime: currentTime,
                timeIn: currentTime,
                registrationDate: checkInDate,
                date: checkInDate,
                status: 'active'
              });
            } else {
              // For scan 3+, just mark as active but don't overwrite the original timeIn
              await updateVisitor(visitor.id, {
                status: 'active',
                checkOutTime: null,
                checkOutDate: null
              });
            }
            console.log('[Dashboard] TIME-IN update sent to Firestore');
            
            const updatedVisitor = { 
              ...visitor, 
              timeIn: currentTime, 
              date: checkInDate, 
              fullDate: checkInDate,
              status: 'active'
            };
            console.log('[parseQrString-JSON-TIMEIN] About to call setScannedVisitorData with:', updatedVisitor);
            setScannedVisitorData(updatedVisitor);
            setMessage({ type: 'success', text: `${visitor.name} - Scan #${scanCount} (TIME-IN) recorded at ${currentTime}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
          } else {
            // EVEN SCAN - Record as Time-out (visitor can check back in)
            console.log('[Dashboard] Scan #' + scanCount + ' for:', visitor.name, ' - Recording as TIME-OUT at', currentTime);
            const checkOutDate = now.toLocaleDateString('en-US', { 
              month: '2-digit', 
              day: '2-digit', 
              year: '2-digit' 
            }).replace(/\//g, '-');
            
            // Record checkout event in attendance collection FIRST
            await recordCheckout(visitor.id, visitor.name, checkOutDate, currentTime);
            console.log('[Dashboard] Checkout event recorded for attendance report');
            
            // Refresh attendance records after recording checkout
            await refreshAttendanceRecords();
            
            // Then update visitor status
            await updateVisitor(visitor.id, {
              checkOutTime: currentTime,
              timeOut: currentTime,
              checkOutDate: checkOutDate,
              status: 'active'
            });
            console.log('[Dashboard] TIME-OUT update sent to Firestore');
            
            const updatedVisitor = { ...visitor, timeOut: currentTime, fullDate: visitor.date || checkInDate, status: 'active' };
            console.log('[parseQrString-JSON-TIMEOUT] About to call setScannedVisitorData with:', updatedVisitor);
            setScannedVisitorData(updatedVisitor);
            setMessage({ type: 'success', text: `${visitor.name} - Scan #${scanCount} (TIME-OUT) recorded at ${currentTime}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
          }
          return true;
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
          console.log('[parseQrString-JSON-NO-VISITOR] About to call setScannedVisitorData with scannedData:', scannedData);
          setScannedVisitorData(scannedData);
          setMessage({ type: 'success', text: 'Visitor information loaded from scanner.' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
        return true;
      }
    } catch (err) {
      console.error('parseQrString error', err);
    }
    setMessage({ type: 'error', text: 'Unable to parse scanned data.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    return false;
  };

  const activateUsbScanner = async () => {
    try {
      setCameraError('');
      // Request only USB cameras, not laptop camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Filter for USB cameras only - check for common USB camera indicators
      const usbDevices = videoDevices.filter(device => 
        device.label && (
          device.label.toLowerCase().includes('usb') || 
          device.label.toLowerCase().includes('webcam') ||
          device.label.toLowerCase().includes('camera') ||
          device.label.toLowerCase().includes('external')
        )
      );
      
      // If no obvious USB devices found, use any available video device except built-in/integrated ones
      let selectedDevice = usbDevices.length > 0 ? usbDevices[0] : null;
      
      if (!selectedDevice && videoDevices.length > 0) {
        // Try to exclude integrated cameras and use the first external camera
        selectedDevice = videoDevices.find(device => 
          !device.label.toLowerCase().includes('integrated') && 
          !device.label.toLowerCase().includes('built-in') &&
          !device.label.toLowerCase().includes('facetime')
        ) || videoDevices[0];
      }
      
      if (!selectedDevice) {
        setCameraError('No camera device found. Please connect a USB Web Camera.');
        setMessage({ type: 'error', text: 'No camera found. Please connect a USB camera and try again.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        return;
      }
      
      const deviceId = selectedDevice.deviceId;
      
      const constraints = {
        video: { deviceId: { exact: deviceId } }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // First, activate camera to render the video element
      setIsCameraActive(true);
      
      // Then, assign stream to video element once it's rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready before marking as ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(err => {
              console.error('Play error:', err);
              setMessage({ type: 'error', text: 'Failed to start video playback.' });
            });
            setMessage({ type: 'success', text: 'Camera activated — ready to capture face.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
          };
        } else {
          console.error('videoRef.current is null after rendering');
          setMessage({ type: 'error', text: 'Video element not initialized.' });
          setIsCameraActive(false);
        }
      }, 0);
      
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please check camera connection and permissions.');
      setMessage({ type: 'error', text: 'Cannot access camera. Check connection and camera permissions.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // Face detection and auto-capture functionality
  const detectFaceAndAutoCapture = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Get image data for face detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple brightness/contrast analysis to detect if someone is in front of camera
    // Calculate average brightness and check for significant variations (face detection)
    let brightPixels = 0;
    let totalPixels = 0;

    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Count pixels that are in typical skin tone range or have significant color
      if (
        (r > 50 && g > 50 && b > 50 && r < 250 && g < 250 && b < 250) ||
        (Math.abs(r - g) > 10 || Math.abs(g - b) > 10 || Math.abs(r - b) > 10)
      ) {
        brightPixels++;
      }
      totalPixels++;
    }

    // Calculate face presence percentage
    const facePresencePercentage = (brightPixels / totalPixels) * 100;

    // If significant face/person detected (30-95% of image has face-like features)
    if (facePresencePercentage > 30 && facePresencePercentage < 95) {
      setFaceDetected(true);

      // Auto-capture if not already attempted in this session
      if (!autoCaptureAttempted && previewUrl === null) {
        console.log('[Face Detection] Face detected! Auto-capturing...');
        setAutoCaptureAttempted(true);

        // Get current time and check readiness
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            // Create a new canvas for capture
            const captureCanvas = document.createElement('canvas');
            captureCanvas.width = video.videoWidth;
            captureCanvas.height = video.videoHeight;
            const captureCtx = captureCanvas.getContext('2d');
            captureCtx.drawImage(video, 0, 0);

            // Convert to image data
            const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.95);

            setPreviewUrl(imageDataUrl);
            setMessage({
              type: 'success',
              text: '✓ Face captured automatically! Ready to register.'
            });

            setTimeout(() => setMessage({ type: '', text: '' }), 4000);

            // Stop the face detection after capture
            if (faceDetectionIntervalRef.current) {
              clearInterval(faceDetectionIntervalRef.current);
              faceDetectionIntervalRef.current = null;
            }
          } catch (error) {
            console.error('[Face Detection] Auto-capture error:', error);
            setAutoCaptureAttempted(false);
          }
        }
      }
    } else {
      setFaceDetected(false);
    }
  };

  // Start face detection when camera is active
  useEffect(() => {
    if (isCameraActive && currentView === 'register' && !previewUrl && !autoCaptureAttempted) {
      // Start face detection every 300ms
      faceDetectionIntervalRef.current = setInterval(() => {
        detectFaceAndAutoCapture();
      }, 300);

      return () => {
        if (faceDetectionIntervalRef.current) {
          clearInterval(faceDetectionIntervalRef.current);
          faceDetectionIntervalRef.current = null;
        }
      };
    }
  }, [isCameraActive, currentView, previewUrl, autoCaptureAttempted]);

  const handleScannerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const data = scannerBuffer.trim();
      console.log('[Scanner] Enter pressed with data:', data);
      if (data) {
        setScannerBuffer('');
        setIsProcessingQR(true);
        console.log('[Scanner] Processing QR/ID:', data);
        parseQrString(data);
        // Clear processing state after a delay (gives time for state updates to process)
        setTimeout(() => {
          setIsProcessingQR(false);
        }, 1500);
        // keep input focused for next scan
        setTimeout(() => {
          if (scannerInputRef.current) {
            scannerInputRef.current.focus();
            console.log('[Scanner] Input refocused');
          }
        }, 50);
      } else {
        console.log('[Scanner] Empty data, ignoring');
      }
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

    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
    
    setIsCameraActive(false);
    setFaceDetected(false);
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

  useEffect(() => {
    if (currentView === 'monitoring' && scannerInputRef.current) {
      setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 100);
    }
  }, [currentView]);

  const activeVisitors = visitors.filter(v => v.status === 'active');
  const filteredVisitors = visitors.filter(v => {
    const q = searchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.room.toLowerCase().includes(q) || v.patient.toLowerCase().includes(q) || v.date.toLowerCase().includes(q);
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
    return (v.name && v.name.toLowerCase().includes(q)) || 
           (v.room && v.room.toLowerCase().includes(q)) || 
           (v.patient && v.patient.toLowerCase().includes(q)) || 
           (v.date && v.date.toLowerCase().includes(q)) ||
           (v.timeIn && v.timeIn.toLowerCase().includes(q)) ||
           (v.timeOut && v.timeOut && v.timeOut.toLowerCase().includes(q));
  });
  const attendanceVisitors = attendanceDate ? visitors.filter(v => {
    // Convert attendanceDate from YYYY-MM-DD to MM-DD-YY format to match v.date
    if (!attendanceDate) return false;
    const [year, month, day] = attendanceDate.split('-');
    const formattedDate = `${month}-${day}-${year.slice(-2)}`;
    return v.date === formattedDate;
  }) : visitors;

  const inputStyle = { width: '100%', padding: '16px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '1.2em', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'white' };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    onLogout();
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div style={{ background: '#1a8f6f', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '5px' }}>IGNACIO LACSON ARROYO MEMORIAL HOSPITAL</div>
          <div style={{ fontSize: '1em', fontWeight: '600', letterSpacing: '1px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '6px 16px', borderRadius: '20px' }}>ADMIN DASHBOARD</div>
        </div>
        <button onClick={handleLogout} style={{ padding: '12px 30px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', flex: 1, width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '20px', gap: '20px', overflow: 'hidden' }}>
        {currentView === 'monitoring' && (
        <div style={{ width: 240, background: 'white', borderRadius: 12, padding: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'sticky', top: '20px', height: 'calc(100vh - 60px)', maxHeight: '100vh' }}>
          {!scannedVisitorData && (
            <>
              <h2 style={{ color: '#1a8f6f', marginBottom: '18px', fontSize: '1.3em', textAlign: 'center', borderBottom: '2px solid #1a8f6f', paddingBottom: '10px', fontWeight: '700' }}> SCANNER</h2>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', scrollbarGutter: 'stable' }}>
                <div style={{ marginBottom: '16px' }}>
                  <input 
                    ref={scannerInputRef}
                    type="text"
                    placeholder=""
                    value={scannerBuffer}
                    onChange={(e) => {
                      console.log('[Scanner Input] Value changed:', e.target.value);
                      setScannerBuffer(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #ccc',
                      borderRadius: '6px',
                      fontSize: '0.85em',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s',
                      outline: 'none',
                      background: '#fff',
                      marginBottom: '12px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1a8f6f';
                      e.target.style.boxShadow = '0 0 6px rgba(26, 143, 111, 0.3)';
                      setScannerActive(true);
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#ccc';
                      e.target.style.boxShadow = 'none';
                    }}
                    onKeyDown={handleScannerKeyDown}
                  />
                  <button
                    onClick={() => {
                      // Ensure input is focused to capture any pending scanner data
                      if (scannerInputRef.current) {
                        scannerInputRef.current.focus();
                      }
                      const data = scannerBuffer.trim();
                      console.log('[Scanner Button] Scan pressed with data:', data, 'scannerBuffer:', scannerBuffer);
                      if (data) {
                        setScannerBuffer('');
                        setIsProcessingQR(true);
                        console.log('[Scanner Button] Processing QR/ID:', data);
                        parseQrString(data);
                        // Clear processing state after a delay (gives time for state updates to process)
                        setTimeout(() => {
                          setIsProcessingQR(false);
                        }, 1500);
                        // keep input focused for next scan
                        setTimeout(() => {
                          if (scannerInputRef.current) {
                            scannerInputRef.current.focus();
                            console.log('[Scanner Button] Input refocused');
                          }
                        }, 50);
                      } else {
                        setMessage({ type: 'error', text: 'Please enter or scan a QR/ID first!' });
                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#1a8f6f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '1em',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginBottom: '12px',
                      boxShadow: '0 3px 8px rgba(26, 143, 111, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#158f6f';
                      e.target.style.boxShadow = '0 5px 12px rgba(26, 143, 111, 0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#1a8f6f';
                      e.target.style.boxShadow = '0 3px 8px rgba(26, 143, 111, 0.3)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    🔍 SCAN
                  </button>
                  <div style={{
                    background: isProcessingQR ? '#e3f2fd' : '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: `2px solid ${isProcessingQR ? '#1a8f6f' : '#ddd'}`,
                    textAlign: 'center',
                    color: isProcessingQR ? '#1a8f6f' : '#1a8f6f',
                    fontSize: '0.9em',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isProcessingQR ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#1a8f6f',
                          animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#1a8f6f',
                          animation: 'pulse 1.5s ease-in-out 0.3s infinite'
                        }} />
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#1a8f6f',
                          animation: 'pulse 1.5s ease-in-out 0.6s infinite'
                        }} />
                        <span style={{ marginLeft: '8px' }}>Scanning...</span>
                      </div>
                    ) : (
                      '✓ Ready to scan'
                    )}
                  </div>
                
                </div>
              </div>
            </>
          )}

          {scannedVisitorData && (
            <div style={{ 
              marginTop: '24px', 
              padding: '24px', 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
              borderRadius: '14px', 
              border: '3px solid #1a8f6f',
              boxShadow: '0 6px 16px rgba(26, 143, 111, 0.2)',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarGutter: 'stable',
              maxHeight: 'calc(100vh - 80px)',
              minHeight: '300px',
              flex: '1'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid rgba(26, 143, 111, 0.2)' }}>
                <h3 style={{ color: '#1a8f6f', margin: 0, fontSize: '1.4em', fontWeight: '700' }}>VISITOR VERIFIED</h3>
                <button 
                  onClick={() => setScannedVisitorData(null)}
                  style={{ 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '0.95em',
                    fontWeight: '700',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 6px rgba(220, 53, 69, 0.2)'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#c82333'}
                  onMouseOut={(e) => e.target.style.background = '#dc3545'}
                >
                  Clear
                </button>
              </div>

              {scannedVisitorData.photo && (
                <div style={{ marginBottom: '24px', textAlign: 'center', padding: '18px', background: 'white', borderRadius: '10px', boxShadow: '0 3px 8px rgba(0,0,0,0.1)' }}>
                  <img 
                    src={scannedVisitorData.photo} 
                    alt="Visitor" 
                    style={{ 
                      width: '140px', 
                      height: '140px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '5px solid #1a8f6f',
                      boxShadow: '0 6px 14px rgba(26, 143, 111, 0.25)',
                      marginBottom: '10px'
                    }} 
                  />
                  <div style={{ 
                    fontSize: '0.8em', 
                    color: '#1a8f6f', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Verified Photo ID
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Visitor Name</div>
                <div style={{ fontWeight: '700', color: '#1a8f6f', fontSize: '1.4em' }}>{scannedVisitorData.name}</div>
              </div>

              <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Contact Number</div>
                <div style={{ fontWeight: '700', color: '#333', fontSize: '1.3em' }}>{scannedVisitorData.contact}</div>
              </div>

              <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Room Number</div>
                <div style={{ fontWeight: '700', color: '#333', fontSize: '1.3em' }}>{scannedVisitorData.room}</div>
              </div>

              <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Patient Name</div>
                <div style={{ fontWeight: '700', color: '#333', fontSize: '1.3em' }}>{scannedVisitorData.patient}</div>
              </div>

              <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Time-In</div>
                <div style={{ fontWeight: '700', color: '#333', fontSize: '1.3em' }}>{scannedVisitorData.timeIn}</div>
              </div>

              {scannedVisitorData.timeOut && (
                <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Check-Out Time</div>
                  <div style={{ fontWeight: '700', color: '#333', fontSize: '1.3em' }}>{scannedVisitorData.timeOut}</div>
                </div>
              )}

              <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Registration Date</div>
                <div style={{ fontWeight: '700', color: '#333', fontSize: '1em' }}>{scannedVisitorData.fullDate}</div>
              </div>

              <div style={{ padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.73em', color: '#666', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Current Status</div>
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
                  {scannedVisitorData.status === 'active' ? 'ACTIVE' : 'DISCHARGED'}
                </span>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: '#f0f8f5', borderRadius: '8px', border: '2px solid #1a8f6f' }}>
                <h4 style={{ color: '#1a8f6f', margin: '0 0 14px 0', fontSize: '1em', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Records</h4>
                {allAttendanceRecords && allAttendanceRecords.filter(r => r.visitorId === scannedVisitorData.id).length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', scrollbarGutter: 'stable' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                      <thead>
                        <tr style={{ background: '#1a8f6f', color: 'white', stickyTop: 0 }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', borderBottom: '2px solid #0d5443' }}>Date</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', borderBottom: '2px solid #0d5443' }}>Time</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', borderBottom: '2px solid #0d5443' }}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAttendanceRecords.filter(r => r.visitorId === scannedVisitorData.id).sort((a, b) => {
                          const dateA = new Date(a.scanDate || a.checkInDate || a.date || '');
                          const dateB = new Date(b.scanDate || b.checkInDate || b.date || '');
                          return dateB - dateA; // Most recent first
                        }).map((record, idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f9fdf7', borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '10px', fontWeight: '600', color: '#333' }}>{record.scanDate || record.checkInDate || record.date || 'N/A'}</td>
                            <td style={{ padding: '10px', fontWeight: '600', color: '#333' }}>{record.scanTime || record.checkInTime || record.checkoutTime || record.timeOut || 'N/A'}</td>
                            <td style={{ padding: '10px', fontWeight: '700', color: record.eventType === 'checkout' ? '#dc3545' : '#28a745' }}>
                              {record.eventType === 'checkout' ? 'TIME-OUT' : 'TIME-IN'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No attendance records found</div>
                )}
              </div>
            </div>
          )}
        </div>
        )}
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable', position: 'relative' }}>
          <h1 style={{ color: '#1a8f6f', marginBottom: '20px', fontSize: '2em', fontWeight: 'bold', position: 'sticky', top: 0, backgroundColor: 'white', paddingBottom: '10px', zIndex: 5 }}>{currentView === 'dashboard' ? 'DASHBOARD' : currentView === 'visitorInfo' ? "LIST OF VISITORS" : currentView === 'registered' ? 'REGISTERED VISITOR' : currentView === 'monitoring' ? 'MONITORING' : currentView === 'report' ? 'VISITOR REPORT' : currentView === 'patientData' ? 'PATIENT DATA' : currentView === 'register' ? 'REGISTER NEW VISITOR' : 'DASHBOARD'}</h1>

          {currentView === 'dashboard' && (
            <>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px', background: '#f8f9fa', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.1em', color: '#27ae60', fontWeight: 'bold' }}>Active Visitors</div>
                  <div style={{ fontSize: '1.6em', color: '#1a8f6f', fontWeight: '700' }}>{activeVisitors.length}</div>
                </div>
                <div style={{ background: '#1a8f6f', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: '700' }}>
                  <div style={{ fontSize: '0.9em', marginBottom: '3px' }}>DATE: {currentDate}</div>
                  <div style={{ fontSize: '1.1em' }}>TIME: {currentTime}</div>
                </div>
              </div>

              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 300px)', minWidth: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead style={{ background: '#f1f1f1' }}>
                    <tr>
                      <th style={{ padding: '14px', textAlign: 'left', fontSize: '1.1em', fontWeight: 'bold' }}>Name</th>
                      <th style={{ padding: '14px', textAlign: 'left', fontSize: '1.1em', fontWeight: 'bold' }}>Room</th>
                      <th style={{ padding: '14px', textAlign: 'left', fontSize: '1.1em', fontWeight: 'bold' }}>Patient Name</th>
                      <th style={{ padding: '14px', textAlign: 'left', fontSize: '1.1em', fontWeight: 'bold' }}>Contact Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVisitors.map((v) => (
                      <tr key={v.id}>
                        <td style={{ padding: '14px', fontSize: '1.05em' }}>{v.name}</td>
                        <td style={{ padding: '14px', fontSize: '1.05em' }}>{v.room}</td>
                        <td style={{ padding: '14px', fontSize: '1.05em' }}>{v.patient}</td>
                        <td style={{ padding: '14px', fontSize: '1.05em' }}>{v.contact}</td>
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
              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 200px)', minWidth: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', tableLayout: 'fixed' }}>
                  <thead style={{ background: '#1a8f6f', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Name</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Room</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Patient Name</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Contact Number</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Registration Date</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Time In</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Time Out</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Discharge Date(s)</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.95em', fontWeight: 'bold', position: 'sticky', top: 0, background: '#1a8f6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((v) => {
                      // Helper function to parse time string to minutes
                      const parseTimeToMinutes = (timeStr) => {
                        if (!timeStr) return -1;
                        const match = timeStr.match(/(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?/i);
                        if (match) {
                          let hours = parseInt(match[1]);
                          const minutes = parseInt(match[2]);
                          const ampm = match[4];
                          if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                          if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                          return hours * 60 + minutes;
                        }
                        return -1;
                      };
                      
                      // Get all attendance records for this visitor
                      const visitorRecords = allAttendanceRecords.filter(
                        record => record.visitorId === v.id
                      );
                      
                      // Get today's date in MM-DD-YY format
                      const today = new Date();
                      const todayFormatted = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${String(today.getFullYear()).slice(-2)}`;
                      
                      // Get today's records for this visitor
                      const todayRecords = visitorRecords.filter(r => {
                        const recordDate = r.scanDate || r.checkInDate || r.date || '';
                        return recordDate === todayFormatted;
                      });
                      
                      // Use registration time as time-in (from visitor document)
                      let displayTimeIn = v.timeIn || v.checkInTime;
                      let displayTimeOut = v.timeOut;
                      
                      // Only recalculate time-out if there are attendance records with multiple scans
                      if (todayRecords.length > 1) {
                        // Get all times from today's records
                        const allTimes = todayRecords.map(r => ({
                          time: r.checkInTime || r.checkOutTime || r.timeIn || r.timeOut || r.scanTime || '',
                          minutes: parseTimeToMinutes(r.checkInTime || r.checkOutTime || r.timeIn || r.timeOut || r.scanTime || '')
                        })).filter(t => t.minutes >= 0);
                        
                        if (allTimes.length > 1) {
                          // Sort by time to get earliest and latest
                          allTimes.sort((a, b) => a.minutes - b.minutes);
                          // Set time-out as the latest time
                          displayTimeOut = allTimes[allTimes.length - 1].time;
                        }
                      }
                      
                      // Get all discharge records for this visitor
                      const dischargeRecords = allAttendanceRecords.filter(r => r.visitorId === v.id && r.eventType === 'discharge');
                      
                      // Build discharge dates from ALL records
                      let allDischargeDates = [];
                      dischargeRecords.forEach(record => {
                        if (record.dischargeDate && !allDischargeDates.includes(record.dischargeDate)) {
                          allDischargeDates.push(record.dischargeDate);
                        }
                      });
                      
                      // Fallback to visitor object if no records found
                      if (allDischargeDates.length === 0 && v.dischargeTime) {
                        const fallbackDate = typeof v.dischargeTime === 'string' ? v.dischargeTime : new Date(v.dischargeTime).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
                        if (fallbackDate) {
                          allDischargeDates.push(fallbackDate);
                        }
                      }
                      
                      // Fallback to dischargeDate field if still empty
                      if (allDischargeDates.length === 0 && v.dischargeDate) {
                        allDischargeDates.push(v.dischargeDate);
                      }
                      
                      return (
                      <tr key={v.id}>
                        <td style={{ padding: '10px 8px', fontSize: '1em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</td>
                        <td style={{ padding: '10px 8px', fontSize: '1em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.room}</td>
                        <td style={{ padding: '10px 8px', fontSize: '1em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.patient}</td>
                        <td style={{ padding: '10px 8px', fontSize: '1em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.contact}</td>
                        <td style={{ padding: '10px 8px', fontSize: '1em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.date}</td>
                        <td style={{ padding: '10px 8px', fontSize: '1em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayTimeIn}</td>
                        <td style={{ padding: '10px 8px', fontSize: '1em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayTimeOut || 'N/A'}</td>
                        <td style={{ padding: '10px 8px', fontSize: '1em', fontWeight: '600', color: allDischargeDates.length > 0 ? '#721c24' : '#999' }}>
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
                        <td style={{ padding: '10px 8px', fontSize: '1em' }}>
                          <span style={{ 
                            padding: '6px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.85em',
                            fontWeight: 'bold',
                            background: v.status === 'active' ? '#d4edda' : '#f8d7da',
                            color: v.status === 'active' ? '#155724' : '#721c24'
                          }}>
                            {v.status === 'active' ? 'ACTIVE' : 'DISCHARGED'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', fontSize: '0.9em' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {v.status === 'active' ? (
                              <>
                                <button 
                                  onClick={() => handleDischarge(v.id)}
                                  style={{ 
                                    padding: '8px 18px', 
                                    background: '#dc3545', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1em'
                                  }}
                                >
                                  Discharged (Patient)
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${v.name}?`)) {
                                      deleteVisitorByName(v.name);
                                    }
                                  }}
                                  style={{ 
                                    padding: '8px 18px', 
                                    background: '#6c757d', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1em'
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <span style={{ color: '#999', fontSize: '1em' }}>Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'registered' && (
            <div>
              <input placeholder="Search registered..." value={registeredSearchQuery} onChange={(e) => setRegisteredSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 300px)', minWidth: 0, border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%', fontSize: '0.95em', background: 'white' }}>
                  <thead style={{ background: '#1a8f6f', color: 'white', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Name</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Room</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Patient Name</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Registration Date</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time In</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time Out</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Discharge Date(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegisteredVisitors.map(v => {
                      // Get all discharge records for this visitor
                      const dischargeRecords = allAttendanceRecords.filter(r => r.visitorId === v.id && r.eventType === 'discharge');
                      
                      // Build discharge dates from ALL records
                      let allDischargeDates = [];
                      dischargeRecords.forEach(record => {
                        if (record.dischargeDate && !allDischargeDates.includes(record.dischargeDate)) {
                          allDischargeDates.push(record.dischargeDate);
                        }
                      });
                      
                      // Fallback to visitor object if no records found
                      if (allDischargeDates.length === 0 && v.dischargeTime) {
                        const fallbackDate = typeof v.dischargeTime === 'string' ? v.dischargeTime : new Date(v.dischargeTime).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
                        if (fallbackDate) {
                          allDischargeDates.push(fallbackDate);
                        }
                      }
                      
                      // Fallback to dischargeDate field if still empty
                      if (allDischargeDates.length === 0 && v.dischargeDate) {
                        allDischargeDates.push(v.dischargeDate);
                      }
                      
                      return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f9f9f9'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600' }}>{v.name}</td>
                        <td style={{ padding: '10px 10px', fontSize: '0.95em' }}>{v.room}</td>
                        <td style={{ padding: '10px 10px', fontSize: '0.95em' }}>{v.patient}</td>
                        <td style={{ padding: '10px 10px', fontSize: '0.95em', color: '#007bff', fontWeight: '600' }}>{v.fullDate}</td>
                        <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600', color: v.timeIn ? '#155724' : '#999' }}>{v.timeIn || '-'}</td>
                        <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600', color: v.timeOut ? '#dc3545' : '#999' }}>{v.timeOut || '-'}</td>
                        <td style={{ padding: '10px 10px', fontSize: '0.95em', fontWeight: '600', color: allDischargeDates.length > 0 ? '#721c24' : '#999' }}>
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
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredRegisteredVisitors.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '1.1em' }}>No registered visitors found</div>
              )}
            </div>
          )}

          {currentView === 'monitoring' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', width: '100%' }}>
              {message.text && (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`, fontSize: '1em' }}>
                  {message.text}
                </div>
              )}
              <input placeholder="Search monitoring..." value={monitoringSearchQuery} onChange={(e) => setMonitoringSearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '20px', flexShrink: 0 }} />
              
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #ddd', flexShrink: 0 }}>
                <button
                  onClick={() => setMonitoringTab('active')}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    fontSize: '1em',
                    fontWeight: monitoringTab === 'active' ? '700' : '500',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: monitoringTab === 'active' ? '4px solid #1a8f6f' : 'none',
                    color: monitoringTab === 'active' ? '#1a8f6f' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Active Visitors
                </button>
                <button
                  onClick={() => setMonitoringTab('discharged')}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    fontSize: '1em',
                    fontWeight: monitoringTab === 'discharged' ? '700' : '500',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: monitoringTab === 'discharged' ? '4px solid #dc3545' : 'none',
                    color: monitoringTab === 'discharged' ? '#dc3545' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Discharged
                </button>
              </div>

              {/* Active Visitors Table */}
              {monitoringTab === 'active' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%' }}>
                  <div style={{ overflowY: 'auto', overflowX: 'hidden', borderRadius: '8px', scrollbarGutter: 'stable', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', tableLayout: 'fixed' }}>
                      <thead style={{ background: '#d4edda', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Name</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Room</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Patient Name</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Contact</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Reg Date</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time In</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time Out</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonitoringVisitors.filter(v => v.status === 'active').map((v) => {
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
                          }).sort((a, b) => {
                            const timeA = new Date(a.recordedAt || 0).getTime();
                            const timeB = new Date(b.recordedAt || 0).getTime();
                            return timeA - timeB; // Oldest first
                          });

                          // Get time-in (first check-in event today)
                          const checkInRecord = todayRecords.find(r => r.eventType === 'check-in' || r.checkInTime || r.scanTime);
                          const latestTimeIn = checkInRecord ? (checkInRecord.checkInTime || checkInRecord.scanTime || checkInRecord.timeIn || '') : v.timeIn || '';

                          // Get time-out (most recent checkout event today)
                          const checkOutRecords = todayRecords.filter(r => r.eventType === 'checkout');
                          const latestCheckout = checkOutRecords.length > 0 ? checkOutRecords[checkOutRecords.length - 1] : null;
                          const latestTimeOut = latestCheckout ? (latestCheckout.checkoutTime || latestCheckout.timeOut || latestCheckout.scanTime || '') : v.timeOut || '';

                          return (
                          <tr key={v.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s', background: latestTimeOut ? '#fff3cd' : 'transparent' }} onMouseOver={(e) => e.currentTarget.style.background = latestTimeOut ? '#ffeaa7' : '#f0f8f5'} onMouseOut={(e) => e.currentTarget.style.background = latestTimeOut ? '#fff3cd' : 'transparent'}>
                            <td style={{ padding: '10px 8px' }}>{v.name}</td>
                            <td style={{ padding: '10px 8px' }}>{v.room}</td>
                            <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                            <td style={{ padding: '10px 8px' }}>{v.contact}</td>
                            <td style={{ padding: '10px 8px', fontWeight: '600', color: '#007bff' }}>{v.date || (v.registrationDate ? v.registrationDate.replace(/\//g, '-') : 'N/A')}</td>
                            <td style={{ padding: '10px 8px', fontWeight: '600', color: '#155724' }}>{latestTimeIn || 'N/A'}</td>
                            <td style={{ padding: '10px 8px', fontWeight: latestTimeOut ? '600' : '400', color: latestTimeOut ? '#dc3545' : '#999' }}>
                              {latestTimeOut ? (
                                <span style={{ 
                                  padding: '3px 8px',
                                  borderRadius: '3px',
                                  background: '#ffcccc',
                                  color: '#dc3545',
                                  fontWeight: '600',
                                  fontSize: '0.9em'
                                }}>
                                  {latestTimeOut}
                                </span>
                              ) : (
                                'Pending'
                              )}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '0.9em' }}>
                              <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                fontSize: '0.85em',
                                fontWeight: 'bold',
                                background: '#d4edda',
                                color: '#155724'
                              }}>
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                    {filteredMonitoringVisitors.filter(v => v.status === 'active').length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '1.1em' }}>No active visitors</div>
                    )}
                  </div>
                </div>
              )}

              {/* Discharged Visitors Table */}
              {monitoringTab === 'discharged' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%' }}>
                  <div style={{ overflowY: 'auto', overflowX: 'hidden', borderRadius: '8px', scrollbarGutter: 'stable', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', tableLayout: 'fixed' }}>
                      <thead style={{ background: '#f8d7da', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '15%' }}>Name</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '8%' }}>Room</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '15%' }}>Patient</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '15%' }}>Contact #</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '12%' }}>Reg Date</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '12%' }}>Time In</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '12%' }}>Time Out</th>
                          <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap', width: '11%' }}>Discharge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonitoringVisitors.filter(v => v.status === 'discharged' || v.status === 'timed-out' || v.status === 'inactive').map((v) => {
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
                          
                          // Build discharge dates from ALL records
                          let allDischargeDates = [];
                          dischargeRecords.forEach(record => {
                            if (record.dischargeDate && !allDischargeDates.includes(record.dischargeDate)) {
                              allDischargeDates.push(record.dischargeDate);
                            }
                          });
                          
                          // Fallback to visitor object if no records found
                          if (allDischargeDates.length === 0 && v.dischargeTime) {
                            const fallbackDate = typeof v.dischargeTime === 'string' ? v.dischargeTime : new Date(v.dischargeTime).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-');
                            if (fallbackDate) {
                              allDischargeDates.push(fallbackDate);
                            }
                          }
                          
                          // Fallback to dischargeDate field if still empty
                          if (allDischargeDates.length === 0 && v.dischargeDate) {
                            allDischargeDates.push(v.dischargeDate);
                          }

                          return (
                            <tr key={v.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#fdf7f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '10px 8px' }}>{v.name}</td>
                              <td style={{ padding: '10px 8px' }}>{v.room}</td>
                              <td style={{ padding: '10px 8px' }}>{v.patient}</td>
                              <td style={{ padding: '10px 8px' }}>{v.contact}</td>
                              <td style={{ padding: '10px 8px' }}>{v.date || 'N/A'}</td>
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: '#155724' }}>{displayTimeIn}</td>
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: displayTimeOut && displayTimeOut !== '-' ? '#721c24' : '#999' }}>{displayTimeOut}</td>
                              <td style={{ padding: '10px 8px', fontWeight: '600', color: allDischargeDates.length > 0 ? '#721c24' : '#999' }}>
                                {allDischargeDates.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {allDischargeDates.map((date, idx) => (
                                      <div key={idx} style={{ padding: '4px 8px', background: '#ffcccc', borderRadius: '3px', fontSize: '0.9em' }}>
                                        {date}
                                      </div>
                                    ))}
                                  </div>
                                ) : 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredMonitoringVisitors.filter(v => v.status === 'discharged' || v.status === 'timed-out' || v.status === 'inactive').length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '1.1em' }}>No discharged visitors</div>
                    )}
                  </div>
                </div>
              )}

              <style>
                {`
                  @keyframes fadeInSlide {
                    from {
                      opacity: 0;
                      transform: translateY(5px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}
              </style>
            </div>
          )}

          {currentView === 'report' && (
            <div>
              {message.text && (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`, fontSize: '1em' }}>
                  {message.text}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  type="text"
                  placeholder="Search by name, room, or contact..." 
                  value={reportSearchQuery} 
                  onChange={(e) => setReportSearchQuery(e.target.value)} 
                  style={{ ...inputStyle, flex: 1, minWidth: '200px' }} 
                />
                <input 
                  type="date"
                  value={reportDateFilter}
                  onChange={(e) => setReportDateFilter(e.target.value)}
                  style={{ ...inputStyle, minWidth: '150px', padding: '10px 12px' }}
                />
                <button
                  onClick={() => showView('report')}
                  style={{ padding: '10px 20px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95em' }}
                >
                  Refresh Report
                </button>
                <button
                  onClick={() => {
                    const printContent = document.querySelector('[data-report-print]');
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Visitor Report</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; background: white; }
                              h1 { color: #1a8f6f; text-align: center; margin-bottom: 10px; }
                              .report-info { text-align: center; margin-bottom: 20px; font-size: 14px; color: #666; }
                              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                              thead { background: #1a8f6f; color: white; }
                              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
                              tbody tr:nth-child(even) { background: #f9f9f9; }
                              .page-break { page-break-after: always; }
                              @media print {
                                body { margin: 0; }
                                .print-btn { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      setTimeout(() => printWindow.print(), 250);
                    }
                  }}
                  style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95em' }}
                >
                  Print Report
                </button>
              </div>

              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '3px solid #ddd', backgroundColor: '#f8f9fa', borderRadius: '8px 8px 0 0' }}>
                <button
                  onClick={() => setReportTab('summary')}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    background: reportTab === 'summary' ? '#1a8f6f' : 'transparent',
                    color: reportTab === 'summary' ? 'white' : '#666',
                    fontWeight: reportTab === 'summary' ? '700' : '600',
                    fontSize: '1em',
                    cursor: 'pointer',
                    borderRadius: '8px 0 0 0',
                    transition: 'all 0.3s ease',
                    boxShadow: reportTab === 'summary' ? '0 2px 8px rgba(26, 143, 111, 0.3)' : 'none'
                  }}
                >
                  Visitor Summary
                </button>
              </div>
              
              {/* Tab Content - Visitor Summary */}
              {reportTab === 'summary' && (
                <div style={{ animation: 'fadeInSlide 0.3s ease' }} data-report-print>
                  <div style={{ padding: '20px', background: '#f0f8f6', borderRadius: '8px', border: '2px solid #1a8f6f', marginBottom: '20px' }}>
                    <h3 style={{ color: '#1a8f6f', marginTop: 0, marginBottom: '15px', fontSize: '1.6em' }}>Visitor Summary Report</h3>
                    <p style={{ color: '#666', marginBottom: '15px', fontSize: '1.3em' }}>Generated on: <strong>{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</strong></p>
                    <p style={{ color: '#666', marginBottom: '15px', fontSize: '1.3em' }}>Total visitors: <strong>{visitors.length}</strong></p>
                    
                    <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 280px)', minWidth: 0, border: '1px solid #ddd' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%', fontSize: '1.05em', background: 'white' }}>
                        <thead style={{ background: '#1a8f6f', color: 'white', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Name</th>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Room</th>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Patient Name</th>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Contact</th>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Registration Date</th>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time In</th>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time Out</th>
                            <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Visit Dates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitors
                            .map((v) => {
                              // Count total visits and collect visit dates with check-in and check-out times
                              const visitorCheckIns = allAttendanceRecords.filter(
                                record => record.visitorId === v.id && record.eventType === 'check-in'
                              );
                              const totalVisits = visitorCheckIns.length > 0 ? visitorCheckIns.length : 1;
                              
                              // Extract visit dates with their corresponding time-in and time-out values
                              // Get all attendance records for this visitor
                              const visitorRecords = allAttendanceRecords.filter(r => r.visitorId === v.id);
                              
                              // Group records by date
                              const uniqueVisits = {};
                              visitorRecords.forEach(record => {
                                const date = record.scanDate || record.checkInDate || record.checkOutDate || record.dischargeDate || record.date || '';
                                if (date && date.trim() !== '') {
                                  if (!uniqueVisits[date]) {
                                    uniqueVisits[date] = [];
                                  }
                                  uniqueVisits[date].push(record);
                                }
                              });
                              
                              // For each date, extract earliest and latest times
                              const visitsData = Object.entries(uniqueVisits).map(([date, records]) => {
                                let allTimes = [];
                                records.forEach(record => {
                                  const time = record.checkInTime || record.scanTime || record.timeIn || record.checkoutTime || record.timeOut || '';
                                  if (time && time.trim() !== '') {
                                    allTimes.push(time);
                                  }
                                });

                                // Sort times chronologically
                                allTimes.sort((a, b) => {
                                  const timeA = new Date(`2000-01-01 ${a}`).getTime();
                                  const timeB = new Date(`2000-01-01 ${b}`).getTime();
                                  return timeA - timeB;
                                });

                                return {
                                  date,
                                  timeIn: allTimes.length > 0 ? allTimes[0] : '',
                                  timeOut: allTimes.length > 1 ? allTimes[allTimes.length - 1] : ''
                                };
                              });
                              
                              // Get latest time-in and time-out from all visits
                              const latestTimeIn = visitsData.length > 0 ? visitsData[visitsData.length - 1].timeIn : (v.timeIn || '');
                              const latestTimeOut = visitsData.length > 0 ? visitsData[visitsData.length - 1].timeOut : (v.timeOut || '');
                              
                              return (
                              <tr key={v.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '12px 10px', fontSize: '1.2em' }}>{v.name}</td>
                                <td style={{ padding: '12px 10px', fontSize: '1.2em' }}>{v.room}</td>
                                <td style={{ padding: '12px 10px', fontSize: '1.2em' }}>{v.patient}</td>
                                <td style={{ padding: '12px 10px', fontSize: '1.2em' }}>{v.contact}</td>
                                <td style={{ padding: '12px 10px', fontSize: '1.2em', fontWeight: '600', color: '#007bff' }}>{v.date ? v.date.replace(/\//g, '-') : (v.registrationDate ? v.registrationDate.replace(/\//g, '-') : 'N/A')}</td>
                                <td style={{ padding: '12px 10px', fontSize: '1.2em', fontWeight: '600', color: '#155724' }}>{latestTimeIn || 'N/A'}</td>
                                <td style={{ padding: '12px 10px', fontSize: '1.2em', fontWeight: latestTimeOut ? '600' : '400', color: latestTimeOut ? '#dc3545' : '#999' }}>{latestTimeOut || 'N/A'}</td>
                                <td style={{ padding: '12px 10px' }}>
                                  {visitsData && visitsData.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {visitsData.map((visit, idx) => (
                                        <div 
                                          key={idx} 
                                          style={{ 
                                            padding: '6px 10px', 
                                            background: '#e8f4f8',
                                            border: '1px solid #00bcd4',
                                            borderRadius: '4px',
                                            fontSize: '0.95em',
                                            fontWeight: '500',
                                            color: '#00838f'
                                          }}
                                        >
                                          <div style={{ fontSize: '0.9em', fontWeight: '600' }}>{visit.date}</div>
                                          {visit.timeIn && <div style={{ fontSize: '0.85em', color: '#0097a7', marginTop: '2px' }}>Time-In: {visit.timeIn}</div>}
                                          {visit.timeOut && <div style={{ fontSize: '0.85em', color: '#d32f2f', marginTop: '2px' }}>Check-out: {visit.timeOut}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: '#999' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            );
                            })}
                        </tbody>
                      </table>
                      {visitors.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '1.1em' }}>No records found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <style>
                {`
                  @keyframes fadeInSlide {
                    from {
                      opacity: 0;
                      transform: translateX(10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                `}
              </style>
            </div>
          )}

          {currentView === 'security' && (
            <div>
              {message.text && (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`, fontSize: '1em' }}>
                  {message.text}
                </div>
              )}
              <input placeholder="Search by name, room, or contact..." value={securitySearchQuery} onChange={(e) => setSecuritySearchQuery(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
              
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #ddd' }}>
                <button
                  onClick={() => setSecurityTab('active')}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    fontSize: '1.1em',
                    fontWeight: securityTab === 'active' ? '700' : '500',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: securityTab === 'active' ? '4px solid #1a8f6f' : 'none',
                    color: securityTab === 'active' ? '#1a8f6f' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Active Visitors
                </button>
                <button
                  onClick={() => setSecurityTab('discharged')}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    fontSize: '1.1em',
                    fontWeight: securityTab === 'discharged' ? '700' : '500',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: securityTab === 'discharged' ? '4px solid #dc3545' : 'none',
                    color: securityTab === 'discharged' ? '#dc3545' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Discharged
                </button>
              </div>

              {/* Active Visitors Table */}
              {securityTab === 'active' && (
                <div style={{ animation: 'fadeInSlide 0.4s ease-in' }}>
                  <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 350px)', minWidth: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%', fontSize: '0.95em' }}>
                      <thead style={{ background: '#d4edda', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Name</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Room</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Patient Name</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Contact</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Date</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time In</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.filter(v => {
                          const q = securitySearchQuery.toLowerCase();
                          const matchesSearch = !securitySearchQuery || 
                            v.name.toLowerCase().includes(q) ||
                            v.room.toLowerCase().includes(q) ||
                            v.contact.toLowerCase().includes(q);
                          return matchesSearch && v.status === 'active';
                        }).map((v) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f0f8f5'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.name}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.room}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.patient}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.contact}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.date}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.timeIn}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.timeOut || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visitors.filter(v => {
                      const q = securitySearchQuery.toLowerCase();
                      const matchesSearch = !securitySearchQuery || 
                        v.name.toLowerCase().includes(q) ||
                        v.room.toLowerCase().includes(q) ||
                        v.contact.toLowerCase().includes(q);
                      return matchesSearch && v.status === 'active';
                    }).length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '1.1em' }}>No active visitors</div>
                    )}
                  </div>
                </div>
              )}

              {/* Discharged Visitors Table */}
              {securityTab === 'discharged' && (
                <div style={{ animation: 'fadeInSlide 0.4s ease-in' }}>
                  <div style={{ overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', scrollbarGutter: 'stable', maxHeight: 'calc(100vh - 350px)', minWidth: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%', fontSize: '0.95em' }}>
                      <thead style={{ background: '#f8d7da', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Name</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Room</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Patient</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Date</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time In</th>
                          <th style={{ padding: '14px 10px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Time Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.filter(v => {
                          const q = securitySearchQuery.toLowerCase();
                          const matchesSearch = !securitySearchQuery || 
                            v.name.toLowerCase().includes(q) ||
                            v.room.toLowerCase().includes(q) ||
                            v.contact.toLowerCase().includes(q);
                          return matchesSearch && (v.status === 'discharged' || v.status === 'timed-out' || v.status === 'inactive');
                        }).map((v) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#fdf7f8'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.name}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.room}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.patient}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.date}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.timeIn}</td>
                            <td style={{ padding: '12px 10px', fontSize: '1.05em' }}>{v.timeOut || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visitors.filter(v => {
                      const q = securitySearchQuery.toLowerCase();
                      const matchesSearch = !securitySearchQuery || 
                        v.name.toLowerCase().includes(q) ||
                        v.room.toLowerCase().includes(q) ||
                        v.contact.toLowerCase().includes(q);
                      return matchesSearch && (v.status === 'discharged' || v.status === 'timed-out' || v.status === 'inactive');
                    }).length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '1.1em' }}>No discharged visitors</div>
                    )}
                  </div>
                </div>
              )}

              <style>
                {`
                  @keyframes fadeInSlide {
                    from {
                      opacity: 0;
                      transform: translateY(5px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                  @keyframes pulse {
                    0%, 100% {
                      opacity: 1;
                    }
                    50% {
                      opacity: 0.7;
                    }
                  }
                `}
              </style>
            </div>
          )}

          {currentView === 'patientData' && (
            <div>
              {message.text && (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`, fontSize: '1em' }}>
                  {message.text}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px', fontSize: '1.1em' }}>Patient Name:</label>
                  <input 
                    type="text" 
                    value={patientFormData.patientName} 
                    onChange={(e) => setPatientFormData({ ...patientFormData, patientName: e.target.value })} 
                    style={{ ...inputStyle, marginBottom: '16px' }} 
                    placeholder="Enter patient name" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px', fontSize: '1.1em' }}>Room Number:</label>
                  <input 
                    type="text" 
                    value={patientFormData.roomNumber} 
                    onChange={(e) => setPatientFormData({ ...patientFormData, roomNumber: e.target.value })} 
                    style={{ ...inputStyle, marginBottom: '16px' }} 
                    placeholder="Enter room number" 
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  if (!patientFormData.patientName || !patientFormData.roomNumber) {
                    setMessage({ type: 'error', text: 'Please fill in all fields!' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    return;
                  }

                  // Check if this patient already exists
                  const existingPatient = visitors.find(v => v.patient?.toLowerCase() === patientFormData.patientName.toLowerCase() && v.room === patientFormData.roomNumber);
                  if (existingPatient) {
                    setMessage({ type: 'error', text: 'This patient and room combination already exists!' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    return;
                  }

                  // Add new patient to visitors list
                  const newPatient = {
                    id: `patient-${Date.now()}`,
                    name: patientFormData.patientName,
                    patient: patientFormData.patientName,
                    room: patientFormData.roomNumber,
                    contact: '',
                    status: 'inactive',
                    date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-'),
                    timestamp: new Date().toISOString()
                  };

                  // Save to Firestore
                  try {
                    await addVisitorDoc(newPatient);
                    // Update local state
                    setVisitors([newPatient, ...visitors]);
                    setMessage({ type: 'success', text: `Patient "${patientFormData.patientName}" (Room ${patientFormData.roomNumber}) added successfully!` });
                    setPatientFormData({ patientName: '', roomNumber: '' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                  } catch (err) {
                    console.error('[Dashboard] Error adding patient:', err);
                    setMessage({ type: 'error', text: 'Failed to add patient. Please try again.' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                  }
                }}
                style={{ padding: '14px 24px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s', marginBottom: '30px' }}
                onMouseOver={(e) => e.target.style.background = '#158f6f'}
                onMouseOut={(e) => e.target.style.background = '#1a8f6f'}
              >
                ADD PATIENT
              </button>

              <div style={{ padding: '20px', background: '#f0f8f6', borderRadius: '8px', border: '2px solid #1a8f6f' }}>
                <h3 style={{ color: '#1a8f6f', marginTop: 0, marginBottom: '20px', fontSize: '1.4em' }}>Available Patients</h3>
                
                {visitors.length > 0 ? (
                  <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)', scrollbarGutter: 'stable' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#1a8f6f', color: 'white', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', borderBottom: '2px solid #0d5443' }}>Patient Name</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', borderBottom: '2px solid #0d5443' }}>Room Number</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', borderBottom: '2px solid #0d5443' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map((visitor, idx) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f9fdf7', borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{visitor.patient}</td>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{visitor.room}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                onClick={async () => {
                                  try {
                                    await deleteVisitor(visitor.id);
                                    setVisitors(visitors.filter(v => v.id !== visitor.id));
                                    setMessage({ type: 'success', text: `Patient removed!` });
                                    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                                  } catch (err) {
                                    console.error('[Dashboard] Error removing patient:', err);
                                    setMessage({ type: 'error', text: 'Failed to remove patient. Please try again.' });
                                    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                                  }
                                }}
                                style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', fontWeight: '600', transition: 'background 0.3s' }}
                                onMouseOver={(e) => e.target.style.background = '#c82333'}
                                onMouseOut={(e) => e.target.style.background = '#dc3545'}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '1.1em' }}>No patients added yet</div>
                )}
              </div>
            </div>
          )}

          {currentView === 'register' && (
            <>
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
                        <strong style={{ color: '#1a8f6f' }}>Contact Number:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.contact}</span>
                      </div>
                      <div style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                        <strong style={{ color: '#1a8f6f' }}>Registration:</strong> <span style={{ marginLeft: '8px' }}>{registeredVisitorData.registrationDateTime}</span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', background: 'white', padding: '15px', borderRadius: '8px' }}>
                      <img src={qrCodeUrl} alt="Visitor QR Code" style={{ borderRadius: '8px', border: '3px solid #1a8f6f', display: 'block', width: '350px', height: '350px' }} />
                      <p style={{ marginTop: '12px', fontSize: '0.9em', color: '#666', fontWeight: 'bold' }}>Scan to view visitor info</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={handleDownloadQR}
                      style={{ flex: 1, minWidth: '150px', padding: '14px', background: '#1a8f6f', color: 'white', border: 'none', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s', fontSize: '1.05em' }}
                      onMouseOver={(e) => e.target.style.background = '#157a5e'}
                      onMouseOut={(e) => e.target.style.background = '#1a8f6f'}
                    >
                       Download QR Code
                    </button>
                    <button 
                      onClick={handlePrintQR}
                      style={{ flex: 1, minWidth: '150px', padding: '14px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s', fontSize: '1.05em' }}
                      onMouseOver={(e) => e.target.style.background = '#0b5ed7'}
                      onMouseOut={(e) => e.target.style.background = '#0d6efd'}
                    >
                       Print QR Code
                    </button>
                    <button 
                      onClick={() => { setQrCodeUrl(null); setRegisteredVisitorData(null); }}
                      style={{ flex: 1, minWidth: '150px', padding: '14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s', fontSize: '1.05em' }}
                      onMouseOver={(e) => e.target.style.background = '#5c636a'}
                      onMouseOut={(e) => e.target.style.background = '#6c757d'}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px', fontSize: '1.1em' }}>Visitor Name:</label>
                  <input type="text" name="visitorName" value={formData.visitorName} onChange={handleInputChange} style={{ ...inputStyle, marginBottom: '16px' }} placeholder="Enter visitor's full name" />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px', fontSize: '1.1em' }}>Contact Number:</label>
                  <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} style={{ ...inputStyle, marginBottom: '4px' }} placeholder="Enter 11-digit contact number" />
                  <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '16px' }}>Must be 11 digits</div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: '#333', marginBottom: '8px', fontSize: '1.1em' }}>Select Patient & Room No.:</label>
                  <button 
                    onClick={() => setShowVisitorSelector(true)}
                    style={{ 
                      width: '100%',
                      padding: '12px',
                      background: selectedVisitorForRegistration ? '#28a745' : '#1a8f6f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '1em',
                      marginBottom: '8px',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                    onMouseOver={(e) => e.target.style.background = selectedVisitorForRegistration ? '#218838' : '#158f6f'}
                    onMouseOut={(e) => e.target.style.background = selectedVisitorForRegistration ? '#28a745' : '#1a8f6f'}
                  >
                    {selectedVisitorForRegistration ? `✓ ${selectedVisitorForRegistration.name} - Room ${selectedVisitorForRegistration.room}` : '+ SELECT PATIENT'}
                  </button>
                  {!selectedVisitorForRegistration && <div style={{ fontSize: '0.9em', color: '#dc3545', marginBottom: '16px', fontWeight: '600' }}>Required: Select a patient to register</div>}
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f8f6', borderRadius: '8px', border: '2px solid #1a8f6f' }}>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#1a8f6f', marginBottom: '12px', fontSize: '1.1em' }}>Face Recognition (USB Web Cam):</label>
                
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <button 
                    onClick={activateUsbScanner}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: '#1a8f6f', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '1em',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 6px rgba(26, 143, 111, 0.2)'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#158f6f'}
                    onMouseOut={(e) => e.target.style.background = '#1a8f6f'}
                  >
                    ACTIVATE CAMERA
                  </button>
                </div>

                {/* Live Feed - Always Visible */}
                <div style={{ marginTop: '15px' }}>
                  <div style={{ 
                    marginBottom: '15px', 
                    padding: '12px', 
                    background: '#f0f8f5', 
                    borderRadius: '10px', 
                    border: '2px solid #1a8f6f',
                    boxShadow: '0 2px 8px rgba(26, 143, 111, 0.1)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '10px',
                      fontSize: '0.9em',
                      color: '#1a8f6f',
                      fontWeight: '600'
                    }}>
                      Live Webcam Feed {isCameraActive && '(Active)'}
                      {faceDetected && (
                        <span style={{ 
                          marginLeft: '12px', 
                          padding: '4px 10px',
                          background: '#28a745',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '0.85em',
                          fontWeight: 'bold',
                          animation: 'pulse 1s infinite'
                        }}>
                          ● Face Detected
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      position: 'relative',
                      background: '#000000',
                      borderRadius: '8px',
                      border: '3px solid #1a8f6f',
                      overflow: 'hidden'
                    }}>
                      <video 
                        ref={videoRef}
                        style={{ 
                          width: '100%', 
                          height: '400px',
                          display: 'block',
                          background: '#000000',
                          objectFit: 'cover',
                          boxShadow: '0 2px 8px rgba(26, 143, 111, 0.15)'
                        }}
                        autoPlay
                        playsInline
                        muted
                      />
                      {!isCameraActive && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: '#999'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>📷</div>
                            <div style={{ fontSize: '0.9em', fontWeight: '600' }}>Camera Inactive</div>
                            <div style={{ fontSize: '0.85em', marginTop: '5px' }}>Click "Activate Camera" to start the webcam</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>

                  {isCameraActive && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          const video = videoRef.current;
                          const canvas = canvasRef.current;
                          
                          if (!video) {
                            console.error('videoRef.current is null');
                              setMessage({ type: 'error', text: 'Camera not initialized. Please activate camera first.' });
                              return;
                            }
                            
                            if (!canvas) {
                              console.error('canvasRef.current is null');
                              setMessage({ type: 'error', text: 'Canvas element not found.' });
                              return;
                            }
                            
                            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                              setMessage({ type: 'error', text: 'Camera still loading. Please wait a moment and try again.' });
                              return;
                            }
                            
                            try {
                              canvas.width = video.videoWidth;
                              canvas.height = video.videoHeight;
                              
                              if (canvas.width === 0 || canvas.height === 0) {
                                console.error('Invalid video dimensions:', canvas.width, 'x', canvas.height);
                                setMessage({ type: 'error', text: 'Invalid video dimensions. Camera may not be ready.' });
                                return;
                              }
                              
                              const ctx = canvas.getContext('2d');
                              ctx.drawImage(video, 0, 0);
                              const imageData = canvas.toDataURL('image/jpeg', 0.95);
                              
                              if (imageData && imageData.length > 100) {
                                setPreviewUrl(imageData);
                                setMessage({ type: 'success', text: 'Face captured successfully!' });
                                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                              } else {
                                console.error('Invalid image data');
                                setMessage({ type: 'error', text: 'Failed to capture image. Please try again.' });
                              }
                            } catch (error) {
                              console.error('Capture error:', error);
                              setMessage({ type: 'error', text: `Error capturing face: ${error.message}` });
                            }
                          }}
                          style={{ 
                            flex: 1, 
                            padding: '10px', 
                            background: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.95em',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 6px rgba(40, 167, 69, 0.2)'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#218838'}
                          onMouseOut={(e) => e.target.style.background = '#28a745'}
                        >
                          CAPTURE
                        </button>
                        <button 
                          onClick={stopCamera}
                          style={{ 
                            flex: 1, 
                            padding: '10px',
                            background: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.95em',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 6px rgba(220, 53, 69, 0.2)'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#c82333'}
                          onMouseOut={(e) => e.target.style.background = '#dc3545'}
                        >
                          STOP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {previewUrl && (
                  <div style={{ marginTop: '15px', padding: '12px', background: '#d4edda', borderRadius: '10px', border: '2px solid #28a745', boxShadow: '0 2px 8px rgba(40, 167, 69, 0.15)' }}>
                    <div style={{ fontSize: '0.9em', fontWeight: '600', color: '#155724', marginBottom: '10px' }}>Face Captured Successfully!</div>
                    <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px' }}>
                      <img src={previewUrl} alt="Captured Face" style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', maxHeight: '250px', border: '2px solid #28a745' }} />
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#155724', fontWeight: '600', marginTop: '10px', textAlign: 'center' }}>Ready to register visitor</div>
                  </div>
                )}
              </div>

              <style>
                {`
                  @keyframes spin {
                    0% {
                      transform: rotate(0deg);
                    }
                    100% {
                      transform: rotate(360deg);
                    }
                  }
                  @keyframes pulse-button {
                    0%, 100% {
                      opacity: 1;
                    }
                    50% {
                      opacity: 0.8;
                    }
                  }
                  .register-loading {
                    animation: pulse-button 1.5s ease-in-out infinite !important;
                  }
                  .spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    margin-right: 8px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    vertical-align: middle;
                  }
                `}
              </style>

              <button onClick={handleRegister} disabled={loading || uploadingImage} className={loading || uploadingImage ? 'register-loading' : ''} style={{ width: '100%', padding: '18px', marginTop: '20px', background: loading || uploadingImage ? '#666' : '#1a8f6f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2em', fontWeight: 'bold', cursor: loading || uploadingImage ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '56px' }}>
                {uploadingImage || loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>{uploadingImage ? 'UPLOADING IMAGE...' : 'REGISTERING...'}</span>
                  </>
                ) : (
                  'REGISTER'
                )}
              </button>

              {showVisitorSelector && (
                <div style={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  background: 'rgba(0, 0, 0, 0.7)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  zIndex: 9999
                }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    border: '3px solid #1a8f6f'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #1a8f6f' }}>
                      <h2 style={{ color: '#1a8f6f', margin: 0, fontSize: '1.5em', fontWeight: '700' }}>Select Patient</h2>
                      <button 
                        onClick={() => setShowVisitorSelector(false)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          cursor: 'pointer',
                          fontSize: '1.2em',
                          fontWeight: 'bold',
                          transition: 'background 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#c82333'}
                        onMouseOut={(e) => e.target.style.background = '#dc3545'}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <input 
                        type="text"
                        placeholder="Search by name or room number..."
                        onChange={(e) => {}}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '1em',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', scrollbarGutter: 'stable' }}>
                      {visitors.length > 0 ? (
                        visitors.map((visitor, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setSelectedVisitorForRegistration(visitor);
                              setFormData({
                                ...formData,
                                roomNumber: visitor.room || '',
                                patientName: visitor.patient || ''
                              });
                              setShowVisitorSelector(false);
                            }}
                            style={{
                              padding: '16px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              marginBottom: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.3s',
                              background: '#f9f9f9',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#f0f8f5';
                              e.currentTarget.style.borderColor = '#1a8f6f';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(26, 143, 111, 0.2)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#f9f9f9';
                              e.currentTarget.style.borderColor = '#e0e0e0';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '1.1em', fontWeight: '700', color: '#1a8f6f', marginBottom: '4px' }}>{visitor.patient}</div>
                              <div style={{ fontSize: '0.9em', color: '#666' }}>Room: <strong>{visitor.room}</strong></div>
                            </div>
                            <div style={{ fontSize: '1.3em', color: '#1a8f6f', fontWeight: 'bold' }}>→</div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No visitors found</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ width: 180, background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
          <div onClick={() => showView('dashboard')} style={{ fontSize: 28, textAlign: 'center', marginBottom: 12, cursor: 'pointer' }}></div>
          <div onClick={() => showView('dashboard')} style={{ padding: 12, marginBottom: 10, background: currentView === 'dashboard' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'dashboard' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer', fontSize: '1.05em', fontWeight: currentView === 'dashboard' ? '600' : '500' }}>Dashboard</div>
          <div onClick={() => showView('visitorInfo')} style={{ padding: 12, marginBottom: 10, background: currentView === 'visitorInfo' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'visitorInfo' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer', fontSize: '1.05em', fontWeight: currentView === 'visitorInfo' ? '600' : '500' }}>List of Visitors</div>
          <div onClick={() => showView('registered')} style={{ padding: 12, marginBottom: 10, background: currentView === 'registered' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'registered' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer', fontSize: '1.05em', fontWeight: currentView === 'registered' ? '600' : '500' }}>Registered Visitor</div>
          <div onClick={() => showView('monitoring')} style={{ padding: 12, marginBottom: 10, background: currentView === 'monitoring' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'monitoring' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer', fontSize: '1.05em', fontWeight: currentView === 'monitoring' ? '600' : '500' }}>Monitoring</div>
          <div onClick={() => showView('report')} style={{ padding: 12, marginBottom: 10, background: currentView === 'report' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'report' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer', fontSize: '1.05em', fontWeight: currentView === 'report' ? '600' : '500' }}>Report</div>
          <div onClick={() => showView('patientData')} style={{ padding: 12, marginBottom: 16, background: currentView === 'patientData' ? '#1a8f6f' : '#f7f7f7', color: currentView === 'patientData' ? 'white' : '#333', borderRadius: 8, cursor: 'pointer', fontSize: '1.05em', fontWeight: currentView === 'patientData' ? '600' : '500' }}>Patient Data</div>
          
          <button onClick={() => showView('register')} style={{ width: '100%', padding: 14, background: '#1a8f6f', color: 'white', border: 'none', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' }}>REGISTER</button>
        </div>
      </div>
    </div>
  );
}