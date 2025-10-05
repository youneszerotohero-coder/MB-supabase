import { useState, useEffect } from "react"
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/services/productService'
import { getCategories } from '@/services/categoryService'
import { Search, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import ProductCard from "../../components/productCard"
import { getProductImageUrl } from '@/utils/imageUtils'
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/contexts/LanguageContext"

// Default color options (will be enhanced with backend data)
const defaultColors = [
  { name: "Black", value: "black", hexCode: "#000000", bgClass: "bg-black" },
  { name: "White", value: "white", hexCode: "#FFFFFF", bgClass: "bg-white border border-gray-300" },
  { name: "Brown", value: "brown", hexCode: "#A52A2A", bgClass: "bg-amber-800" },
  { name: "Beige", value: "beige", hexCode: "#C8B28D", bgClass: "bg-[#C8B28D]" },
  { name: "Blue", value: "blue", hexCode: "#0000FF", bgClass: "bg-blue-600" },
  { name: "Green", value: "green", hexCode: "#008000", bgClass: "bg-green-600" },
  { name: "Red", value: "red", hexCode: "#FF0000", bgClass: "bg-red-600" },
  { name: "Yellow", value: "yellow", hexCode: "#FFFF00", bgClass: "bg-yellow-400" },
  { name: "Orange", value: "orange", hexCode: "#FFA500", bgClass: "bg-orange-500" },
  { name: "Purple", value: "purple", hexCode: "#800080", bgClass: "bg-purple-600" },
  { name: "Pink", value: "pink", hexCode: "#FFC0CB", bgClass: "bg-pink-300" },
  { name: "Gray", value: "gray", hexCode: "#808080", bgClass: "bg-gray-500" },
]

const defaultSizes = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" }
]

function ProductsGrid({ appliedFilters, currentPage, setCurrentPage }) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', { ...appliedFilters }],
    queryFn: async () => {
      const params = {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
      
      if (appliedFilters.searchTerm && appliedFilters.searchTerm.trim()) {
        params.search = appliedFilters.searchTerm.trim()
      }
      if (appliedFilters.priceRange && appliedFilters.priceRange[0] > 0) {
        params.minPrice = appliedFilters.priceRange[0]
      }
      if (appliedFilters.priceRange && appliedFilters.priceRange[1] < 1000) {
        params.maxPrice = appliedFilters.priceRange[1]
      }
      if (appliedFilters.selectedCategories && appliedFilters.selectedCategories.length > 0) {
        // Get category IDs from category names
        const categoryIds = appliedFilters.selectedCategories
          .map(catName => appliedFilters.categories?.find(cat => cat.name === catName)?.id)
          .filter(Boolean)
        if (categoryIds.length > 0) {
          params.categoryId = categoryIds[0] // Backend expects single categoryId for now
        }
      }
      if (appliedFilters.selectedSizes && appliedFilters.selectedSizes.length > 0) {
        params.sizes = appliedFilters.selectedSizes.join(',')
      }
      if (appliedFilters.selectedColors && appliedFilters.selectedColors.length > 0) {
        params.colors = appliedFilters.selectedColors.join(',')
      }
      
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key]
        }
      })
      
      const res = await getProducts(params)
      let products = res.data.products || []

      // Client-side filtering for sizes and colors (backend does not filter these)
      const normalizeSize = (size) => {
        if (typeof size === 'string') return size.toLowerCase()
        if (size && (size.value || size.size)) return String(size.value || size.size).toLowerCase()
        return ''
      }
      const normalizeColor = (color) => {
        if (typeof color === 'string') return color.toLowerCase()
        if (color && (color.name || color.value)) return String(color.name || color.value).toLowerCase()
        return ''
      }

      if (appliedFilters.selectedSizes && appliedFilters.selectedSizes.length > 0) {
        const selectedSizes = appliedFilters.selectedSizes.map(s => String(s).toLowerCase())
        products = products.filter(p => {
          const pSizes = Array.isArray(p.sizes) ? p.sizes : []
          return pSizes.some(sz => selectedSizes.includes(normalizeSize(sz)))
        })
      }

      if (appliedFilters.selectedColors && appliedFilters.selectedColors.length > 0) {
        const selectedColors = appliedFilters.selectedColors.map(c => String(c).toLowerCase())
        products = products.filter(p => {
          const pColors = Array.isArray(p.colors) ? p.colors : []
          return pColors.some(clr => selectedColors.includes(normalizeColor(clr)))
        })
      }

      return products
    }
  })

  if (isLoading) return (
    <div className="p-8 text-center">
      <div className="flex justify-center items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8B28D]"></div>
        <span>{t('common.loading')}</span>
      </div>
    </div>
  )
  
  if (isError) return (
    <div className="p-8 text-center">
      <div className="text-red-600">{t('common.error')}</div>
      <button 
        onClick={() => refetch()} 
        className="mt-4 px-4 py-2 bg-[#C8B28D] text-white rounded hover:bg-[#b49e77]"
      >
        Try Again
      </button>
    </div>
  )

  console.log('Products data:', data)
  const products = data || []
  const pageSize = 12
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageItems = products.slice(startIndex, endIndex)

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{t('products.noProducts')}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-4 px-4 py-2 bg-[#C8B28D] text-white rounded hover:bg-[#b49e77]"
        >
          Refresh Products
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {pageItems.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name || 'Unnamed Product'}
            image={getProductImageUrl(product)}
            price={Number(product.price || product.finalPrice || 0)}
            compareAtPrice={product.compare_at_price || product.compareAtPrice}
            sizes={product.sizes || []}
            colors={product.colors || []}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
            className="hidden sm:flex bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = Math.max(1, Math.min(totalPages - 4, safeCurrentPage - 2)) + i
            if (pageNum > totalPages) return null
            return (
              <Button
                key={pageNum}
                variant={safeCurrentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className={safeCurrentPage === pageNum ? "bg-[#C8B28D] text-white hover:bg-[#b49e77]" : ""}
              >
                {pageNum}
              </Button>
            )
          })}
          
          {totalPages > 5 && safeCurrentPage < totalPages - 2 && (
            <>
              <span className="px-2 hidden sm:inline">...</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(totalPages)}
                className="hidden sm:inline-flex"
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
            className="hidden sm:flex bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  )
}

export default function ProductCatalog() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  // Current filter state (what user is selecting)
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  
  // Applied filter state (what's actually used for API calls)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("")
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 1000])
  const [appliedSelectedSizes, setAppliedSelectedSizes] = useState([])
  const [appliedSelectedColors, setAppliedSelectedColors] = useState([])
  const [appliedSelectedCategories, setAppliedSelectedCategories] = useState([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch categories from Supabase
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await getCategories();
      return response.data || [];
    }
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : []

  // Initialize applied filters on first load
  useEffect(() => {
    if (!isInitialized) {
      setAppliedSearchTerm(searchTerm)
      setAppliedPriceRange(priceRange)
      setAppliedSelectedSizes(selectedSizes)
      setAppliedSelectedColors(selectedColors)
      setAppliedSelectedCategories(selectedCategories)
      setIsInitialized(true)
    }
  }, [isInitialized, searchTerm, priceRange, selectedSizes, selectedColors, selectedCategories])

  const handleCategoryChange = (categoryName, checked) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryName])
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryName))
    }
    setHasUnsavedChanges(true)
  }

  const handleSizeToggle = (sizeValue) => {
    setSelectedSizes(prev => 
      prev.includes(sizeValue) 
        ? prev.filter(s => s !== sizeValue)
        : [...prev, sizeValue]
    )
    setHasUnsavedChanges(true)
  }

  const handleColorToggle = (colorValue) => {
    setSelectedColors(prev => 
      prev.includes(colorValue) 
        ? prev.filter(c => c !== colorValue)
        : [...prev, colorValue]
    )
    setHasUnsavedChanges(true)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handlePriceChange = (newPriceRange) => {
    setPriceRange(newPriceRange)
    setHasUnsavedChanges(true)
  }

  const applyFilters = () => {
    setAppliedSearchTerm(searchTerm)
    setAppliedPriceRange(priceRange)
    setAppliedSelectedSizes(selectedSizes)
    setAppliedSelectedColors(selectedColors)
    setAppliedSelectedCategories(selectedCategories)
    setCurrentPage(1)
    setHasUnsavedChanges(false)
    setShowMobileFilters(false)
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setPriceRange([0, 1000])
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedCategories([])
    setAppliedSearchTerm("")
    setAppliedPriceRange([0, 1000])
    setAppliedSelectedSizes([])
    setAppliedSelectedColors([])
    setAppliedSelectedCategories([])
    setCurrentPage(1)
    setHasUnsavedChanges(false)
  }

  const filters = {
    searchTerm,
    priceRange,
    selectedSizes,
    selectedColors,
    selectedCategories,
    categories
  }

  const appliedFilters = {
    searchTerm: appliedSearchTerm,
    priceRange: appliedPriceRange,
    selectedSizes: appliedSelectedSizes,
    selectedColors: appliedSelectedColors,
    selectedCategories: appliedSelectedCategories,
    categories
  }

  return (
    <div className={`mt-16 min-h-screen bg-gray-50 p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="md:hidden mb-4">
          <Button
            onClick={() => setShowMobileFilters(true)}
            className={`w-full ${hasUnsavedChanges ? 'bg-[#C8B28D] text-white hover:bg-[#b49e77]' : 'bg-[#C8B28D] text-white hover:bg-[#b49e77]'} relative`}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('products.filters')}
            {hasUnsavedChanges && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </Button>
        </div>

        <div className="flex gap-8">
          <div
            className={`
            ${showMobileFilters ? "fixed inset-0 z-50 bg-black bg-opacity-50 md:relative md:bg-transparent" : "hidden md:block"}
          `}
          >
            <div
              className={`
              ${showMobileFilters ? "fixed left-0 top-0 h-full w-full bg-white transform transition-transform" : "w-80 bg-white"}
              p-6 rounded-lg shadow-sm h-fit md:h-fit overflow-y-auto
            `}
            >
              <div className="flex justify-between items-center mb-6 md:block">
                <h2 className="text-xl font-semibold flex items-center">
                  {t('products.filters')}
                  {hasUnsavedChanges && (
                    <div className="ml-2 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowMobileFilters(false)} className="md:hidden">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('products.searchPlaceholder')}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-4">{t('products.priceRange')}</h3>
                <div className="px-2">
                  <Slider value={priceRange} onValueChange={handlePriceChange} max={1000} step={100} className="mb-4 " />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{priceRange[0]}</span>
                    <span>{priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-4">{t('products.size')}</h3>
                <div className="flex gap-2 flex-wrap">
                  {defaultSizes.map((size) => (
                    <Button
                      key={size.value}
                      variant={selectedSizes.includes(size.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSizeToggle(size.value)}
                      className={`${selectedSizes.includes(size.value) ? "bg-[#C8B28D] text-white hover:bg-[#b49e77]" : ""} flex-1 min-w-0 sm:flex-none`}
                    >
                      {size.label}
                    </Button>
                  ))}
                </div>
                {selectedSizes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedSizes.map(s => defaultSizes.find(opt => opt.value === s)?.label).join(', ')}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-4">{t('products.color')}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorToggle(color.value)}
                      className={`w-8 h-8 rounded-full ${color.bgClass} hover:ring-2 hover:ring-gray-300 transition-all ${
                        selectedColors.includes(color.value) ? 'ring-2 ring-[#C8B28D] ring-offset-1' : ''
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
                {selectedColors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedColors.map(c => defaultColors.find(opt => opt.value === c)?.name).join(', ')}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-4">{t('products.categoryFilter')}</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('products.loadingCategories')}</p>
                  ) : (
                    categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={(checked) => handleCategoryChange(category.name, checked)}
                        />
                        <label htmlFor={category.id} className="text-sm text-gray-700">
                          {category.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedCategories.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  className={`w-full ${hasUnsavedChanges ? 'bg-[#C8B28D] text-white hover:bg-[#b49e77]' : 'bg-[#EADBC2] text-white hover:bg-[#b49e77]'}`}
                  onClick={applyFilters}
                  disabled={!hasUnsavedChanges}
                >
                  {hasUnsavedChanges ? t('products.applyFilters') : t('products.filtersApplied')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  {t('products.clearAllFilters')}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <ProductsGrid 
              appliedFilters={appliedFilters} 
              currentPage={currentPage} 
              setCurrentPage={setCurrentPage} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
