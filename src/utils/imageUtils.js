import imageCompression from 'browser-image-compression';

export const optimizeImage = async (file) => {
  try {
    const options = {
      maxSizeMB: 0.5,          // Maximum file size in MB
      maxWidthOrHeight: 800,   // Maximum width or height
      useWebWorker: true,      // Use web worker for faster compression
      fileType: 'image/webp',  // Convert to webp format for better compression
    };
    
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

// Helper function to validate image
export const validateImage = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeMB = 5; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid image type. Please upload JPEG, PNG, or WebP.');
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Image too large. Maximum size is ${maxSizeMB}MB.`);
  }
  
  return true;
};