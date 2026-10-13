-- DMX System - Development Seed Data
-- Currency: COP | Establishment: DMX System

-- 1. Initial Business Settings
INSERT INTO business_settings (id, business_name, currency_code, timezone, default_warning_threshold, default_critical_threshold)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'DMX System',
  'COP',
  'America/Bogota',
  5,
  2
) ON CONFLICT DO NOTHING;

-- 2. Categories
INSERT INTO categories (id, name, normalized_name, description, is_active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Iluminación DMX', 'iluminacion dmx', 'Luces robóticas, cabezas móviles, barras LED', true),
  ('11111111-1111-1111-1111-111111111102', 'Controladores & Interfaces', 'controladores interfaces', 'Consolas DMX, splitters, interfaces USB/ArtNet', true),
  ('11111111-1111-1111-1111-111111111103', 'Cables & Conectores', 'cables conectores', 'Cables XLR de 3 y 5 pines, terminadores DMX', true),
  ('11111111-1111-1111-1111-111111111104', 'Efectos Especiales', 'efectos especiales', 'Máquinas de humo, niebla, confeti y líquidos', true)
ON CONFLICT DO NOTHING;

-- 3. Providers
INSERT INTO providers (id, name, tax_id, contact_name, phone, email, address, is_active) VALUES
  ('22222222-2222-2222-2222-222222222201', 'ProLight Colombia S.A.S.', '900876543-1', 'Carlos Mendoza', '+57 310 456 7890', 'contacto@prolight.co', 'Cra 15 # 85-30, Bogotá', true),
  ('22222222-2222-2222-2222-222222222202', 'Audio & Show Distribuciones', '901234567-8', 'Mariana Ospina', '+57 320 987 6543', 'ventas@audioshow.co', 'Calle 53 # 24-18, Medellín', true)
ON CONFLICT DO NOTHING;

-- 4. Products (With real initial average costs and sale prices in COP)
INSERT INTO products (id, sku, name, description, category_id, unit, cost_average, sale_price, stock_quantity, warning_threshold, critical_threshold, is_active) VALUES
  ('33333333-3333-3333-3333-333333333301', 'DMX-LED-BEAM7R', 'Cabeza Móvil Beam 7R 230W', 'Luz robótica de alta potencia con rueda de 14 colores y 17 gobos', '11111111-1111-1111-1111-111111111101', 'unidad', 980000, 1450000, 8, 4, 1, true),
  ('33333333-3333-3333-3333-333333333302', 'DMX-PAR-54X3', 'Foco Par LED 54x3W RGBW', 'Foco wash profesional para escenarios y eventos', '11111111-1111-1111-1111-111111111101', 'unidad', 165000, 260000, 18, 6, 2, true),
  ('33333333-3333-3333-3333-333333333303', 'DMX-CTRL-512', 'Consola Controladora DMX 512 Canales', 'Consola estándar para control de luminarias y escenas', '11111111-1111-1111-1111-111111111102', 'unidad', 320000, 490000, 4, 5, 2, true),
  ('33333333-3333-3333-3333-333333333304', 'DMX-CBL-10M', 'Cable DMX XLR 3 Pines 10 Metros', 'Cable blindado 110 ohms de alta fidelidad', '11111111-1111-1111-1111-111111111103', 'unidad', 28000, 45000, 32, 10, 4, true),
  ('33333333-3333-3333-3333-333333333305', 'DMX-FOG-1500', 'Máquina de Humo 1500W DMX', 'Calentador rápido con control DMX e inalámbrico', '11111111-1111-1111-1111-111111111104', 'unidad', 290000, 440000, 2, 4, 2, true)
ON CONFLICT DO NOTHING;

-- 5. Link Provider Products
INSERT INTO provider_products (provider_id, product_id, provider_sku, last_purchase_cost) VALUES
  ('22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', 'PL-BEAM-7R', 980000),
  ('22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333302', 'PL-PAR-54', 165000),
  ('22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333303', 'AS-CTRL-512', 320000),
  ('22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333304', 'AS-CBL-10M', 28000),
  ('22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333305', 'AS-FOG-1500', 290000)
ON CONFLICT DO NOTHING;
