import React from "react";
import { 
  LayoutDashboard, 
  Boxes, 
  Building2, 
  ShoppingCart, 
  Receipt, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Settings, 
  X,
  Layers
} from "lucide-react";

export type TabType = 
  | "dashboard"
  | "inventory"
  | "providers"
  | "purchases"
  | "sales"
  | "reports"
  | "expenses"
  | "projections"
  | "settings";

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  criticalAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  criticalAlertsCount = 0,
}) => {
  const navGroups = [
    {
      group: "ERP",
      items: [
        { id: "dashboard" as TabType, label: "Dashboard", icon: LayoutDashboard },
        { id: "inventory" as TabType, label: "Inventario", icon: Boxes, badge: criticalAlertsCount > 0 ? criticalAlertsCount : undefined },
        { id: "providers" as TabType, label: "Proveedores", icon: Building2 },
        { id: "purchases" as TabType, label: "Compras", icon: ShoppingCart },
        { id: "sales" as TabType, label: "Ventas", icon: Receipt },
        { id: "reports" as TabType, label: "Reportes", icon: FileText },
      ],
    },
    {
      group: "PROYECCIONES",
      items: [
        { id: "expenses" as TabType, label: "Gastos", icon: DollarSign },
        { id: "projections" as TabType, label: "Estado de Resultados", icon: TrendingUp },
      ],
    },
    {
      group: "SISTEMA",
      items: [
        { id: "settings" as TabType, label: "Configuración", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5D79DF] to-[#967BDD] flex items-center justify-center text-white shadow-sm shadow-[#5D79DF]/20">
              <Layers className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xl tracking-tight select-none">
              <span className="text-slate-900">DMX </span>
              <span className="text-[#5D79DF]">System</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navGroups.map((section) => (
            <div key={section.group}>
              <div className="px-3 mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#5D79DF]/10 text-[#5D79DF] font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4.5 h-4.5 transition-colors ${
                            isActive ? "text-[#5D79DF]" : "text-slate-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Business summary footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <p className="text-xs font-semibold text-slate-800">Establecimiento Único</p>
            <p className="text-[11px] text-slate-600 mt-0.5">COP (America/Bogota)</p>
          </div>
        </div>
      </aside>
    </>
  );
};
