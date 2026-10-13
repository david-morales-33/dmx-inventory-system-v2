# DMX System — Seguridad y Control de Acceso

## 1. Principio de Mínimo Privilegio
- El frontend no almacena ni expone claves `service_role` ni secretos de servidor.
- Las variables públicas usan `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## 2. Row Level Security (RLS)
- RLS se encuentra activado en el 100% de las tablas.
- Los movimientos de inventario (`inventory_movements`) y auditoría son inmutables: no poseen políticas de `UPDATE` ni `DELETE`.

## 3. Prevención de Inyecciones
- Consultas parametrizadas en PostgreSQL / Supabase SDK.
- Exportaciones CSV escapan caracteres de inyección de fórmulas (`=`, `+`, `-`, `@`).

## 4. Concurrencia y Bloqueos
- Las funciones SQL (`receive_purchase` y `process_sale`) utilizan bloqueos `FOR UPDATE` sobre los productos involucrados en la transacción, impidiendo que dos ventas simultáneas dejen el stock en negativo.
