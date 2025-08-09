
import { toast } from 'sonner';

export const validateImageSize = (file, maxSizeInMB = 1) => {
  const maxSize = maxSizeInMB * 1024 * 1024; // Convert MB to bytes
  
  if (file.size > maxSize) {
    toast.error('Choose small sized image!');
    return false;
  }
  
  return true;
};
