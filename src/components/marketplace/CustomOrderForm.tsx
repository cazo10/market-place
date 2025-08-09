import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CustomOrderImageUpload from './CustomOrderImageUpload';
import { addCustomOrder } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface CustomOrderFormProps {
  onSuccess: () => void;
}

export default function CustomOrderForm({ onSuccess }: CustomOrderFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: '',
    priceRange: '',
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addCustomOrder({
        ...formData,
        userId: user?.uid || null,
        userName: user?.displayName || 'Guest',
        userEmail: user?.email || null
      });
      toast.success('Your request has been submitted!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to submit your request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImagesChange = (images) => {
    setFormData(prev => ({ ...prev, images }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
      <div>
        <Label>Product Name *</Label>
        <Input
          value={formData.productName}
          onChange={(e) => setFormData({...formData, productName: e.target.value})}
          required
        />
      </div>
      
      {/* Other form fields... */}
      
      <CustomOrderImageUpload 
        images={formData.images} 
        onChange={handleImagesChange} 
      />
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  );
}