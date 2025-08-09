
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  User, 
  Menu, 
  X, 
  Globe,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  Shield,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import CartSidebar from '@/components/CartSidebar';

const Header = ({ currentPage, setCurrentPage, searchTerm, setSearchTerm, showSearch }) => {

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { getTotalItems, openCart } = useCart();
  const { user, userData, logout, isVendor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (userData?.name) {
      return userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };
return (
  <>
    <header className="sticky top-0 z-50 w-full  bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
         <Button
  variant="outline"
  className="px-4 py-2 hover:scale-105 transition-transform duration-200 bg-transparent"
  onClick={() => {
    setIsMobileMenuOpen(false);
    document.getElementById('products-section')?.scrollIntoView({
      behavior: 'smooth'
    });
    // Remove setCurrentPage since we're not changing pages anymore
  }}
>
  <div className="flex items-center space-x-4">
    <img
      src="https://i.ibb.co/27p1jbnw/10629681.png"
      alt="Search"
      className="h-7 w-7 object-contain"
    />
    <p className="text-sm font-medium text-black">{t('common.search')}</p>
  </div>
</Button>


            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                 <Button 
  variant="ghost" 
  size="sm" 
  className="!inline-flex items-center gap-2 hover:scale-[1.02] transition-transform"
>
  <div className="relative h-8 w-8"> {/* Container for precise control */}
    <img
      src="https://i.ibb.co/mF0B2kHF/flag-great-britain-tanzania-260nwnhg-1083694664.jpg"
      alt="Language"
      className="absolute h-full w-full rounded-full object-cover border border-gray-200"
    />
  </div>
  <span className="text-sm">{currentLanguage.toUpperCase()}</span>
</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('sw')}>
                    Kiswahili
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile (if logged in) */}
{user && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        className="relative h-8 w-8 rounded-full ring-2 ring-primary-400 hover:ring-yellow-500"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={userData?.profileImage} alt={userData?.name || user.email} />
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end" forceMount>
      <div className="flex items-center justify-start gap-2 p-2">
        <div className="flex flex-col space-y-1 leading-none">
          {userData?.name && (
            <p className="font-medium">{userData.name}</p>
          )}
          <p className="w-[200px] truncate text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>
      <DropdownMenuSeparator />
      
      <DropdownMenuItem asChild>
        <Link to="/orders">
          <Package className="mr-2 h-4 w-4" />
          <span>My Orders</span>
        </Link>
      </DropdownMenuItem>
      
      {isVendor && (
        <DropdownMenuItem asChild>
          <Link to="/vendor">
            <Settings className="mr-2 h-4 w-4" />
            <span>Vendor Dashboard</span>
          </Link>
        </DropdownMenuItem>
      )}
      
      <DropdownMenuItem asChild>
        <Link to="/admin">
          <Shield className="mr-2 h-4 w-4" />
          <span>Admin Dashboard</span>
        </Link>
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
              {/* Cart Button */}
              {/* Cart Button - Replaced with Soko Camp Icon */}
<Button
  variant="ghost"
  size="sm"
  className="relative hover-scale"
  onClick={openCart}
>
  {/* Replace ShoppingCart icon with your logo */}
  <img
    src="https://i.ibb.co/q3s6cRWt/7835563.png"
    alt="Soko Camp Icon"
    className="h-8 w-8" // Adjust size as needed
  />
  {getTotalItems() > 0 && (
    <Badge 
      variant="destructive" 
      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-scale-in"
    >
      {getTotalItems()}
    </Badge>
  )}
</Button>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/products">
                  <Button variant="ghost" size="sm" className="hover-scale">
                    {t('common.products')}
                  </Button>
                </Link>
                
                {user && (
                  <Link to="/orders">
                    <Button variant="ghost" size="sm" className="hover-scale">
                      My Orders
                    </Button>
                  </Link>
                )}
                
                {isVendor && (
                  <Link to="/vendor">
                    <Button variant="ghost" size="sm" className="hover-scale">
                      Vendor Dashboard
                    </Button>
                  </Link>
                )}

                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="hover-scale">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>

                {!user ? (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm" className="hover-scale">
                        <LogIn className="h-4 w-4 mr-2" />
                        {t('common.login')}
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="sm" className="hover-scale">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('common.register')}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" className="hover-scale" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t py-4 animate-slide-in-down">
              <div className="flex flex-col space-y-2">
                <Link 
                  to="/products" 
                  className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('common.products')}
                </Link>
                
                {user && (
                  <Link 
                    to="/orders" 
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                )}
                
                {isVendor && (
                  <Link 
                    to="/vendor" 
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Vendor Dashboard
                  </Link>
                )}

                <Link 
                  to="/admin" 
                  className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>

                <div className="border-t pt-2 mt-2">
                  {!user ? (
                    <>
                      <Link 
                        to="/login" 
                        className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('common.login')}
                      </Link>
                      <Link 
                        to="/register" 
                        className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('common.register')}
                      </Link>
                    </>
                  ) : (
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <CartSidebar />
    </>
  );
};

export default Header;
