import React, { useState } from 'react';
import type { Restaurant, AdminView } from '../types';

import AdminDashboard from './admin/Dashboard';
import MenuBuilder from './admin/MenuBuilder';
import OrdersManagement from './admin/OrdersManagement';
import TableManagement from './admin/TableManagement';
import Reports from './admin/Reports';
import Staff from './admin/Staff';
import Settings from './admin/Settings';
import KitchenDisplay from './KitchenDisplay';


const ICONS: Record<string, React.FC<{ className?: string }>> = {
    DASHBOARD: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    MENU: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
    ORDERS: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    TABLES: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    KDS: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0117.657 18.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1014.12 11.88m-4.242 4.242L6 19" /></svg>,
    REPORTS: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    STAFF: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    SETTINGS: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    LOGOUT: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
};

const NavItem: React.FC<{ title: string; icon: React.FC<{ className?: string }>; isActive: boolean; onClick: () => void; }> = ({ title, icon: Icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
        <Icon className="h-5 w-5 mr-3" />
        <span className="font-medium">{title}</span>
    </button>
);

interface AdminProps {
    setView: (view: 'LANDING') => void;
    restaurant: Restaurant;
}

const Admin: React.FC<AdminProps> = ({ setView, restaurant }) => {
    const [adminView, setAdminView] = useState<AdminView>('DASHBOARD');

    const renderAdminView = () => {
        switch (adminView) {
            case 'MENU': return <MenuBuilder />;
            case 'ORDERS': return <OrdersManagement />;
            case 'TABLES': return <TableManagement restaurant={restaurant}/>;
            case 'REPORTS': return <Reports />;
            case 'STAFF': return <Staff />;
            case 'SETTINGS': return <Settings />;
            case 'KDS': return <KitchenDisplay setView={() => setAdminView('DASHBOARD')} restaurant={restaurant}/>;
            case 'DASHBOARD':
            default: return <AdminDashboard />;
        }
    };

    const viewTitles: Record<AdminView, string> = {
        DASHBOARD: 'Dashboard',
        MENU: 'Menu Builder',
        ORDERS: 'Orders Management',
        TABLES: 'Table Management',
        KDS: 'Kitchen Display System',
        REPORTS: 'Reports & Analytics',
        STAFF: 'Staff Management',
        SETTINGS: 'Settings'
    };
    
    const navItems: { key: AdminView; title: string; icon: string; }[] = [
        { key: 'DASHBOARD', title: 'Dashboard', icon: 'DASHBOARD' },
        { key: 'MENU', title: 'Menu Builder', icon: 'MENU' },
        { key: 'ORDERS', title: 'Orders Management', icon: 'ORDERS' },
        { key: 'TABLES', title: 'Table Management', icon: 'TABLES' },
        { key: 'KDS', title: 'Kitchen Display', icon: 'KDS' },
        { key: 'REPORTS', title: 'Reports', icon: 'REPORTS' },
    ];
    
    const secondaryNavItems = [
        { key: 'STAFF', title: 'Staff', icon: 'STAFF' },
        { key: 'SETTINGS', title: 'Settings', icon: 'SETTINGS' }
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white flex flex-col border-r">
                <div className="h-16 flex items-center justify-center border-b px-4 text-center">
                    <h1 className="text-xl font-bold text-orange-600">{restaurant.name}</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (
                        <NavItem key={item.key} title={item.title} icon={ICONS[item.icon]} isActive={adminView === item.key} onClick={() => setAdminView(item.key)} />
                    ))}
                    
                    <div className="pt-4 mt-4 border-t">
                        {secondaryNavItems.map(item => (
                            <NavItem key={item.key} title={item.title} icon={ICONS[item.icon]} isActive={adminView === item.key} onClick={() => setAdminView(item.key as AdminView)} />
                        ))}
                    </div>
                </nav>
                 <div className="p-4 border-t">
                    <NavItem title="Exit to All Restaurants" icon={ICONS['LOGOUT']} isActive={false} onClick={() => setView('LANDING')} />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm z-10">
                    <div className="p-4">
                        <h2 className="text-2xl font-bold text-gray-800">{viewTitles[adminView]}</h2>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
                    {renderAdminView()}
                </main>
            </div>
        </div>
    );
};

export default Admin;