export enum OrderStatus {
  Received = 'Received',
  InProgress = 'In Progress',
  Ready = 'Ready',
  Served = 'Served',
  Cancelled = 'Cancelled'
}

export interface Restaurant {
    id: string;
    name: string;
    description: string;
}

export interface MenuItem {
  id: string;
  name:string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  tags: string[];
  restaurantId: string;
}

export interface Category {
  id: string;
  name: string;
  restaurantId: string;
  parentId: string | null;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  id:string;
  tableId: string;
  items: CartItem[];
  status: OrderStatus;
  timestamp: number;
  total: number;
  restaurantId: string;
  userId?: string;
}

export interface Table {
  id: string;
  name: string;
  restaurantId: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Should be hashed in a real app
    loyaltyPoints?: number;
    role: 'Customer' | 'RestaurantAdmin';
    managedRestaurantIds?: string[];
}

export interface Review {
  id: string;
  menuItemId: string;
  restaurantId: string;
  rating: number; // 1-5
  comment: string;
  userId: string;
  timestamp: number;
}

export type View = 'LANDING' | 'CUSTOMER' | 'KITCHEN' | 'ADMIN';

export type CustomerView = 'WELCOME' | 'AUTH' | 'MENU' | 'CART' | 'ORDERS';

export type AdminView = 'DASHBOARD' | 'MENU' | 'ORDERS' | 'REPORTS' | 'STAFF' | 'SETTINGS' | 'KDS' | 'TABLES';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}
