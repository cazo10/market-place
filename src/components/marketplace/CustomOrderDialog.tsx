import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CustomOrderForm from './CustomOrderForm';

interface CustomOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomOrderDialog({ open, onOpenChange }: CustomOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a Custom Product</DialogTitle>
          <DialogDescription>
            Can't find what you're looking for? Tell us and we'll find it for you!
          </DialogDescription>
        </DialogHeader>
        <CustomOrderForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}