import React, { useMemo } from 'react';
import { useOrders } from '../../contexts/OrderContext';
import { OrderStatus } from '../../types';

const Reports: React.FC = () => {
    const { orders } = useOrders();

    const salesData = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === OrderStatus.Served);
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = completedOrders.length;
        
        const itemPerformance = new Map<string, { name: string; quantity: number; revenue: number; }>();
        completedOrders.forEach(order => {
            order.items.forEach(cartItem => {
                const existing = itemPerformance.get(cartItem.menuItem.id);
                const itemRevenue = cartItem.menuItem.price * cartItem.quantity;
                if (existing) {
                    existing.quantity += cartItem.quantity;
                    existing.revenue += itemRevenue;
                } else {
                    itemPerformance.set(cartItem.menuItem.id, {
                        name: cartItem.menuItem.name,
                        quantity: cartItem.quantity,
                        revenue: itemRevenue,
                    });
                }
            });
        });

        const topItemsByQuantity = Array.from(itemPerformance.values()).sort((a, b) => b.quantity - a.quantity);

        return { totalRevenue, totalOrders, topItemsByQuantity };
    }, [orders]);
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                        <p className="text-lg font-medium text-green-800">Total Revenue</p>
                        <p className="text-4xl font-extrabold text-green-900">${salesData.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                        <p className="text-lg font-medium text-blue-800">Completed Orders</p>
                        <p className="text-4xl font-extrabold text-blue-900">{salesData.totalOrders}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Item Performance</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {salesData.topItemsByQuantity.length > 0 ? salesData.topItemsByQuantity.map(item => (
                                <tr key={item.name}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.revenue.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500">No sales data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
