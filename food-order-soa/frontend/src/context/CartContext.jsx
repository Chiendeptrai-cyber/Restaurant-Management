// filepath: src/context/CartContext.jsx
import { createContext, useState, useCallback } from 'react'

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [restaurantId, setRestaurantId] = useState(null)
  const [restaurantName, setRestaurantName] = useState(null)

  const addItem = useCallback((item, restaurant, onConfirm) => {
    // If adding from different restaurant, ask for confirmation
    if (restaurantId && restaurantId !== restaurant.id) {
      onConfirm(() => {
        setCartItems([{ ...item, quantity: 1 }])
        setRestaurantId(restaurant.id)
        setRestaurantName(restaurant.name)
      })
      return
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })

    if (!restaurantId) {
      setRestaurantId(restaurant.id)
      setRestaurantName(restaurant.name)
    }
  }, [restaurantId])

  const removeItem = useCallback((menuItemId) => {
    setCartItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId))
  }, [])

  const updateQuantity = useCallback((menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId)
      return
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setCartItems([])
    setRestaurantId(null)
    setRestaurantName(null)
  }, [])

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items: cartItems,
        restaurantId,
        restaurantName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
