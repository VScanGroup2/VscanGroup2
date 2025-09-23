import React, { useState, useRef, useEffect } from 'react';
import '../Styles/Scanner.css';

const HospitalIDScanner = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [patientID, setPatientID] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const generateRandomID = () => {
    const prefix = 'ILA';
    const number = Math.random().toString().substr(2, 6);
    return `${prefix}${number}`;
  };

  const openScanner = async () => {
    setShowScanner(true);
    document.body.style.overflow = 'hidden';
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera if available
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      showErrorMessage('Unable to access camera. Please check permissions and try again.');
      closeScanner();
    }
  };

  const closeScanner = () => {
    setShowScanner(false);
    document.body.style.overflow = 'auto';
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      showErrorMessage('Camera not ready. Please wait a moment and try again.');
      return;
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    context.drawImage(videoRef.current, 0, 0);
    
    // Convert to blob and simulate processing
    canvas.toBlob((blob) => {
      processIDImage(blob);
    }, 'image/jpeg', 0.8);
  };

  const processIDImage = (imageBlob) => {
    // Close scanner first
    closeScanner();
    
    // Show processing overlay
    setShowProcessing(true);
    
    // Simulate ID processing time
    setTimeout(() => {
      setShowProcessing(false);
      const newPatientID = generateRandomID();
      setPatientID(newPatientID);
      setShowResult(true);
      document.body.style.overflow = 'hidden';
    }, 3000);
  };

  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setShowError(true);
    document.body.style.overflow = 'hidden';
  };

  const closeResult = () => {
    setShowResult(false);
    document.body.style.overflow = 'auto';
  };

  const closeError = () => {
    setShowError(false);
    setErrorMessage('');
    document.body.style.overflow = 'auto';
  };

  const closeProcessing = () => {
    setShowProcessing(false);
    document.body.style.overflow = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (showScanner) closeScanner();
      if (showResult) closeResult();
      if (showError) closeError();
      if (showProcessing) closeProcessing();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showScanner, showResult, showError, showProcessing]);

  return (
    <div className="hospital-scanner-app">
      <div className="tablet-container">
        <div className="screen">
          <div className="hospital-header">
            <h1>Ignacio Lacson Arroyo</h1>
            <h2>Memorial District Hospital</h2>
          </div>
          
          <div className="welcome-banner">
            <h3>VSCAN</h3>
          </div>
          
          <div className="scanner-section">
            <button className="scan-button" onClick={openScanner}>
              <span className="scan-text">Scan your ID</span>
              <div className="scan-line"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="scanner-header">
              <h3>Scanning ID...</h3>
              <button className="close-btn" onClick={closeScanner}>&times;</button>
            </div>
            <div className="camera-container">
              <video ref={videoRef} autoPlay style={{ width: '100%', height: '300px', objectFit: 'cover', background: '#2c3e50' }} />
              <div className="scan-overlay">
                <div className="scan-frame"></div>
                <div className="scanning-line" style={{ animation: 'scanning 2s ease-in-out infinite' }}></div>
              </div>
            </div>
            <div className="scanner-instructions">
              <p>Position your ID within the frame</p>
              <button className="capture-button" onClick={captureImage}>Capture</button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {showProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="spinner"></div>
            <p>Processing ID...</p>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content result-content">
            <div className="result-header">
              <h3>ID Scanned Successfully</h3>
            </div>
            <div className="result-info">
              <div className="success-icon">✓</div>
              <p>Welcome to Ignacio Lacson Arroyo Memorial District Hospital</p>
              <p><strong>Patient ID:</strong> {patientID}</p>
              <p><strong>Status:</strong> Verified</p>
              <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
            </div>
            <button className="continue-btn" onClick={closeResult}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showError && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content result-content">
            <div className="result-header">
              <h3 style={{ color: '#e74c3c' }}>Error</h3>
            </div>
            <div className="result-info">
              <div style={{ color: '#e74c3c', fontSize: '4em' }}>⚠</div>
              <p>{errorMessage}</p>
            </div>
            <button className="continue-btn" style={{ background: '#e74c3c' }} onClick={closeError}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalIDScanner;