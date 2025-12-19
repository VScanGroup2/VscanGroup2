import React, { useState, useEffect } from 'react';
import { addVisitor as addVisitorDoc, listenVisitorsRealtime, updateVisitor as updateVisitorDoc, deleteVisitor as deleteVisitorDoc } from '../lib/firestore';
import uploadImageToCloudinary from '../lib/cloudinary';
import QRCode from 'qrcode';

export default function VisitorRegistration() {
  const [formData, setFormData] = useState({ visitorName: '', roomNumber: '', patientName: '', contactNumber: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [visitors, setVisitors] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [lastDocId, setLastDocId] = useState(null);

  useEffect(() => {
    const unsub = listenVisitorsRealtime((data) => setVisitors(data));
    return () => {
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // For contact number, only allow digits and limit to 11
    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
      setFormData((p) => ({ ...p, [name]: digitsOnly }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setSelectedFile(f || null);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleRegister = async () => {
    if (!formData.visitorName || !formData.roomNumber || !formData.patientName || !formData.contactNumber) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    // Validate contact number must be exactly 11 digits
    const contactNumberDigits = formData.contactNumber.replace(/\D/g, '');
    if (contactNumberDigits.length !== 11) {
      setMessage({ type: 'error', text: 'Contact number must consist of exactly 11 digits' });
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      if (selectedFile) {
        setUploadingImage(true);
        try {
          const res = await uploadImageToCloudinary(selectedFile);
          photoUrl = res.secure_url || res.url || null;
        } catch (err) {
          console.error('Cloudinary upload failed', err);
          // surface detailed error to the user so they can check env/config
          const msg = err && err.message ? err.message : 'Image upload failed';
          setMessage({ type: 'error', text: `Image upload failed: ${msg}` });
          setLoading(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const visitorData = {
        visitorName: formData.visitorName,
        roomNumber: formData.roomNumber,
        patientName: formData.patientName,
        contactNumber: formData.contactNumber,
        checkInTime: new Date().toLocaleString(),
        timestamp: Date.now(),
        status: 'checked-in',
        photoUrl: photoUrl || null,
      };

      console.log('Attempting to add visitor:', visitorData);
      const docId = await addVisitorDoc(visitorData);
      console.log('addVisitor returned id:', docId);

      // generate QR code that encodes a verification URL containing the doc id
      try {
        const targetUrl = `${window.location.origin}/verified?id=${docId}`;
        const dataUrl = await QRCode.toDataURL(targetUrl, { margin: 2, width: 300 });
        setQrDataUrl(dataUrl);
      } catch (qrErr) {
        console.error('QR generation failed', qrErr);
        setQrDataUrl(null);
      }

      setLastDocId(docId);

      setMessage({ type: 'success', text: `Registered (id: ${docId})` });
      setFormData({ visitorName: '', roomNumber: '', patientName: '', contactNumber: '' });
      setSelectedFile(null);
      setPreviewUrl(null);

      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      console.error('Registration error', err);
      setMessage({ type: 'error', text: err?.message || String(err) });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const checkOutVisitor = async (id) => {
    try {
      await updateVisitorDoc(id, { status: 'checked-out', checkOutTime: new Date().toLocaleString() });
    } catch (err) {
      console.error('checkOut error', err);
      setMessage({ type: 'error', text: 'Unable to check out' });
    }
  };

  const deleteVisitor = async (id) => {
    try {
      await deleteVisitorDoc(id);
    } catch (err) {
      console.error('delete error', err);
      setMessage({ type: 'error', text: 'Unable to delete' });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Register Visitor</h2>

      {message.text && (
        <div style={{ margin: '12px 0', padding: 8, borderRadius: 4, background: message.type === 'success' ? '#e6fffa' : '#fff5f5' }}>
          {message.text}
        </div>
      )}

      <div style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Visitor Name</label>
          <input name="visitorName" value={formData.visitorName} onChange={handleInputChange} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Room Number</label>
          <input name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Patient Name</label>
          <input name="patientName" value={formData.patientName} onChange={handleInputChange} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Contact Number</label>
          <input name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} maxLength="11" placeholder="11 digits only" style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Photo (optional)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {previewUrl && <div style={{ marginTop: 8 }}><img src={previewUrl} alt="preview" style={{ maxWidth: 180 }} /></div>}
        </div>

        <button onClick={handleRegister} disabled={loading || uploadingImage} style={{ padding: '10px 16px' }}>
          {uploadingImage ? 'Uploading...' : loading ? 'Registering...' : 'Register'}
        </button>
      </div>

      {qrDataUrl && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #e6e6e6', borderRadius: 6, maxWidth: 360 }}>
          <h4 style={{ margin: 0, marginBottom: 8 }}>Visitor QR</h4>
          <img src={qrDataUrl} alt="visitor-qr" style={{ width: 180, height: 180, display: 'block' }} />
          <div style={{ marginTop: 8 }}>
            <a href={qrDataUrl} download={`visitor-${lastDocId || 'qr'}.png`} style={{ marginRight: 8 }}>
              <button>Download QR</button>
            </a>
            <button onClick={() => { setQrDataUrl(null); setLastDocId(null); }}>Close</button>
          </div>
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      <h3>Registered (live)</h3>
      <div>
        {visitors.length === 0 ? <p>No visitors</p> : visitors.map(v => (
          <div key={v.id} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{v.visitorName}</strong>
                <div style={{ fontSize: 12 }}>{v.patientName} — Room {v.roomNumber}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{v.checkInTime}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => checkOutVisitor(v.id)}>Check out</button>
                <button onClick={() => deleteVisitor(v.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
