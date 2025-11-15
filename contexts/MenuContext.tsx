import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { MenuItem, Category } from '../types';

interface MenuContextType {
    menuItems: MenuItem[];
    categories: Category[];
    loading: boolean;
    error: Error | null;
    addMenuItem: (item: Omit<MenuItem, 'id' | 'restaurantId' | 'tags'>) => Promise<void>;
    updateMenuItem: (item: MenuItem) => Promise<void>;
    deleteMenuItem: (itemId: string) => Promise<void>;
    addCategory: (category: Omit<Category, 'id' | 'restaurantId'>) => Promise<void>;
    updateCategory: (category: Category) => Promise<void>;
    deleteCategory: (categoryId: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
    children: ReactNode;
    restaurantId: string;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children, restaurantId }) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMenuData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [itemsResponse, categoriesResponse] = await Promise.all([
                fetch(`/menu/items?restaurantId=${restaurantId}`),
                fetch(`/menu/categories?restaurantId=${restaurantId}`)
            ]);
            if (!itemsResponse.ok || !categoriesResponse.ok) {
                throw new Error('Failed to fetch menu data');
            }
            const itemsData = await itemsResponse.json();
            const categoriesData = await categoriesResponse.json();
            setMenuItems(itemsData);
            setCategories(categoriesData);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        if (restaurantId) {
            fetchMenuData();
        }
    }, [fetchMenuData, restaurantId]);

    const addMenuItem = async (item: Omit<MenuItem, 'id' | 'restaurantId' | 'tags'>) => {
        try {
            const response = await fetch('/menu/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, restaurantId, tags: [] }),
            });
            if (!response.ok) throw new Error('Failed to add menu item');
            const newItem = await response.json();
            setMenuItems(prev => [...prev, newItem]);
        } catch (err: any) {
            setError(err);
        }
    };

    const updateMenuItem = async (updatedItem: MenuItem) => {
        try {
            const response = await fetch(`/menu/items/${updatedItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem),
            });
            if (!response.ok) throw new Error('Failed to update menu item');
            const result = await response.json();
            setMenuItems(prev => prev.map(item => item.id === result.id ? result : item));
        } catch (err: any) {
            setError(err);
        }
    };

    const deleteMenuItem = async (itemId: string) => {
        try {
            const response = await fetch(`/menu/items/${itemId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete menu item');
            setMenuItems(prev => prev.filter(item => item.id !== itemId));
        } catch (err: any) {
            setError(err);
        }
    };

    const addCategory = async (category: Omit<Category, 'id' | 'restaurantId'>) => {
        try {
            const response = await fetch('/menu/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...category, restaurantId }),
            });
            if (!response.ok) throw new Error('Failed to add category');
            const newCategory = await response.json();
            setCategories(prev => [...prev, newCategory]);
        } catch (err: any) {
            setError(err);
        }
    };

    const updateCategory = async (updatedCategory: Category) => {
        try {
            const response = await fetch(`/menu/categories/${updatedCategory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCategory),
            });
            if (!response.ok) throw new Error('Failed to update category');
            const result = await response.json();
            setCategories(prev => prev.map(cat => cat.id === result.id ? result : cat));
        } catch (err: any) {
            setError(err);
        }
    };

    const deleteCategory = async (categoryId: string) => {
        try {
            const response = await fetch(`/menu/categories/${categoryId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete category');
            setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        } catch (err: any) {
            setError(err);
        }
    };

    return (
        <MenuContext.Provider value={{ 
            menuItems, 
            categories, 
            loading,
            error,
            addMenuItem, 
            updateMenuItem, 
            deleteMenuItem,
            addCategory,
            updateCategory,
            deleteCategory
        }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = (): MenuContextType => {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};