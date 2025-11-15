import React, { useState, useMemo } from 'react';
import type { MenuItem as MenuItemType, Category } from '../../types';
import { useMenu } from '../../contexts/MenuContext';
import Modal from '../../components/Modal';

// --- Confirmation Modal ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <p className="text-lg text-gray-700 mb-6">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
                <button onClick={onConfirm} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">
                    Delete
                </button>
            </div>
        </div>
    </Modal>
);

// --- Category Form Component ---
interface CategoryFormProps {
    category?: Category | null;
    allCategories: Category[];
    onSave: (category: Omit<Category, 'id' | 'restaurantId'> | Category) => void;
    onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, allCategories, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        parentId: category?.parentId || null,
    });

    const potentialParents = useMemo(() => {
        // A category cannot be its own parent or a child of its own descendants.
        // For simplicity, we just prevent making it a child of itself.
        return allCategories.filter(c => c.id !== category?.id);
    }, [allCategories, category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === 'null' ? null : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (category) {
            onSave({ ...formData, id: category.id, restaurantId: category.restaurantId });
        } else {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"/>
            </div>
            <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Parent Category</label>
                <select name="parentId" id="parentId" value={formData.parentId || 'null'} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                    <option value="null">None (Top-level category)</option>
                    {potentialParents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600">Save Category</button>
            </div>
        </form>
    );
};


// --- Menu Item Form Component ---
interface MenuItemFormProps {
    item?: MenuItemType | null;
    categories: Category[];
    onSave: (item: Omit<MenuItemType, 'id' | 'restaurantId'> | MenuItemType) => void;
    onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ item, categories, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price || 0,
        categoryId: item?.categoryId || (categories.length > 0 ? categories[0].id : ''),
        image: item?.image || 'https://via.placeholder.com/400x300.png?text=No+Image',
    });

    const categoryOptions = useMemo(() => {
        interface CategoryNode extends Category {
            children: CategoryNode[];
        }
        const categoryMap = new Map<string, CategoryNode>(categories.map(c => [c.id, { ...c, children: [] }]));
        const tree: CategoryNode[] = [];
        categories.forEach(c => {
            const node = categoryMap.get(c.id);
            if (!node) return;

            if (c.parentId && categoryMap.has(c.parentId)) {
                const parent = categoryMap.get(c.parentId);
                if (parent) {
                    parent.children.push(node);
                }
            } else if (!c.parentId) {
                tree.push(node);
            }
        });

        const options: React.ReactElement[] = [];
        const buildOptions = (nodes: CategoryNode[], level = 0) => {
            nodes.forEach(node => {
                options.push(<option key={node.id} value={node.id}>{'--'.repeat(level)} {node.name}</option>);
                if (node.children.length > 0) {
                    buildOptions(node.children, level + 1);
                }
            });
        };
        buildOptions(tree);
        return options;
    }, [categories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId) {
            alert("Please create a category first before adding an item.");
            return;
        }
        const dataToSave = { ...formData, tags: [] };
        if (item) {
            onSave({ ...dataToSave, id: item.id, restaurantId: item.restaurantId });
        } else {
            onSave(dataToSave);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                    <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Item Image</label>
                    <div className="mt-2 flex items-center gap-4">
                        <img src={formData.image} alt="Preview" className="h-24 w-24 rounded-lg object-cover bg-gray-100 shadow-inner"/>
                        <div className="w-full">
                             <label htmlFor="image-upload" className="sr-only">Upload file</label>
                             <input 
                                type="file"
                                id="image-upload"
                                name="image-upload"
                                accept="image/png, image/jpeg, image/webp" 
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, or WEBP. Recommended: 400x300px.</p>
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
                    <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm">
                        {categoryOptions.length === 0 ? <option value="" disabled>Please add a category first</option> : categoryOptions}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600">Save Item</button>
                </div>
            </div>
        </form>
    );
};

// --- Main Menu Builder Component ---
const MenuBuilder: React.FC = () => {
    const { menuItems, categories, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, updateCategory, deleteCategory } = useMenu();
    
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'item' | 'category'; id: string; name: string; } | null>(null);


    const handleOpenItemModal = (item: MenuItemType | null = null) => {
        setEditingItem(item);
        setIsItemModalOpen(true);
    };

    const handleCloseItemModal = () => {
        setIsItemModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveItem = (itemData: Omit<MenuItemType, 'id' | 'restaurantId'> | MenuItemType) => {
        if ('id' in itemData) {
            updateMenuItem(itemData as MenuItemType);
        } else {
            addMenuItem(itemData as Omit<MenuItemType, 'id' | 'restaurantId'>);
        }
        handleCloseItemModal();
    };

    const handleDeleteRequest = (type: 'item' | 'category', target: MenuItemType | Category) => {
        if (type === 'category') {
            const hasChildren = categories.some(c => c.parentId === target.id);
            const hasItems = menuItems.some(i => i.categoryId === target.id);
            if (hasChildren || hasItems) {
                alert('Cannot delete category. Please move or delete sub-categories and menu items first.');
                return;
            }
        }
        setDeleteTarget({ type, id: target.id, name: target.name });
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDeletion = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'item') {
            deleteMenuItem(deleteTarget.id);
        } else if (deleteTarget.type === 'category') {
            deleteCategory(deleteTarget.id);
        }

        setIsConfirmModalOpen(false);
        setDeleteTarget(null);
    };

    const handleOpenCategoryModal = (category: Category | null = null) => {
        setEditingCategory(category);
        setIsCategoryModalOpen(true);
    };

    const handleCloseCategoryModal = () => {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
    };
    
    const handleSaveCategory = (categoryData: Omit<Category, 'id' | 'restaurantId'> | Category) => {
        if ('id' in categoryData) {
            updateCategory(categoryData as Category);
        } else {
            addCategory(categoryData as Omit<Category, 'id' | 'restaurantId'>);
        }
        handleCloseCategoryModal();
    };

    const categoryTree = useMemo(() => {
        const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, children: [] }]));
        const tree: any[] = [];
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

    const CategoryTreeItem: React.FC<{node: any, level: number}> = ({ node, level }) => (
        <div className={`ml-${level * 6}`}>
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <span className="font-medium text-gray-800">{node.name}</span>
                <div className="space-x-2">
                    <button onClick={() => handleOpenCategoryModal(node)} className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm">Edit</button>
                    <button onClick={() => handleDeleteRequest('category', node)} className="text-red-600 hover:text-red-900 font-semibold text-sm">Delete</button>
                </div>
            </div>
            {node.children.length > 0 && (
                <div className="border-l-2 border-gray-200 pl-2">
                    {node.children.map((child: any) => <CategoryTreeItem key={child.id} node={child} level={level + 1} />)}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Category Management */}
            <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Manage Categories</h3>
                    <button onClick={() => handleOpenCategoryModal()} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Add Category
                    </button>
                </div>
                <div className="space-y-1">
                    {categoryTree.map(node => <CategoryTreeItem key={node.id} node={node} level={0} />)}
                     {categories.length === 0 && <p className="text-gray-500 text-center py-4">No categories created yet. Add one to get started!</p>}
                </div>
            </div>

            {/* Item Management */}
            <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Manage Menu Items</h3>
                    <button onClick={() => handleOpenItemModal()} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 flex items-center shadow-md" disabled={categories.length === 0}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Add New Item
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {menuItems.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={item.image} alt={item.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categories.find(c => c.id === item.categoryId)?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenItemModal(item)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Edit</button>
                                        <button onClick={() => handleDeleteRequest('item', item)} className="text-red-600 hover:text-red-900 font-semibold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                              {menuItems.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">
                                        {categories.length === 0 ? "Create a category before adding menu items." : "No menu items yet. Add one!"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isItemModalOpen} onClose={handleCloseItemModal} title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}>
                <MenuItemForm item={editingItem} categories={categories} onSave={handleSaveItem} onCancel={handleCloseItemModal} />
            </Modal>
            <Modal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} title={editingCategory ? 'Edit Category' : 'Add New Category'}>
                <CategoryForm category={editingCategory} allCategories={categories} onSave={handleSaveCategory} onCancel={handleCloseCategoryModal} />
            </Modal>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDeletion}
                title={`Delete ${deleteTarget?.type}`}
                message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default MenuBuilder;