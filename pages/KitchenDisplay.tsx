import React from 'react';
import type { View, Order, OrderStatus, Restaurant } from '../types';
import { useOrders } from '../contexts/OrderContext';
import Header from '../components/Header';
import { OrderStatus as OrderStatusEnum } from '../types';

interface OrderTicketProps {
    order: Order;
    onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const statusColors: Record<OrderStatus, string> = {
    [OrderStatusEnum.Received]: 'bg-blue-100 text-blue-800',
    [OrderStatusEnum.InProgress]: 'bg-yellow-100 text-yellow-800',
    [OrderStatusEnum.Ready]: 'bg-green-100 text-green-800',
    [OrderStatusEnum.Served]: 'bg-gray-100 text-gray-800',
    [OrderStatusEnum.Cancelled]: 'bg-red-100 text-red-800',
};

const OrderTicket: React.FC<OrderTicketProps> = ({ order, onUpdateStatus }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col h-full">
            <div className="flex justify-between items-start border-b pb-2 mb-3">
                <div>
                    <h3 className="text-xl font-bold">Table {order.tableId.replace('s2t', '')}</h3>
                    <p className="text-xs text-gray-500">#{order.id.slice(-6)}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[order.status]}`}>
                    {order.status}
                </span>
            </div>
            <ul className="space-y-2 flex-grow overflow-y-auto">
                {order.items.map(item => (
                    <li key={item.menuItem.id} className="flex flex-col">
                        <div className="flex justify-between">
                            <span className="font-semibold">{item.quantity}x</span>
                            <span className="text-left ml-2 flex-1">{item.menuItem.name}</span>
                        </div>
                        {item.notes && (
                            <p className="text-sm text-red-600 pl-5 italic mt-1 break-words">
                                &rdsh; {item.notes}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
            <div className="mt-4 pt-3 border-t">
                {order.status === OrderStatusEnum.Received && (
                    <button onClick={() => onUpdateStatus(order.id, OrderStatusEnum.InProgress)} className="w-full bg-yellow-500 text-white font-bold py-2 rounded-md hover:bg-yellow-600 transition">
                        Start Cooking
                    </button>
                )}
                {order.status === OrderStatusEnum.InProgress && (
                    <button onClick={() => onUpdateStatus(order.id, OrderStatusEnum.Ready)} className="w-full bg-green-500 text-white font-bold py-2 rounded-md hover:bg-green-600 transition">
                        Mark as Ready
                    </button>
                )}
                {order.status === OrderStatusEnum.Ready && (
                    <button onClick={() => onUpdateStatus(order.id, OrderStatusEnum.Served)} className="w-full bg-gray-500 text-white font-bold py-2 rounded-md hover:bg-gray-600 transition">
                        Mark as Served
                    </button>
                )}
            </div>
        </div>
    );
}

interface KitchenDisplayProps {
    setView: (view: View) => void;
    restaurant: Restaurant;
}

const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ setView, restaurant }) => {
    const { orders, updateOrderStatus } = useOrders();
    
    const activeOrders = orders.filter(o => o.status !== OrderStatusEnum.Served && o.status !== OrderStatusEnum.Cancelled);

    return (
        <div className="bg-gray-200 min-h-screen">
            <Header title={`${restaurant.name} KDS`} showBackButton onBack={() => setView('LANDING')} />
            <main className="p-4">
                {activeOrders.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-500">No active orders.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {activeOrders.map(order => (
                            <OrderTicket key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default KitchenDisplay;