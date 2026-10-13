import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, TabType } from "@/src/components/layout/Sidebar";
import { Header } from "@/src/components/layout/Header";
import { DashboardView } from "@/src/features/dashboard/DashboardView";
import { InventoryView } from "@/src/features/inventory/InventoryView";
import { ProvidersView } from "@/src/features/providers/ProvidersView";
import { PurchasesView } from "@/src/features/purchases/PurchasesView";
import { SalesView } from "@/src/features/sales/SalesView";
import { ExpensesView } from "@/src/features/expenses/ExpensesView";
import { ProjectionsView } from "@/src/features/projections/ProjectionsView";
import { ReportsView } from "@/src/features/reports/ReportsView";
import { SettingsView } from "@/src/features/settings/SettingsView";
import { NewProductModal } from "@/src/components/modals/NewProductModal";
import { NewCategoryModal } from "@/src/components/modals/NewCategoryModal";

import { 
  Product, Category, Provider, Purchase, Sale, Expense, BusinessSettings, KPISummary 
} from "@/src/types/domain";
import { db } from "@/src/services/db";

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dashboardPeriod, setDashboardPeriod] = useState<"today" | "week" | "month" | "year">("month");

  // Domain data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);

  // Load all database state
  const loadData = useCallback(async () => {
    try {
      const [
        prodsData,
        catsData,
        provsData,
        pursData,
        salesData,
        expsData,
        settingsData,
        kpisData,
      ] = await Promise.all([
        db.getProducts(),
        db.getCategories(),
        db.getProviders(),
        db.getPurchases(),
        db.getSales(),
        db.getExpenses(),
        db.getSettings(),
        db.getKPISummary(dashboardPeriod),
      ]);

      setProducts(prodsData);
      setCategories(catsData);
      setProviders(provsData);
      setPurchases(pursData);
      setSales(salesData);
      setExpenses(expsData);
      setSettings(settingsData);
      setKpis(kpisData);
    } catch (err) {
      console.error("Error loading DMX System data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle period change in dashboard
  const handleChangePeriod = async (newPeriod: "today" | "week" | "month" | "year") => {
    setDashboardPeriod(newPeriod);
    const newKpis = await db.getKPISummary(newPeriod);
    setKpis(newKpis);
  };

  const criticalStockCount = kpis?.criticalStockProductsCount || 0;
  const lowStockCount = kpis?.lowStockProductsCount || 0;

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-slate-900 flex font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        criticalAlertsCount={criticalStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          criticalStockCount={criticalStockCount}
          lowStockCount={lowStockCount}
          onNavigateToInventory={() => setCurrentTab("inventory")}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-[#5D79DF] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Cargando datos de DMX System...</p>
            </div>
          ) : (
            <>
              {currentTab === "dashboard" && kpis && (
                <DashboardView
                  kpis={kpis}
                  period={dashboardPeriod}
                  onChangePeriod={handleChangePeriod}
                  products={products}
                  recentPurchases={purchases}
                  recentSales={sales}
                  onOpenNewProduct={() => setIsNewProductOpen(true)}
                  onOpenNewPurchase={() => setCurrentTab("purchases")}
                  onOpenNewSale={() => setIsNewSaleOpen(true)}
                  onOpenNewExpense={() => setIsNewExpenseOpen(true)}
                  onNavigateToInventory={() => setCurrentTab("inventory")}
                />
              )}

              {currentTab === "inventory" && (
                <InventoryView
                  products={products}
                  categories={categories}
                  onRefresh={loadData}
                  onOpenNewProduct={() => setIsNewProductOpen(true)}
                  onOpenNewCategory={() => setIsNewCategoryOpen(true)}
                />
              )}

              {currentTab === "providers" && (
                <ProvidersView
                  providers={providers}
                  products={products}
                  onRefresh={loadData}
                />
              )}

              {currentTab === "purchases" && (
                <PurchasesView
                  purchases={purchases}
                  providers={providers}
                  products={products}
                  onRefresh={loadData}
                  onOpenNewExpense={() => setIsNewExpenseOpen(true)}
                />
              )}

              {currentTab === "sales" && (
                <SalesView
                  sales={sales}
                  products={products}
                  onRefresh={loadData}
                  onOpenNewSale={() => setIsNewSaleOpen(true)}
                  isNewSaleOpen={isNewSaleOpen}
                  onCloseNewSale={() => setIsNewSaleOpen(false)}
                />
              )}

              {currentTab === "expenses" && (
                <ExpensesView
                  expenses={expenses}
                  onRefresh={loadData}
                  isNewExpenseOpen={isNewExpenseOpen}
                  onCloseNewExpense={() => setIsNewExpenseOpen(false)}
                  onOpenNewExpense={() => setIsNewExpenseOpen(true)}
                />
              )}

              {currentTab === "projections" && kpis && (
                <ProjectionsView
                  kpis={kpis}
                  expenses={expenses}
                  purchases={purchases}
                  sales={sales}
                />
              )}

              {currentTab === "reports" && (
                <ReportsView
                  products={products}
                  sales={sales}
                  purchases={purchases}
                  expenses={expenses}
                />
              )}

              {currentTab === "settings" && settings && (
                <SettingsView
                  settings={settings}
                  categories={categories}
                  onRefresh={loadData}
                  onOpenNewCategory={() => setIsNewCategoryOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Shared Modals */}
      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        categories={categories}
        onProductCreated={loadData}
      />

      <NewCategoryModal
        isOpen={isNewCategoryOpen}
        onClose={() => setIsNewCategoryOpen(false)}
        onCategoryCreated={loadData}
      />
    </div>
  );
}
