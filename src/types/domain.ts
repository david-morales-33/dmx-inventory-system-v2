export type StockAlertStatus = "normal" | "warning" | "critical";

export interface Category {
  id: string;
  name: string;
  normalized_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  unit: string;
  cost_average: number;
  sale_price: number;
  stock_quantity: number;
  warning_threshold?: number;
  critical_threshold?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  name: string;
  tax_id?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

export interface ProviderProduct {
  id: string;
  provider_id: string;
  product_id: string;
  provider_sku?: string;
  last_purchase_cost?: number;
  notes?: string;
}

export type PurchaseStatus = "draft" | "received" | "cancelled";

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
  line_discount: number;
  line_total: number;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  provider_id: string;
  provider_name?: string;
  status: PurchaseStatus;
  purchase_date: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  received_at?: string;
  items: PurchaseItem[];
}

export type SaleStatus = "completed" | "cancelled";
export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "otro";

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  unit_cost_snapshot: number;
  line_discount: number;
  line_total: number;
}

export interface Sale {
  id: string;
  sale_number: string;
  status: SaleStatus;
  sale_date: string;
  customer_name?: string;
  payment_method: PaymentMethod;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  completed_at?: string;
  items: SaleItem[];
}

export type MovementType = 
  | "purchase_receipt"
  | "sale"
  | "customer_return"
  | "supplier_return"
  | "adjustment_in"
  | "adjustment_out"
  | "initial_inventory"
  | "reversal";

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  movement_type: MovementType;
  quantity_delta: number;
  unit_cost?: number;
  reference_type: string;
  reference_id: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  provider_name?: string;
  payment_method?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  currency_code: string;
  timezone: string;
  default_warning_threshold: number;
  default_critical_threshold: number;
  phone?: string;
  email?: string;
  address?: string;
}

export interface KPISummary {
  periodSalesTotal: number;
  periodSalesCount: number;
  periodPurchasesTotal: number;
  periodPurchasesCount: number;
  periodExpensesTotal: number;
  periodGrossProfit: number;
  inventoryValueTotal: number;
  lowStockProductsCount: number;
  criticalStockProductsCount: number;
}
