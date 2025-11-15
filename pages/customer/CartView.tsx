import React from 'react';
import type { CartItem } from '../../types';
import Header from '../../components/Header';

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const MinusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

interface CartViewProps {
    cartItems: CartItem[];
    cartTotal: number;
    cartCount: number;
    updateQuantity: (menuItemId: string, quantity: number) => void;
    updateCartItemNotes: (menuItemId: string, notes: string) => void;
    onPlaceOrder: () => void;
    onBackToMenu: () => void;
}

const CartView: React.FC<CartViewProps> = ({
    cartItems,
    cartTotal,
    cartCount,
    updateQuantity,
    updateCartItemNotes,
    onPlaceOrder,
    onBackToMenu,
}) => {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header title="Your Order" showBackButton onBack={onBackToMenu} />
            <main className="flex-grow overflow-y-auto p-4">
                {cartItems.length > 0 ? (
                    <div className="space-y-4">
                        {cartItems.map(item => (
                            <div key={item.menuItem.id} className="bg-white p-4 rounded-lg shadow-md">
                                <div className="flex items-start gap-4">
                                    <img src={item.menuItem.image} alt={item.menuItem.name} className="h-20 w-20 rounded-md object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-bold text-lg">{item.menuItem.name}</p>
                                        <p className="text-sm text-gray-600">${item.menuItem.price.toFixed(2)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon /></button>
                                            <span className="font-bold w-8 text-center text-lg">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon /></button>
                                        </div>
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={(e) => updateCartItemNotes(item.menuItem.id, e.target.value)}
                                                placeholder="Add a note (e.g., no onions)"
                                                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 py-2 px-3"
                                                aria-label={`Note for ${item.menuItem.name}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-500">Your cart is empty.</p>
                        <button onClick={onBackToMenu} className="mt-4 bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600">
                            Back to Menu
                        </button>
                    </div>
                )}
            </main>
            {cartCount > 0 && (
                <footer className="bg-white p-4 border-t shadow-inner">
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span>Total ({cartCount} item{cartCount > 1 ? 's' : ''}):</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <button onClick={onPlaceOrder} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition duration-200 text-lg">
                        Proceed to Place Order
                    </button>
                </footer>
            )}
        </div>
    );
};

export default CartView;