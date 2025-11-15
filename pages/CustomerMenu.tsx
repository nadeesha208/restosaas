import React, { useState, useMemo, useEffect } from 'react';
import type { View, MenuItem as MenuItemType, Category, Table, Review, User, CustomerView } from '../types';
import { useMenu } from '../contexts/MenuContext';
import { useOrders } from '../contexts/OrderContext';
import { useCart } from '../hooks/useCart';
import { useReviews } from '../contexts/ReviewContext';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StarRating from '../components/StarRating';
import CartView from './customer/CartView';
import OrderStatusPage from './customer/OrderStatus';


// --- ICONS ---
const ShoppingCartIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const UserGroupIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
);


// --- MENU ITEM CARD ---
interface MenuItemCardProps {
    item: MenuItemType;
    onAddToCart: (item: MenuItemType) => void;
    onViewDetails: (item: MenuItemType) => void;
}
const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart, onViewDetails }) => {
    const { getReviewStatsByItemId } = useReviews();
    const { average, count } = getReviewStatsByItemId(item.id);

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Stop propagation on the "Add" button to prevent opening the modal.
        if ((e.target as HTMLElement).closest('button')?.textContent?.includes('Add')) {
            e.stopPropagation();
            onAddToCart(item);
            return;
        }
        onViewDetails(item);
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col cursor-pointer" onClick={handleCardClick}>
            <div className="relative">
                <img className="h-40 w-full object-cover" src={item.image} alt={item.name} />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 px-2 py-1 rounded-md">
                     {count > 0 ? (
                        <div className="flex items-center gap-1">
                            <StarRating rating={average} size="sm" />
                            <span className="text-white text-xs font-semibold">({count})</span>
                        </div>
                    ) : (
                         <span className="text-white text-xs font-semibold">No reviews</span>
                    )}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                <p className="mt-1 text-sm text-gray-600 flex-grow">{item.description}</p>
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-lg font-semibold text-orange-600">${item.price.toFixed(2)}</p>
                    <button className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition duration-200 flex items-center">
                        <PlusIcon /> <span className="ml-1">Add</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MENU ITEM DETAIL & REVIEW MODAL ---
interface MenuItemDetailModalProps {
    item: MenuItemType | null;
    onClose: () => void;
}
const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({ item, onClose }) => {
    const { getReviewsByItemId, addReview, getReviewStatsByItemId } = useReviews();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    
    if (!item) return null;

    const reviews = getReviewsByItemId(item.id);
    const { average, count } = getReviewStatsByItemId(item.id);

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        // Use a default 'guest' ID.
        const userId = 'guest-user';
        addReview({
            menuItemId: item.id,
            rating,
            comment,
            userId,
        });
        setRating(5);
        setComment('');
    };

    return (
        <Modal isOpen={!!item} onClose={onClose} title={item.name}>
            <div>
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                <p className="text-gray-600 mb-4">{item.description}</p>
                 <div className="flex justify-between items-center mb-6">
                    <p className="text-2xl font-bold text-orange-600">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                        <StarRating rating={average} />
                        <span className="text-gray-600 font-medium">({count} reviews)</span>
                    </div>
                </div>

                <form onSubmit={handleSubmitReview} className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-lg mb-2">Leave a Review</h4>
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating</label>
                        <StarRating rating={rating} setRating={setRating} size="lg" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment</label>
                        <textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3} required className="w-full mt-1 text-sm border-gray-300 rounded-md shadow-sm" placeholder="What did you think?"/>
                    </div>
                    <button type="submit" className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600">Submit Review</button>
                </form>

                <div>
                    <h4 className="font-semibold text-lg mb-4">What Others Are Saying</h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {reviews.length > 0 ? reviews.map(review => (
                            <div key={review.id} className="border-b pb-3 last:border-0">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{review.userName}</p>
                                    <StarRating rating={review.rating} size="sm" />
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                                <p className="text-xs text-gray-400 mt-2 text-right">{new Date(review.timestamp).toLocaleDateString()}</p>
                            </div>
                        )) : <p className="text-gray-500">No reviews yet. Be the first!</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};


// --- CATEGORY DISPLAY ---
interface CategoryNode extends Category {
    children: CategoryNode[];
}
const RecursiveCategoryDisplay: React.FC<{
    categoryNode: CategoryNode;
    menuItems: MenuItemType[];
    onAddToCart: (item: MenuItemType) => void;
    onViewDetails: (item: MenuItemType) => void;
    level: number;
}> = ({ categoryNode, menuItems, onAddToCart, onViewDetails, level }) => {
    const itemsInCategory = menuItems.filter(item => item.categoryId === categoryNode.id);

    const hasContent = itemsInCategory.length > 0 || categoryNode.children.length > 0;
    if (!hasContent) return null;

    const headerStyles: Record<number, string> = {
        0: 'text-2xl font-bold text-gray-800 mb-6 border-b-2 border-orange-400 pb-2',
        1: 'text-xl font-semibold text-gray-700 mb-4',
        2: 'text-lg font-medium text-gray-600 mb-3',
    };

    return (
        <section className={level > 0 ? `ml-${level * 4} mt-8` : "mb-12"}>
            <h2 className={headerStyles[level] || headerStyles[2]}>{categoryNode.name}</h2>
            {itemsInCategory.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {itemsInCategory.map(item => (
                        <MenuItemCard key={item.id} item={item} onAddToCart={onAddToCart} onViewDetails={onViewDetails}/>
                    ))}
                </div>
            )}
            {categoryNode.children.length > 0 && (
                 <div className="mt-6">
                    {categoryNode.children.map(childNode => (
                        <RecursiveCategoryDisplay
                            key={childNode.id}
                            categoryNode={childNode}
                            menuItems={menuItems}
                            onAddToCart={onAddToCart}
                            onViewDetails={onViewDetails}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

// --- MAIN CUSTOMER MENU CONTROLLER ---
interface CustomerMenuProps {
    table: Table;
    setView: (view: View) => void;
}
const CustomerMenu: React.FC<CustomerMenuProps> = ({ table, setView }) => {
    const { menuItems, categories } = useMenu();
    const { placeOrder, cancelOrder } = useOrders();
    const { cartItems, addToCart, updateQuantity, clearCart, cartTotal, cartCount, updateCartItemNotes } = useCart();
    
    const [customerView, setCustomerView] = useState<CustomerView>('WELCOME');
    const [isPreOrderConfirmOpen, setIsPreOrderConfirmOpen] = useState(false);
    const [isPostOrderConfirmOpen, setIsPostOrderConfirmOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);

    // FIX: Define categoryTree by building a tree from the flat categories array.
    const categoryTree = useMemo(() => {
        const categoryMap = new Map<string, CategoryNode>(
            categories.map(cat => [cat.id, { ...cat, children: [] }])
        );
        const tree: CategoryNode[] = [];
        categories.forEach(cat => {
            const node = categoryMap.get(cat.id);
            if (node) {
                if (cat.parentId && categoryMap.has(cat.parentId)) {
                    categoryMap.get(cat.parentId)?.children.push(node);
                } else {
                    tree.push(node);
                }
            }
        });
        return tree;
    }, [categories]);

    const handlePlaceOrder = () => {
        if (cartItems.length > 0) {
            setIsPreOrderConfirmOpen(true);
        }
    };

    const handleConfirmOrder = async () => {
        if (cartItems.length === 0) return;
        
        await placeOrder(table.id, cartItems);
        
        clearCart();
        setIsPreOrderConfirmOpen(false);
        setIsPostOrderConfirmOpen(true);
    };

    const handleClosePostOrderModal = () => {
        setIsPostOrderConfirmOpen(false);
        setCustomerView('ORDERS');
    };

    const headerRightContent = useMemo(() => {
        if (customerView === 'MENU') {
            return (
                <div className="flex items-center gap-4">
                    <button onClick={() => setCustomerView('ORDERS')} className="text-gray-600 hover:text-orange-600 font-semibold text-sm sm:text-base">
                       My Orders
                    </button>
                    {cartCount > 0 && (
                        <button onClick={() => setCustomerView('CART')} className="relative text-gray-600 hover:text-orange-600">
                            <ShoppingCartIcon />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>
                        </button>
                    )}
                </div>
            );
        }
        return null;
    }, [customerView, cartCount]);
    
    // --- RENDER VIEWS ---

    if (customerView === 'WELCOME') {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm text-center">
                    <UserGroupIcon />
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">Welcome to Table {table.name}</h1>
                    <p className="text-gray-600 mt-2 mb-8">Ready to see the menu?</p>
                    <div className="space-y-4">
                         <button onClick={() => setCustomerView('MENU')} className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105">
                            View Menu
                        </button>
                    </div>
                     <button onClick={() => setView('LANDING')} className="mt-8 text-sm text-gray-500 hover:text-gray-700">
                        Not your table? Go back.
                    </button>
                </div>
            </div>
        )
    }

    if (customerView === 'CART') {
        return (
            <>
                <CartView
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    cartCount={cartCount}
                    updateQuantity={updateQuantity}
                    updateCartItemNotes={updateCartItemNotes}
                    onPlaceOrder={handlePlaceOrder}
                    onBackToMenu={() => setCustomerView('MENU')}
                />
                 <Modal isOpen={isPreOrderConfirmOpen} onClose={() => setIsPreOrderConfirmOpen(false)} title="Confirm Your Order">
                    <div className="text-center">
                        <p className="text-lg mb-4">
                            You are ordering {cartCount} item(s) for a total of <strong>${cartTotal.toFixed(2)}</strong>.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">Your order will be sent to the kitchen immediately.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setIsPreOrderConfirmOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Go Back</button>
                            <button onClick={handleConfirmOrder} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600">Confirm & Order</button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={isPostOrderConfirmOpen} onClose={handleClosePostOrderModal} title="Order Placed!">
                    <div className="text-center">
                        <p className="text-lg mb-6">Your order has been sent to the kitchen!</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setCustomerView('MENU')} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Order More</button>
                            <button onClick={handleClosePostOrderModal} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600">View My Orders</button>
                        </div>
                    </div>
                </Modal>
            </>
        );
    }
    
    if (customerView === 'ORDERS') {
        return (
            <OrderStatusPage
                tableId={table.id}
                onCancelOrder={cancelOrder}
                onBackToMenu={() => setCustomerView('MENU')}
            />
        );
    }

    // Default view: MENU
    return (
        <div className="pb-24">
            <Header 
                title={`${table.name} Menu`} 
                showBackButton 
                onBack={() => setView('LANDING')} 
                rightContent={headerRightContent}
            />
            
            <main className="container mx-auto p-4">
                 {categoryTree.map(categoryNode => (
                    <RecursiveCategoryDisplay
                        key={categoryNode.id}
                        categoryNode={categoryNode}
                        menuItems={menuItems}
                        onAddToCart={addToCart}
                        onViewDetails={setSelectedItem}
                        level={0}
                    />
                ))}
            </main>

            <MenuItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        </div>
    );
};

export default CustomerMenu;