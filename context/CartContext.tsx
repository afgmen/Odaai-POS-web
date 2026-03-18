'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Table, User } from '@/lib/types';

interface CartContextType {
  cart: CartItem[];
  selectedTable: Table | null;
  currentUser: User | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateCartItem: (productId: number, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  setSelectedTable: (table: Table | null) => void;
  setCurrentUser: (user: User | null) => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => 
          cartItem.product.id === item.product.id &&
          JSON.stringify(cartItem.modifiers) === JSON.stringify(item.modifiers)
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += item.quantity;
        return newCart;
      }

      return [...prevCart, item];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateCartItem = (productId: number, updates: Partial<CartItem>) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, ...updates } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + parseFloat(item.product.price) * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        selectedTable,
        currentUser,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        setSelectedTable,
        setCurrentUser,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

