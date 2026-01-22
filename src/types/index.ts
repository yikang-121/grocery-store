// src/types/index.ts

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  isPerishable: boolean;
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBatch {
  id: number;
  productId: number;
  quantity: number;
  expiryDate?: string;
  batchNumber: string;
  createdAt: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  batchId?: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface Address {
  id: number;
  label: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal: string;
  isDefault: boolean;
  userId?: number;
}

export interface SpoilageLog {
  id: number;
  productId: number;
  batchId: number;
  quantity: number;
  reason: 'EXPIRED' | 'DAMAGED' | 'SPOILED';
  notes?: string;
  loggedAt: string;
}

export interface RestockAlert {
  id: number;
  productId: number;
  product: Product;
  currentStock: number;
  suggestedRestock: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export interface ProductWithInventory extends Product {
  totalStock: number;
  batches: InventoryBatch[];
  nearestExpiry?: string;
}