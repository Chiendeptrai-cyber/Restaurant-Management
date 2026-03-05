// filepath: src/api/restaurantApi.js
import apiClient from './axios'

export const restaurantApi = {
  getAll: async () => {
    const response = await apiClient.get('/restaurants')
    return response.data.data
  },

  getById: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}`)
    return response.data.data
  },

  getMenu: async (id) => {
    const response = await apiClient.get(`/restaurants/${id}/menu`)
    return response.data.data
  },

  create: async (data) => {
    const response = await apiClient.post('/restaurants', data)
    return response.data.data
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/restaurants/${id}`, data)
    return response.data.data
  },

  addMenuItem: async (restaurantId, data) => {
    const response = await apiClient.post(`/restaurants/${restaurantId}/menu`, data)
    return response.data.data
  },

  updateMenuItem: async (id, data) => {
    const response = await apiClient.put(`/menu-items/${id}`, data)
    return response.data.data
  },

  toggleMenuItem: async (id) => {
    const response = await apiClient.patch(`/menu-items/${id}/toggle`)
    return response.data.data
  }
}
