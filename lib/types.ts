export type Role = 'OWNER' | 'MANAGER' | 'STAFF';

export type ProductStatus =
  | 'AVAILABLE'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'SOLD_OUT'
  | 'CLEARANCE'
  | 'INACTIVE';

export type Condition = 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'POS' | 'OTHER';

export type ExpenseCategory =
  | 'TRANSPORT'
  | 'RENT'
  | 'ELECTRICITY'
  | 'PACKAGING'
  | 'STAFF'
  | 'MARKETING'
  | 'MARKET_EXPENSE'
  | 'OTHER';

export type MovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'DAMAGE'
  | 'ADJUSTMENT'
  | 'CLEARANCE';

export type PlanStatus = 'DRAFT' | 'READY' | 'COMPLETED';

export type SocialPlatform = 'WHATSAPP' | 'INSTAGRAM';

export type SocialPostStatus = 'DRAFT' | 'READY' | 'POSTED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: string;
  name: string;
  phone: string;
  address: string;
  logo?: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId?: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  description?: string | null;
  size: string;
  gender: string;
  condition: Condition;
  brand?: string | null;
  color?: string | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  status: ProductStatus;
  dateAdded: string;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];
  primaryImageUrl?: string;
  daysInStock?: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  market: string;
  notes?: string | null;
  batchCount?: number;
  totalSuppliedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseBatchId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseBatch {
  id: string;
  batchNumber: string;
  supplierId?: string | null;
  supplierName?: string;
  market?: string;
  purchaseDate: string;
  purchaseAmount: number;
  transportCost: number;
  otherCosts: number;
  totalCost: number;
  notes?: string | null;
  createdById: string;
  createdByName?: string;
  itemCount?: number;
  totalPieces?: number;
  items?: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  totalPurchases?: number;
  totalSpent?: number;
  lastPurchaseDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitSellingPrice: number;
  unitCostPrice: number;
  discount: number;
  totalAmount: number;
  profit: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  saleDate: string;
  soldById: string;
  soldByName?: string;
  notes?: string | null;
  items?: SaleItem[];
  createdAt: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  type: MovementType;
  quantity: number;
  referenceId?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string;
  createdAt: string;
}

export interface PurchasingPlanItem {
  id: string;
  planId: string;
  categoryId: string;
  categoryName?: string;
  currentStock: number;
  averageWeeklySales: number;
  recommendedQuantity: number;
  actualQuantityPurchased: number;
  notes?: string | null;
}

export interface PurchasingPlan {
  id: string;
  planDate: string;
  status: PlanStatus;
  items?: PurchasingPlanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  productId: string;
  productName?: string;
  productPrice?: number;
  productSize?: string;
  productCondition?: string;
  platform: SocialPlatform;
  caption: string;
  imageUrl?: string | null;
  status: SocialPostStatus;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
  createdAt: string;
}

// Cart item for Sales POS
export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}
