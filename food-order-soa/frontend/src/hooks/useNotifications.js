// filepath: src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react'
import { notificationApi } from '../api/notificationApi'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await notificationApi.getUnreadCount()
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const data = await notificationApi.getAll()
      setNotifications(data.slice(0, 5)) // Keep only latest 5
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [user])

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      )
      refetch()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [refetch])

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!user) return

    refetch()
    const interval = setInterval(refetch, 30000)
    return () => clearInterval(interval)
  }, [user, refetch])

  return {
    unreadCount,
    notifications,
    loading,
    markRead,
    refetch,
    fetchNotifications
  }
}
