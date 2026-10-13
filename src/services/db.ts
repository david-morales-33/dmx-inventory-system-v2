import { supabase, isSupabaseConfigured } from "@/src/lib/supabase/client";
import { 
  Product, Category, Provider, ProviderProduct, 
  Purchase, Sale, Expense, InventoryMovement, 
  BusinessSettings, KPISummary, StockAlertStatus 
} from "@/src/types/domain";

const STORAGE_KEY = "dmx_system_database_v1";

interface LocalDatabaseState {
  settings: BusinessSettings;
  categories: Category[];
  products: Product[];
  providers: Provider[];
  providerProducts: ProviderProduct[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  movements: InventoryMovement[];
}

// Initial structured data for fresh deployment
const defaultInitialState: LocalDatabaseState = {
  settings: {
    id: "00000000-0000-0000-0000-000000000001",
    business_name: "DMX System",
    currency_code: "COP",
    timezone: "America/Bogota",
    default_warning_threshold: 5,
    default_critical_threshold: 2,
    phone: "+57 300 123 4567",
    email: "admin@dmxsystem.co",
    address: "Calle 72 # 11-86, Bogotá, Colombia",
  },
  categories: [
    {
      id: "cat-1",
      name: "Iluminación DMX",
      normalized_name: "iluminacion dmx",
      description: "Luces robóticas, cabezas móviles, barras LED",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "cat-2",
      name: "Controladores & Interfaces",
      normalized_name: "controladores interfaces",
      description: "Consolas DMX, splitters, interfaces USB/ArtNet",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "cat-3",
      name: "Cables & Conectores",
      normalized_name: "cables conectores",
      description: "Cables XLR de 3 y 5 pines, terminadores DMX",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "cat-4",
      name: "Efectos Especiales",
      normalized_name: "efectos especiales",
      description: "Máquinas de humo, niebla, confeti y líquidos",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  providers: [
    {
      id: "prov-1",
      name: "ProLight Colombia S.A.S.",
      tax_id: "900876543-1",
      contact_name: "Carlos Mendoza",
      phone: "+57 310 456 7890",
      email: "contacto@prolight.co",
      address: "Cra 15 # 85-30, Bogotá",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      products_count: 2,
    },
    {
      id: "prov-2",
      name: "Audio & Show Distribuciones",
      tax_id: "901234567-8",
      contact_name: "Mariana Ospina",
      phone: "+57 320 987 6543",
      email: "ventas@audioshow.co",
      address: "Calle 53 # 24-18, Medellín",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      products_count: 3,
    },
  ],
  products: [
    {
      id: "prod-1",
      sku: "DMX-LED-BEAM7R",
      name: "Cabeza Móvil Beam 7R 230W",
      description: "Luz robótica de alta potencia con rueda de 14 colores y 17 gobos",
      category_id: "cat-1",
      category_name: "Iluminación DMX",
      unit: "unidad",
      cost_average: 980000,
      sale_price: 1450000,
      stock_quantity: 8,
      warning_threshold: 4,
      critical_threshold: 1,
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-2",
      sku: "DMX-PAR-54X3",
      name: "Foco Par LED 54x3W RGBW",
      description: "Foco wash profesional para escenarios y eventos",
      category_id: "cat-1",
      category_name: "Iluminación DMX",
      unit: "unidad",
      cost_average: 165000,
      sale_price: 260000,
      stock_quantity: 18,
      warning_threshold: 6,
      critical_threshold: 2,
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-3",
      sku: "DMX-CTRL-512",
      name: "Consola Controladora DMX 512 Canales",
      description: "Consola estándar para control de luminarias y escenas",
      category_id: "cat-2",
      category_name: "Controladores & Interfaces",
      unit: "unidad",
      cost_average: 320000,
      sale_price: 490000,
      stock_quantity: 3,
      warning_threshold: 5,
      critical_threshold: 2,
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-4",
      sku: "DMX-CBL-10M",
      name: "Cable DMX XLR 3 Pines 10 Metros",
      description: "Cable blindado 110 ohms de alta fidelidad",
      category_id: "cat-3",
      category_name: "Cables & Conectores",
      unit: "unidad",
      cost_average: 28000,
      sale_price: 45000,
      stock_quantity: 32,
      warning_threshold: 10,
      critical_threshold: 4,
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-5",
      sku: "DMX-FOG-1500",
      name: "Máquina de Humo 1500W DMX",
      description: "Calentador rápido con control DMX e inalámbrico",
      category_id: "cat-4",
      category_name: "Efectos Especiales",
      unit: "unidad",
      cost_average: 290000,
      sale_price: 440000,
      stock_quantity: 1, // Critical stock!
      warning_threshold: 4,
      critical_threshold: 2,
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  providerProducts: [
    { id: "pp-1", provider_id: "prov-1", product_id: "prod-1", provider_sku: "PL-BEAM-7R", last_purchase_cost: 980000 },
    { id: "pp-2", provider_id: "prov-1", product_id: "prod-2", provider_sku: "PL-PAR-54", last_purchase_cost: 165000 },
    { id: "pp-3", provider_id: "prov-2", product_id: "prod-3", provider_sku: "AS-CTRL-512", last_purchase_cost: 320000 },
    { id: "pp-4", provider_id: "prov-2", product_id: "prod-4", provider_sku: "AS-CBL-10M", last_purchase_cost: 28000 },
    { id: "pp-5", provider_id: "prov-2", product_id: "prod-5", provider_sku: "AS-FOG-1500", last_purchase_cost: 290000 },
  ],
  purchases: [
    {
      id: "pur-1",
      purchase_number: "COM-0001",
      provider_id: "prov-1",
      provider_name: "ProLight Colombia S.A.S.",
      status: "received",
      purchase_date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      subtotal: 9460000,
      tax_total: 0,
      discount_total: 0,
      total: 9460000,
      notes: "Pedido de reposición mensual de cabezas móviles y focos",
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      items: [
        {
          id: "pi-1",
          purchase_id: "pur-1",
          product_id: "prod-1",
          product_name: "Cabeza Móvil Beam 7R 230W",
          sku: "DMX-LED-BEAM7R",
          quantity: 6,
          unit_cost: 980000,
          line_discount: 0,
          line_total: 5880000,
        },
        {
          id: "pi-2",
          purchase_id: "pur-1",
          product_id: "prod-2",
          product_name: "Foco Par LED 54x3W RGBW",
          sku: "DMX-PAR-54X3",
          quantity: 20,
          unit_cost: 165000,
          line_discount: 0,
          line_total: 3300000,
        },
      ],
    },
  ],
  sales: [
    {
      id: "sale-1",
      sale_number: "VEN-0001",
      status: "completed",
      sale_date: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      customer_name: "Eventos & Luces Bogotá",
      payment_method: "transferencia",
      subtotal: 3420000,
      discount_total: 0,
      tax_total: 0,
      total: 3420000,
      notes: "Venta para montaje de festival",
      created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      items: [
        {
          id: "si-1",
          sale_id: "sale-1",
          product_id: "prod-1",
          product_name: "Cabeza Móvil Beam 7R 230W",
          sku: "DMX-LED-BEAM7R",
          quantity: 2,
          unit_price: 1450000,
          unit_cost_snapshot: 980000,
          line_discount: 0,
          line_total: 2900000,
        },
        {
          id: "si-2",
          sale_id: "sale-1",
          product_id: "prod-2",
          product_name: "Foco Par LED 54x3W RGBW",
          sku: "DMX-PAR-54X3",
          quantity: 2,
          unit_price: 260000,
          unit_cost_snapshot: 165000,
          line_discount: 0,
          line_total: 520000,
        },
      ],
    },
  ],
  expenses: [
    {
      id: "exp-1",
      description: "Servicio de transporte y flete de equipos",
      category: "Transporte",
      amount: 180000,
      expense_date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      provider_name: "Transportes Rápidos",
      payment_method: "efectivo",
      created_at: new Date().toISOString(),
    },
  ],
  movements: [
    {
      id: "mov-1",
      product_id: "prod-1",
      product_name: "Cabeza Móvil Beam 7R 230W",
      sku: "DMX-LED-BEAM7R",
      movement_type: "initial_inventory",
      quantity_delta: 4,
      unit_cost: 980000,
      reference_type: "opening",
      reference_id: "init",
      reason: "Inventario de apertura",
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    },
    {
      id: "mov-2",
      product_id: "prod-1",
      product_name: "Cabeza Móvil Beam 7R 230W",
      sku: "DMX-LED-BEAM7R",
      movement_type: "purchase_receipt",
      quantity_delta: 6,
      unit_cost: 980000,
      reference_type: "purchase",
      reference_id: "pur-1",
      reason: "Recepción de compra COM-0001",
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    {
      id: "mov-3",
      product_id: "prod-1",
      product_name: "Cabeza Móvil Beam 7R 230W",
      sku: "DMX-LED-BEAM7R",
      movement_type: "sale",
      quantity_delta: -2,
      unit_cost: 980000,
      reference_type: "sale",
      reference_id: "sale-1",
      reason: "Venta VEN-0001",
      created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    },
  ],
};

function loadState(): LocalDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveState(defaultInitialState);
      return defaultInitialState;
    }
    return JSON.parse(raw);
  } catch {
    return defaultInitialState;
  }
}

function saveState(state: LocalDatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Error saving state to persistent storage:", err);
  }
}

/**
 * High-level Database Repository API with strict transactional guarantees.
 */
export const db = {
  // Settings
  async getSettings(): Promise<BusinessSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from("business_settings").select("*").limit(1).single();
      if (data) return data;
    }
    return loadState().settings;
  },

  async updateSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const state = loadState();
    state.settings = { ...state.settings, ...settings };
    saveState(state);

    if (isSupabaseConfigured && supabase) {
      await supabase.from("business_settings").update(settings).eq("id", state.settings.id);
    }
    return state.settings;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from("categories").select("*").order("name");
      if (data) return data;
    }
    return loadState().categories.sort((a, b) => a.name.localeCompare(b.name));
  },

  async createCategory(name: string, description?: string): Promise<Category> {
    const normalized = name.trim().toLowerCase();
    const state = loadState();
    if (state.categories.some(c => c.normalized_name === normalized)) {
      throw new Error(`La categoría "${name}" ya existe.`);
    }

    const newCat: Category = {
      id: "cat-" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      normalized_name: normalized,
      description: description?.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.categories.push(newCat);
    saveState(state);

    if (isSupabaseConfigured && supabase) {
      await supabase.from("categories").insert({
        name: newCat.name,
        normalized_name: newCat.normalized_name,
        description: newCat.description,
      });
    }

    return newCat;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from("products").select("*, categories(name)").order("name");
      if (data) {
        return data.map((d: any) => ({
          ...d,
          category_name: d.categories?.name,
        }));
      }
    }
    const state = loadState();
    return state.products.map(p => {
      const cat = state.categories.find(c => c.id === p.category_id);
      return { ...p, category_name: cat ? cat.name : "Sin categoría" };
    });
  },

  async createProduct(data: {
    sku: string;
    name: string;
    description?: string;
    category_id?: string;
    unit?: string;
    cost_average: number;
    sale_price: number;
    initial_stock?: number;
    warning_threshold?: number;
    critical_threshold?: number;
  }): Promise<Product> {
    const state = loadState();
    const sku = data.sku.trim().toUpperCase();

    if (state.products.some(p => p.sku.toUpperCase() === sku)) {
      throw new Error(`El SKU "${sku}" ya está registrado.`);
    }

    const newProd: Product = {
      id: "prod-" + Math.random().toString(36).substring(2, 9),
      sku,
      name: data.name.trim(),
      description: data.description?.trim(),
      category_id: data.category_id,
      unit: data.unit || "unidad",
      cost_average: Math.max(0, data.cost_average),
      sale_price: Math.max(0, data.sale_price),
      stock_quantity: Math.max(0, data.initial_stock || 0),
      warning_threshold: data.warning_threshold ?? state.settings.default_warning_threshold,
      critical_threshold: data.critical_threshold ?? state.settings.default_critical_threshold,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.products.push(newProd);

    // If initial stock was provided, create formal opening movement!
    if (newProd.stock_quantity > 0) {
      const mov: InventoryMovement = {
        id: "mov-" + Math.random().toString(36).substring(2, 9),
        product_id: newProd.id,
        product_name: newProd.name,
        sku: newProd.sku,
        movement_type: "initial_inventory",
        quantity_delta: newProd.stock_quantity,
        unit_cost: newProd.cost_average,
        reference_type: "opening",
        reference_id: newProd.id,
        reason: "Inventario inicial de apertura",
        created_at: new Date().toISOString(),
      };
      state.movements.push(mov);
    }

    saveState(state);
    return newProd;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const state = loadState();
    const index = state.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Producto no encontrado");

    // Stock CANNOT be directly modified here as per domain rule!
    const { stock_quantity, cost_average, ...safeUpdates } = updates;
    state.products[index] = {
      ...state.products[index],
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    };
    saveState(state);
    return state.products[index];
  },

  // Stock Adjustment (Formal Transaction)
  async adjustStock(productId: string, newQuantity: number, reason: string): Promise<void> {
    if (newQuantity < 0) throw new Error("El inventario no puede ser negativo.");
    const state = loadState();
    const product = state.products.find(p => p.id === productId);
    if (!product) throw new Error("Producto no encontrado.");

    const delta = newQuantity - product.stock_quantity;
    if (delta === 0) return;

    product.stock_quantity = newQuantity;
    product.updated_at = new Date().toISOString();

    const movement: InventoryMovement = {
      id: "mov-" + Math.random().toString(36).substring(2, 9),
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      movement_type: delta > 0 ? "adjustment_in" : "adjustment_out",
      quantity_delta: delta,
      unit_cost: product.cost_average,
      reference_type: "adjustment",
      reference_id: "adj-" + Date.now(),
      reason: reason.trim(),
      created_at: new Date().toISOString(),
    };

    state.movements.push(movement);
    saveState(state);
  },

  // Providers
  async getProviders(): Promise<Provider[]> {
    const state = loadState();
    return state.providers.map(p => ({
      ...p,
      products_count: state.providerProducts.filter(pp => pp.provider_id === p.id).length,
    }));
  },

  async createProvider(data: Omit<Provider, "id" | "created_at" | "updated_at">): Promise<Provider> {
    const state = loadState();
    const newProv: Provider = {
      id: "prov-" + Math.random().toString(36).substring(2, 9),
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.providers.push(newProv);
    saveState(state);
    return newProv;
  },

  async getProviderProducts(providerId: string): Promise<Product[]> {
    const state = loadState();
    const linkedProductIds = state.providerProducts
      .filter(pp => pp.provider_id === providerId)
      .map(pp => pp.product_id);
    return state.products.filter(p => linkedProductIds.includes(p.id) && p.is_active);
  },

  async linkProviderProduct(providerId: string, productId: string, cost?: number): Promise<void> {
    const state = loadState();
    if (!state.providerProducts.some(pp => pp.provider_id === providerId && pp.product_id === productId)) {
      state.providerProducts.push({
        id: "pp-" + Math.random().toString(36).substring(2, 9),
        provider_id: providerId,
        product_id: productId,
        last_purchase_cost: cost,
      });
      saveState(state);
    }
  },

  // PURCHASES (Transactional execution with weighted average cost calculation)
  async getPurchases(): Promise<Purchase[]> {
    const state = loadState();
    return state.purchases.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
  },

  async receivePurchase(data: {
    provider_id: string;
    purchase_date?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_cost: number;
      line_discount?: number;
    }[];
    notes?: string;
  }): Promise<Purchase> {
    const state = loadState();
    const provider = state.providers.find(p => p.id === data.provider_id);
    if (!provider) throw new Error("Proveedor no encontrado.");

    if (!data.items || data.items.length === 0) {
      throw new Error("La compra debe contener al menos un producto.");
    }

    const purchaseNumber = "COM-" + String(state.purchases.length + 1).padStart(4, "0");
    const purchaseId = "pur-" + Math.random().toString(36).substring(2, 9);
    const purchaseDate = data.purchase_date || new Date().toISOString();

    let subtotal = 0;
    let discountTotal = 0;
    const purchaseItems = [];

    // Atomic pass: validate and calculate
    for (const item of data.items) {
      const product = state.products.find(p => p.id === item.product_id);
      if (!product) throw new Error(`Producto con ID ${item.product_id} no encontrado.`);
      if (item.quantity <= 0) throw new Error(`Cantidad inválida para ${product.name}`);
      if (item.unit_cost < 0) throw new Error(`Costo inválido para ${product.name}`);

      const discount = item.line_discount || 0;
      const lineTotal = (item.quantity * item.unit_cost) - discount;
      subtotal += item.quantity * item.unit_cost;
      discountTotal += discount;

      // WEIGHTED AVERAGE COST FORMULA:
      // nuevo_costo_promedio = ((s * a) + (q * c)) / (s + q)
      const currentStock = product.stock_quantity;
      const currentCost = product.cost_average;
      const newStock = currentStock + item.quantity;
      let newAvgCost = item.unit_cost;

      if (newStock > 0) {
        if (currentStock <= 0) {
          newAvgCost = item.unit_cost;
        } else {
          newAvgCost = ((currentStock * currentCost) + (item.quantity * item.unit_cost)) / newStock;
        }
      }

      product.stock_quantity = newStock;
      product.cost_average = Math.round(newAvgCost);
      product.updated_at = new Date().toISOString();

      purchaseItems.push({
        id: "pi-" + Math.random().toString(36).substring(2, 9),
        purchase_id: purchaseId,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        line_discount: discount,
        line_total: lineTotal,
      });

      // Insert immutable movement
      state.movements.push({
        id: "mov-" + Math.random().toString(36).substring(2, 9),
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        movement_type: "purchase_receipt",
        quantity_delta: item.quantity,
        unit_cost: item.unit_cost,
        reference_type: "purchase",
        reference_id: purchaseId,
        reason: `Recepción de compra ${purchaseNumber}`,
        created_at: new Date().toISOString(),
      });

      // Ensure link in provider_products
      const pp = state.providerProducts.find(x => x.provider_id === provider.id && x.product_id === product.id);
      if (pp) {
        pp.last_purchase_cost = item.unit_cost;
      } else {
        state.providerProducts.push({
          id: "pp-" + Math.random().toString(36).substring(2, 9),
          provider_id: provider.id,
          product_id: product.id,
          last_purchase_cost: item.unit_cost,
        });
      }
    }

    const total = Math.max(0, subtotal - discountTotal);

    const purchase: Purchase = {
      id: purchaseId,
      purchase_number: purchaseNumber,
      provider_id: provider.id,
      provider_name: provider.name,
      status: "received",
      purchase_date: purchaseDate,
      subtotal,
      tax_total: 0,
      discount_total: discountTotal,
      total,
      notes: data.notes?.trim(),
      created_at: new Date().toISOString(),
      items: purchaseItems,
    };

    state.purchases.push(purchase);
    saveState(state);
    return purchase;
  },

  // SALES (Transactional POS with strict stock validation & cost snapshot)
  async getSales(): Promise<Sale[]> {
    const state = loadState();
    return state.sales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
  },

  async processSale(data: {
    customer_name?: string;
    payment_method: Sale["payment_method"];
    items: {
      product_id: string;
      quantity: number;
      unit_price: number;
      line_discount?: number;
    }[];
    notes?: string;
  }): Promise<Sale> {
    const state = loadState();

    if (!data.items || data.items.length === 0) {
      throw new Error("Debe agregar al menos un producto a la venta.");
    }

    // Consolidate quantities per product to verify total stock demand
    const consolidatedDemand = new Map<string, number>();
    for (const item of data.items) {
      if (item.quantity <= 0) throw new Error("La cantidad debe ser mayor que cero.");
      const current = consolidatedDemand.get(item.product_id) || 0;
      consolidatedDemand.set(item.product_id, current + item.quantity);
    }

    // STRICT STOCK VERIFICATION: Reject sale completely if any item exceeds stock!
    for (const [productId, requiredQty] of consolidatedDemand.entries()) {
      const product = state.products.find(p => p.id === productId);
      if (!product) throw new Error(`Producto no encontrado.`);
      if (!product.is_active) throw new Error(`El producto "${product.name}" está inactivo.`);
      if (product.stock_quantity < requiredQty) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock_quantity}, Requerido: ${requiredQty}.`
        );
      }
    }

    const saleNumber = "VEN-" + String(state.sales.length + 1).padStart(4, "0");
    const saleId = "sale-" + Math.random().toString(36).substring(2, 9);
    const saleDate = new Date().toISOString();

    let subtotal = 0;
    let discountTotal = 0;
    const saleItems = [];

    // Atomic execution
    for (const item of data.items) {
      const product = state.products.find(p => p.id === item.product_id)!;
      const discount = item.line_discount || 0;
      const lineTotal = (item.quantity * item.unit_price) - discount;

      subtotal += item.quantity * item.unit_price;
      discountTotal += discount;

      // Decrement stock
      product.stock_quantity -= item.quantity;
      product.updated_at = new Date().toISOString();

      // Snapshot the cost average at the exact time of sale
      saleItems.push({
        id: "si-" + Math.random().toString(36).substring(2, 9),
        sale_id: saleId,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost_snapshot: product.cost_average, // Crucial for accurate gross profit!
        line_discount: discount,
        line_total: lineTotal,
      });

      // Insert immutable inventory movement (negative delta)
      state.movements.push({
        id: "mov-" + Math.random().toString(36).substring(2, 9),
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        movement_type: "sale",
        quantity_delta: -item.quantity,
        unit_cost: product.cost_average,
        reference_type: "sale",
        reference_id: saleId,
        reason: `Venta ${saleNumber}`,
        created_at: new Date().toISOString(),
      });
    }

    const total = Math.max(0, subtotal - discountTotal);

    const sale: Sale = {
      id: saleId,
      sale_number: saleNumber,
      status: "completed",
      sale_date: saleDate,
      customer_name: data.customer_name?.trim() || "Cliente General",
      payment_method: data.payment_method,
      subtotal,
      discount_total: discountTotal,
      tax_total: 0,
      total,
      notes: data.notes?.trim(),
      created_at: new Date().toISOString(),
      items: saleItems,
    };

    state.sales.push(sale);
    saveState(state);
    return sale;
  },

  // Anulación trazable de venta con reversión de inventario
  async cancelSale(saleId: string, reason: string): Promise<void> {
    const state = loadState();
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) throw new Error("Venta no encontrada.");
    if (sale.status === "cancelled") throw new Error("La venta ya fue anulada.");

    sale.status = "cancelled";
    sale.notes = (sale.notes ? sale.notes + " | " : "") + `Anulada: ${reason}`;

    // Revert inventory stock
    for (const item of sale.items) {
      const product = state.products.find(p => p.id === item.product_id);
      if (product) {
        product.stock_quantity += item.quantity;
        product.updated_at = new Date().toISOString();

        state.movements.push({
          id: "mov-" + Math.random().toString(36).substring(2, 9),
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          movement_type: "reversal",
          quantity_delta: item.quantity,
          unit_cost: item.unit_cost_snapshot,
          reference_type: "sale_cancellation",
          reference_id: sale.id,
          reason: `Anulación de venta ${sale.sale_number}: ${reason}`,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveState(state);
  },

  // EXPENSES
  async getExpenses(): Promise<Expense[]> {
    const state = loadState();
    return state.expenses.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  },

  async createExpense(data: {
    description: string;
    category: string;
    amount: number;
    expense_date?: string;
    provider_name?: string;
    payment_method?: string;
    notes?: string;
  }): Promise<Expense> {
    if (data.amount <= 0) throw new Error("El monto del gasto debe ser mayor que cero.");
    const state = loadState();

    const expense: Expense = {
      id: "exp-" + Math.random().toString(36).substring(2, 9),
      description: data.description.trim(),
      category: data.category.trim(),
      amount: data.amount,
      expense_date: data.expense_date || new Date().toISOString(),
      provider_name: data.provider_name?.trim(),
      payment_method: data.payment_method || "efectivo",
      notes: data.notes?.trim(),
      created_at: new Date().toISOString(),
    };

    state.expenses.push(expense);
    saveState(state);
    return expense;
  },

  async cancelExpense(id: string, reason: string): Promise<void> {
    const state = loadState();
    const exp = state.expenses.find(e => e.id === id);
    if (!exp) throw new Error("Gasto no encontrado.");
    exp.cancelled_at = new Date().toISOString();
    exp.cancellation_reason = reason.trim();
    saveState(state);
  },

  // MOVEMENTS
  async getMovements(productId?: string): Promise<InventoryMovement[]> {
    const state = loadState();
    let list = state.movements;
    if (productId) {
      list = list.filter(m => m.product_id === productId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // KPIS AND ANALYTICS
  async getKPISummary(period: "today" | "week" | "month" | "year" = "month"): Promise<KPISummary> {
    const state = loadState();
    const now = new Date();
    let startDate = new Date();

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const startMs = startDate.getTime();

    // Completed sales in period
    const periodSales = state.sales.filter(
      s => s.status === "completed" && new Date(s.sale_date).getTime() >= startMs
    );
    const periodSalesTotal = periodSales.reduce((acc, s) => acc + s.total, 0);

    // Cost of goods sold (COGS) strictly derived from unit_cost_snapshot!
    let periodCOGS = 0;
    for (const sale of periodSales) {
      for (const item of sale.items) {
        periodCOGS += item.quantity * item.unit_cost_snapshot;
      }
    }

    // Gross profit = Sales revenue - COGS
    const periodGrossProfit = periodSalesTotal - periodCOGS;

    // Received purchases in period
    const periodPurchases = state.purchases.filter(
      p => p.status === "received" && new Date(p.purchase_date).getTime() >= startMs
    );
    const periodPurchasesTotal = periodPurchases.reduce((acc, p) => acc + p.total, 0);

    // Active expenses in period
    const periodExpenses = state.expenses.filter(
      e => !e.cancelled_at && new Date(e.expense_date).getTime() >= startMs
    );
    const periodExpensesTotal = periodExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Total valuation of current inventory: sum(stock_quantity * cost_average)
    const inventoryValueTotal = state.products
      .filter(p => p.is_active)
      .reduce((acc, p) => acc + (p.stock_quantity * p.cost_average), 0);

    // Stock alerts calculation
    let lowStockCount = 0;
    let criticalStockCount = 0;

    for (const p of state.products.filter(p => p.is_active)) {
      const warn = p.warning_threshold ?? state.settings.default_warning_threshold;
      const crit = p.critical_threshold ?? state.settings.default_critical_threshold;

      if (p.stock_quantity <= crit) {
        criticalStockCount++;
      } else if (p.stock_quantity <= warn) {
        lowStockCount++;
      }
    }

    return {
      periodSalesTotal,
      periodSalesCount: periodSales.length,
      periodPurchasesTotal,
      periodPurchasesCount: periodPurchases.length,
      periodExpensesTotal,
      periodGrossProfit,
      inventoryValueTotal,
      lowStockProductsCount: lowStockCount,
      criticalStockProductsCount: criticalStockCount,
    };
  },

  // Helper: Get stock status for a single product
  getStockStatus(product: Product, settings?: BusinessSettings): StockAlertStatus {
    const warn = product.warning_threshold ?? (settings?.default_warning_threshold || 5);
    const crit = product.critical_threshold ?? (settings?.default_critical_threshold || 2);

    if (product.stock_quantity <= crit) return "critical";
    if (product.stock_quantity <= warn) return "warning";
    return "normal";
  },

  // Export full JSON backup
  exportBackup(): string {
    return JSON.stringify(loadState(), null, 2);
  },

  // Restore backup
  restoreBackup(jsonString: string): void {
    const parsed = JSON.parse(jsonString);
    if (!parsed.products || !parsed.settings) throw new Error("Formato de backup inválido.");
    saveState(parsed);
  },
};
