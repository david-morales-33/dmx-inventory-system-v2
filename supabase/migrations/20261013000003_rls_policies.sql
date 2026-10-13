-- DMX System - Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can view and edit their own profile
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Business Settings: Authenticated users can view and update settings
CREATE POLICY "Authenticated users can read business settings" 
ON business_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update business settings" 
ON business_settings FOR UPDATE TO authenticated USING (true);

-- 3. Categories: Authenticated users full access
CREATE POLICY "Authenticated users can read categories" 
ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert categories" 
ON categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories" 
ON categories FOR UPDATE TO authenticated USING (true);

-- 4. Products: Authenticated users full access
CREATE POLICY "Authenticated users can read products" 
ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert products" 
ON products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON products FOR UPDATE TO authenticated USING (true);

-- 5. Providers & Provider Products
CREATE POLICY "Authenticated users can read providers" 
ON providers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can modify providers" 
ON providers FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage provider products" 
ON provider_products FOR ALL TO authenticated USING (true);

-- 6. Purchases & Purchase Items
CREATE POLICY "Authenticated users can read purchases" 
ON purchases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert purchases" 
ON purchases FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read purchase items" 
ON purchase_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert purchase items" 
ON purchase_items FOR INSERT TO authenticated WITH CHECK (true);

-- 7. Sales & Sale Items
CREATE POLICY "Authenticated users can read sales" 
ON sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales" 
ON sales FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read sale items" 
ON sale_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sale items" 
ON sale_items FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Immutable Inventory Movements: Insert and Read only
CREATE POLICY "Authenticated users can read movements" 
ON inventory_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert movements" 
ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Disallow UPDATE and DELETE on inventory_movements (Immutability guarantee)
-- No UPDATE or DELETE policy granted.

-- 9. Expenses
CREATE POLICY "Authenticated users can manage expenses" 
ON expenses FOR ALL TO authenticated USING (true);

-- 10. Audit Logs
CREATE POLICY "Authenticated users can read audit logs" 
ON audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Server can insert audit logs" 
ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
