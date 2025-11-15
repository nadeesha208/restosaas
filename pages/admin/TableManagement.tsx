import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Table, Restaurant } from '../../types';
import { useTables } from '../../contexts/TableContext';
import Modal from '../../components/Modal';

// --- Table Form Modal ---
interface TableFormProps {
    table?: Table | null;
    onSave: (tableData: Omit<Table, 'id' | 'restaurantId'> | Table) => void;
    onCancel: () => void;
}

const TableForm: React.FC<TableFormProps> = ({ table, onSave, onCancel }) => {
    const [name, setName] = useState(table?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (table) {
            onSave({ ...table, name });
        } else {
            onSave({ name });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="tableName" className="block text-sm font-medium text-gray-700">Table Name / Number</label>
                <input
                    type="text"
                    id="tableName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="e.g., Table 1, Patio 5, Booth A"
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600">Save Table</button>
            </div>
        </form>
    );
};

// --- QR Code Modal ---
interface QrCodeModalProps {
    table: Table;
    restaurant: Restaurant;
    onClose: () => void;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ table, restaurant, onClose }) => {
    const qrCodeRef = useRef<HTMLDivElement>(null);
    const url = `${window.location.origin}/?restaurantId=${restaurant.id}&tableId=${table.id}`;

    const handlePrint = () => {
        const printContent = qrCodeRef.current?.innerHTML;
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print QR Code</title>
                        <style>
                            @page { size: auto; margin: 20mm; }
                            body { font-family: sans-serif; text-align: center; }
                            h1 { font-size: 24px; }
                            p { font-size: 14px; color: grey; }
                            canvas { width: 80% !important; height: auto !important; margin: 0 auto; }
                        </style>
                    </head>
                    <body>
                        <h1>${restaurant.name}</h1>
                        <h2>${table.name}</h2>
                        ${printContent}
                        <p>Scan to view the menu and order.</p>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { // Timeout necessary for some browsers
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`QR Code for ${table.name}`}>
            <div className="text-center">
                <div ref={qrCodeRef} className="p-4 inline-block bg-white">
                    <QRCodeCanvas value={url} size={256} />
                </div>
                <p className="mt-2 text-sm text-gray-500 break-all">
                    URL: <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a>
                </p>
                <div className="mt-6 flex justify-center gap-4">
                     <button onClick={handlePrint} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600">
                        Print
                    </button>
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// --- Main Table Management Component ---
const TableManagement: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => {
    const { tables, addTable, updateTable, deleteTable } = useTables();
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [qrTable, setQrTable] = useState<Table | null>(null);

    const handleOpenFormModal = (table: Table | null = null) => {
        setEditingTable(table);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEditingTable(null);
    };

    const handleSaveTable = (tableData: Omit<Table, 'id' | 'restaurantId'> | Table) => {
        if ('id' in tableData) {
            updateTable(tableData);
        } else {
            addTable(tableData);
        }
        handleCloseFormModal();
    };

    const handleDeleteTable = (tableId: string) => {
        // In a real app, you'd check if the table has active orders first.
        if (window.confirm('Are you sure you want to delete this table? This cannot be undone.')) {
            deleteTable(tableId);
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Manage Tables</h3>
                <button onClick={() => handleOpenFormModal()} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 flex items-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add Table
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Name</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tables.map(table => (
                            <tr key={table.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{table.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => setQrTable(table)} className="text-green-600 hover:text-green-900 font-semibold">Generate QR</button>
                                    <button onClick={() => handleOpenFormModal(table)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Edit</button>
                                    <button onClick={() => handleDeleteTable(table.id)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {tables.length === 0 && (
                             <tr>
                                <td colSpan={2} className="text-center py-10 text-gray-500">
                                    No tables created yet. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {isFormModalOpen && (
                 <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={editingTable ? 'Edit Table' : 'Add New Table'}>
                    <TableForm table={editingTable} onSave={handleSaveTable} onCancel={handleCloseFormModal} />
                </Modal>
            )}
            {qrTable && <QrCodeModal table={qrTable} restaurant={restaurant} onClose={() => setQrTable(null)} />}
        </div>
    );
};

export default TableManagement;
