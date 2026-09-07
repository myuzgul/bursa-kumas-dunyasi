'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantTitle?: string;
  sku: string;
  image: string;
  unitPrice: number;
  meterQuantity: number;
  maxStockMeter?: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateMeter: (productId: string, meter: number, variantId?: string) => void;
  setCouponCode: (code: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalMeters: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const getItemKey = (productId: string, variantId?: string | null): string => {
  return `${productId}__${variantId ? String(variantId) : 'base'}`;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bkd_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Normalize and merge duplicates if any existed previously
          const normalizedMap = new Map<string, CartItem>();
          parsed.forEach((it: CartItem) => {
            const key = getItemKey(it.productId, it.variantId);
            if (normalizedMap.has(key)) {
              const existing = normalizedMap.get(key)!;
              existing.meterQuantity = Math.round((existing.meterQuantity + (it.meterQuantity || 1)) * 100) / 100;
            } else {
              normalizedMap.set(key, {
                ...it,
                meterQuantity: Math.round((it.meterQuantity || 1) * 100) / 100,
              });
            }
          });
          setItems(Array.from(normalizedMap.values()));
        }
      }
      const savedCoupon = localStorage.getItem('bkd_coupon');
      if (savedCoupon) {
        setCouponCode(savedCoupon);
      }
    } catch (e) {
      // Ignore
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('bkd_cart', JSON.stringify(items));
        localStorage.setItem('bkd_coupon', couponCode);
      } catch (e) {
        // Ignore
      }
    }
  }, [items, couponCode, isHydrated]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = (newItem: CartItem) => {
    const targetKey = getItemKey(newItem.productId, newItem.variantId);
    const addition = Math.round((Number(newItem.meterQuantity) || 1) * 100) / 100;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => getItemKey(i.productId, i.variantId) === targetKey
      );

      if (existingIdx > -1) {
        const currentItem = prev[existingIdx];
        const currentM = Number(currentItem.meterQuantity) || 0;
        const newTotal = Math.round((currentM + addition) * 100) / 100;
        const maxStock = currentItem.maxStockMeter;
        const finalMeter = maxStock ? Math.min(newTotal, maxStock) : newTotal;

        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, meterQuantity: finalMeter } : item
        );
      } else {
        return [
          ...prev,
          {
            ...newItem,
            meterQuantity: addition,
          },
        ];
      }
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string, variantId?: string) => {
    const targetKey = getItemKey(productId, variantId);
    setItems((prev) =>
      prev.filter((i) => getItemKey(i.productId, i.variantId) !== targetKey)
    );
  };

  const updateMeter = (productId: string, meter: number, variantId?: string) => {
    const targetKey = getItemKey(productId, variantId);
    const sanitizedMeter = Math.max(0.1, Math.round(Number(meter) * 100) / 100);

    setItems((prev) =>
      prev.map((i) => {
        if (getItemKey(i.productId, i.variantId) === targetKey) {
          const maxStock = i.maxStockMeter;
          const finalMeter = maxStock ? Math.min(sanitizedMeter, maxStock) : sanitizedMeter;
          return { ...i, meterQuantity: finalMeter };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
  };

  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.meterQuantity) || 0),
    0
  );

  const totalMeters = items.reduce((acc, item) => acc + (Number(item.meterQuantity) || 0), 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        couponCode,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateMeter,
        setCouponCode,
        clearCart,
        subtotal: Math.round(subtotal * 100) / 100,
        totalMeters: Math.round(totalMeters * 100) / 100,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
