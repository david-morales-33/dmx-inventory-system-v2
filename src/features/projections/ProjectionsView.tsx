import React, { useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Scale, 
  HelpCircle, 
  Info,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { KPISummary, Expense, Purchase, Sale } from "@/src/types/domain";
import { formatCOP } from "@/src/lib/formatters/currency";

interface ProjectionsViewProps {
  kpis: KPISummary;
  expenses: Expense[];
  purchases: Purchase[];
  sales: Sale[];
}

export const ProjectionsView: React.FC<ProjectionsViewProps> = ({
  kpis,
  expenses,
  purchases,
  sales,
}) => {
  // Period filter for projections
  const [periodMonths, setPeriodMonths] = useState<number>(1);

  // Active completed sales
  const completedSales = sales.filter(s => s.status === "completed");
  const totalSalesRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);

  // TRUE COGS (Costo de Mercancía Vendida) using the exact snapshots!
  let totalCOGS = 0;
  for (const s of completedSales) {
    for (const it of s.items) {
      totalCOGS += it.quantity * it.unit_cost_snapshot;
    }
  }

  const grossProfit = totalSalesRevenue - totalCOGS;
  const grossMarginPercent = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

  // Operating Expenses (excluding cancelled)
  const activeExpenses = expenses.filter(e => !e.cancelled_at);
  const totalOperatingExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Operating Result
  const netResult = grossProfit - totalOperatingExpenses;

  // Purchases of inventory (Cash outflow for restocking)
  const totalInventoryPurchases = purchases
    .filter(p => p.status === "received")
    .reduce((sum, p) => sum + p.total, 0);

  // Break-even point calculation (Punto de Equilibrio)
  // Punto de equilibrio ($) = Costos Fijos / Margen de contribución ponderado (%)
  const contributionMarginRatio = grossMarginPercent > 0 ? grossMarginPercent / 100 : 0.35;
  const breakEvenPoint = contributionMarginRatio > 0 
    ? Math.round(totalOperatingExpenses / contributionMarginRatio) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={TrendingUp}
        title="Proyecciones & Estado de Resultados"
        description="Balance de gestión comercial, análisis de rentabilidad real y estimación de punto de equilibrio."
      />

      {/* Notice box */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-[#5D79DF] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Regla Contable Rigurosa Aplicada:</p>
          <p className="text-blue-800 mt-0.5">
            El Costo de Ventas (CMV) se calcula exclusivamente a partir del costo unitario registrado al momento exacto de cada venta. 
            El valor del stock existente en bodega se valora por separado y no se computa como gasto del periodo.
          </p>
        </div>
      </div>

      {/* 3 Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 1: Egresos y Salidas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">1. Egresos del Periodo</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">Gastos Operativos (Fijos & Variables)</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">
                  {formatCOP(totalOperatingExpenses)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Servicios, transporte, arriendos, papelería.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">Desembolsos en Abastecimiento (Compras)</span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">
                  {formatCOP(totalInventoryPurchases)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Capital invertido en compras recibidas de stock.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-500 block">Total Egresos Registrados:</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-1">
              {formatCOP(totalOperatingExpenses + totalInventoryPurchases)}
            </span>
          </div>
        </div>

        {/* SECTION 2: Balance de Gestión */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">2. Balance de Gestión</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">(+) Ingresos por Ventas</span>
                <span className="font-bold text-slate-900">{formatCOP(totalSalesRevenue)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">(-) Costo Mercancía Vendida (CMV)</span>
                <span className="font-bold text-rose-600">{formatCOP(totalCOGS)}</span>
              </div>

              <div className="flex justify-between py-2 bg-purple-50/60 px-3 rounded-lg font-bold text-purple-900">
                <span>(=) Utilidad Bruta Estimada</span>
                <span>{formatCOP(grossProfit)}</span>
              </div>
              <p className="text-[10px] text-purple-700 text-right font-semibold">
                Margen Bruto: {grossMarginPercent.toFixed(1)}%
              </p>

              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                <span>(-) Gastos Operativos</span>
                <span className="font-bold text-slate-800">{formatCOP(totalOperatingExpenses)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="font-semibold text-slate-500 text-xs block">Resultado Operativo Neto Est.:</span>
            <span
              className={`text-2xl font-extrabold block mt-1 ${
                netResult >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCOP(netResult)}
            </span>
          </div>
        </div>

        {/* SECTION 3: Punto de Equilibrio */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#5D79DF] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">3. Punto de Equilibrio</h2>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Ventas mínimas requeridas para cubrir exactamente los gastos operativos sin generar pérdidas ni ganancias.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Venta Mínima Requerida:</span>
                <span className="text-2xl font-extrabold text-[#5D79DF] block mt-1">
                  {formatCOP(breakEvenPoint)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px] text-slate-600">
                <p>• Base Gastos: {formatCOP(totalOperatingExpenses)}</p>
                <p>• Margen de Contribución: {(contributionMarginRatio * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-600 leading-tight">
            * Este indicador es una proyección interna de gestión y no reemplaza el dictamen de un contador público.
          </div>
        </div>
      </div>
    </div>
  );
};
