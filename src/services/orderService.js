import api from './api'

// Get all orders with filtering and pagination
export const getOrders = async (options = {}) => {
  try {
    const params = new URLSearchParams()
    
    if (options.page) params.append('page', options.page)
    if (options.limit) params.append('limit', options.limit)
    if (options.status && options.status !== 'all') params.append('status', options.status)
    if (options.paymentStatus && options.paymentStatus !== 'all') params.append('paymentStatus', options.paymentStatus)
    if (options.search) params.append('search', options.search)
    if (options.fromDate) params.append('fromDate', options.fromDate)
    if (options.toDate) params.append('toDate', options.toDate)

    console.log('Fetching orders with options:', options)
    console.log('API URL:', `/orders?${params.toString()}`)
    
    const response = await api.get(`/orders?${params.toString()}`)
    console.log('Orders response:', response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching orders:', error)
    console.error('Error response:', error.response?.data)
    throw error
  }
}

// Get single order by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status })
    return response.data
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

// Create new order (for admin/POS)
export const createOrder = async (orderData) => {
  try {
    console.log('Creating order with data:', orderData)
    const response = await api.post('/orders/pos', orderData)
    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}
