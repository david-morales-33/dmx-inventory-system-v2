import React, { useState, useMemo } from "react";
import { 
  Boxes, 
  Search, 
  Plus, 
  Filter, 
  SlidersHorizontal, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Edit3, 
  TrendingUp,
  X,
  Tag,
  ArrowUpDown
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Product, Category, StockAlertStatus, InventoryMovement } from "@/src/types/domain";
import { formatCOP, formatDate, formatDateTime } from "@/src/lib/formatters/currency";
import { db } from "@/src/services/db";

interface InventoryViewProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
  onOpenNewProduct: () => void;
  onOpenNewCategory: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  onRefresh,
  onOpenNewProduct,
  onOpenNewCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [productMovements, setProductMovements] = useState<InventoryMovement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === "all" || p.category_id === selectedCategory;

      const status = db.getStockStatus(p);
      const matchesStatus = selectedStatus === "all" || status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Handle open adjust modal
  const handleOpenAdjust = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustQuantity(product.stock_quantity);
    setAdjustReason("");
    setErrorMsg(null);
  };

  // Submit stock adjustment
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (!adjustReason.trim()) {
      setErrorMsg("Debe especificar un motivo para el ajuste.");
      return;
    }
    if (adjustQuantity < 0) {
      setErrorMsg("La cantidad de stock no puede ser negativa.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await db.adjustStock(adjustingProduct.id, adjustQuantity, adjustReason);
      setAdjustingProduct(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al ajustar el inventario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle open movements modal
  const handleOpenHistory = async (product: Product) => {
    setHistoryProduct(product);
    const movs = await db.getMovements(product.id);
    setProductMovements(movs);
  };

  // Handle save edit master data
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setIsSubmitting(true);
      await db.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        description: editingProduct.description,
        category_id: editingProduct.category_id,
        sale_price: editingProduct.sale_price,
        warning_threshold: editingProduct.warning_threshold,
        critical_threshold: editingProduct.critical_threshold,
      });
      setEditingProduct(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Boxes}
        title="Catálogo & Inventario"
        description="Gestión física de productos, semáforo de existencias y trazabilidad de movimientos."
      >
        <button
          onClick={onOpenNewCategory}
          className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Tag className="w-4 h-4 text-slate-400" /> + Categoría
        </button>
        <button
          onClick={onOpenNewProduct}
          className="px-4 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por SKU o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#5D79DF]/20 focus:border-[#5D79DF] transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#5D79DF]/20"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Semáforo */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#5D79DF]/20"
          >
            <option value="all">Todos los estados</option>
            <option value="normal">Óptimo (Normal)</option>
            <option value="warning">Alerta (Bajo)</option>
            <option value="critical">Crítico / Agotado</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">Producto & SKU</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-center">Estado de Stock</th>
                <th className="py-3 px-4 text-right">Costo Promedio</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-right">Margen Bruto</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No se encontraron productos</p>
                    <p className="text-[11px] text-slate-600 mt-1">Prueba cambiando los filtros o registra uno nuevo.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const status = db.getStockStatus(p);
                  const marginAmount = p.sale_price - p.cost_average;
                  const marginPercent = p.sale_price > 0 ? (marginAmount / p.sale_price) * 100 : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product & SKU */}
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                        <p className="font-mono text-[11px] text-slate-600 font-semibold mt-0.5">{p.sku}</p>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-[11px]">
                          {p.category_name || "Sin categoría"}
                        </span>
                      </td>

                      {/* Stock Status Semaphore */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                              status === "critical"
                                ? "bg-rose-100 text-rose-700"
                                : status === "warning"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {status === "critical" && <AlertCircle className="w-3.5 h-3.5" />}
                            {status === "warning" && <AlertTriangle className="w-3.5 h-3.5" />}
                            {status === "normal" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {p.stock_quantity} {p.unit}s
                          </span>
                          <span className="text-[10px] text-slate-600 mt-0.5">
                            aviso: {p.warning_threshold} | crít: {p.critical_threshold}
                          </span>
                        </div>
                      </td>

                      {/* Cost Average */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {formatCOP(p.cost_average, false)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCOP(p.sale_price, false)}
                      </td>

                      {/* Gross Margin */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-slate-800">
                          {formatCOP(marginAmount, false)}
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-bold">
                          {marginPercent.toFixed(1)}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Ajuste formal de inventario"
                        >
                          Ajustar
                        </button>
                        <button
                          onClick={() => handleOpenHistory(p)}
                          className="p-1.5 text-slate-500 hover:text-[#5D79DF] hover:bg-[#5D79DF]/10 rounded-lg transition-colors"
                          title="Ver historial de movimientos"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar datos maestros"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Stock Adjustment */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#5D79DF]" />
                Ajuste Formal de Inventario
              </h2>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-xs font-bold text-slate-800">{adjustingProduct.name}</p>
                <p className="text-[11px] font-mono text-slate-500">SKU: {adjustingProduct.sku}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Stock actual registrado: <span className="font-bold text-slate-900">{adjustingProduct.stock_quantity}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nueva Existencia Física Real
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#5D79DF]/20 focus:border-[#5D79DF]"
                />
                <p className="text-[11px] text-slate-600 mt-1">
                  Diferencia: {adjustQuantity - adjustingProduct.stock_quantity >= 0 ? "+" : ""}
                  {adjustQuantity - adjustingProduct.stock_quantity} unidades
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo o Justificación Obligatoria
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej: Conteo físico mensual, producto dañado, merma..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5D79DF]/20 focus:border-[#5D79DF]"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Confirmar Ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: History of Movements */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#5D79DF]" />
                  Historial de Movimientos Inmutables
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {historyProduct.name} ({historyProduct.sku})
                </p>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {productMovements.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  No hay movimientos registrados para este artículo.
                </p>
              ) : (
                productMovements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block">{m.reason || m.movement_type}</span>
                      <span className="text-[11px] text-slate-400">{formatDateTime(m.created_at)}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold font-mono ${
                          m.quantity_delta > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                      </span>
                      {m.unit_cost && (
                        <p className="text-[10px] text-slate-600">Costo: {formatCOP(m.unit_cost, false)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Product Master Data */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Editar Datos Maestros
              </h2>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={editingProduct.category_id || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Precio de Venta (COP)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingProduct.sale_price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Umbral Aviso</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.warning_threshold ?? 5}
                    onChange={(e) => setEditingProduct({ ...editingProduct, warning_threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Umbral Crítico</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.critical_threshold ?? 2}
                    onChange={(e) => setEditingProduct({ ...editingProduct, critical_threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#5D79DF] text-white rounded-xl font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
