import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Order, CartItem, OrderStatus, User } from '../types';

interface OrderContextType {
    orders: Order[];
    loading: boolean;
    placeOrder: (tableId: string, items: CartItem[]) => Promise<Order>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderProviderProps {
    children: ReactNode;
    restaurantId: string;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children, restaurantId }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/orders?restaurantId=${restaurantId}`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data = await response.json();
            setOrders(data);
        } catch(err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        if(restaurantId) {
            fetchOrders();
        }
    }, [fetchOrders, restaurantId]);

    const placeOrder = useCallback(async (tableId: string, items: CartItem[]): Promise<Order> => {
        setLoading(true);
        const total = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
        
        try {
            const response = await fetch('/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId, items, total, restaurantId, userId: 'guest-user' }),
            });
             if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to place order: ${errorData}`);
            }
            const newOrder = await response.json();
            setOrders(prev => [newOrder, ...prev]);
            setLoading(false);
            return newOrder;
        } catch(err: any) {
            setError(err);
            setLoading(false);
            throw err;
        }
    }, [restaurantId]);

    const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
        try {
            const response = await fetch(`/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error('Failed to update order status');
            const updatedOrder = await response.json();

            setOrders(prev => prev.map(order => 
                order.id === orderId ? { ...order, status: updatedOrder.status } : order
            ));
        } catch (err: any) {
            setError(err);
        }
    }, []);

    const cancelOrder = useCallback(async (orderId: string) => {
        await updateOrderStatus(orderId, OrderStatus.Cancelled);
    }, [updateOrderStatus]);

    return (
        <OrderContext.Provider value={{ orders, loading, placeOrder, updateOrderStatus, cancelOrder }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = (): OrderContextType => {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrders must be used within an OrderProvider');
    }
    return context;
};