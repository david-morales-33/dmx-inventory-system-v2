# DMX System — Procedimiento de Respaldo y Restauración

## 1. Exportación Completa
- **Formato JSON Estructurado**: Desde la sección *Configuración* -> *Respaldo & Exportación Completa*, el usuario puede descargar un archivo JSON con todas las tablas:
  - Configuración del negocio
  - Categorías y Productos
  - Proveedores y Asociaciones
  - Compras y Líneas
  - Ventas y Líneas
  - Gastos Operativos
  - Movimientos Inmutables de Inventario
- **Formato CSV por Módulo**: Desde la sección *Reportes*, se pueden exportar reportes tabulares protegidos contra inyecciones de fórmulas.

## 2. Restauración
- En caso de contingencia o cambio de dispositivo sin conexión a Supabase, se puede cargar el archivo `.json` desde el botón "Restaurar desde Archivo JSON".
- Para Supabase en la nube, se ejecutan las migraciones en `/supabase/migrations/` seguidas del comando `psql` o importador SQL.
