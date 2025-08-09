import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu = ({ isOpen, onClose }: SideMenuProps) => {
  const { t } = useLanguage();
  const { user, isVendor, handleLogout } = useAuth();

  return (
    <div
      className={`fixed inset-0 z-50 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Menu Content */}
      <div className="relative h-full w-80 max-w-full bg-background shadow-lg">
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover-scale"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Menu Items */}
        <nav className="flex flex-col p-4 space-y-2">
          <Link 
            to="/products" 
            className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            onClick={onClose}
          >
            {t('common.products')}
          </Link>
          
          {user && (
            <Link 
              to="/orders" 
              className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors"
              onClick={onClose}
            >
              My Orders
            </Link>
          )}
          
          {isVendor && (
            <Link 
              to="/vendor" 
              className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors"
              onClick={onClose}
            >
              Vendor Dashboard
            </Link>
          )}

          <Link 
            to="/admin" 
            className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            onClick={onClose}
          >
            Admin Dashboard
          </Link>

          <div className="border-t pt-4 mt-2">
            {!user ? (
              <>
                <Link 
                  to="/login" 
                  className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                  onClick={onClose}
                >
                  {t('common.login')}
                </Link>
                <Link 
                  to="/register" 
                  className="block px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                  onClick={onClose}
                >
                  {t('common.register')}
                </Link>
              </>
            ) : (
              <button 
                className="block w-full text-left px-4 py-3 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                onClick={() => {
                  onClose();
                  handleLogout();
                }}
              >
                Logout
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SideMenu;