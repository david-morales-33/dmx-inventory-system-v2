import React, { useState } from "react";
import { Plus, X, Boxes, Sparkles } from "lucide-react";
import { Category } from "@/src/types/domain";
import { db } from "@/src/services/db";

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onProductCreated: () => void;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  onProductCreated,
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("unidad");
  const [costAverage, setCostAverage] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [initialStock, setInitialStock] = useState<number | "">("");
  const [warningThreshold, setWarningThreshold] = useState<number>(5);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto suggest SKU based on name
  const handleSuggestSku = () => {
    if (!name.trim()) return;
    const clean = name
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "-")
      .substring(0, 10);
    const randomHex = Math.floor(Math.random() * 900 + 100);
    setSku(`DMX-${clean}-${randomHex}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setErrorMsg("El nombre y el SKU son obligatorios.");
      return;
    }
    if (criticalThreshold > warningThreshold) {
      setErrorMsg("El umbral crítico no puede ser superior al umbral de advertencia.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await db.createProduct({
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        unit,
        cost_average: Number(costAverage) || 0,
        sale_price: Number(salePrice) || 0,
        initial_stock: Number(initialStock) || 0,
        warning_threshold: warningThreshold,
        critical_threshold: criticalThreshold,
      });

      // Reset
      setName("");
      setSku("");
      setDescription("");
      setCategoryId("");
      setCostAverage("");
      setSalePrice("");
      setInitialStock("");
      onProductCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 text-xs max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#5D79DF]" />
            Registrar Nuevo Producto
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre Comercial del Producto *</label>
            <input
              type="text"
              required
              placeholder="Ej: Cabeza Móvil Wash LED 36x10W"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">SKU / Código Único *</label>
                <button
                  type="button"
                  onClick={handleSuggestSku}
                  className="text-[10px] text-[#5D79DF] font-bold hover:underline flex items-center gap-0.5"
                >
                  <Sparkles className="w-3 h-3" /> Sugerir
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="DMX-WASH-36"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-medium"
              >
                <option value="">Seleccione categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Costo Unitario Inicial (COP)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={costAverage}
                onChange={(e) => setCostAverage(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Precio de Venta (COP) *</label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stock de Apertura</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={initialStock}
                onChange={(e) => setInitialStock(Number(e.target.value))}
                className="w-full px-2 py-1.5 border rounded-lg bg-white font-bold text-center"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5 text-center">Mov. apertura</span>
            </div>
            <div>
              <label className="block font-bold text-amber-700 mb-1">Umbral Aviso</label>
              <input
                type="number"
                min="1"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full px-2 py-1.5 border rounded-lg bg-white font-bold text-center"
              />
              <span className="text-[10px] text-amber-600 block mt-0.5 text-center">Alerta preventiva</span>
            </div>
            <div>
              <label className="block font-bold text-rose-700 mb-1">Umbral Crítico</label>
              <input
                type="number"
                min="0"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full px-2 py-1.5 border rounded-lg bg-white font-bold text-center"
              />
              <span className="text-[10px] text-rose-600 block mt-0.5 text-center">Nivel rojo</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción Técnica (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Especificaciones, canales DMX, potencia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
