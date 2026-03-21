import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Laptop } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const extractSpec = (description: string, label: string) => {
  const lower = description.toLowerCase();
  if (label === "processador") {
    const match = description.match(/(?:i[3579][\s-]?\d{4,5}\w*|Ryzen\s*\d\s*\d{4}\w*|M[1-4]\s*(?:Pro|Max|Ultra)?)/i);
    return match ? match[0] : null;
  }
  if (label === "ram") {
    const match = description.match(/(\d+\s*GB)\s*(?:RAM|DDR|de\s*RAM)/i);
    return match ? match[1] + " RAM" : null;
  }
  if (label === "armazenamento") {
    const match = description.match(/(\d+\s*(?:GB|TB))\s*(?:SSD|NVMe|HD|HDD)/i);
    if (match) {
      const type = lower.includes("nvme") ? "NVMe" : lower.includes("ssd") ? "SSD" : "HD";
      return match[1] + " " + type;
    }
    return null;
  }
  return null;
};

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark">
              <Laptop className="h-5 w-5 text-brand-yellow" />
            </div>
            <span className="text-lg font-bold tracking-tight">ConectadoStore</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Notebooks</h1>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {search ? "Nenhum produto encontrado" : "Nenhum produto disponível no momento"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, index) => {
              const proc = extractSpec(product.description, "processador");
              const ram = extractSpec(product.description, "ram");
              const storage = extractSpec(product.description, "armazenamento");
              const specs = [proc, ram, storage].filter(Boolean).join(" • ");

              return (
                <div
                  key={product.id}
                  className="animate-fade-up group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => navigate(`/catalogo/${product.id}`)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {product.photos.length > 0 ? (
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/40 text-sm">
                        Sem foto
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-sm font-semibold text-foreground">{product.name}</h3>
                    {specs && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{specs}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {formatPrice(product.price)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs active:scale-[0.97] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/catalogo/${product.id}`);
                        }}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;
