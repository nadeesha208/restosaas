import { useState, useMemo, useCallback } from 'react';
import type { CartItem, MenuItem } from '../types';

export const useCart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = useCallback((menuItem: MenuItem) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.menuItem.id === menuItem.id);

            if (existingItem) {
                // Item exists, update quantity and move to top
                const updatedItem = { ...existingItem, quantity: existingItem.quantity + 1 };
                const otherItems = prevItems.filter(item => item.menuItem.id !== menuItem.id);
                return [updatedItem, ...otherItems];
            }
            
            // New item, add to top
            const newItem: CartItem = { menuItem, quantity: 1, notes: '' };
            return [newItem, ...prevItems];
        });
    }, []);

    const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
        if (quantity <= 0) {
            setCartItems(prevItems => prevItems.filter(item => item.menuItem.id !== menuItemId));
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.menuItem.id === menuItemId ? { ...item, quantity } : item
                )
            );
        }
    }, []);

    const updateCartItemNotes = useCallback((menuItemId: string, notes: string) => {
        setCartItems(prevItems => 
            prevItems.map(item => 
                item.menuItem.id === menuItemId ? { ...item, notes } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const cartTotal = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
    }, [cartItems]);
    
    const cartCount = useMemo(() => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    }, [cartItems]);

    return {
        cartItems,
        addToCart,
        updateQuantity,
        updateCartItemNotes,
        clearCart,
        cartTotal,
        cartCount,
    };
};
