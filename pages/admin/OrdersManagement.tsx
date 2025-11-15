import React, { useState, useMemo } from 'react';
import { useOrders } from '../../contexts/OrderContext';
import { OrderStatus } from '../../types';

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.Received]: 'bg-blue-100 text-blue-800',
  [OrderStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.Ready]: 'bg-green-100 text-green-800',
  [OrderStatus.Served]: 'bg-gray-200 text-gray-800',
  [OrderStatus.Cancelled]: 'bg-red-100 text-red-800',
};
const ALL_STATUSES = 'All Statuses';
const ALL_TIME = 'All Time';

type DateFilter = 'All Time' | 'Today' | 'Last 7 Days' | 'Last 30 Days';

const OrdersManagement: React.FC = () => {
    const { orders } = useOrders();
    const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
    const [dateFilter, setDateFilter] = useState<DateFilter>(ALL_TIME);

    const filteredOrders = useMemo(() => {
        let dateFilteredOrders = orders;

        if (dateFilter !== ALL_TIME) {
            const now = new Date();
            let startDate = new Date();

            switch (dateFilter) {
                case 'Today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'Last 7 Days':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'Last 30 Days':
                    startDate.setDate(now.getDate() - 30);
                    break;
            }
            
            dateFilteredOrders = orders.filter(order => new Date(order.timestamp) >= startDate);
        }

        if (statusFilter === ALL_STATUSES) {
            return dateFilteredOrders;
        }
        return dateFilteredOrders.filter(order => order.status === statusFilter);
    }, [orders, statusFilter, dateFilter]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">All Orders</h3>
                <div className="flex items-center gap-4">
                    <div>
                        <label htmlFor="date-filter" className="sr-only">Filter by date</label>
                         <select
                            id="date-filter"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                        >
                            <option>All Time</option>
                            <option>Today</option>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                        >
                            <option>{ALL_STATUSES}</option>
                            {Object.values(OrderStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.length > 0 ? filteredOrders.map(order => (
                            <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id.slice(-6)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Table {order.tableId.replace(/t|s2/g, '')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                           <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500">
                                    No orders found for the selected criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersManagement;