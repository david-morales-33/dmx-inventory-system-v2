-- DMX System - Transactional Inventory & Commerce SQL Functions

-- Function 1: Atomic Purchase Receipt with Weighted Average Cost calculation
CREATE OR REPLACE FUNCTION receive_purchase(
  p_purchase_number TEXT,
  p_provider_id UUID,
  p_purchase_date TIMESTAMPTZ,
  p_subtotal NUMERIC,
  p_tax_total NUMERIC,
  p_discount_total NUMERIC,
  p_total NUMERIC,
  p_notes TEXT,
  p_created_by UUID,
  p_items JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase_id UUID;
  v_item RECORD;
  v_product_id UUID;
  v_qty NUMERIC;
  v_unit_cost NUMERIC;
  v_line_discount NUMERIC;
  v_line_total NUMERIC;
  v_current_stock NUMERIC;
  v_current_avg_cost NUMERIC;
  v_new_avg_cost NUMERIC;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_purchase_id FROM purchases WHERE idempotency_key = p_idempotency_key;
    IF v_purchase_id IS NOT NULL THEN
      RETURN v_purchase_id;
    END IF;
  END IF;

  -- Insert purchase header
  INSERT INTO purchases (
    purchase_number, provider_id, status, purchase_date,
    subtotal, tax_total, discount_total, total, notes,
    created_by, received_at, idempotency_key
  ) VALUES (
    p_purchase_number, p_provider_id, 'received', p_purchase_date,
    p_subtotal, p_tax_total, p_discount_total, p_total, p_notes,
    p_created_by, timezone('America/Bogota', now()), p_idempotency_key
  ) RETURNING id INTO v_purchase_id;

  -- Process line items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, quantity NUMERIC, unit_cost NUMERIC, line_discount NUMERIC, line_total NUMERIC
  )
  LOOP
    v_product_id := v_item.product_id;
    v_qty := v_item.quantity;
    v_unit_cost := v_item.unit_cost;
    v_line_discount := COALESCE(v_item.line_discount, 0);
    v_line_total := v_item.line_total;

    -- Lock product row for atomic update
    SELECT stock_quantity, cost_average 
    INTO v_current_stock, v_current_avg_cost
    FROM products 
    WHERE id = v_product_id 
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto con ID % no encontrado', v_product_id;
    END IF;

    -- Weighted average cost calculation
    -- nuevo_costo_promedio = ((s * a) + (q * c)) / (s + q)
    IF (v_current_stock + v_qty) > 0 THEN
      IF v_current_stock <= 0 THEN
        v_new_avg_cost := v_unit_cost;
      ELSE
        v_new_avg_cost := ((v_current_stock * v_current_avg_cost) + (v_qty * v_unit_cost)) / (v_current_stock + v_qty);
      END IF;
    ELSE
      v_new_avg_cost := v_unit_cost;
    END IF;

    -- Update product stock and average cost
    UPDATE products 
    SET stock_quantity = stock_quantity + v_qty,
        cost_average = ROUND(v_new_avg_cost, 2),
        updated_at = timezone('America/Bogota', now())
    WHERE id = v_product_id;

    -- Update provider_products last purchase cost
    UPDATE provider_products
    SET last_purchase_cost = v_unit_cost
    WHERE provider_id = p_provider_id AND product_id = v_product_id;

    -- Insert purchase item
    INSERT INTO purchase_items (
      purchase_id, product_id, quantity, unit_cost, line_discount, line_total
    ) VALUES (
      v_purchase_id, v_product_id, v_qty, v_unit_cost, v_line_discount, v_line_total
    );

    -- Insert immutable inventory movement
    INSERT INTO inventory_movements (
      product_id, movement_type, quantity_delta, unit_cost,
      reference_type, reference_id, reason, created_by
    ) VALUES (
      v_product_id, 'purchase_receipt', v_qty, v_unit_cost,
      'purchase', v_purchase_id::text, 'Recepción de compra ' || p_purchase_number, p_created_by
    );
  END LOOP;

  RETURN v_purchase_id;
END;
$$;

-- Function 2: Atomic Sale Processing with Stock Lock & Cost Snapshot
CREATE OR REPLACE FUNCTION process_sale(
  p_sale_number TEXT,
  p_sale_date TIMESTAMPTZ,
  p_customer_name TEXT,
  p_payment_method TEXT,
  p_subtotal NUMERIC,
  p_discount_total NUMERIC,
  p_tax_total NUMERIC,
  p_total NUMERIC,
  p_notes TEXT,
  p_created_by UUID,
  p_items JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id UUID;
  v_item RECORD;
  v_product_id UUID;
  v_qty NUMERIC;
  v_unit_price NUMERIC;
  v_line_discount NUMERIC;
  v_line_total NUMERIC;
  v_current_stock NUMERIC;
  v_current_avg_cost NUMERIC;
  v_is_active BOOLEAN;
  v_product_name TEXT;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_sale_id FROM sales WHERE idempotency_key = p_idempotency_key;
    IF v_sale_id IS NOT NULL THEN
      RETURN v_sale_id;
    END IF;
  END IF;

  -- Insert sale header
  INSERT INTO sales (
    sale_number, status, sale_date, customer_name, payment_method,
    subtotal, discount_total, tax_total, total, notes,
    created_by, completed_at, idempotency_key
  ) VALUES (
    p_sale_number, 'completed', p_sale_date, p_customer_name, p_payment_method,
    p_subtotal, p_discount_total, p_tax_total, p_total, p_notes,
    p_created_by, timezone('America/Bogota', now()), p_idempotency_key
  ) RETURNING id INTO v_sale_id;

  -- Process line items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, quantity NUMERIC, unit_price NUMERIC, line_discount NUMERIC, line_total NUMERIC
  )
  LOOP
    v_product_id := v_item.product_id;
    v_qty := v_item.quantity;
    v_unit_price := v_item.unit_price;
    v_line_discount := COALESCE(v_item.line_discount, 0);
    v_line_total := v_item.line_total;

    -- Lock product row for concurrency safety
    SELECT name, is_active, stock_quantity, cost_average 
    INTO v_product_name, v_is_active, v_current_stock, v_current_avg_cost
    FROM products 
    WHERE id = v_product_id 
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto con ID % no encontrado', v_product_id;
    END IF;

    IF NOT v_is_active THEN
      RAISE EXCEPTION 'El producto % no está activo para la venta', v_product_name;
    END IF;

    -- Strict stock verification: No negative stock allowed
    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %', 
        v_product_name, v_current_stock, v_qty;
    END IF;

    -- Decrement stock atomically
    UPDATE products 
    SET stock_quantity = stock_quantity - v_qty,
        updated_at = timezone('America/Bogota', now())
    WHERE id = v_product_id;

    -- Insert sale item with cost snapshot for true historical gross margin
    INSERT INTO sale_items (
      sale_id, product_id, quantity, unit_price, unit_cost_snapshot, line_discount, line_total
    ) VALUES (
      v_sale_id, v_product_id, v_qty, v_unit_price, v_current_avg_cost, v_line_discount, v_line_total
    );

    -- Insert immutable inventory movement (negative delta)
    INSERT INTO inventory_movements (
      product_id, movement_type, quantity_delta, unit_cost,
      reference_type, reference_id, reason, created_by
    ) VALUES (
      v_product_id, 'sale', -v_qty, v_current_avg_cost,
      'sale', v_sale_id::text, 'Venta ' || p_sale_number, p_created_by
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$;

-- Function 3: Formal Stock Adjustment
CREATE OR REPLACE FUNCTION adjust_stock(
  p_product_id UUID,
  p_new_quantity NUMERIC,
  p_reason TEXT,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock NUMERIC;
  v_cost_average NUMERIC;
  v_delta NUMERIC;
  v_movement_type TEXT;
BEGIN
  IF p_new_quantity < 0 THEN
    RAISE EXCEPTION 'La nueva cantidad no puede ser negativa';
  END IF;

  SELECT stock_quantity, cost_average 
  INTO v_current_stock, v_cost_average
  FROM products 
  WHERE id = p_product_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  v_delta := p_new_quantity - v_current_stock;
  IF v_delta = 0 THEN
    RETURN;
  END IF;

  v_movement_type := CASE WHEN v_delta > 0 THEN 'adjustment_in' ELSE 'adjustment_out' END;

  UPDATE products 
  SET stock_quantity = p_new_quantity,
      updated_at = timezone('America/Bogota', now())
  WHERE id = p_product_id;

  INSERT INTO inventory_movements (
    product_id, movement_type, quantity_delta, unit_cost,
    reference_type, reference_id, reason, created_by
  ) VALUES (
    p_product_id, v_movement_type, v_delta, v_cost_average,
    'adjustment', gen_random_uuid()::text, p_reason, p_created_by
  );
END;
$$;
