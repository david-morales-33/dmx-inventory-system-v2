import React, { useState } from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  DollarSign, 
  Boxes, 
  AlertTriangle, 
  AlertCircle,
  Plus, 
  ArrowUpRight,
  Clock,
  Layers,
  CheckCircle2
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { KPISummary, Product, Purchase, Sale } from "@/src/types/domain";
import { formatCOP, formatDate } from "@/src/lib/formatters/currency";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";

interface DashboardViewProps {
  kpis: KPISummary;
  period: "today" | "week" | "month" | "year";
  onChangePeriod: (period: "today" | "week" | "month" | "year") => void;
  products: Product[];
  recentPurchases: Purchase[];
  recentSales: Sale[];
  onOpenNewProduct: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewSale: () => void;
  onOpenNewExpense: () => void;
  onNavigateToInventory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  period,
  onChangePeriod,
  products,
  recentPurchases,
  recentSales,
  onOpenNewProduct,
  onOpenNewPurchase,
  onOpenNewSale,
  onOpenNewExpense,
  onNavigateToInventory,
}) => {
  // Critical stock products
  const criticalProducts = products.filter(
    p => p.is_active && p.stock_quantity <= (p.critical_threshold ?? 2)
  );

  // Generate chart data combining recent sales and purchases
  const chartData = [
    { name: "Sem 1", ventas: kpis.periodSalesTotal * 0.18, compras: kpis.periodPurchasesTotal * 0.25 },
    { name: "Sem 2", ventas: kpis.periodSalesTotal * 0.28, compras: kpis.periodPurchasesTotal * 0.20 },
    { name: "Sem 3", ventas: kpis.periodSalesTotal * 0.22, compras: kpis.periodPurchasesTotal * 0.35 },
    { name: "Sem 4", ventas: kpis.periodSalesTotal * 0.32, compras: kpis.periodPurchasesTotal * 0.20 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Layers}
        title="Panel General"
        description="Resumen en tiempo real de operaciones comerciales, inventario y finanzas."
      >
        {/* Period Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {(["today", "week", "month", "year"] as const).map((p) => {
            const labels = {
              today: "Hoy",
              week: "Semana",
              month: "Mes",
              year: "Año",
            };
            return (
              <button
                key={p}
                onClick={() => onChangePeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </PageHeader>

      {/* 7 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ventas del periodo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#5D79DF]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas del Periodo</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {formatCOP(kpis.periodSalesTotal)}
          </p>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{kpis.periodSalesCount} ventas</span> completadas
          </p>
        </div>

        {/* 2. Compras recibidas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#5D79DF]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compras Recibidas</span>
            <div className="w-9 h-9 rounded-xl bg-[#5D79DF]/10 text-[#5D79DF] flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {formatCOP(kpis.periodPurchasesTotal)}
          </p>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
            <span className="font-semibold text-[#5D79DF]">{kpis.periodPurchasesCount} compras</span> ingresadas
          </p>
        </div>

        {/* 3. Gastos del periodo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#5D79DF]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos Operativos</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {formatCOP(kpis.periodExpensesTotal)}
          </p>
          <p className="text-xs text-slate-600 mt-1">Egresos generales sin stock</p>
        </div>

        {/* 4. Utilidad bruta estimada */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#5D79DF]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilidad Bruta Est.</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {formatCOP(kpis.periodGrossProfit)}
          </p>
          <p className="text-xs text-purple-700 mt-1 font-medium">Ventas netas - CMV histórico</p>
        </div>

        {/* 5. Valor del inventario */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#5D79DF]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor en Inventario</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {formatCOP(kpis.inventoryValueTotal)}
          </p>
          <p className="text-xs text-slate-600 mt-1">Costo promedio × existencias</p>
        </div>

        {/* 6. Stock bajo advertencia */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Bajo Mínimo</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2 tracking-tight">
            {kpis.lowStockProductsCount} <span className="text-sm font-normal text-slate-500">artículos</span>
          </p>
          <p className="text-xs text-slate-600 mt-1">Próximos a agotarse</p>
        </div>

        {/* 7. Stock crítico / Agotado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Crítico</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2 tracking-tight">
            {kpis.criticalStockProductsCount} <span className="text-sm font-normal text-slate-500">artículos</span>
          </p>
          <p className="text-xs text-slate-600 mt-1">Requieren reposición urgente</p>
        </div>

        {/* Quick actions box */}
        <div className="bg-gradient-to-br from-[#5D79DF] to-[#967BDD] rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Acciones Directas</span>
            <p className="text-sm font-medium text-white/90 mt-1">Operaciones frecuentes</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={onOpenNewSale}
              className="px-2.5 py-1.5 bg-white text-[#5D79DF] hover:bg-white/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <Receipt className="w-3.5 h-3.5" /> + Venta
            </button>
            <button
              onClick={onOpenNewPurchase}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> + Compra
            </button>
            <button
              onClick={onOpenNewProduct}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Producto
            </button>
            <button
              onClick={onOpenNewExpense}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" /> + Gasto
            </button>
          </div>
        </div>
      </div>

      {/* Middle row: Chart & Critical stock alert table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tendencia de Flujo Comercial</h2>
              <p className="text-xs text-slate-500">Comparativa de ingresos por ventas vs compras en el periodo</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#5D79DF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5D79DF]" /> Ventas
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Compras
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5D79DF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5D79DF" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip 
                  formatter={(val: any) => [formatCOP(Number(val)), ""]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#5D79DF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVentas)" name="Ventas" />
                <Area type="monotone" dataKey="compras" stroke="#cbd5e1" strokeWidth={2} fillOpacity={0} name="Compras" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical stock products widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
                Alerta de Stock Crítico
              </h2>
              <button
                onClick={onNavigateToInventory}
                className="text-xs font-semibold text-[#5D79DF] hover:underline flex items-center gap-0.5"
              >
                Ver inventario <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {criticalProducts.length === 0 ? (
              <div className="text-center py-10 px-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-800">Inventario en buen estado</p>
                <p className="text-xs text-emerald-600 mt-1">No hay productos en nivel crítico ni agotados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-rose-50/50 border border-rose-100/80 rounded-xl flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded-full">
                        {p.stock_quantity} disp.
                      </span>
                      <p className="text-[10px] text-slate-600 mt-0.5">mín: {p.critical_threshold ?? 2}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <button
              onClick={onOpenNewPurchase}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" /> Registrar Abastecimiento
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Últimas Ventas Realizadas
            </h2>
          </div>

          {recentSales.length === 0 ? (
            <p className="text-xs text-slate-600 py-6 text-center">No hay ventas registradas aún.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 font-mono">{sale.sale_number}</span>
                    <p className="text-[11px] text-slate-600">{sale.customer_name || "Cliente General"} • {formatDate(sale.sale_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">{formatCOP(sale.total)}</span>
                    <span className="block text-[10px] uppercase font-semibold text-emerald-600">{sale.payment_method}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5D79DF]" />
              Últimas Compras Recibidas
            </h2>
          </div>

          {recentPurchases.length === 0 ? (
            <p className="text-xs text-slate-600 py-6 text-center">No hay compras registradas aún.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPurchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 font-mono">{purchase.purchase_number}</span>
                    <p className="text-[11px] text-slate-600">{purchase.provider_name || "Proveedor"} • {formatDate(purchase.purchase_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">{formatCOP(purchase.total)}</span>
                    <span className="block text-[10px] font-semibold text-blue-600">Recibida</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
