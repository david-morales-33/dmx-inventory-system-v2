import React from "react";
import { Menu, Bell, ShieldCheck, Database, User } from "lucide-react";
import { isSupabaseConfigured } from "@/src/lib/supabase/client";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  criticalStockCount: number;
  lowStockCount: number;
  onNavigateToInventory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  criticalStockCount,
  lowStockCount,
  onNavigateToInventory,
}) => {
  const totalAlerts = criticalStockCount + lowStockCount;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500">
          <span className="hidden sm:inline">DMX System</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">Panel de Administración</span>
        </div>
      </div>

      {/* Right: Status badge, Stock alerts & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real Persistence Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600">
          {isSupabaseConfigured ? (
            <>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline text-emerald-700 font-semibold">Supabase PostgreSQL</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#5D79DF]" />
              <span className="hidden md:inline text-[#5D79DF] font-semibold">Persistencia Local Segura</span>
            </>
          )}
        </div>

        {/* Stock Alert Bell */}
        <button
          onClick={onNavigateToInventory}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title={totalAlerts > 0 ? `${totalAlerts} alertas de stock activo` : "Inventario óptimo"}
        >
          <Bell className="w-5 h-5" />
          {totalAlerts > 0 && (
            <span className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
              criticalStockCount > 0 ? "bg-rose-500" : "bg-amber-500"
            }`}>
              {totalAlerts}
            </span>
          )}
        </button>

        {/* Active Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-[#5D79DF]/10 text-[#5D79DF] flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Admin DMX</p>
            <p className="text-[10px] text-slate-600 leading-tight">Propietario</p>
          </div>
        </div>
      </div>
    </header>
  );
};
