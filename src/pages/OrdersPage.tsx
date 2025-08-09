import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Eye, Truck, Home, CheckCircle, Clock, RefreshCw, Star, Heart, Trash2, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getOrdersByCustomer, listenToCollection, where, orderBy, getDoc, doc } from '@/lib/firebase';
import Header from '@/components/Header';
import OrderTracking from '@/components/OrderTracking';
import ProductCard from '@/components/ProductCard';
import { db } from '@/lib/firebase';

// Local storage keys
const LOCAL_STORAGE_ORDERS_KEY = 'user_orders';
const LOCAL_STORAGE_DELETED_ORDERS_KEY = 'user_deleted_orders';

const UserPage = () => {
  const [orders, setOrders] = useState([]);
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'favorites', or 'deleted'
  const { user } = useAuth();

  // Load orders from local storage on initial render
  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY)) || [];
    const storedDeletedOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DELETED_ORDERS_KEY)) || [];
    
    setOrders(storedOrders);
    setDeletedOrders(storedDeletedOrders);
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadOrders();
      loadFavorites();
      
      const unsubscribeOrders = listenToCollection(
        'orders',
        (ordersData) => {
          const userOrders = ordersData.filter(order => 
            order.customerEmail && 
            order.customerEmail.toLowerCase() === user.email.toLowerCase()
          );
          
          // Merge with existing orders, preserving any locally stored data
          const mergedOrders = mergeOrders(orders, userOrders);
          setOrders(mergedOrders);
          saveOrdersToLocalStorage(mergedOrders);
        }
      );

      const unsubscribeUser = listenToCollection(
        'users',
        (usersData) => {
          const currentUser = usersData.find(u => u.uid === user.uid);
          if (currentUser?.favorites) {
            loadFavoriteProducts(currentUser.favorites);
          }
        },
        [where('uid', '==', user.uid)]
      );

      return () => {
        if (unsubscribeOrders) unsubscribeOrders();
        if (unsubscribeUser) unsubscribeUser();
      };
    }
  }, [user?.email, user?.uid]);

  // Merge Firebase orders with local storage orders
  const mergeOrders = (existingOrders, newOrders) => {
    const existingOrderIds = existingOrders.map(o => o.id);
    const ordersToAdd = newOrders.filter(order => !existingOrderIds.includes(order.id));
    
    return [...existingOrders, ...ordersToAdd];
  };

  const saveOrdersToLocalStorage = (ordersToSave) => {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(ordersToSave));
  };

  const saveDeletedOrdersToLocalStorage = (deletedOrdersToSave) => {
    localStorage.setItem(LOCAL_STORAGE_DELETED_ORDERS_KEY, JSON.stringify(deletedOrdersToSave));
  };

  const loadOrders = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const ordersData = await getOrdersByCustomer(user.email);
      const mergedOrders = mergeOrders(orders, ordersData);
      setOrders(mergedOrders);
      saveOrdersToLocalStorage(mergedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user?.uid) {
      setIsLoadingFavorites(false);
      return;
    }

    setIsLoadingFavorites(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const favorites = userSnap.data().favorites || [];
        loadFavoriteProducts(favorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const loadFavoriteProducts = async (favoriteIds) => {
    try {
      if (!favoriteIds || favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

      const productsPromises = favoriteIds.map(productId => 
        getDoc(doc(db, 'products', productId))
      );
      
      const productsSnaps = await Promise.all(productsPromises);
      const products = productsSnaps
        .filter(snap => snap.exists())
        .map(snap => ({ id: snap.id, ...snap.data() }));
        
      setFavorites(products);
    } catch (error) {
      console.error("Error loading favorite products:", error);
    }
  };

  const handleDeleteOrder = (orderId) => {
    const orderToDelete = orders.find(o => o.id === orderId);
    if (!orderToDelete) return;

    // Remove from active orders
    const updatedOrders = orders.filter(o => o.id !== orderId);
    setOrders(updatedOrders);
    saveOrdersToLocalStorage(updatedOrders);

    // Add to deleted orders
    const updatedDeletedOrders = [...deletedOrders, orderToDelete];
    setDeletedOrders(updatedDeletedOrders);
    saveDeletedOrdersToLocalStorage(updatedDeletedOrders);
  };

  const handleRestoreOrder = (orderId) => {
    const orderToRestore = deletedOrders.find(o => o.id === orderId);
    if (!orderToRestore) return;

    // Remove from deleted orders
    const updatedDeletedOrders = deletedOrders.filter(o => o.id !== orderId);
    setDeletedOrders(updatedDeletedOrders);
    saveDeletedOrdersToLocalStorage(updatedDeletedOrders);

    // Add back to active orders
    const updatedOrders = [...orders, orderToRestore];
    setOrders(updatedOrders);
    saveOrdersToLocalStorage(updatedOrders);
  };

  const handlePermanentDelete = (orderId) => {
    // Remove from deleted orders permanently
    const updatedDeletedOrders = deletedOrders.filter(o => o.id !== orderId);
    setDeletedOrders(updatedDeletedOrders);
    saveDeletedOrdersToLocalStorage(updatedDeletedOrders);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing': return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      default: return 'Pending';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Please log in to view your account</h2>
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              My Account
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={activeTab === 'orders' ? loadOrders : loadFavorites} 
            disabled={activeTab === 'orders' ? isLoading : isLoadingFavorites}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${
              (activeTab === 'orders' ? isLoading : isLoadingFavorites) ? 'animate-spin' : ''
            }`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'orders' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('orders')}
          >
            My Orders
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'favorites' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('favorites')}
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'deleted' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('deleted')}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Deleted Orders ({deletedOrders.length})
            </div>
          </button>
        </div>

        {activeTab === 'orders' ? (
          isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-3"></div>
                    <div className="h-6 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                <Link to="/products">
                  <Button>Browse Products</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.id.slice(-8).toUpperCase()}</h3>
                        <p className="text-sm text-muted-foreground">
                          Placed on: {order.createdAt?.toDate 
                            ? order.createdAt.toDate().toLocaleDateString() 
                            : new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        {order.updatedAt && order.updatedAt !== order.createdAt && (
                          <p className="text-sm text-muted-foreground">
                            Last updated: {order.updatedAt?.toDate 
                              ? order.updatedAt.toDate().toLocaleDateString() 
                              : new Date(order.updatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status || 'pending')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Product:</span>
                        <span className="text-sm font-medium">{order.productName || 'Unknown Product'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Quantity:</span>
                        <span className="text-sm">{order.quantity || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Vendor:</span>
                        <span className="text-sm">{order.vendorName || 'Unknown Vendor'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-sm font-bold">TSh {order.total?.toLocaleString() || '0'}</span>
                      </div>
                      {order.customerPhone && (
                        <div className="flex justify-between">
                          <span className="text-sm">Contact:</span>
                          <span className="text-sm">{order.customerPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Progress Indicator */}
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

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'favorites' ? (
          isLoadingFavorites ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded mb-3"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-4">
                  Tap the star icon on products to add them to your favorites
                </p>
                <Link to="/products">
                  <Button>Browse Products</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        ) : (
          // Deleted orders tab
          <div className="grid gap-4">
            {deletedOrders.length === 0 ? (
              <Card className="text-center">
                <CardContent className="p-8">
                  <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No deleted orders</h3>
                  <p className="text-muted-foreground mb-4">
                    Deleted orders will appear here and can be restored
                  </p>
                </CardContent>
              </Card>
            ) : (
              deletedOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow border-destructive/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.id.slice(-8).toUpperCase()}</h3>
                        <p className="text-sm text-muted-foreground">
                          Placed on: {order.createdAt?.toDate 
                            ? order.createdAt.toDate().toLocaleDateString() 
                            : new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        Deleted
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Product:</span>
                        <span className="text-sm font-medium">{order.productName || 'Unknown Product'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total:</span>
                        <span className="text-sm font-bold">TSh {order.total?.toLocaleString() || '0'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRestoreOrder(order.id)}
                      >
                        <Undo className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handlePermanentDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Permanently
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Order Tracking Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Tracking</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <OrderTracking order={selectedOrder} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;