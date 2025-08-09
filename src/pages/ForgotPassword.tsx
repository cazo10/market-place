import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { sendPasswordReset } from '@/lib/firebase';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await sendPasswordReset(email);
      toast.success(t('forgot_password.success_message'));
      setIsOpen(false);
      setEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || t('forgot_password.error_message'));
    } finally {
      setIsLoading(false);
    }
  };

 return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0 text-sm text-muted-foreground hover:text-primary">
          {t('login.forgot_password')}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('forgot_password.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('forgot_password.email_label')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('forgot_password.email_placeholder')}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('forgot_password.sending') : t('forgot_password.submit')}
          </Button>
        </form>
        
        {/* Persistent Spam Folder Reminder */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {t('forgot_password.spam_reminder_title')}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {t('forgot_password.spam_reminder_text')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword;