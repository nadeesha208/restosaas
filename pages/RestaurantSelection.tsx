import React, { useState, useEffect, useCallback } from 'react';
import type { Restaurant } from '../types';

interface RestaurantSelectionProps {
    onSelectRestaurant: (restaurant: Restaurant) => void;
}

const BuildingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1-4h1" />
    </svg>
);

const RestaurantSelection: React.FC<RestaurantSelectionProps> = ({ onSelectRestaurant }) => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoading(true);
            try {
                const response = await fetch('/restaurants');
                if(!response.ok) throw new Error("Network response was not ok");
                const data = await response.json();
                setRestaurants(data);
            } catch (error) {
                console.error("Failed to fetch restaurants:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurants();
    }, []);

    if (loading) {
        return (
             <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <p className="text-xl text-gray-600">Loading Restaurants...</p>
             </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-lg text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 mt-4">Welcome to QR Dine</h1>
                <p className="text-lg text-gray-600 mt-2 mb-8">
                    Please select a restaurant to begin.
                </p>
                <div className="space-y-4">
                    {restaurants.map(res => (
                        <button
                            key={res.id}
                            onClick={() => onSelectRestaurant(res)}
                            className="w-full bg-white text-gray-800 text-left p-6 rounded-lg shadow-md hover:shadow-xl hover:border-orange-500 border-2 border-transparent transition-all duration-200 flex items-center"
                        >
                           <div className="p-3 bg-orange-100 rounded-lg mr-5">
                             <BuildingIcon />
                           </div>
                           <div>
                             <h2 className="font-bold text-xl">{res.name}</h2>
                             <p className="text-gray-600">{res.description}</p>
                           </div>
                        </button>
                    ))}
                     {restaurants.length === 0 && !loading && (
                        <div className="bg-white p-8 rounded-lg shadow-md text-gray-600">
                            <p>No restaurants are available at this time.</p>
                        </div>
                    )}
                </div>
                 <footer className="mt-12 text-sm text-gray-500">
                    <p>This is a simulation of a multi-tenant SaaS platform.</p>
                    <p>Each selection acts as a "login" to that restaurant's specific portal.</p>
                </footer>
            </div>
        </div>
    );
};

export default RestaurantSelection;