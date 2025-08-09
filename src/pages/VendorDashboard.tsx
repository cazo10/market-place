import React, { useState, useEffect, useCallback } from 'react';
import { optimizeImage, validateImage } from '@/utils/imageUtils';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  MessageSquare,
  Plus,
  Trash2,
  Eye,
  Mail,
  MailOpen,
  Home,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
} from 'lucide-react';

import { ChatBot } from '@/components/chat/ChatBot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useBackButton } from '@/hooks/useBackButton';
import { 
 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  getMessagesByRecipient, 
  deleteMessage, 
  getOrdersByVendor, 
  addProduct, 
  uploadBase64Image, 
  getProductsByVendor, 
  deleteProduct,
  updateOrderStatus,
  deleteOrder,
  getVendorByEmail
} from '@/lib/firebase';
import { toast } from 'sonner';


const VendorDashboard = () => {
  // All state hooks at the top
  const [messages, setMessages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    originalPrice: ''
  });
  const [productImages, setProductImages] = useState([]);
  const [isOptimizingImages, setIsOptimizingImages] = useState(false);

  // All context hooks next
  const { t } = useLanguage();
  const { user, userData, isVendor } = useAuth();
  const { goBack } = useBackButton();

  // Other hooks (useRef, useCallback, useEffect) after
  const vendorId = vendorData?.id || userData?.id || user?.uid;



  useEffect(() => {
    if (user?.email) {
      checkVendorAccess();
    }
  }, [user?.email]);

  useEffect(() => {
    if (vendorData && vendorData.status !== 'suspended' && vendorData.status !== 'inactive') {
      loadInitialData();
    }
  }, [vendorData]);

  
  const checkVendorAccess = async () => {
    try {
      setIsCheckingAccess(true);
      console.log('Checking vendor access for:', user.email);
      const vendor = await getVendorByEmail(user.email);
      console.log('Vendor data found:', vendor);
      
      if (vendor) {
        setVendorData(vendor);
      } else {
        console.log('No vendor found with email:', user.email);
        setVendorData(null);
      }
    } catch (error) {
      console.error('Error checking vendor access:', error);
      setVendorData(null);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const loadInitialData = async () => {
    console.log('Loading initial data for vendor:', vendorId);
    await Promise.all([
      loadMessages(),
      loadOrders(),
      loadProducts()
    ]);
  };

  const loadMessages = async () => {
    if (!vendorId && !user?.email) {
      console.log('No vendor ID or email available for loading messages');
      return;
    }
    
    setIsLoadingMessages(true);
    try {
      console.log('Loading messages for:', vendorId || user.email);
      const messagesData = await getMessagesByRecipient(vendorId || user.email);
      console.log('Loaded messages:', messagesData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadOrders = async () => {
    if (!vendorId) {
      console.log('No vendor ID available for loading orders');
      return;
    }
    
    try {
      console.log('Loading orders for vendor:', vendorId);
      const ordersData = await getOrdersByVendor(vendorId);
      console.log('Loaded orders:', ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const loadProducts = async () => {
    if (!vendorId) {
      console.log('No vendor ID available for loading products');
      return;
    }
    
    setIsLoadingProducts(true);
    try {
      console.log('Loading products for vendor:', vendorId);
      const productsData = await getProductsByVendor(vendorId);
      console.log('Loaded products:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

const refreshData = useCallback(async () => {
  try {
    await Promise.all([
      loadMessages(),
      loadOrders(),
      loadProducts()
    ]);
    toast.success('Data refreshed successfully');
  } catch (error) {
    console.error('Error refreshing data:', error);
    toast.error('Failed to refresh data');
  }
}, [loadMessages, loadOrders, loadProducts]);









  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking vendor access...</p>
        </div>
      </div>
    );
  }

   

  if (vendorData.status === 'suspended' || vendorData.status === 'inactive') {
    return (
      <div className="min-h-screen bg-background p-6">
  <div className="max-w-md mx-auto mt-20">
    <Card className="text-center">
      <CardContent className="p-8">
        <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-semibold mb-4">Account Suspended</h2>
        <p className="text-muted-foreground mb-4">
          Your vendor account has been <strong>{vendorData.status}</strong> by the administrator. <br />
          For assistance, please contact support:<br />
          <strong>Phone:</strong> 0775 769 177<br />
          <strong>Email:</strong> sokocamp@gmail.com
        </p>
        <Link to="/">
          <Button variant="outline">Return to Home</Button>
        </Link>
      </CardContent>
    </Card>
  </div>
</div>

    );
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      toast.success('Message deleted successfully!');
      loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, productId = null, quantity = null) => {
    try {
      await updateOrderStatus(orderId, newStatus, productId, quantity);
      toast.success(`Order status updated to ${getStatusText(newStatus)}`);
      loadOrders();
      loadProducts();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId);
      toast.success('Order deleted successfully!');
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Pending';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleAddProduct = async (e) => {
  e.preventDefault();
  setIsAddingProduct(true);

  try {
    let imageUrls = [];
    if (productImages.length > 0) {
      // Images are already optimized, just convert to base64
      imageUrls = await Promise.all(
        productImages.map(image => uploadBase64Image(image))
      );
    }

    await addProduct({
      ...productData,
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
      stock: parseInt(productData.stock),
      images: imageUrls,
      vendorId: vendorId,
      vendorName: vendorData?.businessName || userData?.name || user.email
    });

    toast.success('Product added successfully!');
    setShowAddProduct(false);
    setProductData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      originalPrice: ''
    });
    setProductImages([]);
    loadProducts();
  } catch (error) {


    console.error('Error adding product:', {
    error: error.message,
    productData,
    imageCount: productImages.length,
    imageSizes: productImages.map(img => img.size)
  });
  toast.error(`Failed to add product: ${error.message}`);

    
  } finally {
    setIsAddingProduct(false);
  }
};

  const handleImageChange = async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  try {
    setIsOptimizingImages(true);
    // Validate each file first
    files.forEach(file => validateImage(file));
    
    // Optimize all images in parallel
    const optimizedImages = await Promise.all(
      files.map(file => optimizeImage(file))
    );
    
    setProductImages(optimizedImages);
  } catch (error) {
    toast.error(error.message);
    e.target.value = ''; // Clear the input
  }
};


  const unreadMessages = messages.filter(msg => !msg.read);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = orders
    .filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    })
    .reduce((total, order) => total + (order.total || 0), 0);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Debug info */}
       {/* 
<div className="mb-4 p-2 bg-gray-100 rounded text-xs">
  <p>Vendor email: {user?.email}</p>
  <p>Vendor ID: {vendorId}</p>
  <p>Vendor status: {vendorData?.status}</p>
  <p>Messages: {messages.length}</p>
  <p>Orders: {orders.length}</p>
  <p>Products: {products.length}</p>
</div> 
*/}

        {/* Header - Made responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
           
<ChatBot vendorId={vendorId} />
           <div>
  <h1 className="text-[20px] font-bold text-primary uppercase">
    Vendor Dashboard
  </h1>
  <p className="text-muted-foreground text-sm sm:text-base">
    Welcome back,{" "}
    <span className="text-green-500">
      {vendorData?.businessName || userData?.name || user.email}
    </span>
  </p>
</div>

          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button  variant="outline" onClick={refreshData} className="hover-scale text-sm w-fit">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button className="hover-scale w-fit text-sm" onClick={() => setShowAddProduct(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Made responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Products</p>
                  <p className="text-lg sm:text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-lg sm:text-2xl font-bold">{orders.length}</p>
                </div>
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-base sm:text-2xl font-bold">TSh {monthlyRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Unread Messages</p>
                  <p className="text-lg sm:text-2xl font-bold">{unreadMessages.length}</p>
                </div>
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - Made responsive */}
        <Tabs defaultValue="products" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm">
            <TabsTrigger value="products">{t('common.products')}</TabsTrigger>
            <TabsTrigger value="orders">{t('common.orders')}</TabsTrigger>
            <TabsTrigger value="inbox" className="relative">
              {t('common.inbox')}
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-xs">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>My Products</CardTitle>
                <CardDescription>Manage your product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading products...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No products yet. Add your first product!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                          <Card key={product.id} className="hover-scale">
                            <CardContent className="p-4">
                              {product.images && product.images[0] && (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-full h-32 object-cover rounded-md mb-2"
                                />
                              )}
                              <h4 className="font-medium mb-1">{product.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold">TSh {product.price?.toLocaleString()}</span>
                                <Badge variant="outline">Stock: {product.stock}</Badge>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="w-full"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Product
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Orders placed by customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No orders yet</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Order #{order.id.slice(-8)}</h4>
                          <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status || 'pending')}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 mb-3">
                          <p><strong>Customer:</strong> {order.customerName}</p>
                          <p><strong>Phone:</strong> {order.customerPhone}</p>
                          <p><strong>Email:</strong> {order.customerEmail}</p>
                          <p><strong>Address:</strong> {order.customerAddress}</p>
                          {order.customerDetails && (
                            <p><strong>Customer Details:</strong> {order.customerDetails}</p>
                          )}
                          <p><strong>Product:</strong> {order.productName}</p>
                          <p><strong>Quantity:</strong> {order.quantity}</p>
                          <p><strong>Total:</strong> TSh {order.total?.toLocaleString()}</p>
                          <p><strong>Date:</strong> {order.createdAt?.toDate ? 
                            order.createdAt.toDate().toLocaleString() : 'Unknown'
                          }</p>
                        </div>
                        
                        <div className="mb-4 p-3 bg-secondary/20 rounded-lg">
                          <div className="flex items-center justify-between text-xs">
                            <div className={`flex items-center gap-1 ${
                              ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted-foreground'
                              }`} />
                              Placed
                            </div>
                            <div className={`flex items-center gap-1 ${
                              ['processing', 'shipped', 'delivered'].includes(order.status) ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                ['processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted-foreground'
                              }`} />
                              Processing
                            </div>
                            <div className={`flex items-center gap-1 ${
                              ['shipped', 'delivered'].includes(order.status) ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                ['shipped', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted-foreground'
                              }`} />
                              Shipped
                            </div>
                            <div className={`flex items-center gap-1 ${
                              order.status === 'delivered' ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                order.status === 'delivered' ? 'bg-primary' : 'bg-muted-foreground'
                              }`} />
                              Delivered
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {order.status !== 'processing' && order.status !== 'shipped' && order.status !== 'delivered' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Mark Processing
                            </Button>
                          )}
                          {order.status !== 'shipped' && order.status !== 'delivered' && order.status === 'processing' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Mark Shipped
                            </Button>
                          )}
                          {order.status !== 'delivered' && order.status === 'shipped' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered', order.productId, order.quantity)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Delivered
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {t('common.inbox')}
                    </CardTitle>
                    <CardDescription>Messages from admin and customers</CardDescription>
                  </div>
                  <Button onClick={loadMessages} disabled={isLoadingMessages} className="hover-scale">
                    {isLoadingMessages ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoadingMessages ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors animate-fade-in ${
                            !message.read ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedMessage(message)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {message.read ? (
                                  <MailOpen className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Mail className="h-4 w-4 text-primary" />
                                )}
                                <span className="font-medium">
                                  {message.senderName || 'Unknown Sender'}
                                </span>
                                <Badge variant={message.type === 'admin_message' ? 'destructive' : 'secondary'}>
                                  {message.type === 'admin_message' ? 'Admin' : 'Customer'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {message.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {message.createdAt?.toDate ? 
                                  message.createdAt.toDate().toLocaleString() : 
                                  'Unknown time'
                                }
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessage(message);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(message.id);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Sales and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Sales Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Revenue:</span>
                        <span className="font-bold">TSh {orders.reduce((total, order) => total + (order.total || 0), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This Month:</span>
                        <span className="font-bold">TSh {monthlyRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Order:</span>
                        <span className="font-bold">
                          TSh {orders.length > 0 ? Math.round(orders.reduce((total, order) => total + (order.total || 0), 0) / orders.length).toLocaleString() : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Product Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Active Products:</span>
                        <span className="font-bold">{products.filter(p => p.stock > 0).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Out of Stock:</span>
                        <span className="font-bold">{products.filter(p => p.stock === 0).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Inventory:</span>
                        <span className="font-bold">{products.reduce((total, product) => total + (product.stock || 0), 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog - Made scrollable and responsive */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Product</DialogTitle>
      {/* Add DialogDescription */}
      <DialogDescription>
        Fill out the form to add a new product to your store
      </DialogDescription>
    </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productData.name}
                  onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Description</Label>
                <Textarea
                  id="productDescription"
                  value={productData.description}
                  onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productPrice">Price (TSh)</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    value={productData.price}
                    onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (TSh) - Optional</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={productData.originalPrice}
                    onChange={(e) => setProductData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productStock">Stock Quantity</Label>
                <Input
                  id="productStock"
                  type="number"
                  value={productData.stock}
                  onChange={(e) => setProductData(prev => ({ ...prev, stock: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCategory">Category</Label>
                <select
                  id="productCategory"
                  value={productData.category}
                  onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="home">Home & Garden</option>
                  <option value="sports">Sports</option>
                  <option value="books">Books</option>
                  <option value="beauty">Beauty</option>
                  <option value="toys">Toys & Games</option>
                  <option value="food">Food & Beverages</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
  <Label htmlFor="productImages">Product Images</Label>
  <Input
    id="productImages"
    type="file"
    accept="image/jpeg, image/png, image/webp"
    multiple
    onChange={handleImageChange}
  />
  
  {productImages.length > 0 && (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {productImages.map((image, index) => (
        <div key={index} className="relative">
          <img
            src={URL.createObjectURL(image)}
            alt={`Preview ${index + 1}`}
            className="h-24 w-full object-cover rounded-md"
          />
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
            {(image.size / 1024).toFixed(1)}KB
          </span>
        </div>
      ))}
    </div>
  )}
</div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingProduct}>
                  {isAddingProduct ? 'Adding...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedMessage.type === 'admin_message' ? 'destructive' : 'secondary'}>
                  {selectedMessage.type === 'admin_message' ? 'Admin' : 'Customer'}
                </Badge>
                <span className="font-medium">{selectedMessage.senderName}</span>
                <span className="text-sm text-muted-foreground">
                  {selectedMessage.createdAt?.toDate ? 
                    selectedMessage.createdAt.toDate().toLocaleString() : 
                    'Unknown time'
                  }
                </span>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={() => setSelectedMessage(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      
    </div>
  );
};

export default VendorDashboard;