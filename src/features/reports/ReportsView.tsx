import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Calendar, 
  Boxes, 
  ShoppingCart, 
  Receipt, 
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Product, Sale, Purchase, Expense } from "@/src/types/domain";
import { formatCOP, formatDate } from "@/src/lib/formatters/currency";

interface ReportsViewProps {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  sales,
  purchases,
  expenses,
}) => {
  const [reportType, setReportType] = useState<"sales" | "inventory" | "purchases" | "expenses">("sales");

  // Safe CSV export with formula injection escaping
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `dmx_reporte_${reportType}_${new Date().toISOString().split("T")[0]}.csv`;

    const sanitize = (val: any) => {
      let str = String(val ?? "").replace(/"/g, '""');
      // Escape CSV formula injection characters: =, +, -, @
      if (/^[=+\-@]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    if (reportType === "sales") {
      rows.push(["N° Venta", "Fecha", "Cliente", "Método de Pago", "Subtotal", "Total", "Estado"]);
      sales.forEach(s => {
        rows.push([
          s.sale_number,
          formatDate(s.sale_date),
          s.customer_name || "General",
          s.payment_method,
          String(s.subtotal),
          String(s.total),
          s.status
        ]);
      });
    } else if (reportType === "inventory") {
      rows.push(["SKU", "Producto", "Categoría", "Stock Actual", "Unidad", "Costo Promedio", "Precio Venta", "Valor Total"]);
      products.forEach(p => {
        rows.push([
          p.sku,
          p.name,
          p.category_name || "General",
          String(p.stock_quantity),
          p.unit,
          String(p.cost_average),
          String(p.sale_price),
          String(p.stock_quantity * p.cost_average)
        ]);
      });
    } else if (reportType === "purchases") {
      rows.push(["N° Compra", "Fecha", "Proveedor", "Total", "Estado"]);
      purchases.forEach(p => {
        rows.push([
          p.purchase_number,
          formatDate(p.purchase_date),
          p.provider_name || "-",
          String(p.total),
          p.status
        ]);
      });
    } else {
      rows.push(["Descripción", "Categoría", "Fecha", "Monto", "Beneficiario", "Método"]);
      expenses.forEach(e => {
        rows.push([
          e.description,
          e.category,
          formatDate(e.expense_date),
          String(e.amount),
          e.provider_name || "-",
          e.payment_method || "-"
        ]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(r => r.map(sanitize).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={FileText}
        title="Reportes & Analítica Comercial"
        description="Consulta consolidada de operaciones y exportación de datos en formato seguro."
      >
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" /> Exportar Reporte CSV
        </button>
      </PageHeader>

      {/* Report Selector Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs max-w-xl text-xs font-bold">
        {[
          { id: "sales" as const, label: "Ventas", icon: Receipt },
          { id: "inventory" as const, label: "Inventario Físico", icon: Boxes },
          { id: "purchases" as const, label: "Compras", icon: ShoppingCart },
          { id: "expenses" as const, label: "Gastos", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? "bg-[#5D79DF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Table Display for Selected Report */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === "sales" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-5">N° Venta</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-mono font-bold">{s.sale_number}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(s.sale_date)}</td>
                    <td className="py-3 px-4 font-medium">{s.customer_name || "General"}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-semibold">{s.payment_method}</td>
                    <td className="py-3 px-4 text-right font-bold">{formatCOP(s.total)}</td>
                    <td className="py-3 px-5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "inventory" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-5">SKU</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-center">Existencias</th>
                  <th className="py-3 px-4 text-right">Costo Promedio</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-5 text-right">Valor Total Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-mono font-bold text-slate-600">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-center font-bold">{p.stock_quantity} {p.unit}s</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatCOP(p.cost_average, false)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCOP(p.sale_price, false)}</td>
                    <td className="py-3 px-5 text-right font-bold text-slate-900">
                      {formatCOP(p.stock_quantity * p.cost_average)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "purchases" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-5">N° Compra</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Total Facturado</th>
                  <th className="py-3 px-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-mono font-bold">{p.purchase_number}</td>
                    <td className="py-3 px-4 font-semibold">{p.provider_name || "-"}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(p.purchase_date)}</td>
                    <td className="py-3 px-4 text-right font-bold">{formatCOP(p.total)}</td>
                    <td className="py-3 px-5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "expenses" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-5">Descripción</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-bold">{e.description}</td>
                    <td className="py-3 px-4 text-slate-600">{e.category}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(e.expense_date)}</td>
                    <td className="py-3 px-4 text-right font-bold">{formatCOP(e.amount)}</td>
                    <td className="py-3 px-5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                        {e.cancelled_at ? "Anulado" : "Activo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
