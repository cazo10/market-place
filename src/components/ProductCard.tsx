import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ShoppingCart, Zap, ChevronLeft, ChevronRight, Star, Heart, UserPlus } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onVendorUpdate, db } from '@/lib/firebase';
import { toast } from 'sonner';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot } from 'firebase/firestore';
import { getDoc, setDoc } from "firebase/firestore";
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category?: string;
  images: string[];
  vendorId?: string;
  features?: string[];
}

interface VendorData {
  businessName?: string;
  profileImage?: string;
}

interface ProductCardProps {
  product: Product;
  initialVendorData?: VendorData;
  lazyLoad?: boolean; // New prop for lazy loading
}

type BadgeVariant = "default" | "destructive" | "outline" | "secondary" | "success";

const ProductCard = memo(({ product, initialVendorData, lazyLoad = true }: ProductCardProps) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [vendorData, setVendorData] = useState(initialVendorData || {});
  const [isHovering, setIsHovering] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const cardElement = document.querySelector(`#product-${product.id}`);
    if (cardElement) {
      observer.observe(cardElement);
    }

    return () => {
      if (cardElement) {
        observer.unobserve(cardElement);
      }
    };
  }, [product.id, lazyLoad]);

  const ensureUserDocument = useCallback(async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', userId), {
          uid: userId,
          email: user?.email || '',
          favorites: []
        });
      }
    } catch (error) {
      console.error("Error ensuring user document:", error);
    }
  }, [user]);

  const stockBadge = useMemo(() => {
    if (product.stock === 0) return { variant: 'destructive' as const, text: 'Out of Stock' };
    if (product.stock <= 5) return { variant: 'destructive' as const, text: `Only ${product.stock} left!` };
    if (product.stock <= 10) return { variant: 'success' as const, text: `${product.stock} in stock` };
    return { variant: 'success' as const, text: `${product.stock} in stock` };
  }, [product.stock]);

  // Fetch vendor data only when visible
  useEffect(() => {
    if (!isVisible || !product.vendorId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'vendors', product.vendorId),
      (doc) => {
        if (doc.exists()) {
          const vendorData = doc.data();
          setVendorData({
            businessName: vendorData.businessName || 'Vendor',
            profileImage: vendorData.profileImage || '/default-avatar.png'
          });
        }
      },
      (error) => {
        console.error("Vendor data fetch error:", error);
      }
    );

    return () => unsubscribe();
  }, [product.vendorId, isVisible]);

  // Combined user data effect - only when visible
  useEffect(() => {
    if (!isVisible) return;
    
    if (!user?.uid) {
      setIsFavorite(false);
      return;
    }

    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setIsFavorite(userData.favorites?.includes(product.id) || false);
      }
    }, (error) => {
      console.error("User favorites fetch error:", error);
    });

    return () => unsubscribeUser();
  }, [user, product.id, isVisible]);

  // Handle browser back button when modal is open
  useEffect(() => {
    if (!showProductDetails) return;

    const handlePopState = () => {
      setShowProductDetails(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showProductDetails]);

  const handleCardClick = useCallback(() => {
    setShowProductDetails(true);
    if (!showProductDetails) {
      window.history.pushState({ modalOpen: true }, '');
    }
  }, [showProductDetails]);

  const handleCloseModal = useCallback(() => {
    setShowProductDetails(false);
    if (window.history.state?.modalOpen) {
      window.history.back();
    }
  }, []);

  // Memoized derived values
  const images = useMemo(() => product.images || ['/placeholder.svg'], [product.images]);
  const hasMultipleImages = useMemo(() => images.length > 1, [images.length]);
  
  const discountPercentage = useMemo(() => {
    return product.originalPrice && product.originalPrice > product.price 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;
  }, [product.originalPrice, product.price]);

  const toggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowLoginPopup(true);
      return;
    }

    try {
      await ensureUserDocument(user.uid);
      const newFavoriteState = !isFavorite;
      setIsFavorite(newFavoriteState);

      await updateDoc(doc(db, 'users', user.uid), {
        favorites: newFavoriteState ? arrayUnion(product.id) : arrayRemove(product.id)
      });
      
      toast.success(newFavoriteState ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Favorite update error:", error);
      setIsFavorite(!isFavorite);
      toast.error(`Failed to update favorites: ${error.message}`);
    }
  }, [user, isFavorite, product.id, ensureUserDocument]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginPopup(true);
      setTimeout(() => setShowLoginPopup(false), 5000);
      return;
    }
    addToCart(product);
    toast.success("Added to cart");
  }, [user, product, addToCart]);

  const handleBuyNow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginPopup(true);
      setTimeout(() => setShowLoginPopup(false), 5000);
      return;
    }
    addToCart(product);
    navigate('/checkout');
  }, [user, product, addToCart, navigate]);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  if (!isVisible) {
    return (
      <div id={`product-${product.id}`} className="h-[350px] w-full">
        {/* Placeholder for lazy loading */}
      </div>
    );
  }

  return (
    <>
      {/* Product Card */}
      <motion.div
        id={`product-${product.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Card 
          className="group transition-all duration-300 overflow-hidden h-full flex flex-col cursor-pointer relative border-0 shadow-md rounded-xl"
          onClick={handleCardClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Favorite Button */}
          <div className="absolute top-1 right-3 z-20">
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm transition-all hover:scale-110 shadow-md"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`h-3 w-3 transition-colors ${
                  isFavorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              />
            </button>
          </div>
          
          {/* Image Section */}
          <div className="relative overflow-hidden aspect-square bg-gray-50 rounded-t-xl">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
            )}
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={handleImageLoad}
            />
            
            {/* Floating Price */}
            <div className="absolute bottom-2 left-2 bg-primary/90 text-white px-2 py-1 rounded-md text-sm font-bold">
              {t('common.currency')} {product.price?.toLocaleString()}
            </div>
            
            {/* Image Navigation */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 hover:bg-white shadow-md opacity-100"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 hover:bg-white shadow-md opacity-100"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 transition-opacity ${
                  isHovering ? 'opacity-100' : 'opacity-0'
                } group-hover:opacity-100`}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white w-3 h-3' : 'bg-white/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Badges */}
            <Badge variant={stockBadge.variant} className="absolute top-3 left-3">
              {stockBadge.text}
            </Badge>

            {discountPercentage && (
              <Badge variant="destructive" className="absolute top-12 right-3">
                -{discountPercentage}%
              </Badge>
            )}
          </div>
          
          {/* Details Section */}
          <CardContent className="p-4 flex-grow flex flex-col border-t border-gray-100 dark:border-gray-700">
            <div className="flex-grow space-y-2">
              {/* Vendor Info */}
              {vendorData.businessName && (
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={vendorData.profileImage} />
                    <AvatarFallback>{vendorData.businessName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {vendorData.businessName}
                  </span>
                </div>
              )}
              
              <h3 className="font-bold text-[11px] line-clamp-2 min-h-[2.5rem]">
  {product.name}
</h3>

              
             <p className="text-[10px] font-light text-muted-foreground line-clamp-2 min-h-[2.5rem]">
  {product.description}
</p>

              
              <div className="flex items-center justify-between mt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-xs text-muted-foreground line-through">
                        {t('common.currency')} {product.originalPrice?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Product Details Dialog */}
      <Dialog 
        open={showProductDetails} 
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
          }
        }}
      >
        <DialogContent className="w-full max-w-6xl h-[90dvh] max-h-[90dvh] p-0 overflow-hidden flex flex-col rounded-xl sm:rounded-2xl">
          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className="absolute top-1 right-1 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-md focus:outline-none focus:ring-0"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-6 w-6 transition-colors ${
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            />
          </button>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Images Section (60%) */}
              <div className="w-full lg:w-[60%] space-y-6">
                <div className="relative w-full aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />

                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/90 hover:bg-white shadow-lg"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/90 hover:bg-white shadow-lg"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}

                  {discountPercentage && (
                    <Badge variant="destructive" className="absolute top-4 left-4 text-sm">
                      -{discountPercentage}%
                    </Badge>
                  )}
                </div>

                {/* Thumbnails */}
                {hasMultipleImages && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        className={`aspect-square rounded-lg overflow-hidden transition-all ${
                          index === currentImageIndex 
                            ? 'ring-2 ring-primary' 
                            : 'ring-1 ring-gray-200 hover:ring-gray-300'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details Section (40%) */}
              <div className="w-full lg:w-[40%] space-y-6">
                <div>
                  <Badge variant={stockBadge.variant} className="mb-3">
                    {stockBadge.text}
                  </Badge>
                  
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product.name}</h1>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={vendorData.profileImage} />
                      <AvatarFallback>{vendorData.businessName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      Sold by {vendorData.businessName}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      {t('common.currency')} {product.price?.toLocaleString()}
                    </p>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-lg text-muted-foreground relative">
                        <span className="line-through">
                          {t('common.currency')} {product.originalPrice?.toLocaleString()}
                        </span>
                      </p>
                    )}
                  </div>

                  {product.category && (
                    <Badge variant="outline" className="text-sm">
                      {product.category}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Features/Specs (if available) */}
                {product.features && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Features</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span className="text-muted-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer Buttons */}
          <div className="border-t bg-background px-6 py-4 sticky bottom-0">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full h-12"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {t('common.add_to_cart')}
              </Button>
              <Button
                size="lg"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full h-12"
              >
                <Zap className="h-5 w-5 mr-2" />
                {t('common.buy_now')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Required Popup */}
      <Dialog open={showLoginPopup} onOpenChange={setShowLoginPopup}>
        <DialogContent className="max-w-md mx-auto rounded-xl">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">Join Us to Continue Shopping</h2>
            <div className="flex justify-center">
              <img 
                src="https://i.ibb.co/pB1GZp04/login-register-prompt-updated.gif"
                alt="Login instructions"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
            <p className="text-muted-foreground">
              Create an account or log in to save favorites and make purchases.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="w-full" onClick={() => setShowLoginPopup(false)}>
                <Button variant="outline" className="w-full h-11">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link to="/register" className="w-full" onClick={() => setShowLoginPopup(false)}>
                <Button className="w-full h-11">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register
                </Button>
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground">
              By registering, you agree to our Terms of Service
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;