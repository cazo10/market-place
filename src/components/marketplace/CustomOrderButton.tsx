import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import CustomOrderDialog from './CustomOrderDialog';

export default function CustomOrderButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        className="fixed bottom-20 right-4 rounded-full w-14 h-14 p-0 hover-scale shadow-lg bg-primary text-white z-40"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
      <CustomOrderDialog open={open} onOpenChange={setOpen} />
    </>
  );
}