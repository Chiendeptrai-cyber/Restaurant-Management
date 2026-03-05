// filepath: src/api/notificationApi.js
import apiClient from './axios'

export const notificationApi = {
  getAll: async () => {
    const response = await apiClient.get('/notifications')
    return response.data.data
  },

  markRead: async (id) => {
    const response = await apiClient.patch(`/notifications/${id}/read`)
    return response.data.data
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data.data
  }
}
