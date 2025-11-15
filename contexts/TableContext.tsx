import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { Table } from '../types';

interface TableContextType {
    tables: Table[];
    loading: boolean;
    error: Error | null;
    addTable: (table: Omit<Table, 'id' | 'restaurantId'>) => Promise<void>;
    updateTable: (table: Table) => Promise<void>;
    deleteTable: (tableId: string) => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

interface TableProviderProps {
    children: ReactNode;
    restaurantId: string;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children, restaurantId }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTables = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/restaurants/${restaurantId}/tables`);
            if (!response.ok) throw new Error('Failed to fetch tables');
            const data = await response.json();
            setTables(data);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        if(restaurantId) {
            fetchTables();
        }
    }, [fetchTables, restaurantId]);

    const addTable = async (tableData: Omit<Table, 'id' | 'restaurantId'>) => {
        try {
            const response = await fetch(`/restaurants/${restaurantId}/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tableData),
            });
            if (!response.ok) throw new Error('Failed to add table');
            const newTable = await response.json();
            setTables(prev => [...prev, newTable]);
        } catch (err: any) {
            setError(err);
        }
    };

    const updateTable = async (updatedTable: Table) => {
        try {
            const response = await fetch(`/restaurants/${restaurantId}/tables/${updatedTable.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: updatedTable.name }),
            });
            if (!response.ok) throw new Error('Failed to update table');
            const result = await response.json();
            setTables(prev => prev.map(t => t.id === result.id ? result : t));
        } catch (err: any) {
            setError(err);
        }
    };

    const deleteTable = async (tableId: string) => {
        try {
            const response = await fetch(`/restaurants/${restaurantId}/tables/${tableId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete table');
            setTables(prev => prev.filter(t => t.id !== tableId));
        } catch (err: any) {
            setError(err);
        }
    };

    return (
        <TableContext.Provider value={{ tables, loading, error, addTable, updateTable, deleteTable }}>
            {children}
        </TableContext.Provider>
    );
};

export const useTables = (): TableContextType => {
    const context = useContext(TableContext);
    if (context === undefined) {
        throw new Error('useTables must be used within a TableProvider');
    }
    return context;
};