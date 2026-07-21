import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import OfflineBanner from "./components/OfflineBanner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import WarrantyForm from "./pages/WarrantyForm";
import Catalog from "./pages/Catalog";
import CatalogProduct from "./pages/CatalogProduct";
import CatalogListing from "./pages/CatalogListing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-yellow border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Login />;

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <OfflineBanner />
        <BrowserRouter>
          <Routes>
            {/* Public catalog routes */}
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/catalogo/buscar" element={<CatalogListing mode="search" />} />
            <Route path="/catalogo/categoria/:category" element={<CatalogListing mode="category" />} />
            <Route path="/catalogo/categoria/:category/:subcategory" element={<CatalogListing mode="category" />} />
            <Route path="/catalogo/:id" element={<CatalogProduct />} />

            {/* Admin routes (auth required) */}
            <Route path="/" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
            <Route path="/admin" element={<AuthWrapper><Navigate to="/products/new" replace /></AuthWrapper>} />
            <Route path="/products/new" element={<AuthWrapper><ProductForm /></AuthWrapper>} />
            <Route path="/products/:id" element={<AuthWrapper><ProductDetail /></AuthWrapper>} />
            <Route path="/products/:id/warranty" element={<AuthWrapper><WarrantyForm /></AuthWrapper>} />
            <Route path="/products/:id/edit" element={<AuthWrapper><ProductForm /></AuthWrapper>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
