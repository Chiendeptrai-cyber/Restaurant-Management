// filepath: src/api/authApi.js
import apiClient from './axios'

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data.data
  },

  register: async (name, email, password, role) => {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      role
    })
    return response.data.data
  },

  getMe: async () => {
    const response = await apiClient.get('/users/me')
    return response.data.data
  }
}
