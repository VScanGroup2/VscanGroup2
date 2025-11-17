export async function uploadImageToCloudinary(file, opts = {}) {
  if (!file) throw new Error('No file provided');
  const cloudName = opts.cloudName || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = opts.uploadPreset || process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    const msg = 'Cloudinary configuration missing. Set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET in .env.local or pass them in opts.';
    console.error('uploadImageToCloudinary:', msg, { cloudName, uploadPreset });
    throw new Error(msg);
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    const text = await res.text();
    console.error('uploadImageToCloudinary: upload failed', { status: res.status, statusText: res.statusText, body: text });
    throw new Error('Cloudinary upload failed: ' + (text || res.statusText || res.status));
  }
  const data = await res.json();
  return data; // contains secure_url, public_id, etc.
}

export default uploadImageToCloudinary;
