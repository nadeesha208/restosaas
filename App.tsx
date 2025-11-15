import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { View, Restaurant } from './types';
import Landing from './pages/Landing';
import CustomerMenu from './pages/CustomerMenu';
import KitchenDisplay from './pages/KitchenDisplay';
import Admin from './pages/Admin';
import { MenuProvider, useMenu } from './contexts/MenuContext';
import { OrderProvider } from './contexts/OrderContext';
import { TableProvider } from './contexts/TableContext';
import { ReviewProvider } from './contexts/ReviewContext';
import RestaurantSelection from './pages/RestaurantSelection';
import { useTables } from './contexts/TableContext';
import Chatbot from './components/Chatbot';

const ChatbotIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zM9.48 13.48c-.29.29-.77.29-1.06 0L6.01 11.07c-.45-.45-.12-1.2.53-1.2h1.27c.29,0,.55.11,.75,.31l.92.92c.29.29.29.77 0 1.06l-.99.99zm4.99 0c-.29.29-.77.29-1.06 0l-2.41-2.41c-.45-.45-.12-1.2.53-1.2h1.27c.29,0,.55.11,.75,.31l.92.92c.29.29.29.77 0 1.06l-.99.99zm4.99 0c-.29.29-.77.29-1.06 0l-2.41-2.41c-.45-.45-.12-1.2.53-1.2h1.27c.29,0,.55.11,.75,.31l.92.92c.29.29.29.77 0 1.06l-.99.99z"/>
    </svg>
);


const AppContent: React.FC<{
    currentRestaurant: Restaurant;
    initialTableId: string | null;
    onExit: () => void;
}> = ({ currentRestaurant, initialTableId, onExit }) => {
    const [view, setView] = useState<View>(initialTableId ? 'CUSTOMER' : 'LANDING');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(initialTableId);
    const { tables, loading: tablesLoading } = useTables();
    const { menuItems, categories, loading: menuLoading } = useMenu();
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleSelectTable = (tableId: string) => {
        setSelectedTableId(tableId);
        setView('CUSTOMER');
    };
    
    const handleSetView = (newView: View) => {
        if (newView === 'LANDING') {
            setSelectedTableId(null);
        }
        
        setView(newView);
    }
    
    if (tablesLoading || menuLoading) {
         return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-xl text-gray-600">Loading Restaurant Data...</p>
            </div>
        )
    }

    const renderView = () => {
        switch (view) {
            case 'CUSTOMER':
                const table = tables.find(t => t.id === selectedTableId);
                return table ? <CustomerMenu table={table} setView={handleSetView} /> : <Landing setView={handleSetView} restaurant={currentRestaurant} setSelectedTable={handleSelectTable} />;
            case 'KITCHEN':
                return <KitchenDisplay setView={handleSetView} restaurant={currentRestaurant} />;
            case 'ADMIN':
                return <Admin setView={onExit} restaurant={currentRestaurant} />;
            case 'LANDING':
            default:
                return <Landing setView={handleSetView} restaurant={currentRestaurant} setSelectedTable={handleSelectTable} />;
        }
    }

    const showChatbotButton = view === 'LANDING' || view === 'CUSTOMER';

    return (
        <>
            {renderView()}
            {showChatbotButton && (
                <>
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-6 right-6 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-110 z-50"
                        aria-label="Open AI Assistant"
                    >
                        <ChatbotIcon />
                    </button>
                    <Chatbot 
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                        restaurant={currentRestaurant}
                        menuItems={menuItems}
                        categories={categories}
                    />
                </>
            )}
        </>
    );
}

const AppCore: React.FC = () => {
    const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
    const [initialTableId, setInitialTableId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleSelectRestaurant = useCallback((restaurant: Restaurant) => {
        setCurrentRestaurant(restaurant);
        setInitialTableId(null);
        if (window.location.protocol !== 'blob:') {
            const url = new URL(window.location.href);
            url.searchParams.set('restaurantId', restaurant.id);
            url.searchParams.delete('tableId');
            window.history.pushState({}, '', url.toString());
        }
    }, []);

    const handleExitRestaurant = useCallback(() => {
        setCurrentRestaurant(null);
        if (window.location.protocol !== 'blob:') {
            window.history.pushState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        const loadApp = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const restaurantId = urlParams.get('restaurantId');
            const tableId = urlParams.get('tableId');
            
            setIsLoading(true);
    
            if (restaurantId) {
                 try {
                    const response = await fetch(`/restaurants/${restaurantId}`);
                    if (response.ok) {
                        const restaurantData = await response.json();
                        setCurrentRestaurant(restaurantData);
                        if (tableId) {
                            setInitialTableId(tableId);
                        }
                    } else {
                        console.error("Restaurant not found:", restaurantId);
                        setCurrentRestaurant(null);
                        if (window.location.protocol !== 'blob:') {
                            window.history.pushState({}, document.title, window.location.pathname);
                        }
                    }
                 } catch (error) {
                    console.error("Failed to fetch restaurant:", error);
                    setCurrentRestaurant(null);
                    if (window.location.protocol !== 'blob:') {
                        window.history.pushState({}, document.title, window.location.pathname);
                    }
                 }
            }
            
            setIsLoading(false);
        };
    
        loadApp();
    }, []);
    

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <p className="text-xl text-gray-600">Initializing...</p>
            </div>
        )
    }
    
    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-900">
            {currentRestaurant ? (
                <TableProvider restaurantId={currentRestaurant.id}>
                    <MenuProvider restaurantId={currentRestaurant.id}>
                        <OrderProvider restaurantId={currentRestaurant.id}>
                            <ReviewProvider restaurantId={currentRestaurant.id}>
                                <AppContent 
                                    currentRestaurant={currentRestaurant}
                                    initialTableId={initialTableId}
                                    onExit={handleExitRestaurant}
                                />
                            </ReviewProvider>
                        </OrderProvider>
                    </MenuProvider>
                </TableProvider>
            ) : (
                <RestaurantSelection onSelectRestaurant={handleSelectRestaurant} />
            )}
        </div>
    );
}


const App: React.FC = () => {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
    }, []);

    return (
        <AppCore />
    );
};

export default App;