import React, { useState } from "react";
import { 
  ShoppingCart, 
  Plus, 
  DollarSign, 
  Building2, 
  Calendar, 
  Trash2, 
  Receipt,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Boxes
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Purchase, Provider, Product } from "@/src/types/domain";
import { formatCOP, formatDate } from "@/src/lib/formatters/currency";
import { db } from "@/src/services/db";

interface PurchasesViewProps {
  purchases: Purchase[];
  providers: Provider[];
  products: Product[];
  onRefresh: () => void;
  onOpenNewExpense: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  providers,
  products,
  onRefresh,
  onOpenNewExpense,
}) => {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  // Form state
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<
    { product_id: string; quantity: number; unit_cost: number; line_discount: number }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available products for the selected provider
  const availableProducts = products.filter(p => p.is_active);

  // Start new purchase form
  const handleOpenPurchaseModal = () => {
    setSelectedProviderId(providers[0]?.id || "");
    setPurchaseNotes("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setItems([{ product_id: products[0]?.id || "", quantity: 1, unit_cost: products[0]?.cost_average || 0, line_discount: 0 }]);
    setErrorMsg(null);
    setIsPurchaseModalOpen(true);
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      { product_id: products[0].id, quantity: 1, unit_cost: products[0].cost_average || 0, line_discount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // If product changed, update default unit cost
    if (field === "product_id") {
      const prod = products.find(p => p.id === value);
      if (prod) {
        current.unit_cost = prod.cost_average || 0;
      }
    }

    updated[index] = current;
    setItems(updated);
  };

  // Preliminary calculations for display
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unit_cost), 0);
  const totalDiscount = items.reduce((acc, it) => acc + (it.line_discount || 0), 0);
  const total = Math.max(0, subtotal - totalDiscount);

  // Submit atomic purchase
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId) {
      setErrorMsg("Debe seleccionar un proveedor.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Debe añadir al menos un producto.");
      return;
    }

    for (const it of items) {
      if (it.quantity <= 0) {
        setErrorMsg("Las cantidades deben ser mayores a 0.");
        return;
      }
      if (it.unit_cost < 0) {
        setErrorMsg("Los costos no pueden ser negativos.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await db.receivePurchase({
        provider_id: selectedProviderId,
        purchase_date: new Date(purchaseDate).toISOString(),
        items,
        notes: purchaseNotes,
      });
      setIsPurchaseModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with dual buttons */}
      <PageHeader
        icon={ShoppingCart}
        title="Compras & Abastecimiento"
        description="Recepción de mercancía con recálculo de costo promedio ponderado y egresos directos."
      >
        <button
          onClick={onOpenNewExpense}
          className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <DollarSign className="w-4 h-4 text-amber-500" /> + Gasto General
        </button>
        <button
          onClick={handleOpenPurchaseModal}
          className="px-4 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Comprar Artículos
        </button>
      </PageHeader>

      {/* Purchases List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">N° Compra</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-center">Ítems</th>
                <th className="py-3 px-4 text-right">Total Facturado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-5 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No hay compras registradas</p>
                    <p className="text-[11px] text-slate-600 mt-1">Registra tu primer abastecimiento para cargar existencias.</p>
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => {
                  const isExpanded = expandedPurchaseId === pur.id;
                  return (
                    <React.Fragment key={pur.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                          {pur.purchase_number}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {pur.provider_name || "Proveedor General"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatDate(pur.purchase_date)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {pur.items.length} artículos
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatCOP(pur.total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Recibida
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setExpandedPurchaseId(isExpanded ? null : pur.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable items breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                              <p className="font-bold text-xs text-slate-800">Desglose de Artículos Ingresados:</p>
                              <div className="divide-y divide-slate-100 text-xs">
                                {pur.items.map((it) => (
                                  <div key={it.id} className="py-2 flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-slate-900">{it.product_name}</span>
                                      <span className="font-mono text-[11px] text-slate-600 ml-2">SKU: {it.sku}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-slate-600 font-medium">{it.quantity} unids. × {formatCOP(it.unit_cost, false)}</span>
                                      <span className="font-bold text-slate-900 ml-3">{formatCOP(it.line_total)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {pur.notes && (
                                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                                  <span className="font-bold">Notas:</span> {pur.notes}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Register Inventory Purchase */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#5D79DF]" />
                Registrar Abastecimiento de Inventario
              </h2>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Provider & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor</label>
                  <select
                    required
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-[#5D79DF]/20"
                  >
                    <option value="">Seleccione proveedor...</option>
                    {providers.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Recepción</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Product Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Líneas de Compra (Productos)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#5D79DF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Agregar Línea
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      {/* Product Selector */}
                      <div className="col-span-5">
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                        >
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Cant."
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white text-center font-bold"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="col-span-4">
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Costo unitario"
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(idx, "unit_cost", Number(e.target.value))}
                          className="w-full px-2 py-1.5 border rounded-lg bg-white font-bold"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">Notas u Observaciones (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Factura Proveedor N° 4580, lote 2..."
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-[#5D79DF]/10 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Total de Compra a Ingresar:</span>
                <span className="text-base text-[#5D79DF]">{formatCOP(total)}</span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {errorMsg}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Recibiendo..." : "Confirmar Recepción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
