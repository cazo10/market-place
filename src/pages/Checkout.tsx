import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { addOrder } from '@/lib/firebase';
import { toast } from 'sonner';
import { auth, getUserData } from '@/lib/firebase';

const Checkout = () => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    details: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);
  const [vendorPhone, setVendorPhone] = useState('255787000000'); // Default fallback
  const { t } = useLanguage();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  // Auto-fill customer info from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userData = await getUserData(user.uid);
          if (userData) {
            setCustomerInfo(prev => ({
              ...prev,
              name: userData.name || prev.name,
              phone: userData.phone || prev.phone,
              email: userData.email || prev.email,
              address: userData.address || prev.address
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.warning('Could not load saved user information');
      }
    };

    fetchUserData();
  }, []);

  // Pre-fetch vendor phone number on component mount
  useEffect(() => {
    const fetchVendorPhone = async () => {
      try {
        if (cartItems.length > 0 && cartItems[0].vendorId) {
          const { getVendors } = await import('@/lib/firebase');
          const vendors = await getVendors();
          const vendor = vendors.find(v => v.id === cartItems[0].vendorId);
          if (vendor && vendor.phone) {
            setVendorPhone(formatPhoneNumber(vendor.phone));
          }
        }
      } catch (error) {
        console.error('Error fetching vendor phone:', error);
      }
    };
    
    fetchVendorPhone();
  }, [cartItems]);

  // Format phone number to international format (255...)
  const formatPhoneNumber = (phone) => {
    if (!phone) return '255787000000'; // Default fallback number
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 255
    if (digits.startsWith('0')) {
      return `255${digits.substring(1)}`;
    }
    
    // If doesn't start with country code, add 255
    if (!digits.startsWith('255') && digits.length === 9) {
      return `255${digits}`;
    }
    
    // Return as-is if already in international format
    return digits;
  };

  const generateWhatsAppMessage = () => {
    const orderDate = new Date().toLocaleDateString();
    const orderTime = new Date().toLocaleTimeString();
    
    let message = `*NEW ORDER REQUEST*%0A%0A`;
    message += `*Order Summary*%0A`;
    message += `Date: ${orderDate}%0A`;
    message += `Time: ${orderTime}%0A%0A`;
    
    message += `*Customer Information*%0A`;
    message += `Name: ${customerInfo.name}%0A`;
    message += `Phone: ${customerInfo.phone}%0A`;
    message += `Email: ${customerInfo.email}%0A`;
    message += `Address: ${customerInfo.address}%0A`;
    
    if (customerInfo.details) {
      message += `Details: ${customerInfo.details}%0A%0A`;
    }
    
    message += `*Items Ordered*%0A`;
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name}%0A`;
      message += `   Qty: ${item.quantity}%0A`;
      message += `   Price: ${item.price.toLocaleString()} TSh%0A`;
      message += `   Subtotal: ${(item.price * item.quantity).toLocaleString()} TSh%0A%0A`;
    });
    
    message += `*TOTAL AMOUNT: ${getTotalPrice().toLocaleString()} TSh*%0A%0A`;
    message += `Please confirm this order.`;
    
    return message;
  };

  const placeOrderInSystem = async () => {
    try {
      for (const item of cartItems) {
        await addOrder({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
          customerAddress: customerInfo.address,
          customerDetails: customerInfo.details,
          vendorId: item.vendorId || 'demo-vendor',
          vendorName: item.vendorName || 'Demo Vendor',
          status: 'pending'
        });
      }
      
      clearCart();
      toast.success('Order placed successfully!');
      return true;
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
      return false;
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email || !customerInfo.address) {
      toast.error('Please fill in all required customer information first');
      return;
    }

    setIsWhatsAppLoading(true);

    try {
      // Generate message BEFORE opening window
      const message = generateWhatsAppMessage();
      
      // Create hidden link to preserve user action context
      const link = document.createElement('a');
      link.href = `https://wa.me/${vendorPhone}?text=${message}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      
      // Place order in system
      const orderSuccess = await placeOrderInSystem();
      
      if (orderSuccess) {
        // Trigger click within same execution context
        link.click();
        toast.success('Order placed! WhatsApp opened with order details.');
      }
      
      // Clean up
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error in WhatsApp order process:', error);
      toast.error('Failed to process order');
    } finally {
      setIsWhatsAppLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await placeOrderInSystem();
      if (success) {
        toast.success('Order placed successfully! You may now continue shopping.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t('common.your_cart_is_empty')}</h2>
            <Link to="/products">
              <Button>{t('common.continue_shopping')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back_to_home')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Customer Information */}
          <Card className="w-full">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                {t('common.customer_information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">{t('common.name')}</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">{t('common.phone')}</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">{t('common.delivery_address')}</Label>
                  <Input
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                   
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details" className="text-sm font-medium">{t('common.additional_details')}</Label>
                  <Textarea
                    id="details"
                    value={customerInfo.details}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, details: e.target.value }))}
                    placeholder={t('common.special_instructions')}
                    rows={3}
                    className="w-full resize-none  placeholder-gray-400"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    type="button" 
                    className="w-full text-sm sm:text-base py-3 bg-green-600 hover:bg-green-700"
                    onClick={handleWhatsAppOrder}
                    disabled={isWhatsAppLoading}
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="truncate">
                      {isWhatsAppLoading ? t('common.processing') : `${t('common.whatsapp_order')} - ${t('common.currency')} ${getTotalPrice().toLocaleString()}`}
                    </span>
                  </Button>
                  
                 <Link to="/products" className="hidden">
  <Button variant="outline" className="w-full hover-scale">
    <ArrowLeft className="h-4 w-4 mr-2" />
    {t('common.continue_shopping')}
  </Button>
</Link>

                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Order Summary */}
          <Card className="w-full">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">{t('common.order_summary')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('common.quantity')}: {item.quantity} × {t('common.currency')} {item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-medium text-sm flex-shrink-0">
                        {t('common.currency')} {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-base sm:text-lg font-semibold">
                  <span>{t('common.total')}:</span>
                  <span className="text-primary">
                    {t('common.currency')} {getTotalPrice().toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;