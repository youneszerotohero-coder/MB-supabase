import { supabase } from '../lib/supabaseClient'

// Get all orders with filtering and pagination
export const getOrders = async (options = {}) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          *,
          product:products(*),
          variant:product_variants(*)
        ),
        created_by:users(*)
      `)

    // Apply filters
    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }
    if (options.search) {
      query = query.or(`order_number.ilike.%${options.search}%,customer_name.ilike.%${options.search}%,customer_phone.ilike.%${options.search}%`)
    }
    if (options.fromDate) {
      query = query.gte('created_at', options.fromDate)
    }
    if (options.toDate) {
      query = query.lte('created_at', options.toDate)
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    if (options.page && options.limit) {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: {
        orders: data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || data.length,
          total: count || data.length,
          totalPages: options.limit ? Math.ceil((count || data.length) / options.limit) : 1
        }
      }
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

// Get single order by ID
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          *,
          product:products(*),
          variant:product_variants(*)
        ),
        created_by:users(*)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const updateData = { status }
    
    // Update timestamps based on status
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString()
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

// Create new order (for admin/POS)
export const createOrder = async (orderData) => {
  try {
    console.log('Creating order with data:', orderData)
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity)
    }, 0)
    
    const deliveryFee = orderData.deliveryFee || 0
    const total = subtotal + deliveryFee

    // Generate UUID for the order
    const orderId = crypto.randomUUID()
    
    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        order_number: orderNumber,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_wilaya: orderData.customerWilaya,
        customer_baladiya: orderData.customerBaladiya,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total,
        status: 'pending',
        order_source: orderData.orderSource || 'website',
        pos_session_id: orderData.posSessionId || null,
        created_by: orderData.createdBy || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = orderData.items.map(item => ({
      id: crypto.randomUUID(),
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      product_name: item.productName || 'Unknown Product',
      product_sku: item.productSku || null,
      selected_color: item.selectedColor || null,
      selected_size: item.selectedSize || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_cost: item.unitCost || null,
      line_total: item.unitPrice * item.quantity,
      line_profit: item.unitCost ? (item.unitPrice - item.unitCost) * item.quantity : null
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Update product stock if needed
    for (const item of orderData.items) {
      if (item.productId) {
        // Update main product stock
        const { error: stockError } = await supabase.rpc('decrement_product_stock', {
          p_product_id: item.productId,
          p_quantity: item.quantity
        })
        
        if (stockError) {
          console.warn('Failed to update product stock:', stockError)
        }
      }
    }

    return { 
      data: {
        ...order,
        orderNumber: order.order_number
      }
    }
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// Delete order
export const deleteOrder = async (orderId) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting order:', error)
    throw error
  }
}

// Get order statistics
export const getOrderStats = async (options = {}) => {
  try {
    let query = supabase
      .from('orders')
      .select('status, total, created_at')

    if (options.fromDate) {
      query = query.gte('created_at', options.fromDate)
    }
    if (options.toDate) {
      query = query.lte('created_at', options.toDate)
    }

    const { data, error } = await query

    if (error) throw error

    // Calculate statistics
    const stats = {
      total: data.length,
      pending: data.filter(o => o.status === 'pending').length,
      confirmed: data.filter(o => o.status === 'confirmed').length,
      processing: data.filter(o => o.status === 'processing').length,
      shipped: data.filter(o => o.status === 'shipped').length,
      delivered: data.filter(o => o.status === 'delivered').length,
      cancelled: data.filter(o => o.status === 'cancelled').length,
      totalRevenue: data.reduce((sum, o) => sum + Number(o.total), 0),
      averageOrderValue: data.length > 0 ? data.reduce((sum, o) => sum + Number(o.total), 0) / data.length : 0
    }

    return { data: stats }
  } catch (error) {
    console.error('Error fetching order stats:', error)
    throw error
  }
}

// Get orders by customer
export const getOrdersByCustomer = async (customerPhone, options = {}) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          *,
          product:products(*),
          variant:product_variants(*)
        )
      `)
      .eq('customer_phone', customerPhone)

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    query = query.order('created_at', { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    throw error
  }
}
