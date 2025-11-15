import React, { useMemo } from 'react';
import { useOrders } from '../../contexts/OrderContext';
import { useMenu } from '../../contexts/MenuContext';
import { OrderStatus, MenuItem } from '../../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className={`rounded-full p-3 mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Icons = {
    Revenue: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>,
    Orders: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    Active: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Served: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
};


const AdminDashboard: React.FC = () => {
    const { orders } = useOrders();
    const { menuItems } = useMenu();

    const stats = useMemo(() => {
        const totalRevenue = orders
            .filter(o => o.status === OrderStatus.Served)
            .reduce((sum, order) => sum + order.total, 0);
        
        const totalOrders = orders.length;
        
        const activeOrders = orders.filter(
            o => o.status === OrderStatus.Received || o.status === OrderStatus.InProgress
        ).length;

        const servedOrders = orders.filter(o => o.status === OrderStatus.Served).length;

        return { totalRevenue, totalOrders, activeOrders, servedOrders };
    }, [orders]);

    const topSellingItems = useMemo(() => {
        const itemSales = new Map<string, { item: MenuItem, quantity: number }>();
        orders.forEach(order => {
            order.items.forEach(cartItem => {
                const existing = itemSales.get(cartItem.menuItem.id);
                if (existing) {
                    existing.quantity += cartItem.quantity;
                } else {
                    itemSales.set(cartItem.menuItem.id, {
                        item: cartItem.menuItem,
                        quantity: cartItem.quantity,
                    });
                }
            });
        });
        return Array.from(itemSales.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [orders]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={Icons.Revenue} color="bg-green-100" />
                <StatCard title="Total Orders" value={stats.totalOrders} icon={Icons.Orders} color="bg-blue-100" />
                <StatCard title="Active Orders" value={stats.activeOrders} icon={Icons.Active} color="bg-yellow-100" />
                <StatCard title="Orders Served" value={stats.servedOrders} icon={Icons.Served} color="bg-indigo-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Items</h3>
                     <ul className="space-y-3">
                         {topSellingItems.map(({ item, quantity }) => (
                            <li key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full object-cover mr-3"/>
                                    <span className="font-medium text-gray-700">{item.name}</span>
                                </div>
                                <span className="font-bold text-gray-800">{quantity} sold</span>
                            </li>
                         ))}
                         {topSellingItems.length === 0 && <p className="text-gray-500">No sales data yet.</p>}
                     </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Table</th>
                                    <th scope="col" className="px-4 py-3">Total</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order.id} className="bg-white border-b">
                                        <th scope="row" className="px-4 py-3 font-medium text-gray-900">Table {order.tableId.replace(/t|s2/g, '')}</th>
                                        <td className="px-4 py-3">${order.total.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${ {
                                                Received: 'bg-blue-100 text-blue-800',
                                                'In Progress': 'bg-yellow-100 text-yellow-800',
                                                Ready: 'bg-green-100 text-green-800',
                                                Served: 'bg-gray-100 text-gray-800',
                                                Cancelled: 'bg-red-100 text-red-800',
                                                }[order.status]}`}>{order.status}</span>
                                        </td>
                                        <td className="px-4 py-3">{new Date(order.timestamp).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                                {orders.length === 0 && <tr><td colSpan={4} className="text-center py-4">No recent orders.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;