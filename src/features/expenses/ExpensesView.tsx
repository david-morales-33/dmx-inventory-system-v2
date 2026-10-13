import React, { useState } from "react";
import { 
  DollarSign, 
  Plus, 
  Search, 
  X, 
  Calendar, 
  Tag, 
  AlertCircle,
  CheckCircle2,
  XCircle 
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Expense } from "@/src/types/domain";
import { formatCOP, formatDate } from "@/src/lib/formatters/currency";
import { db } from "@/src/services/db";

interface ExpensesViewProps {
  expenses: Expense[];
  onRefresh: () => void;
  isNewExpenseOpen: boolean;
  onCloseNewExpense: () => void;
  onOpenNewExpense: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onRefresh,
  isNewExpenseOpen,
  onCloseNewExpense,
  onOpenNewExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form State
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Servicios Públicos");
  const [amount, setAmount] = useState<number | "">("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [providerName, setProviderName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const expenseCategories = [
    "Servicios Públicos",
    "Transporte & Fletes",
    "Arriendo / Local",
    "Papelería & Suministros",
    "Mantenimiento & Reparación",
    "Publicidad & Marketing",
    "Nómina & Honorarios",
    "Otros Gastos Operativos",
  ];

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.provider_name && e.provider_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalActiveExpenses = filteredExpenses
    .filter(e => !e.cancelled_at)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) {
      setErrorMsg("Ingrese una descripción y un monto válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await db.createExpense({
        description: description.trim(),
        category,
        amount: Number(amount),
        expense_date: new Date(expenseDate).toISOString(),
        provider_name: providerName.trim() || undefined,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });

      // Clear
      setDescription("");
      setAmount("");
      setProviderName("");
      setNotes("");
      onCloseNewExpense();
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar el gasto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelExpense = async (expense: Expense) => {
    const reason = prompt(`Motivo de anulación para el gasto "${expense.description}":`);
    if (!reason || !reason.trim()) return;

    try {
      await db.cancelExpense(expense.id, reason.trim());
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Error al anular el gasto.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={DollarSign}
        title="Gastos Operativos"
        description="Control de egresos generales que no corresponden a compra de mercancía ni alteran inventario."
      >
        <button
          onClick={onOpenNewExpense}
          className="px-4 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </PageHeader>

      {/* Filter and Total Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between md:col-span-1">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Filtrado</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{formatCOP(totalActiveExpenses)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center md:col-span-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar gasto o beneficiario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">Todas las categorías</option>
            {expenseCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">Descripción del Gasto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Beneficiario / Proveedor</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No hay gastos registrados</p>
                    <p className="text-[11px] text-slate-600 mt-1">Registra egresos como fletes, servicios o arriendo.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isCancelled = Boolean(exp.cancelled_at);

                  return (
                    <tr key={exp.id} className={`hover:bg-slate-50/70 transition-colors ${isCancelled ? "opacity-50 bg-slate-50/50" : ""}`}>
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {exp.description}
                        {exp.cancellation_reason && (
                          <span className="block text-[10px] text-rose-600 font-normal">
                            Motivo anulación: {exp.cancellation_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded-md text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(exp.expense_date)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {exp.provider_name || "-"}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-slate-600">
                        {exp.payment_method || "efectivo"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                        {formatCOP(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full">
                            Anulado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-full">
                            Registrado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelExpense(exp)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: New Expense */}
      {isNewExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#5D79DF]" />
                Registrar Gasto Operativo
              </h2>
              <button onClick={onCloseNewExpense} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción del Gasto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de recibo de energía local marzo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monto (COP) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="150000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Beneficiario / Proveedor (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Enel Codensa / Empresa de Envíos"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={onCloseNewExpense}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#5D79DF] text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Registrar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
