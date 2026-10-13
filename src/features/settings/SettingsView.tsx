import React, { useState } from "react";
import { 
  Settings, 
  Save, 
  Database, 
  Download, 
  Upload, 
  Tag, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Layers,
  Sliders
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { BusinessSettings, Category } from "@/src/types/domain";
import { isSupabaseConfigured } from "@/src/lib/supabase/client";
import { db } from "@/src/services/db";

interface SettingsViewProps {
  settings: BusinessSettings;
  categories: Category[];
  onRefresh: () => void;
  onOpenNewCategory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  categories,
  onRefresh,
  onOpenNewCategory,
}) => {
  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await db.updateSettings(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Error al guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(db.exportBackup());
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dmx_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        db.restoreBackup(json);
        alert("Copia de seguridad restaurada correctamente.");
        onRefresh();
      } catch (err: any) {
        alert("Error al restaurar: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Settings}
        title="Configuración del Establecimiento"
        description="Parámetros del negocio, umbrales globales de stock y herramientas de respaldo."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business & Stock Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#5D79DF]" />
              Parámetros Generales
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Moneda del Sistema</label>
                <input
                  type="text"
                  disabled
                  value="COP (Peso Colombiano)"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-100 text-slate-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zona Horaria</label>
                <input
                  type="text"
                  disabled
                  value="America/Bogota"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-100 text-slate-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo del Negocio</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 pt-4">
              Umbrales Globales de Semáforo de Stock
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-amber-700 mb-1">
                  Umbral de Advertencia por Defecto
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.default_warning_threshold}
                  onChange={(e) => setFormData({ ...formData, default_warning_threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
                <p className="text-[11px] text-slate-500 mt-1">Nivel para alerta ámbar en productos sin umbral personalizado.</p>
              </div>

              <div>
                <label className="block font-bold text-rose-700 mb-1">
                  Umbral Crítico por Defecto
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.default_critical_threshold}
                  onChange={(e) => setFormData({ ...formData, default_critical_threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
                <p className="text-[11px] text-slate-500 mt-1">Nivel para alerta roja y requerimiento urgente de reposición.</p>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Parámetros guardados exitosamente.
              </div>
            )}

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#5D79DF] hover:bg-[#4d69ce] text-white font-bold rounded-xl shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Guardando..." : "Guardar Parámetros"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Database, Categories & Backups */}
        <div className="space-y-6">
          {/* Persistence status box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#5D79DF]" />
              Estado de la Base de Datos
            </h2>
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Motor de Persistencia:</span>
                <span className="font-bold text-slate-900">
                  {isSupabaseConfigured ? "Supabase PostgreSQL" : "Motor Local Transaccional"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transacciones Atómicas:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Activas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stock Negativo:</span>
                <span className="font-bold text-rose-600">Bloqueado</span>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-[#5D79DF]" />
              Respaldo & Exportación Completa
            </h2>
            <p className="text-slate-500 text-[11px]">
              Descarga un volcado íntegro de productos, movimientos, compras, ventas y gastos.
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Copia de Seguridad JSON
              </button>

              <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Restaurar desde Archivo JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Categories Quick List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#5D79DF]" />
                Categorías Registradas ({categories.length})
              </h2>
              <button
                type="button"
                onClick={onOpenNewCategory}
                className="text-[#5D79DF] font-bold text-[11px] hover:underline"
              >
                + Nueva
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded-md font-mono text-slate-500">
                    {c.normalized_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
