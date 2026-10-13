# DMX System — Arquitectura del Sistema

## 1. Visión General
DMX System es un sistema de gestión comercial e inventario diseñado para un único establecimiento y usuario principal con acceso multiplataforma (computador, tablet y móvil).

## 2. Decisiones de Alcance
- **Módulo E-commerce**: Excluido por requerimiento expreso del usuario para centrar el 100% de la capacidad operativa en ERP, inventario, compras, ventas, gastos y proyecciones.
- **Moneda oficial**: COP (Pesos Colombianos) con formateo regional (`Intl.NumberFormat('es-CO')`).
- **Zona Horaria**: `America/Bogota`.

## 3. Principios de Persistencia y Transaccionalidad
- **Una Sola Fuente de Verdad**: La base de datos relacional (PostgreSQL en Supabase) es la autoridad sobre los saldos.
- **Stock Negativo Bloqueado**: Las ventas no permiten dejar inventario en negativo. Si la demanda acumulada de un pedido supera el stock disponible en bodega, la venta se rechaza atómicamente.
- **Costo Promedio Ponderado**:
  Al recibir una compra:
  `nuevo_costo_promedio = ((stock_anterior * costo_anterior) + (cantidad_comprada * costo_compra)) / (stock_total)`
- **Snapshot de Costo en Ventas**:
  Cada línea de venta almacena `unit_cost_snapshot`. Esto preserva el cálculo verídico de la utilidad bruta histórica aún si el costo promedio del producto varía en el futuro.
- **Inmutabilidad de Movimientos**:
  La tabla `inventory_movements` es de solo lectura e inserción (`INSERT` y `SELECT`). Las correcciones se realizan con movimientos compensatorios de reversión.
