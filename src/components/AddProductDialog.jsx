import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createProduct } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AddProductDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    descriptionAr: '',
    price: '',
    cost: '', // Buying price
    compareAtPrice: '', // Optional
    categoryId: '',
    stockQuantity: '',
    brand: '',
    isActive: true,
    isFeatured: false
  });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [imageUrls, setImageUrls] = useState('');

  // Size and color options
  const sizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const colorOptions = [
    { value: 'black', label: 'Black', hexCode: '#000000' },
    { value: 'white', label: 'White', hexCode: '#FFFFFF' },
    { value: 'red', label: 'Red', hexCode: '#FF0000' },
    { value: 'blue', label: 'Blue', hexCode: '#0000FF' },
    { value: 'green', label: 'Green', hexCode: '#008000' },
    { value: 'yellow', label: 'Yellow', hexCode: '#FFFF00' },
    { value: 'orange', label: 'Orange', hexCode: '#FFA500' },
    { value: 'purple', label: 'Purple', hexCode: '#800080' },
    { value: 'pink', label: 'Pink', hexCode: '#FFC0CB' },
    { value: 'brown', label: 'Brown', hexCode: '#A52A2A' },
    { value: 'gray', label: 'Gray', hexCode: '#808080' },
    { value: 'navy', label: 'Navy', hexCode: '#000080' }
  ];

  // Get the toast hook and query client at component level
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Process image URLs from comma-separated input
  const processImageUrls = (urlString) => {
    if (!urlString.trim()) return [];
    
    return urlString
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map((url, index) => ({
        url,
        alt: formData.name,
        sortOrder: index,
        isPrimary: index === 0
      }));
  };

  // Validate URL format
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle size selection
  const handleSizeToggle = (sizeValue) => {
    setSelectedSizes(prev => 
      prev.includes(sizeValue) 
        ? prev.filter(s => s !== sizeValue)
        : [...prev, sizeValue]
    );
  };

  // Handle color selection
  const handleColorToggle = (colorValue) => {
    setSelectedColors(prev => 
      prev.includes(colorValue) 
        ? prev.filter(c => c !== colorValue)
        : [...prev, colorValue]
    );
  };

  // Fetch categories using React Query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await getCategories();
      return response.data || [];
    },
    enabled: open // Only fetch when dialog is open
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Process image URLs
    const imageData = processImageUrls(imageUrls);
    
    // Validate URLs if provided
    if (imageUrls.trim()) {
      const urls = imageUrls.split(',').map(url => url.trim()).filter(url => url.length > 0);
      const invalidUrls = urls.filter(url => !isValidUrl(url));
      
      if (invalidUrls.length > 0) {
        toast({
          title: "Invalid URLs",
          description: `The following URLs are invalid: ${invalidUrls.join(', ')}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    // Prepare sizes and colors data
    const sizesData = selectedSizes.map(sizeValue => ({
      value: sizeValue,
      sizeType: 'letter'
    }));

    const colorsData = selectedColors.map(colorValue => {
      const colorOption = colorOptions.find(c => c.value === colorValue);
      return {
        name: colorOption.label,
        hexCode: colorOption.hexCode
      };
    });

    // Convert string values to appropriate types
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
      stockQuantity: parseInt(formData.stockQuantity),
      slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      images: imageData,
      sizes: sizesData,
      colors: colorsData
    };

    try {
      const response = await createProduct(productData);
      
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      
      // Invalidate and refetch product queries
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      
      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        descriptionAr: '',
        price: '',
        cost: '',
        compareAtPrice: '',
        categoryId: '',
        stockQuantity: '',
        brand: '',
        isActive: true,
        isFeatured: false
      });
      setSelectedSizes([]);
      setSelectedColors([]);
      setImageUrls('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.addProduct')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Enter selling price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Buying Price (Cost) *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="Enter buying price"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare At Price</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    placeholder="Enter compare at price"
                    value={formData.compareAtPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, compareAtPrice: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    placeholder="Enter stock quantity"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categories.length === 0 ? "Loading categories..." : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(categories) && categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          {categories.length === 0 ? "No categories available. Please create a category first." : "Loading..."}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    placeholder="Enter brand name"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Available Sizes</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size) => (
                      <Button
                        key={size.value}
                        type="button"
                        variant={selectedSizes.includes(size.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSizeToggle(size.value)}
                        className="min-w-[80px]"
                      >
                        {size.label}
                      </Button>
                    ))}
                  </div>
                  {selectedSizes.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedSizes.map(s => sizeOptions.find(opt => opt.value === s)?.label).join(', ')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Available Colors</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorOptions.map((color) => (
                      <Button
                        key={color.value}
                        type="button"
                        variant={selectedColors.includes(color.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleColorToggle(color.value)}
                        className="flex items-center gap-2 min-h-[32px]"
                        style={{
                          backgroundColor: selectedColors.includes(color.value) ? color.hexCode : undefined,
                          color: selectedColors.includes(color.value) ? 
                            (color.hexCode === '#FFFFFF' || color.hexCode === '#FFFF00' ? '#000000' : '#FFFFFF') : undefined,
                          borderColor: color.hexCode
                        }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hexCode }}
                        />
                        {color.label}
                      </Button>
                    ))}
                  </div>
                  {selectedColors.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedColors.map(c => colorOptions.find(opt => opt.value === c)?.label).join(', ')}
                    </p>
                  )}
                </div>


                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: checked })
                        }
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isFeatured: checked })
                        }
                      />
                      <Label htmlFor="isFeatured">Featured</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.descriptionEnglish')}</Label>
              <Textarea
                id="description"
                placeholder={t('admin.descriptionEnglishPlaceholder')}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{t('admin.descriptionArabic')}</Label>
              <Textarea
                id="descriptionAr"
                placeholder={t('admin.descriptionArabicPlaceholder')}
                value={formData.descriptionAr}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionAr: e.target.value })
                }
                className="min-h-[100px]"
                dir="rtl"
              />
            </div>

            {/* Image URLs Section */}
            <div className="space-y-2">
              <Label htmlFor="imageUrls">Product Image URLs</Label>
              <Textarea
                id="imageUrls"
                placeholder="Enter image URLs separated by commas&#10;Example: https://example.com/image1.jpg, https://example.com/image2.png"
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Paste image URLs from external sources (CDN, cloud storage, etc.) separated by commas. The first URL will be the primary image.
              </p>
              
              {/* Preview Images */}
              {imageUrls.trim() && (
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Preview:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {processImageUrls(imageUrls).map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                          <img
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="w-full h-full hidden items-center justify-center bg-muted text-muted-foreground text-xs"
                            style={{display: 'none'}}
                          >
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                              Invalid URL
                            </div>
                          </div>
                        </div>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
