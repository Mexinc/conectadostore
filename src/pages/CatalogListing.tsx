import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CatalogLayout from "@/components/catalog/CatalogLayout";
import PublicProductCard from "@/components/catalog/PublicProductCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";
import {
  CATEGORIES,
  CONDITIONS,
  getCategory,
  getSubcategory,
} from "@/lib/categories";
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

  // Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [availabilityOnly, setAvailabilityOnly] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 0]);

  const catConfig = category ? getCategory(category) : undefined;
  const subConfig = category && subcategory ? getSubcategory(category, subcategory) : undefined;

  // Reset filters when route changes
  useEffect(() => {
    setSelectedBrands([]);
    setSelectedConditions([]);
    setAvailabilityOnly(true);
  }, [category, subcategory, query]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });

      if (mode === "category" && category) {
        q = q.eq("category", category);
        if (subcategory) q = q.eq("subcategory", subcategory);
      }

      if (mode === "search" && query) {
        // ilike across multiple fields
        const pattern = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`;
        const filter = SEARCHABLE_FIELDS.map((f) => `${f}.ilike.${pattern}`).join(",");
        q = q.or(filter);
      }

      // Public listing: only show items the catalog should display
      // (available + reserved + sold all OK because anon RLS already restricts to available;
      //  admin previewing also sees only available via RLS)
      const { data } = await q;
      const rows = (data || []) as Product[];
      setProducts(rows);

      if (rows.length > 0) {
        const prices = rows.map((p) => Number(p.price));
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));
        setPriceBounds([min, max]);
        setPriceRange([min, max]);
      } else {
        setPriceBounds([0, 0]);
        setPriceRange([0, 0]);
      }
      setLoading(false);
    };
    load();
  }, [mode, category, subcategory, query]);

  // Brand options for current result set
  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const b = (p as any).brand?.trim();
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const ap = p as any;
      if (availabilityOnly && p.status !== "available") return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(ap.brand)) return false;
      if (selectedConditions.length > 0 && !selectedConditions.includes(ap.condition)) return false;
      const price = Number(p.price);
      if (priceBounds[1] > 0 && (price < priceRange[0] || price > priceRange[1])) return false;
      return true;
    });
  }, [products, selectedBrands, selectedConditions, availabilityOnly, priceRange, priceBounds]);

  // Group search results by category for smart-search display
  const grouped = useMemo(() => {
    if (mode !== "search") return null;
    const map = new Map<string, Product[]>();
    filtered.forEach((p) => {
      const key = (p as any).category || "outros";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries());
  }, [filtered, mode]);

  const title =
    mode === "search"
      ? `Resultados para "${query}"`
      : subConfig
      ? `${catConfig?.label} · ${subConfig.label}`
      : catConfig?.label ?? "Catálogo";

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedConditions([]);
    setAvailabilityOnly(true);
    setPriceRange(priceBounds);
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedConditions.length > 0 ||
    !availabilityOnly ||
    priceRange[0] !== priceBounds[0] ||
    priceRange[1] !== priceBounds[1];

  const FiltersPanel = (
    <div className="space-y-6">
      {brandOptions.length > 0 && (
        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Marca
          </Label>
          <div className="space-y-2">
            {brandOptions.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedBrands.includes(b)}
                  onCheckedChange={() => toggle(selectedBrands, b, setSelectedBrands)}
                />
                {b}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Estado
        </Label>
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label key={c.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={selectedConditions.includes(c.value)}
                onCheckedChange={() => toggle(selectedConditions, c.value, setSelectedConditions)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Disponibilidade
        </Label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={availabilityOnly}
            onCheckedChange={(v) => setAvailabilityOnly(v === true)}
          />
          Apenas disponíveis
        </label>
      </div>

      {priceBounds[1] > 0 && (
        <div>
          <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Faixa de preço
          </Label>
          <Slider
            min={priceBounds[0]}
            max={priceBounds[1]}
            step={Math.max(1, Math.round((priceBounds[1] - priceBounds[0]) / 100))}
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>R$ {priceRange[0].toLocaleString("pt-BR")}</span>
            <span>R$ {priceRange[1].toLocaleString("pt-BR")}</span>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
          <X className="mr-1.5 h-3.5 w-3.5" /> Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <CatalogLayout initialSearch={mode === "search" ? query : ""}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        {/* Filters drawer for mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden">
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            {FiltersPanel}
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            {FiltersPanel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          ) : grouped ? (
            <div className="space-y-8">
              {grouped.map(([catKey, items]) => {
                const c = getCategory(catKey);
                return (
                  <section key={catKey}>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {c?.label ?? catKey} <span className="text-foreground/40">({items.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((p) => (
                        <PublicProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <PublicProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </CatalogLayout>
  );
};

export default CatalogListing;
