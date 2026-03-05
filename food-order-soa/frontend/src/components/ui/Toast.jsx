// filepath: src/components/ui/Toast.jsx
import { useState, useEffect } from 'react'

export function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const typeClasses = {
    info: 'bg-blue-500',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-danger'
  }

  return (
    <div className={`fixed bottom-4 right-4 ${typeClasses[type]} text-white px-6 py-4 rounded shadow-lg animate-fade-in-up`}>
      {message}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }

  return [toast, showToast]
}
