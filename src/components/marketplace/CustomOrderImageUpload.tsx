import { Image as ImageIcon, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { uploadBase64Image } from '@/lib/firebase';

interface CustomOrderImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function CustomOrderImageUpload({ images, onChange }: CustomOrderImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    if (!e.target.files) return;
    setIsUploading(true);
    
    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(file => uploadBase64Image(file));
      const newImages = await Promise.all(uploadPromises);
      onChange([...images, ...newImages]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Label>Upload Images (Optional)</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((img, index) => (
          <div key={index} className="relative">
            <img src={img} className="h-16 w-16 object-cover rounded" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => removeImage(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      
      <Label
        htmlFor="custom-order-images"
        className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground" />
        <span className="text-sm text-center">
          {isUploading ? 'Uploading...' : 'Click to upload images'}
        </span>
        <input
          id="custom-order-images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={isUploading}
        />
      </Label>
    </div>
  );
}