import api from './api'

export const campaignService = {
  // Get all campaigns
  async getCampaigns(params = {}) {
    try {
      const response = await api.get('/campaigns', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      throw error
    }
  },

  // Create a new campaign
  async createCampaign(campaignData) {
    try {
      const response = await api.post('/campaigns', campaignData)
      return response.data
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  },

  // Update a campaign
  async updateCampaign(campaignId, campaignData) {
    try {
      const response = await api.put(`/campaigns/${campaignId}`, campaignData)
      return response.data
    } catch (error) {
      console.error('Error updating campaign:', error)
      throw error
    }
  },

  // Delete a campaign
  async deleteCampaign(campaignId) {
    try {
      const response = await api.delete(`/campaigns/${campaignId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting campaign:', error)
      throw error
    }
  },

  // Get campaign analytics/performance
  async getCampaignAnalytics(campaignId) {
    try {
      const response = await api.get(`/campaigns/${campaignId}/analytics`)
      return response.data
    } catch (error) {
      console.error('Error fetching campaign analytics:', error)
      throw error
    }
  },

  // Update campaign performance metrics
  async updateCampaignPerformance(campaignId, performanceData) {
    try {
      const response = await api.patch(`/campaigns/${campaignId}/performance`, performanceData)
      return response.data
    } catch (error) {
      console.error('Error updating campaign performance:', error)
      throw error
    }
  }
}
