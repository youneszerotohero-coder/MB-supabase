import { supabase } from '../lib/supabaseClient'

export const campaignService = {
  // Get all campaigns with their linked products
  async getCampaigns(params = {}) {
    try {
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          campaign_products(
            *,
            product:products(*)
          )
        `)

      // Apply filters
      if (params.isActive !== undefined) {
        query = query.eq('is_active', params.isActive)
      }
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
      }

      // Apply sorting
      if (params.sortBy) {
        const ascending = params.sortOrder !== 'desc'
        const columnName = params.sortBy === 'createdAt' ? 'created_at' : 
                          params.sortBy === 'startDate' ? 'start_date' :
                          params.sortBy === 'endDate' ? 'end_date' :
                          params.sortBy === 'isActive' ? 'is_active' :
                          params.sortBy
        query = query.order(columnName, { ascending })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      if (params.page && params.limit) {
        const from = (params.page - 1) * params.limit
        const to = from + params.limit - 1
        query = query.range(from, to)
      } else if (params.limit) {
        query = query.limit(params.limit)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || data?.length || 0,
          total: count || data?.length || 0,
          totalPages: params.limit ? Math.ceil((count || data?.length || 0) / params.limit) : 1
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      throw error
    }
  },

  // Create a new campaign
  async createCampaign(campaignData) {
    try {
      // First, create the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: campaignData.name,
          description: campaignData.description,
          cost: campaignData.cost,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate,
          is_active: campaignData.isActive ?? true,
          created_by: campaignData.createdBy || null
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      // Then create campaign-product relationships if products are selected
      if (campaignData.productIds && campaignData.productIds.length > 0) {
        const campaignProducts = campaignData.productIds.map(productId => ({
          campaign_id: campaign.id,
          product_id: productId,
          allocated_cost: campaignData.cost / campaignData.productIds.length // Distribute cost equally
        }))

        const { error: campaignProductsError } = await supabase
          .from('campaign_products')
          .insert(campaignProducts)

        if (campaignProductsError) {
          console.error('Error creating campaign-product relationships:', campaignProductsError)
          // Don't throw here, just log the error as the campaign was created successfully
        }
      }

      // Return the created campaign with its products
      const { data: fullCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_products(
            *,
            product:products(*)
          )
        `)
        .eq('id', campaign.id)
        .single()

      if (fetchError) {
        console.error('Error fetching created campaign:', fetchError)
        return { data: campaign } // Return basic campaign if fetch fails
      }

      return { data: fullCampaign }
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  },

  // Update a campaign
  async updateCampaign(campaignId, campaignData) {
    try {
      // Update the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .update({
          name: campaignData.name,
          description: campaignData.description,
          cost: campaignData.cost,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate,
          is_active: campaignData.isActive
        })
        .eq('id', campaignId)
        .select()
        .single()

      if (campaignError) throw campaignError

      // Update campaign-product relationships if productIds are provided
      if (campaignData.productIds !== undefined) {
        // First, delete existing relationships
        const { error: deleteError } = await supabase
          .from('campaign_products')
          .delete()
          .eq('campaign_id', campaignId)

        if (deleteError) {
          console.error('Error deleting existing campaign-product relationships:', deleteError)
        }

        // Then create new relationships if products are selected
        if (campaignData.productIds && campaignData.productIds.length > 0) {
          const campaignProducts = campaignData.productIds.map(productId => ({
            campaign_id: campaignId,
            product_id: productId,
            allocated_cost: campaignData.cost / campaignData.productIds.length // Distribute cost equally
          }))

          const { error: campaignProductsError } = await supabase
            .from('campaign_products')
            .insert(campaignProducts)

          if (campaignProductsError) {
            console.error('Error creating campaign-product relationships:', campaignProductsError)
          }
        }
      }

      // Return the updated campaign with its products
      const { data: fullCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_products(
            *,
            product:products(*)
          )
        `)
        .eq('id', campaignId)
        .single()

      if (fetchError) {
        console.error('Error fetching updated campaign:', fetchError)
        return { data: campaign } // Return basic campaign if fetch fails
      }

      return { data: fullCampaign }
    } catch (error) {
      console.error('Error updating campaign:', error)
      throw error
    }
  },

  // Delete a campaign
  async deleteCampaign(campaignId) {
    try {
      // Delete campaign-product relationships first (due to foreign key constraints)
      const { error: deleteCampaignProductsError } = await supabase
        .from('campaign_products')
        .delete()
        .eq('campaign_id', campaignId)

      if (deleteCampaignProductsError) {
        console.error('Error deleting campaign-product relationships:', deleteCampaignProductsError)
      }

      // Then delete the campaign
      const { error: deleteCampaignError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (deleteCampaignError) throw deleteCampaignError

      return { success: true }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      throw error
    }
  },

  // Get single campaign by ID
  async getCampaignById(campaignId) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_products(
            *,
            product:products(*)
          )
        `)
        .eq('id', campaignId)
        .single()

      if (error) throw error

      return { data }
    } catch (error) {
      console.error('Error fetching campaign:', error)
      throw error
    }
  }
}
