import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Store,
  Info,
  Calendar,
  ThumbsUp,
  Search, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getVendorById, getProductsByVendorId, updateVendorLikes } from '@/lib/firebase';
import { toast } from 'sonner';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

const VendorProfilePage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        const vendorData = await getVendorById(vendorId);
        
        if (!vendorData) {
          toast.error('Vendor not found');
          navigate('/');
          return;
        }
        
        const vendorProducts = await getProductsByVendorId(vendorId);
        setVendor(vendorData);
        setProducts(vendorProducts);
        setFilteredProducts(vendorProducts); // Initialize filtered products
        
        // Initialize likes
        setLikesCount(vendorData.likes || 0);
        
        // Check if current user has liked this vendor
        if (user && vendorData.likedBy?.includes(user.uid)) {
          setLiked(true);
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        toast.error('Failed to load vendor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId, navigate, user]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleAddToCart = (product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleBuyNow = (product) => {
    if (!user) {
      toast.error('Please login to purchase items');
      return;
    }
    addToCart(product);
    navigate('/checkout');
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Check out ${vendor.businessName} on Soko Marketplace`,
        text: `Discover products from ${vendor.businessName} on Soko Marketplace`,
        url: `https://soko.ct.ws/vendor/${vendorId}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Sharing failed', error);
      toast.error('Failed to share link');
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to follow vendors');
      return;
    }

    try {
      const newLikedState = !liked;
      const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
      
      // Optimistic UI update
      setLiked(newLikedState);
      setLikesCount(newLikesCount);
      
      // Update in Firestore
      await updateVendorLikes(vendorId, user.uid, newLikedState);
      
      toast.success(newLikedState ? 'Vendor followed!' : 'Vendor unfollowed');
    } catch (error) {
      console.error('Error updating followers:', error);
      toast.error('Failed to update followers');
      // Revert on error
      setLiked(!liked);
      setLikesCount(likesCount);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (typeof date === 'object' && date.toDate) {
        return date.toDate().toLocaleDateString();
      }
      
      // Handle JavaScript Date
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      
      // Handle ISO string
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      
      return 'N/A';
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading vendor profile...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Vendor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="hover-scale"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('navigation.back')}
        </Button>

        {/* Vendor Profile Header */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-background z-0" />
          <CardContent className="relative z-10 p-6 flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0">
  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
    <AvatarImage 
      src={vendor.profileImage || '/default-avatar.png'} 
      alt={vendor.businessName}
      className="rounded-full object-cover h-full w-full"
    />
    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
      {vendor.businessName?.charAt(0) || 'V'}
    </AvatarFallback>
  </Avatar>
</div>

            
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{vendor.businessName}</h1>
                  <p className="text-muted-foreground mt-1">{vendor.category}</p>
                  
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge variant={vendor.verified ? "default" : "secondary"}>
                      {vendor.verified ? t('vendor.verified') : t('vendor.pending')}
                    </Badge>
                    <Badge variant={vendor.status === 'active' ? "default" : "destructive"}>
                      {vendor.status === 'active' ? t('vendor.active') : t('vendor.inactive')}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('vendor.joined')}: {formatDate(vendor.createdAt || vendor.updatedAt)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="hover-scale"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="hover-scale flex items-center"
                    onClick={handleLike}
                  >
                    <Users className={`h-4 w-4 mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{likesCount}</span>
                  </Button>
                </div>
              </div>
              
              <p className="mt-4 text-muted-foreground">
  {vendor.description || vendor.about || vendor.businessDescription || t('vendor.noDescription')}
</p>
              
              <div className="mt-4 flex flex-wrap gap-4">
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href={`mailto:${vendor.email}`} className="hover:underline">{vendor.email}</a>
                  </div>
                )}
                
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${vendor.phone}`} className="hover:underline">{vendor.phone}</a>
                  </div>
                )}
                
                {vendor.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-primary" />
                    <a 
                      href={vendor.website} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="hover:underline"
                    >
                      {vendor.website}
                    </a>
                  </div>
                )}
                
                {vendor.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{vendor.location}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Section */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full max-w-xs">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              {t('navigation.products')}
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t('navigation.about')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <div className="mt-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold">{t('vendor.availableProducts')}</h2>
                
                {/* Search Input */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t('common.search_products')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                    />
                  ))}
                </div>
              ) : (
                <Card className="py-12 text-center">
                  <CardContent>
                    {searchTerm ? (
                      <>
                        <p className="text-muted-foreground">{t('common.no_products_found')}</p>
                        <Button
                          variant="outline"
                          onClick={() => setSearchTerm('')}
                          className="mt-4"
                        >
                          Clear Search
                        </Button>
                      </>
                    ) : (
                      <p className="text-muted-foreground">{t('vendor.noProducts')}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="about">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  {t('vendor.about')} {vendor.businessName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{t('vendor.businessDescription')}</h3>
                  <p className="text-muted-foreground mt-1">
                    {vendor.description || vendor.about || vendor.businessDescription || t('vendor.noDescription')}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Date Joined:</p>
                      <p>{formatDate(vendor.createdAt || vendor.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated:</p>
                      <p>{formatDate(vendor.updatedAt)}</p>
                    </div>
                  </div>
                </div>
                
                {vendor.businessHours && (
                  <div>
                    <h3 className="font-semibold">Business Hours</h3>
                    <pre className="text-muted-foreground mt-1 font-sans">
                      {vendor.businessHours}
                    </pre>
                  </div>
                )}
                
                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorProfilePage;