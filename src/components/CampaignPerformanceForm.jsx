import { useState, useEffect } from 'react'
import { TrendingUp, Target, DollarSign, Eye, MousePointer, Users, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { campaignService } from '@/services/campaignService'

const CampaignPerformanceForm = ({ campaign, onSuccess, onCancel }) => {
  const [performanceData, setPerformanceData] = useState({
    campaignMetrics: {
      totalRevenue: '',
      totalOrders: ''
    },
    campaignProductUpdates: []
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (campaign) {
      // Initialize performance data with current values
      setPerformanceData({
        campaignMetrics: {
          totalRevenue: campaign.totalRevenue?.toString() || '',
          totalOrders: campaign.totalOrders?.toString() || ''
        },
        campaignProductUpdates: campaign.campaignProducts?.map(cp => ({
          productId: cp.productId,
          productName: cp.product?.name || 'Unknown Product',
          impressions: cp.impressions?.toString() || '0',
          clicks: cp.clicks?.toString() || '0',
          conversions: cp.conversions?.toString() || '0',
          revenue: cp.revenue?.toString() || '0'
        })) || []
      })
    }
  }, [campaign])

  const handleCampaignMetricChange = (field, value) => {
    setPerformanceData(prev => ({
      ...prev,
      campaignMetrics: {
        ...prev.campaignMetrics,
        [field]: value
      }
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleProductMetricChange = (productId, field, value) => {
    setPerformanceData(prev => ({
      ...prev,
      campaignProductUpdates: prev.campaignProductUpdates.map(update =>
        update.productId === productId
          ? { ...update, [field]: value }
          : update
      )
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate campaign metrics
    if (performanceData.campaignMetrics.totalRevenue && isNaN(parseFloat(performanceData.campaignMetrics.totalRevenue))) {
      newErrors.totalRevenue = 'Total revenue must be a valid number'
    }

    if (performanceData.campaignMetrics.totalOrders && isNaN(parseInt(performanceData.campaignMetrics.totalOrders))) {
      newErrors.totalOrders = 'Total orders must be a valid number'
    }

    // Validate product metrics
    performanceData.campaignProductUpdates.forEach((update, index) => {
      const fields = ['impressions', 'clicks', 'conversions', 'revenue']
      fields.forEach(field => {
        if (update[field] && isNaN(parseFloat(update[field]))) {
          newErrors[`product_${index}_${field}`] = `${field} must be a valid number`
        }
      })
    })

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
      const formattedData = {
        campaignMetrics: {
          totalRevenue: performanceData.campaignMetrics.totalRevenue 
            ? parseFloat(performanceData.campaignMetrics.totalRevenue) 
            : undefined,
          totalOrders: performanceData.campaignMetrics.totalOrders 
            ? parseInt(performanceData.campaignMetrics.totalOrders) 
            : undefined
        },
        campaignProductUpdates: performanceData.campaignProductUpdates.map(update => ({
          productId: update.productId,
          impressions: parseInt(update.impressions) || 0,
          clicks: parseInt(update.clicks) || 0,
          conversions: parseInt(update.conversions) || 0,
          revenue: parseFloat(update.revenue) || 0
        }))
      }

      const result = await campaignService.updateCampaignPerformance(campaign.id, formattedData)
      onSuccess?.(result)
    } catch (error) {
      console.error('Error updating campaign performance:', error)
      setErrors({ submit: 'Failed to update campaign performance. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!campaign) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No campaign selected for performance tracking.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Update Campaign Performance: {campaign.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Level Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" />
              Campaign Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalRevenue" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </Label>
                <Input
                  id="totalRevenue"
                  type="number"
                  step="0.01"
                  value={performanceData.campaignMetrics.totalRevenue}
                  onChange={(e) => handleCampaignMetricChange('totalRevenue', e.target.value)}
                  placeholder="0.00"
                  className={errors.totalRevenue ? 'border-destructive' : ''}
                />
                {errors.totalRevenue && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.totalRevenue}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="totalOrders" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Orders
                </Label>
                <Input
                  id="totalOrders"
                  type="number"
                  value={performanceData.campaignMetrics.totalOrders}
                  onChange={(e) => handleCampaignMetricChange('totalOrders', e.target.value)}
                  placeholder="0"
                  className={errors.totalOrders ? 'border-destructive' : ''}
                />
                {errors.totalOrders && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.totalOrders}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Level Metrics */}
          {performanceData.campaignProductUpdates.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                Product Performance
              </h3>
              
              <div className="space-y-4">
                {performanceData.campaignProductUpdates.map((update, index) => (
                  <Card key={update.productId} className="p-4">
                    <div className="mb-4">
                      <h4 className="font-medium text-foreground">{update.productName}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor={`impressions_${index}`} className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Impressions
                        </Label>
                        <Input
                          id={`impressions_${index}`}
                          type="number"
                          value={update.impressions}
                          onChange={(e) => handleProductMetricChange(update.productId, 'impressions', e.target.value)}
                          placeholder="0"
                          className={errors[`product_${index}_impressions`] ? 'border-destructive' : ''}
                        />
                        {errors[`product_${index}_impressions`] && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors[`product_${index}_impressions`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`clicks_${index}`} className="flex items-center gap-2">
                          <MousePointer className="w-4 h-4" />
                          Clicks
                        </Label>
                        <Input
                          id={`clicks_${index}`}
                          type="number"
                          value={update.clicks}
                          onChange={(e) => handleProductMetricChange(update.productId, 'clicks', e.target.value)}
                          placeholder="0"
                          className={errors[`product_${index}_clicks`] ? 'border-destructive' : ''}
                        />
                        {errors[`product_${index}_clicks`] && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors[`product_${index}_clicks`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`conversions_${index}`} className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Conversions
                        </Label>
                        <Input
                          id={`conversions_${index}`}
                          type="number"
                          value={update.conversions}
                          onChange={(e) => handleProductMetricChange(update.productId, 'conversions', e.target.value)}
                          placeholder="0"
                          className={errors[`product_${index}_conversions`] ? 'border-destructive' : ''}
                        />
                        {errors[`product_${index}_conversions`] && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors[`product_${index}_conversions`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`revenue_${index}`} className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Revenue
                        </Label>
                        <Input
                          id={`revenue_${index}`}
                          type="number"
                          step="0.01"
                          value={update.revenue}
                          onChange={(e) => handleProductMetricChange(update.productId, 'revenue', e.target.value)}
                          placeholder="0.00"
                          className={errors[`product_${index}_revenue`] ? 'border-destructive' : ''}
                        />
                        {errors[`product_${index}_revenue`] && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors[`product_${index}_revenue`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
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
              {loading ? 'Updating...' : 'Update Performance'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CampaignPerformanceForm
