import React, { useState } from 'react';
import type { View, Restaurant } from '../types';
import { useTables } from '../contexts/TableContext';

interface LandingProps {
    setView: (view: View) => void;
    setSelectedTable: (tableId: string) => void;
    restaurant: Restaurant;
}

const RestaurantIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const Landing: React.FC<LandingProps> = ({ setView, setSelectedTable, restaurant }) => {
    const [showTableSelection, setShowTableSelection] = useState(false);
    const { tables, loading } = useTables();

    const handleSelectTable = (tableId: string) => {
        setSelectedTable(tableId);
        setView('CUSTOMER');
    };

    if (showTableSelection) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Select Your Table at {restaurant.name}</h2>
                    <p className="text-gray-600 mb-8">This simulates scanning a QR code at your table.</p>
                    {loading ? <p>Loading tables...</p> : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => handleSelectTable(table.id)}
                                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:bg-orange-50 transition-all duration-200"
                                >
                                    <span className="text-lg font-semibold text-gray-700">{table.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                     <button onClick={() => setShowTableSelection(false)} className="mt-8 text-orange-600 hover:text-orange-800 font-semibold">
                        &larr; Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <RestaurantIcon />
                <h1 className="text-4xl font-extrabold text-gray-900 mt-4">Welcome to {restaurant.name}</h1>
                <p className="text-lg text-gray-600 mt-2 mb-8">Please select your role for this restaurant.</p>
                <div className="space-y-4">
                    <button
                        onClick={() => setShowTableSelection(true)}
                        className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
                    >
                        I'm a Customer (Select Table)
                    </button>
                    <button
                        onClick={() => setView('KITCHEN')}
                        className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-105"
                    >
                        Kitchen Display System
                    </button>
                    <button
                        onClick={() => setView('ADMIN')}
                        className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-800 transition-transform transform hover:scale-105"
                    >
                        Admin Panel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Landing;