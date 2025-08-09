import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/hooks/useLanguage';
import { getProducts } from '@/lib/firebase';
import { useSearchParams } from 'react-router-dom';
const ProductsPage = () => {

  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports' },
    { value: 'books', label: 'Books' },
    { value: 'beauty', label: 'Beauty' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'other', label: 'Other' }
  ];
 useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      setSelectedCategory(urlCategory.replace('-', ' ')); // Convert URL-friendly back to normal
    }
  }, [searchParams]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const productsData = await getProducts();
      // Ensure all products have vendor information
      const productsWithVendors = productsData.map(product => ({
        ...product,
        vendorName: product.vendorName || 'Vendor',
        vendorProfileImage: product.vendorProfileImage || '/default-avatar.png'
      }));
      setProducts(productsWithVendors);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return Number(a.price || 0) - Number(b.price || 0);
      case 'price-high':
        return Number(b.price || 0) - Number(a.price || 0);
      case 'rating':
        return Number(b.rating || 0) - Number(a.rating || 0);
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  const handleCategoryClick = (categoryValue) => {
    setSelectedCategory(categoryValue);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
       <div className="mb-8 text-center relative overflow-hidden rounded-xl">
  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url('https://i.ibb.co/3mm8QJ21/Screenshot-2025-07-21-195315.png')" }}
  >
    <div className="absolute inset-0 bg-blue-800 opacity-50"></div>
  </div>

  {/* Foreground Content */}
  <div className="relative z-10 animate-fade-in py-12 px-4">
    <h1 className="text-4xl font-bold mb-4 text-white">{t('common.products')}</h1>
    <p className="text-xl text-white">{t('common.discover_amazing_products')}</p>
  </div>
</div>


        {/* Search and Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 animate-fade-in">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search_products')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('common.sort_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('common.newest')}</SelectItem>
                <SelectItem value="price-low">{t('common.price_low_high')}</SelectItem>
                <SelectItem value="price-high">{t('common.price_high_low')}</SelectItem>
                <SelectItem value="rating">{t('common.highest_rated')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="hover-scale">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t('common.filters')}
            </Button>
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
                {selectedCategory === category.value && (
                  <Badge variant="secondary" className="ml-2 bg-white text-primary">
                    {filteredProducts.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                {/* Vendor section skeleton */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-muted h-8 w-8"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
                
                <div className="aspect-square bg-muted"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-3"></div>
                  <div className="h-6 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">{t('common.no_products_found')}</h3>
            <p className="text-muted-foreground">{t('common.try_adjusting_search')}</p>
            {selectedCategory && (
              <Button
                variant="outline"
                onClick={() => setSelectedCategory('')}
                className="mt-4"
              >
                Clear Category Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {sortedProducts.map((product, index) => (
              <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {sortedProducts.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="hover-scale">
              {t('common.load_more_products')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;