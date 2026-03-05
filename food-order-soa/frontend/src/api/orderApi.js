// filepath: src/api/orderApi.js
import apiClient from './axios'

export const orderApi = {
  create: async (data) => {
    const response = await apiClient.post('/orders', data)
    return response.data.data
  },

  getMyOrders: async () => {
    const response = await apiClient.get('/orders/my')
    return response.data.data
  },

  getById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`)
    return response.data.data
  },

  cancel: async (id) => {
    const response = await apiClient.patch(`/orders/${id}/cancel`)
    return response.data.data
  },

  getByRestaurant: async (restaurantId) => {
    const response = await apiClient.get(`/orders/restaurant/${restaurantId}`)
    return response.data.data
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status })
    return response.data.data
  }
}
