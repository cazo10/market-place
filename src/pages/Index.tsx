import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Star, ChevronRight, Package, Shield, Truck, Users,
  Zap, Heart, Globe, Award, Smartphone,
  Shirt, Utensils, HeartPulse, Home, Plus,
  Book, Gamepad2, Sparkles, Eye, Search, ChevronUp, ChevronDown,
  SlidersHorizontal, ShoppingCart, ChevronLeft, Map, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, incrementVisitorCount, getVisitorCount, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { getVerifiedVendors, getVendors } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Chatbot from '@/components/Chatbot';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category?: string;
  stock: number;
  vendorId: string;
  vendorName?: string;
  vendorProfileImage?: string;
  createdAt?: any;
  rating?: number;
}

interface SlideshowData {
  enabled: boolean;
  items: Array<{
    url: string;
    type: 'image' | 'video';
    title?: string;
    link?: string;
  }>;
}

const MarketplaceApp = () => {
  // App state
  
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const productsPerPage = 10;
const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
 
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  const [isFAQExpanded, setIsFAQExpanded] = useState(false);
  const [isFabExpanded, setIsFabExpanded] = useState(false);

  // Home page state
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideshow, setSlideshow] = useState<SlideshowData>({
    enabled: true,
    items: []
  });
  const [productImages, setProductImages] = useState<string[]>([]);

  // Products state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const navigate = useNavigate();

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      await trackVisitor();

      const countRef = doc(db, 'visitorCounts', 'totalVisitors');
      const unsubscribe = onSnapshot(countRef, (doc) => {
        if (doc.exists()) {
          setVisitorCount(doc.data().count);
        }
      });

      await Promise.all([
        loadFeaturedProducts(),
        loadAllProducts(),
        loadRandomProductImages(),
        loadSlideshowSettings(),
     
      ]);

      setLoadingProgress(100);
      setTimeout(() => setIsInitialLoading(false), 500);

      return () => unsubscribe();
    };

    initialize();

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    return () => clearInterval(progressInterval);
  }, []);

  const loadSlideshowSettings = async () => {
    const unsubscribe = onSnapshot(doc(db, 'slideshow', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as SlideshowData;
        setSlideshow({
          enabled: data.enabled ?? true,
          items: data.items ?? []
        });
      }
    });
    return unsubscribe;
  };

  const trackVisitor = async () => {
    try {
      if (!sessionStorage.getItem('hasVisited')) {
        await incrementVisitorCount();
        sessionStorage.setItem('hasVisited', 'true');
      }
      const count = await getVisitorCount();
      setVisitorCount(count);
    } catch (error) {
      console.error('Visitor tracking error:', error);
      const localCount = Number(localStorage.getItem('visitorCountFallback') || 0);
      setVisitorCount(localCount + 1);
      localStorage.setItem('visitorCountFallback', String(localCount + 1));
    }
  };



  const loadFeaturedProducts = async () => {
    try {
      const products = await getProducts();
      setFeaturedProducts(products.slice(0, 6));
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setIsLoadingFeatured(false);
    }
  };

  const loadAllProducts = async () => {
  setIsLoadingProducts(true);
  try {
    const productsData = await getProducts();
    const productsWithVendors = productsData.map(product => ({
      ...product,
      vendorName: product.vendorName || 'Vendor',
      vendorProfileImage: product.vendorProfileImage || '/default-avatar.png'
    }));
    setAllProducts(productsWithVendors);
    
    // Initialize with first page of products
    setDisplayedProducts(productsWithVendors.slice(0, productsPerPage));
    setHasMoreProducts(productsWithVendors.length > productsPerPage);
  } catch (error) {
    console.error('Error loading products:', error);
  } finally {
    setIsLoadingProducts(false);
  }
};

const loadMoreProducts = () => {
  const nextPage = currentPage + 1;
  const startIndex = (nextPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  
  const nextProducts = allProducts.slice(startIndex, endIndex);
  
  setDisplayedProducts(prev => [...prev, ...nextProducts]);
  setCurrentPage(nextPage);
  setHasMoreProducts(endIndex < allProducts.length);
};

  const loadRandomProductImages = async () => {
    try {
      const products = await getProducts();
      const allImages = products
        .filter(product => product.images?.length > 0)
        .flatMap(product => product.images)
        .filter(img => img && typeof img === 'string');

      const selectedImages = [];
      const maxImages = Math.min(5, allImages.length);

      const shuffled = [...allImages].sort(() => 0.5 - Math.random());
      selectedImages.push(...shuffled.slice(0, maxImages));

      setProductImages(selectedImages.length > 0 ? selectedImages : [
        "https://i.ibb.co/gFXM0N6T/start-a-clothing-line-zega-apparel.jpg",
        "https://i.ibb.co/pBw2vRfG/bluetoothheadphones-2048px-0876.webp",
        "https://i.ibb.co/XfCQv3yL/650x450-22a14e08-0efb-4449-add1-5d2918d5eb76.webp"
      ]);
    } catch (error) {
      console.error('Error loading product images:', error);
      setProductImages([
        "https://i.ibb.co/gFXM0N6T/start-a-clothing-line-zega-apparel.jpg",
        "https://i.ibb.co/pBw2vRfG/bluetoothheadphones-2048px-0876.webp",
        "https://i.ibb.co/XfCQv3yL/650x450-22a14e08-0efb-4449-add1-5d2918d5eb76.webp"
      ]);
    }
  };

  // Handle category from URL
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      setSelectedCategory(urlCategory.replace('-', ' '));
    }
  }, [searchParams]);

  // Auto-advance slideshow
  useEffect(() => {
    if (slideshow.enabled && slideshow.items.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => {
          const nextSlide = (prev + 1) % slideshow.items.length;
          const nextItem = slideshow.items[nextSlide];
          return nextItem.type === 'video' ? (nextSlide + 1) % slideshow.items.length : nextSlide;
        });
      }, 4000);
      return () => clearInterval(timer);
    } else if (productImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % productImages.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [slideshow.enabled, slideshow.items.length, productImages.length]);

  // Product filtering and sorting
  const filteredProducts = useMemo(() => {
  const result = allProducts.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' ||
      product.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Reset pagination when filters change
  setDisplayedProducts(result.slice(0, productsPerPage));
  setCurrentPage(1);
  setHasMoreProducts(result.length > productsPerPage);

  return result;
}, [allProducts, searchTerm, selectedCategory]);

  const sortedProducts = useMemo(() => {
  return [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return (a.price || 0) - (b.price || 0);
      case 'price-high': return (b.price || 0) - (a.price || 0);
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      default: return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  }).slice(0, currentPage * productsPerPage); // Only show products up to current page
}, [filteredProducts, sortBy, currentPage]);

  const handleCategoryClick = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
  };

  const features = [
    { icon: Package, title: t('common.quality_products'), description: t('marketplace.features.quality_description') },
    { icon: Shield, title: t('common.secure_shopping'), description: t('marketplace.features.secure_description') },
    { icon: Truck, title: t('common.campus_delivery'), description: t('marketplace.features.delivery_description') },
    { icon: Users, title: t('common.community_focus'), description: t('marketplace.features.community_description') }
  ];

  const stats = [
    { label: t('marketplace.stats.vendors'), value: '50+', icon: Users },
    { label: t('marketplace.stats.products'), value: '500+', icon: Package },
    { label: t('common.happy_customers'), value: '1000+', icon: Heart },
    { label: t('common.campus_coverage'), value: '100%', icon: Globe }
  ];
  
  const categories = [
    { value: '', label: t('categories.all') },
    { value: 'electronics', label: t('categories.electronics') },
    { value: 'clothing', label: t('categories.clothing') },
    { value: 'home', label: t('categories.home') },
    { value: 'sports', label: t('categories.sports') },
    { value: 'books', label: t('categories.books') },
    { value: 'beauty', label: t('categories.beauty') },
    { value: 'toys', label: t('categories.toys') },
    { value: 'food', label: t('categories.food') },
    { value: 'health', label: t('categories.health') },
    { value: 'tools', label: t('categories.tools') },
    { value: 'other', label: t('categories.other') }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Loader Overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center pb-8">
          <div className="w-[98%] max-w-md flex flex-col items-center space-y-3">
            <div className="relative w-full h-8">
              <div
                className="absolute top-0 transition-all duration-300"
                style={{
                  left: `calc(${loadingProgress}% - 16px)`,
                  transform: `translateX(-${loadingProgress}%)`
                }}
              >
                <img
                  src="https://i.ibb.co/q3s6cRWt/7835563.png"
                  alt="Loading..."
                  className="w-8 h-8 animate-pulse"
                />
              </div>
              <div className="absolute right-0 top-0 text-sm font-medium text-primary">
                {loadingProgress < 90 ? loadingProgress.toFixed(0) + '%' : loadingProgress.toFixed(1) + '%'}
              </div>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={true}
      />

      {/* Main Content */}
      <>
        {/* Hero Section */}
       <section className="relative isolate items-center justify-center">
  {/* Geometric background pattern */}
  <div
    className="absolute inset-0 z-0"
    style={{
      backgroundImage: `
        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0),
        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)
      `,
      backgroundSize: '40px 40px',
      backgroundPosition: '0 0, 20px 20px',
    }}
  />

  {/* Dark overlay */}
  <div className="absolute inset-0 bg-primary/70 backdrop-brightness-85" />

  {/* Content container */}
  <div className="relative z-10 container mx-auto max-w-6xl">
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <div className="w-full space-y-6 md:space-y-8">
        
        {/* Header area */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <Badge variant="secondary" className="w-fit">
              {t('common.campus_marketplace')} 🎓
            </Badge>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {t('marketplace.hero.title')}
            </h1>
          </div>
        </div>

        {/* Buttons container */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
            
            {/* Shop Now button */}
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-lg font-bold
              bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary
              border-2 border-white/20 hover:border-white/40
              transition-all duration-700 ease-in-out
              hover:shadow-lg hover:-translate-y-0.5
              animate-[gentle-pulse_3s_ease-in-out_infinite]
              flex-shrink-0"
            >
              {t('marketplace.hero.shopNow')}
              <ChevronRight className="h-5 w-5 ml-2 transition-transform duration-700 ease-in-out group-hover:translate-x-1" />
            </Button>

            {/* Become Vendor button */}
            <Link to="/vendor/register" className="w-full sm:w-auto flex-shrink-0">
              <Button
                variant="outline"
                size="lg"
                className="w-full px-8 py-6 text-lg font-bold
                bg-white/10 hover:bg-white/20 text-white 
                border-white/30 hover:border-white/50
                transition-all duration-700 ease-in-out
                hover:shadow-lg hover:-translate-y-0.5
                animate-[gentle-glow_4s_ease-in-out_infinite]"
              >
                {t('marketplace.hero.becomeVendor')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Ratings */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center">
          <div className="flex items-center gap-2">
            {/* Avatars */}
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background"
                />
              ))}
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="text-sm text-white/50 ml-1">4.9/5</span>
            </div>

            {/* Happy customers text */}
            <span className="text-sm text-white/50">
              500+ {t('common.happy_customers')}
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>


        {/* Slideshow Section */}
        <section className="py-6">
          <div className="w-full">
            <div className="relative group">
              <div className="relative w-full h-[250px] md:h-[400px]">
                {slideshow.enabled && slideshow.items.length > 0 ? (
                  slideshow.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === idx ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {item.type === 'video' ? (
                        <iframe
                          src={item.url}
                          className="w-full h-full"
                          allowFullScreen
                          frameBorder="0"
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  productImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Product ${idx + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${currentSlide === idx ? 'opacity-100' : 'opacity-0'}`}
                      loading="lazy"
                    />
                  ))
                )}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentSlide(prev => (prev - 1 + slideshow.items.length) % slideshow.items.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentSlide(prev => (prev + 1) % slideshow.items.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                {(slideshow.enabled ? slideshow.items : productImages).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

       

        {/* Featured Products Section - Full Width */}
          <section className="py-10 md:py-16 bg-background">
            <div className="w-full px-4 space-y-6">
              <div className="max-w-6xl mx-auto mb-[10px]">
                {/* Centered badge */}
                <div className="text-center mb-3">
                  <Badge variant="secondary">
                    {t('marketplace.sections.featuredProducts')} ⭐
                  </Badge>
                </div>

                {/* Flex layout for paragraph and button */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <p className="text-muted-foreground text-sm md:text-base m-0">
                    {t('marketplace.sections.latestProducts')}
                  </p>

                </div>
              </div>


              {/* Horizontal Scroll Container - Full Width */}
              <div className="relative w-full">
                {isLoadingFeatured ? (
                  <div className="flex gap-4  overflow-x-auto pb-4 px-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="flex-shrink-0 w-64">
                        <CardContent className="p-4 space-y-3">
                          <div className="aspect-square bg-muted rounded-lg" />
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-6 bg-muted rounded w-1/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : featuredProducts.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 px-4">
                    {featuredProducts.map((product) => (
                      <div key={product.id} className="flex-shrink-0 w-[80%]">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-6">
                    <CardContent>
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <h3 className="text-base sm:text-lg font-semibold mb-2">
                        {t('common.no_featured_products')}
                      </h3>
                      <p className="text-muted-foreground mb-3 text-xs sm:text-sm">
                        {t('common.products_will_appear')}
                      </p>
                      <Link to="/vendor/register">
                        <Button size="sm">{t('marketplace.hero.becomeVendor')}</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>

              









             
            


            </div>
          </section>

{/* Products Grid Section */}
<div id="products-section" className="container mx-auto px-4 py-8">
  {/* Search and Filters */}
  <div className="mb-6 flex flex-col lg:flex-row gap-4">
   

    <div className="flex gap-2">
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="price-low">Price: Low to High</SelectItem>
          <SelectItem value="price-high">Price: High to Low</SelectItem>
          <SelectItem value="rating">Highest Rated</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline">
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        Filters
      </Button>
    </div>
     <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>

  {/* Category Filter Buttons */}
  <div className="mb-8 animate-fade-in">
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
  <Button
    key={category.value}
    variant={selectedCategory === category.value ? "default" : "outline"}
    size="sm"
    onClick={() => handleCategoryClick(category.value)}
    className="hover-scale"
  >
    {category.label}
  </Button>
))}
    </div>
  </div>

  {/* Products Grid - Always visible now */}
{isLoadingProducts ? (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 p-4">
    {[...Array(12)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4 space-y-3">
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardContent>
      </Card>
    ))}
  </div>
) : sortedProducts.length === 0 ? (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🔍</div>
    <h3 className="text-xl font-semibold mb-2">No products found</h3>
    <p className="text-muted-foreground">Try adjusting your search or filters</p>
    <Button
      variant="outline"
      onClick={() => {
        setSelectedCategory('');
        setSearchTerm('');
      }}
      className="mt-4"
    >
      Clear Filters
    </Button>
  </div>
) : (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 p-4">
    {sortedProducts.map((product) => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
)}
  {/* Load More - Only show if there are products */}
  {hasMoreProducts && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mt-12"
      >
        <Button 
          variant="outline" 
          size="lg" 
          className="hover-scale"
          onClick={loadMoreProducts}
        >
          Load More Products
        </Button>
      </motion.div>
  )}
</div>

        {/* Stats Section */}
        <section className="py-10 md:py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center hover-scale">
                  <CardContent className="p-4 sm:p-6">
                    <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-primary" />
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Collapsible */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <button
                onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
                className="inline-flex items-center gap-2"
              >
                <Badge variant="secondary" className="mb-3">
                  {t('common.why_choose_marketplace')} 🚀
                </Badge>
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 ${isFeaturesExpanded ? 'rotate-90' : ''}`}
                />
              </button>

              {isFeaturesExpanded && (
                <>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                    {t('common.built_for_campus')}
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                    {t('common.experience_convenience')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {features.map((feature, index) => (
                      <Card key={index} className="hover-scale group">
                        <CardContent className="p-4 sm:p-6 text-center">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground text-xs sm:text-sm">{feature.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="relative py-12 md:py-20 px-4"
          style={{
            backgroundImage: `url("https://i.ibb.co/SDJVP0Xt/MG-7865-min-scaled.jpg")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-primary/80 backdrop-brightness-75 z-0" />
          <div className="relative z-10 container mx-auto max-w-4xl text-center">
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">
                  {t('marketplace.cta.title')}
                </h2>
                <p className="text-primary-foreground/90 max-w-2xl mx-auto text-sm md:text-base">
                  {t('marketplace.cta.subtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full hover-scale">
                    <Users className="h-4 w-4 mr-2" />
                    {t('marketplace.cta.getStarted')}
                  </Button>
                </Link>
                <Link to="/vendor/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full hover-scale bg-primary-foreground text-primary font-bold border border-primary-foreground shadow-md"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    {t('marketplace.cta.sellWithUs')}
                  </Button>
                </Link>
              </div>
              {/* FAQ Section - Collapsible */}
              <div className="mb-8 text-center">
                {/* Email Us Button */}
                <a
                  href="mailto:sokocamp@gmail.com?subject=Question%20About%20SokoCamp"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors mb-6"
                >
                  Email Us Your Questions, or product you wish to find next time
                  <p><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg></p>
                </a>
              </div>

              {/* WhatsApp Channel Button */}
              <div className="mb-4 flex justify-center">
                <a
                  href="https://whatsapp.com/channel/0029VbBJynPGufJ5EpC8wh1u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join Our WhatsApp Channel
                </a>
              </div>

              {/* Contact Info */}
              <div className="pt-6 md:pt-8 border-t border-primary-foreground/20">
                <p className="text-primary-foreground/80 text-xs md:text-sm">
                  {t('common.join_thousands')}
                </p>
                <span className="text-primary-foreground/80 text-xs md:text-sm">kwa msaada au maoni📞0788500249 / 0764870957 / ✉️sokocamp@gmail.com</span>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <Eye className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground/80" />
                  <span className="text-primary-foreground/80 text-xs md:text-sm">
                    {visitorCount.toLocaleString()} visitors
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>


      <div className="fixed bottom-[145px] right-4 z-50 flex flex-col items-end gap-3">
        {/* Location button - only shown when expanded */}
        {isFabExpanded && (
          <a
            href="https://aros.ct.ws/"
            target="_blank"
            rel="noopener noreferrer"
            className="animate-fade-in-up"
          >
            <Button
              className="rounded-full w-14 h-14 p-0 hover-scale shadow-lg bg-blue-600 text-white"
              variant="secondary"
            >
              <MapPin className="h-6 w-6" />
            </Button>
          </a>
        )}</div>

      {isFabExpanded && (
        <div className="right-4 z-50 animate-fade-in-up">
          <Chatbot />
        </div>
      )}

      {/* Main FAB button */}
      <div className="fixed bottom-4 left-4 z-10">
        <Button
          className={`rounded-full w-14 h-14 p-0 hover-scale shadow-xl transition-all duration-300 ${isFabExpanded ? 'bg-primary rotate-45' : 'bg-primary'}`}
          onClick={() => setIsFabExpanded(!isFabExpanded)}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};

export default MarketplaceApp;