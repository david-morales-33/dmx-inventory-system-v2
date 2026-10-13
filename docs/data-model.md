# DMX System — Modelo de Datos Relacional

## Entidades Principales

1. **`business_settings`**:
   - `id`: UUID (PK)
   - `business_name`: Text
   - `currency_code`: 'COP'
   - `timezone`: 'America/Bogota'
   - `default_warning_threshold`: Integer (default 5)
   - `default_critical_threshold`: Integer (default 2)

2. **`categories`**:
   - `id`: UUID (PK)
   - `name`: Text
   - `normalized_name`: Text (Unique, lowercase, sin acentos)
   - `description`: Text
   - `is_active`: Boolean

3. **`products`**:
   - `id`: UUID (PK)
   - `sku`: Text (Unique)
   - `name`: Text
   - `description`: Text
   - `category_id`: UUID (FK categories)
   - `unit`: Text (default 'unidad')
   - `cost_average`: Numeric(15,2)
   - `sale_price`: Numeric(15,2)
   - `stock_quantity`: Numeric(15,2) (Saldo materializado actualizado por transacciones)
   - `warning_threshold`: Integer
   - `critical_threshold`: Integer
   - `is_active`: Boolean

4. **`providers` & `provider_products`**:
   - Proveedores con datos de contacto (NIT, teléfono, email) y relación M:N con productos suministrados (`last_purchase_cost`).

5. **`purchases` & `purchase_items`**:
   - Cabecera y líneas de abastecimiento.

6. **`sales` & `sale_items`**:
   - Cabecera y líneas de venta con `unit_cost_snapshot` para cálculo de margen bruto verídico.

7. **`inventory_movements`**:
   - `id`: UUID (PK)
   - `product_id`: UUID (FK products)
   - `movement_type`: 'purchase_receipt', 'sale', 'adjustment_in', 'adjustment_out', 'initial_inventory', 'reversal'
   - `quantity_delta`: Numeric(15,2)
   - `unit_cost`: Numeric(15,2)
   - `reference_type`: Text
   - `reference_id`: Text
   - `reason`: Text

8. **`expenses`**:
   - Egresos operativos que no afectan inventario.
