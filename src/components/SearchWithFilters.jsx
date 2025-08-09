
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const SearchWithFilters = ({ onSearch, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const categories = [
    'electronics',
    'clothing', 
    'home',
    'sports',
    'books',
    'other'
  ];

  const priceRanges = [
    { label: 'Under TSh 10,000', value: '0-10000' },
    { label: 'TSh 10,000 - 50,000', value: '10000-50000' },
    { label: 'TSh 50,000 - 100,000', value: '50000-100000' },
    { label: 'Above TSh 100,000', value: '100000-999999999' }
  ];

  const stockOptions = [
    { label: 'In Stock', value: 'instock' },
    { label: 'Low Stock (≤5)', value: 'lowstock' },
    { label: 'Out of Stock', value: 'outofstock' }
  ];

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    onFilterChange({ category, priceRange, stockFilter });
  };

  const handlePriceChange = (price) => {
    setPriceRange(price);
    onFilterChange({ category: selectedCategory, priceRange: price, stockFilter });
  };

  const handleStockChange = (stock) => {
    setStockFilter(stock);
    onFilterChange({ category: selectedCategory, priceRange, stockFilter: stock });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange('');
    setStockFilter('');
    onFilterChange({ category: '', priceRange: '', stockFilter: '' });
  };

  const hasActiveFilters = selectedCategory || priceRange || stockFilter;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 w-full"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Category
              {selectedCategory && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCategory}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Select Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleCategoryChange('')}>
              All Categories
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem 
                key={category} 
                onClick={() => handleCategoryChange(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Price Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Price Range
              {priceRange && (
                <Badge variant="secondary" className="ml-2">
                  {priceRanges.find(p => p.value === priceRange)?.label.split(' ')[0]}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Price Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePriceChange('')}>
              Any Price
            </DropdownMenuItem>
            {priceRanges.map((range) => (
              <DropdownMenuItem 
                key={range.value} 
                onClick={() => handlePriceChange(range.value)}
              >
                {range.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Stock Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Stock Status
              {stockFilter && (
                <Badge variant="secondary" className="ml-2">
                  {stockOptions.find(s => s.value === stockFilter)?.label}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Stock Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStockChange('')}>
              Any Stock
            </DropdownMenuItem>
            {stockOptions.map((option) => (
              <DropdownMenuItem 
                key={option.value} 
                onClick={() => handleStockChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedCategory && (
            <Badge variant="secondary">
              {selectedCategory}
              <button
                onClick={() => handleCategoryChange('')}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {priceRange && (
            <Badge variant="secondary">
              {priceRanges.find(p => p.value === priceRange)?.label}
              <button
                onClick={() => handlePriceChange('')}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {stockFilter && (
            <Badge variant="secondary">
              {stockOptions.find(s => s.value === stockFilter)?.label}
              <button
                onClick={() => handleStockChange('')}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchWithFilters;
