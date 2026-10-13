import React, { useState } from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  DollarSign, 
  AlertCircle,
  X,
  Printer,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Sale, Product, PaymentMethod } from "@/src/types/domain";
import { formatCOP, formatDate, formatDateTime } from "@/src/lib/formatters/currency";
import { db } from "@/src/services/db";

interface SalesViewProps {
  sales: Sale[];
  products: Product[];
  onRefresh: () => void;
  onOpenNewSale: () => void;
  isNewSaleOpen: boolean;
  onCloseNewSale: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  products,
  onRefresh,
  onOpenNewSale,
  isNewSaleOpen,
  onCloseNewSale,
}) => {
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  
  // Sale Form State
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [notes, setNotes] = useState("");
  const [discountTotal, setDiscountTotal] = useState(0);
  const [cartItems, setCartItems] = useState<
    { product_id: string; quantity: number; unit_price: number; line_discount: number }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter products for POS
  const [productSearch, setProductSearch] = useState("");
  const availableProducts = products.filter(
    p => p.is_active && (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setErrorMsg(`"${product.name}" no tiene existencias disponibles.`);
      return;
    }

    const existingIdx = cartItems.findIndex(i => i.product_id === product.id);
    if (existingIdx !== -1) {
      const currentQty = cartItems[existingIdx].quantity;
      if (currentQty + 1 > product.stock_quantity) {
        setErrorMsg(`No puedes agregar más de ${product.stock_quantity} unidades de "${product.name}".`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIdx].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        { product_id: product.id, quantity: 1, unit_price: product.sale_price, line_discount: 0 }
      ]);
    }
    setErrorMsg(null);
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQty <= 0) {
      setCartItems(cartItems.filter(i => i.product_id !== productId));
      return;
    }

    if (newQty > product.stock_quantity) {
      setErrorMsg(`Existencias máximas para "${product.name}": ${product.stock_quantity}.`);
      return;
    }

    setCartItems(cartItems.map(i => i.product_id === productId ? { ...i, quantity: newQty } : i));
    setErrorMsg(null);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(i => i.product_id !== productId));
  };

  // Preliminary calculations
  const cartSubtotal = cartItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
  const cartTotal = Math.max(0, cartSubtotal - discountTotal);

  // Submit sale transaction
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setErrorMsg("Debe agregar al menos un producto a la venta.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const createdSale = await db.processSale({
        customer_name: customerName,
        payment_method: paymentMethod,
        items: cartItems,
        notes,
      });

      // Clear & close
      setCartItems([]);
      setCustomerName("");
      setDiscountTotal(0);
      setNotes("");
      onCloseNewSale();
      onRefresh();

      // Automatically show receipt
      setSelectedReceiptSale(createdSale);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al completar la venta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel / Revert sale
  const handleCancelSale = async (sale: Sale) => {
    const reason = prompt(`Motivo de la anulación para la venta ${sale.sale_number}:`);
    if (!reason || !reason.trim()) return;

    try {
      await db.cancelSale(sale.id, reason.trim());
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Error al anular la venta.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Receipt}
        title="Ventas & Punto de Venta (POS)"
        description="Emisión rápida de comprobantes, validación de existencias y congelación de costo histórico."
      >
        <button
          onClick={onOpenNewSale}
          className="px-4 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Nueva Venta (POS)
        </button>
      </PageHeader>

      {/* Sales List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">N° Venta</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Método de Pago</th>
                <th className="py-3 px-4 text-center">Ítems</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No hay ventas registradas</p>
                    <p className="text-[11px] text-slate-600 mt-1">Realiza tu primera venta usando el POS simplificado.</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;
                  const isCancelled = sale.status === "cancelled";

                  return (
                    <React.Fragment key={sale.id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors ${isCancelled ? "opacity-60 bg-slate-50/40" : ""}`}>
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                          {sale.sale_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatDateTime(sale.sale_date)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {sale.customer_name || "Cliente General"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] rounded-md">
                            {sale.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {sale.items.length} unids.
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                          {formatCOP(sale.total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isCancelled ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold text-[11px] rounded-full inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Anulada
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completada
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedReceiptSale(sale)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            title="Ver e imprimir comprobante"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => handleCancelSale(sale)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Anular venta y revertir inventario"
                            >
                              Anular
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                              <p className="font-bold text-xs text-slate-800">Líneas de la venta:</p>
                              <div className="divide-y divide-slate-100 text-xs">
                                {sale.items.map((it) => (
                                  <div key={it.id} className="py-2 flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-slate-900">{it.product_name}</span>
                                      <span className="font-mono text-[11px] text-slate-600 ml-2">SKU: {it.sku}</span>
                                      <span className="text-[10px] text-purple-700 ml-3">
                                        (Costo congelado: {formatCOP(it.unit_cost_snapshot, false)})
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-slate-600">{it.quantity} unids. × {formatCOP(it.unit_price, false)}</span>
                                      <span className="font-bold text-slate-900 ml-3">{formatCOP(it.line_total)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {sale.notes && (
                                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                                  <span className="font-bold">Observación:</span> {sale.notes}
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

      {/* POS MODAL */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#5D79DF]" />
                Punto de Venta Rápido (POS)
              </h2>
              <button onClick={onCloseNewSale} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-y-auto py-4">
              {/* Left Column: Product Search & Quick Add */}
              <div className="md:col-span-7 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar producto por SKU o nombre..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                  {availableProducts.length === 0 ? (
                    <p className="text-center py-6 text-slate-400">No se encontraron productos disponibles.</p>
                  ) : (
                    availableProducts.map((p) => {
                      const isOutOfStock = p.stock_quantity <= 0;
                      return (
                        <div
                          key={p.id}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="font-mono text-[10px] text-slate-600">{p.sku}</p>
                            <span
                              className={`text-[10px] font-bold ${
                                isOutOfStock ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              Disponible: {p.stock_quantity} {p.unit}s
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">{formatCOP(p.sale_price)}</span>
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => handleAddToCart(p)}
                              className="mt-1 px-3 py-1 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-colors"
                            >
                              + Agregar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Cart & Checkout Form */}
              <div className="md:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between space-y-4">
                <form onSubmit={handleSubmitSale} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cliente (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: David Morales / Eventos SAS"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Método de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-1.5 border rounded-xl bg-white font-semibold"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="tarjeta">Tarjeta Débito / Crédito</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* Cart Items List */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Artículos Seleccionados ({cartItems.length})
                    </label>
                    <div className="bg-white border rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto p-2">
                      {cartItems.length === 0 ? (
                        <p className="text-center py-4 text-slate-400">El carrito está vacío.</p>
                      ) : (
                        cartItems.map((item) => {
                          const prod = products.find(p => p.id === item.product_id);
                          return (
                            <div key={item.product_id} className="py-1.5 flex items-center justify-between">
                              <div className="pr-2">
                                <p className="font-bold text-slate-900 truncate w-32">{prod?.name}</p>
                                <p className="text-[10px] text-slate-500">{formatCOP(item.unit_price, false)}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  max={prod?.stock_quantity}
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQty(item.product_id, Number(e.target.value))}
                                  className="w-12 px-1.5 py-0.5 border rounded-md text-center font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(item.product_id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatCOP(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t">
                      <span>Total Venta:</span>
                      <span className="text-[#5D79DF]">{formatCOP(cartTotal)}</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onCloseNewSale}
                      className="w-1/2 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || cartItems.length === 0}
                      className="w-1/2 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isSubmitting ? "Emitiendo..." : "Cobrar Venta"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {selectedReceiptSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <h2 className="font-extrabold text-base text-slate-900">DMX SYSTEM</h2>
              <p className="text-[11px] text-slate-500">Comprobante de Venta</p>
              <p className="font-mono font-bold text-slate-800 mt-1">{selectedReceiptSale.sale_number}</p>
              <p className="text-[10px] text-slate-400">{formatDateTime(selectedReceiptSale.sale_date)}</p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-200 space-y-1">
              <p><span className="text-slate-500">Cliente:</span> <span className="font-bold">{selectedReceiptSale.customer_name || "General"}</span></p>
              <p><span className="text-slate-500">Pago:</span> <span className="font-semibold uppercase">{selectedReceiptSale.payment_method}</span></p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-200 space-y-1.5 max-h-48 overflow-y-auto">
              {selectedReceiptSale.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{it.product_name}</p>
                    <p className="text-[10px] text-slate-500">{it.quantity} × {formatCOP(it.unit_price, false)}</p>
                  </div>
                  <span className="font-bold">{formatCOP(it.line_total, false)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 text-sm font-bold flex justify-between text-slate-900">
              <span>TOTAL PAGADO:</span>
              <span className="text-[#5D79DF]">{formatCOP(selectedReceiptSale.total)}</span>
            </div>

            <div className="pt-5 flex gap-2">
              <button
                onClick={() => setSelectedReceiptSale(null)}
                className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
