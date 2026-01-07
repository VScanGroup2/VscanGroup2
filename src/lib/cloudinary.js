export async function uploadImageToCloudinary(file, opts = {}) {
  if (!file) throw new Error('No file provided');
  
  // Validate file size (limit to 10MB)
  const maxSizeMB = 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File is too large. Maximum size is ${maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
  }

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

  try {
    console.log('[Cloudinary] Starting upload to:', url, 'File:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');
    
    const res = await fetch(url, { 
      method: 'POST', 
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for multipart
    });
    
    console.log('[Cloudinary] Response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const text = await res.text();
      console.error('uploadImageToCloudinary: upload failed', { 
        status: res.status, 
        statusText: res.statusText, 
        body: text,
        url: url,
        fileName: file.name
      });
      throw new Error('Cloudinary upload failed: ' + (text || res.statusText || res.status));
    }
    
    const data = await res.json();
    console.log('[Cloudinary] Upload successful - ID:', data.public_id, 'Size uploaded:', (file.size / 1024).toFixed(2) + 'KB');
    return data; // contains secure_url, public_id, etc.
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      // Network error or CORS issue
      console.error('[Cloudinary] Network/CORS error:', {
        error: err.message,
        cloudName: cloudName,
        url: url,
        fileName: file.name,
        fileSize: file.size
      });
      throw new Error('Network error uploading to Cloudinary. Please check your internet connection and try again. If the problem persists, your Cloudinary credentials may be invalid.');
    }
    // Re-throw other errors
    throw err;
  }
}

export default uploadImageToCloudinary;
