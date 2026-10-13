import React, { useState } from "react";
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Boxes, 
  Edit3, 
  X, 
  Link as LinkIcon 
} from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Provider, Product } from "@/src/types/domain";
import { formatCOP } from "@/src/lib/formatters/currency";
import { db } from "@/src/services/db";

interface ProvidersViewProps {
  providers: Provider[];
  products: Product[];
  onRefresh: () => void;
}

export const ProvidersView: React.FC<ProvidersViewProps> = ({
  providers,
  products,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewProviderOpen, setIsNewProviderOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [managingProductsProvider, setManagingProductsProvider] = useState<Provider | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
  const [selectedProductIdToLink, setSelectedProductIdToLink] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProviders = providers.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (p.contact_name && p.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenNew = () => {
    setName("");
    setTaxId("");
    setContactName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setIsNewProviderOpen(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await db.createProvider({
        name: name.trim(),
        tax_id: taxId.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        is_active: true,
      });
      setIsNewProviderOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Error al registrar el proveedor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenManageProducts = async (provider: Provider) => {
    setManagingProductsProvider(provider);
    const linked = await db.getProviderProducts(provider.id);
    setLinkedProducts(linked);
    setSelectedProductIdToLink("");
  };

  const handleLinkProduct = async () => {
    if (!managingProductsProvider || !selectedProductIdToLink) return;
    const prod = products.find(p => p.id === selectedProductIdToLink);
    await db.linkProviderProduct(managingProductsProvider.id, selectedProductIdToLink, prod?.cost_average);
    const updated = await db.getProviderProducts(managingProductsProvider.id);
    setLinkedProducts(updated);
    setSelectedProductIdToLink("");
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Building2}
        title="Directorio de Proveedores"
        description="Gestión de contactos de suministro y catálogo de productos abastecidos."
      >
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-[#5D79DF] hover:bg-[#4d69ce] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </PageHeader>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:ring-2 focus:ring-[#5D79DF]/20"
          />
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-5">Proveedor / Razón Social</th>
                <th className="py-3 px-4">NIT / Identificación</th>
                <th className="py-3 px-4">Contacto Directo</th>
                <th className="py-3 px-4">Teléfono & Correo</th>
                <th className="py-3 px-4 text-center">Artículos Suministrados</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No hay proveedores registrados</p>
                    <p className="text-[11px] text-slate-600 mt-1">Añade tu primer proveedor comercial.</p>
                  </td>
                </tr>
              ) : (
                filteredProviders.map((prov) => (
                  <tr key={prov.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900">{prov.name}</p>
                      {prov.address && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" /> {prov.address}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {prov.tax_id || "-"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {prov.contact_name || "-"}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      {prov.phone && (
                        <p className="text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" /> {prov.phone}
                        </p>
                      )}
                      {prov.email && (
                        <p className="text-slate-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" /> {prov.email}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenManageProducts(prov)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors"
                      >
                        {prov.products_count || 0} artículos
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleOpenManageProducts(prov)}
                        className="p-1.5 text-slate-500 hover:text-[#5D79DF] hover:bg-[#5D79DF]/10 rounded-lg"
                        title="Vincular productos provistos"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: New Provider */}
      {isNewProviderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#5D79DF]" />
                Registrar Nuevo Proveedor
              </h2>
              <button onClick={() => setIsNewProviderOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-3 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuciones Audio & Iluminación SAS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIT / Cédula</label>
                  <input
                    type="text"
                    placeholder="900.123.456-7"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    placeholder="Carlos Pérez"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección Física</label>
                <input
                  type="text"
                  placeholder="Calle 10 # 20-30, Bogotá"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewProviderOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#5D79DF] text-white rounded-xl font-bold"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manage Provider Products */}
      {managingProductsProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Artículos de {managingProductsProvider.name}
                </h2>
                <p className="text-slate-500 text-[11px]">Productos que suministra habitualmente este proveedor.</p>
              </div>
              <button onClick={() => setManagingProductsProvider(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Link another product */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl flex gap-2">
              <select
                value={selectedProductIdToLink}
                onChange={(e) => setSelectedProductIdToLink(e.target.value)}
                className="flex-1 px-3 py-1.5 border rounded-lg bg-white"
              >
                <option value="">Seleccione producto para vincular...</option>
                {products
                  .filter(p => !linkedProducts.some(lp => lp.id === p.id))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleLinkProduct}
                disabled={!selectedProductIdToLink}
                className="px-3 py-1.5 bg-[#5D79DF] text-white rounded-lg font-bold disabled:opacity-40"
              >
                Vincular
              </button>
            </div>

            {/* Linked products list */}
            <div className="mt-4 divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {linkedProducts.length === 0 ? (
                <p className="text-center py-6 text-slate-400">No hay productos asociados todavía.</p>
              ) : (
                linkedProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">SKU: {p.sku}</p>
                    </div>
                    <span className="font-bold text-slate-700">
                      Costo: {formatCOP(p.cost_average)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t mt-4 text-right">
              <button
                onClick={() => setManagingProductsProvider(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
