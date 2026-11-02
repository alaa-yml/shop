export interface Product {
  id: string;
  barcode: string;
  name: string;
  nameAr?: string;
  brand: string;
  category: string;
  price: number; // in Algerian Dinars (DA)
  unit: string;
  imageUrl?: string;
  origin?: string;
  isCustom?: boolean;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  customPrice?: number;
  addedAt: number;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  cashTendered?: number;
  changeDue?: number;
}

export type ActiveTab = 'scanner' | 'calculator' | 'catalog' | 'history';
