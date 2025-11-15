import React, { useState, useEffect, useMemo } from 'react';
import type { Order, OrderStatus as OrderStatusType } from '../../types';
import { OrderStatus } from '../../types';
import { useOrders } from '../../contexts/OrderContext';
import Header from '../../components/Header';
import Modal from '../../components/Modal';

// FIX: Removed `useAuth` import and `LoyaltyPointsCard` component definition.
// Both were related to authentication features that have been rolled back, and the `useAuth` import was causing a module resolution error.

// Progress Tracker Component
const OrderProgress: React.FC<{ status: OrderStatusType }> = ({ status }) => {
    const statuses = [OrderStatus.Received, OrderStatus.InProgress, OrderStatus.Ready, OrderStatus.Served];
    const currentIndex = statuses.indexOf(status);

    return (
        <div className="flex items-center mt-4">
            {statuses.map((s, index) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center text-center w-1/4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${index <= currentIndex ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-300 border-gray-300 text-gray-600'}`}>
                            {index < currentIndex ? 
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> 
                                : <span>{index + 1}</span>
                            }
                        </div>
                        <p className={`text-xs mt-1 ${index <= currentIndex ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{s}</p>
                    </div>
                    {index < statuses.length - 1 && <div className={`flex-1 h-1 mx-2 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

// Order Card Component
const OrderCard: React.FC<{
    order: Order;
    isMostRecent: boolean;
    onCancel: (orderId: string) => void;
}> = ({ order, isMostRecent, onCancel }) => {
    const [cancelTimeLeft, setCancelTimeLeft] = useState(0);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const canCancel = isMostRecent && (Date.now() - order.timestamp) < 60000 && order.status === OrderStatus.Received;

    useEffect(() => {
        if (!canCancel) {
            setCancelTimeLeft(0);
            return;
        }

        const updateTimer = () => {
             const timeLeft = 60 - Math.floor((Date.now() - order.timestamp) / 1000);
             setCancelTimeLeft(timeLeft > 0 ? timeLeft : 0);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [canCancel, order.timestamp]);

    const handleConfirmCancel = () => {
        onCancel(order.id);
        setIsCancelConfirmOpen(false);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg">Order #{order.id.slice(-6)}</h3>
                    <p className="text-sm text-gray-500">{new Date(order.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{order.items.reduce((acc, i) => acc + i.quantity, 0)} items</p>
                </div>
            </div>
            {order.status === OrderStatus.Cancelled ? (
                 <div className="text-center text-red-500 font-bold mt-4 py-4 border-t">
                    Order Cancelled
                </div>
            ) : (
                <div className="border-t mt-3">
                    <OrderProgress status={order.status} />
                </div>
            )}
            
            {cancelTimeLeft > 0 && canCancel && (
                <div className="mt-4 pt-3 border-t">
                    <button
                        onClick={() => setIsCancelConfirmOpen(true)}
                        className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition-opacity duration-300"
                    >
                        Cancel Order ({cancelTimeLeft}s)
                    </button>
                </div>
            )}
            <Modal isOpen={isCancelConfirmOpen} onClose={() => setIsCancelConfirmOpen(false)} title="Confirm Cancellation">
                <div className="text-center">
                    <p className="text-lg mb-6">Are you sure you want to cancel this order?</p>
                    <div className="flex justify-center gap-4">
                         <button onClick={() => setIsCancelConfirmOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                           No, Keep Order
                        </button>
                        <button onClick={handleConfirmCancel} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600">
                           Yes, Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

interface OrderStatusPageProps {
    tableId: string;
    onCancelOrder: (orderId: string) => void;
    onBackToMenu: () => void;
}

const OrderStatusPage: React.FC<OrderStatusPageProps> = ({ tableId, onCancelOrder, onBackToMenu }) => {
    const { orders } = useOrders();

    // FIX: Removed `useAuth` hook and logic depending on `currentUser`.
    // The component now assumes a guest context and filters orders by `tableId`.
    const relevantOrders = useMemo(() => {
        const userOrders = orders.filter(o => o.tableId === tableId);
        return userOrders.sort((a,b) => b.timestamp - a.timestamp);
    }, [orders, tableId]);
    
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header title="My Orders" showBackButton onBack={onBackToMenu} />
            <main className="flex-grow overflow-y-auto p-4">
                {relevantOrders.length > 0 ? (
                    <div className="space-y-4">
                        {relevantOrders.map((order, index) => (
                            <OrderCard 
                                key={order.id} 
                                order={order} 
                                isMostRecent={index === 0}
                                onCancel={onCancelOrder} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-500">You haven't placed any orders yet.</p>
                        <button onClick={onBackToMenu} className="mt-4 bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600">
                            Back to Menu
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrderStatusPage;