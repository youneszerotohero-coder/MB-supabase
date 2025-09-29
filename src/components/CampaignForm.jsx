import { useState, useEffect } from 'react'
import { Calendar, DollarSign, Target, Package, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { getProducts } from '@/services/productService'
import { campaignService } from '@/services/campaignService'

const CampaignForm = ({ campaign = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    startDate: '',
    endDate: '',
    isActive: true,
    productIds: []
  })
  
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [errors, setErrors] = useState({})

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Populate form if editing existing campaign
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        cost: campaign.cost?.toString() || '',
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
        isActive: campaign.isActive ?? true,
        productIds: campaign.campaignProducts?.map(cp => cp.productId) || []
      })
      
      // Set selected products for display
      if (campaign.campaignProducts) {
        setSelectedProducts(campaign.campaignProducts.map(cp => cp.product))
      }
    }
  }, [campaign])

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await getProducts({ limit: 1000 })
      
      // Extract products from the response structure
      let productsData = []
      if (response && response.data && response.data.products) {
        productsData = response.data.products
      } else if (Array.isArray(response)) {
        productsData = response
      } else if (response && response.data && Array.isArray(response.data)) {
        productsData = response.data
      }
      
      setProducts(productsData)
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([]) // Ensure products is always an array
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleProductSelect = (productId, checked) => {
    const product = products.find(p => p.id === productId)
    
    if (!product) {
      console.error('Product not found:', productId)
      return
    }

    if (checked) {
      setSelectedProducts(prev => [...prev, product])
      setFormData(prev => ({
        ...prev,
        productIds: [...prev.productIds, productId]
      }))
    } else {
      setSelectedProducts(prev => prev.filter(p => p.id !== productId))
      setFormData(prev => ({
        ...prev,
        productIds: prev.productIds.filter(id => id !== productId)
      }))
    }
  }

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId))
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => id !== productId)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (formData.cost && isNaN(parseFloat(formData.cost))) {
      newErrors.cost = 'Cost must be a valid number'
    }

    if (formData.productIds.length === 0) {
      newErrors.productIds = 'Please select at least one product'
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const campaignData = {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
      }

      let result
      if (campaign) {
        result = await campaignService.updateCampaign(campaign.id, campaignData)
      } else {
        result = await campaignService.createCampaign(campaignData)
      }

      onSuccess?.(result)
    } catch (error) {
      console.error('Error saving campaign:', error)
      setErrors({ submit: 'Failed to save campaign. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          {campaign ? 'Edit Campaign' : 'Create New Campaign'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter campaign name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter campaign description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cost" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Campaign Price *
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                placeholder="0.00"
                className={errors.cost ? 'border-destructive' : ''}
              />
              {errors.cost && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.cost}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active Campaign</Label>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-destructive' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date (Optional)
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={errors.endDate ? 'border-destructive' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Select Products *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select products for this campaign.
            </p>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <Badge
                      key={product.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {product.name}
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Product Search/Select */}
            <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {loadingProducts ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Loading products...</p>
                </div>
              ) : Array.isArray(products) && products.length > 0 ? (
                products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.productIds.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelect(product.id, checked)}
                    />
                    <Label
                      htmlFor={`product-${product.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span>{product.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${product.price}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No products available</p>
                </div>
              )}
            </div>
            {errors.productIds && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.productIds}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {loading ? 'Saving...' : (campaign ? 'Update Campaign' : 'Create Campaign')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CampaignForm
