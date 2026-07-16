import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CatalogLayout from "@/components/catalog/CatalogLayout";
import PublicProductCard from "@/components/catalog/PublicProductCard";
import { getCategory, getSubcategory } from "@/lib/categories";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const SEARCHABLE_FIELDS = [
  "name",
  "brand",
  "model",
  "description",
  "subcategory",
  "category",
  "processor",
  "ram",
  "storage",
  "screen",
  "gpu",
  "os",
  "color",
  "condition",
];

interface ListingProps {
  mode: "category" | "search";
}

const CatalogListing = ({ mode }: ListingProps) => {
  const { category, subcategory } = useParams();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const catConfig = category ? getCategory(category) : undefined;
  const subConfig = category && subcategory ? getSubcategory(category, subcategory) : undefined;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("products")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (mode === "category" && category) {
        q = q.eq("category", category);
        if (subcategory) q = q.eq("subcategory", subcategory);
      }

      if (mode === "search" && query) {
        const pattern = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`;
        const filter = SEARCHABLE_FIELDS.map((f) => `${f}.ilike.${pattern}`).join(",");
        q = q.or(filter);
      }

      const { data } = await q;
      setProducts((data || []) as Product[]);
      setLoading(false);
    };
    load();
  }, [mode, category, subcategory, query]);

  const title = useMemo(
    () =>
      mode === "search"
        ? `Resultados para "${query}"`
        : subConfig
        ? `${catConfig?.label} · ${subConfig.label}`
        : catConfig?.label ?? "Catálogo",
    [mode, query, catConfig, subConfig],
  );

  return (
    <CatalogLayout initialSearch={mode === "search" ? query : ""}>
      <div className="mb-4">
        <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado.
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {products.length} {products.length === 1 ? "produto" : "produtos"}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <PublicProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </CatalogLayout>
  );
};

export default CatalogListing;
