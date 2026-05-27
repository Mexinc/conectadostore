import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CatalogLayout from "@/components/catalog/CatalogLayout";
import PublicProductCard from "@/components/catalog/PublicProductCard";
import { CATEGORIES } from "@/lib/categories";
import type { Tables } from "@/integrations/supabase/types";
import { Sparkles, ArrowRight } from "lucide-react";

type Product = Tables<"products">;

const Catalog = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: feat }, { data: rec }] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("status", "available")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("products")
          .select("*")
          .eq("status", "available")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      setFeatured(feat || []);
      setRecent(rec || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <CatalogLayout>
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark to-foreground p-6 sm:p-10">
        <h1 className="text-2xl font-bold text-background sm:text-4xl">
          Tecnologia confiável,{" "}
          <span className="text-brand-yellow">preço justo.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-background/70 sm:text-base">
          Notebooks, iPhones, impressoras e acessórios com garantia própria. Encontre o seu na vitrine abaixo.
        </p>
      </section>

      {/* Category grid */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-foreground">Categorias</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.key}
                to={`/catalogo/categoria/${cat.key}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-yellow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow/15 text-foreground transition-colors group-hover:bg-brand-yellow">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      {(loading || featured.length > 0) && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-yellow" />
            <h2 className="text-lg font-bold text-foreground">Ofertas em destaque</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((p) => (
                <PublicProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recent */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Mais recentes</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhum produto disponível no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recent.map((p) => (
              <PublicProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </CatalogLayout>
  );
};

export default Catalog;
