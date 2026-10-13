-- DMX System - Initial Database Schema Migration
-- Timezone: America/Bogota | Currency: COP

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Administrador DMX',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 2. Business Settings Table (Single row per establishment)
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'DMX System',
  currency_code TEXT NOT NULL DEFAULT 'COP',
  timezone TEXT NOT NULL DEFAULT 'America/Bogota',
  default_warning_threshold INTEGER NOT NULL DEFAULT 5,
  default_critical_threshold INTEGER NOT NULL DEFAULT 2,
  phone TEXT,
  email TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  unit TEXT NOT NULL DEFAULT 'unidad',
  cost_average NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cost_average >= 0),
  sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (sale_price >= 0),
  stock_quantity NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (stock_quantity >= 0),
  warning_threshold INTEGER DEFAULT 5 CHECK (warning_threshold >= 0),
  critical_threshold INTEGER DEFAULT 2 CHECK (critical_threshold >= 0 AND critical_threshold <= warning_threshold),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 5. Providers Table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 6. Provider-Products Association Table
CREATE TABLE IF NOT EXISTS provider_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  provider_sku TEXT,
  last_purchase_cost NUMERIC(15, 2) CHECK (last_purchase_cost >= 0),
  notes TEXT,
  UNIQUE(provider_id, product_id)
);

-- 7. Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number TEXT NOT NULL UNIQUE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('draft', 'received', 'cancelled')),
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
  total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  received_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE
);

-- 8. Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 2) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
  line_discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (line_discount >= 0),
  line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0)
);

-- 9. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  customer_name TEXT,
  payment_method TEXT NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
  tax_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
  total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  completed_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE
);

-- 10. Sale Items Table (Preserving unit_cost_snapshot for accurate gross margin calculation)
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  unit_cost_snapshot NUMERIC(15, 2) NOT NULL CHECK (unit_cost_snapshot >= 0),
  line_discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (line_discount >= 0),
  line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0)
);

-- 11. Immutable Inventory Movements Table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'purchase_receipt', 'sale', 'customer_return', 'supplier_return', 
    'adjustment_in', 'adjustment_out', 'initial_inventory', 'reversal'
  )),
  quantity_delta NUMERIC(15, 2) NOT NULL,
  unit_cost NUMERIC(15, 2) CHECK (unit_cost >= 0),
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  idempotency_key TEXT
);

-- 12. General Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  expense_date TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  provider_name TEXT,
  payment_method TEXT DEFAULT 'efectivo',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at);
