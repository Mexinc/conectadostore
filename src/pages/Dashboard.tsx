import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  LogOut,
  Laptop,
  Link2,
  Filter,
  Pencil,
  Trash2,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { Tables } from "@/integrations/supabase/types";
import { CATEGORIES, getCategoryLabel, getSubcategoryLabel } from "@/lib/categories";

type Product = Tables<"products">;

const TABS = [
  { value: "all", label: "Todos" },
  ...CATEGORIES.map((c) => ({ value: c.key, label: c.label })),
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar produtos");
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (!window.confirm(`Excluir "${product.name}"?`)) return;

    if (product.photos.length > 0) {
      const paths = product.photos.map((url) => url.split("/product-photos/").pop()!).filter(Boolean);
      await supabase.storage.from("product-photos").remove(paths);
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir produto");
    else {
      toast.success("Produto excluído");
      fetchProducts();
    }
  };

  const handleQuickStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("products").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      toast.success("Status atualizado");
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ is_featured: !current } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar destaque");
    else {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? ({ ...p, is_featured: !current } as any) : p))
      );
      toast.success(!current ? "Marcado como destaque" : "Removido dos destaques");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filtered = useMemo(() => {
    let list = products;

    if (tab !== "all") {
      list = list.filter((p) => ((p as any).category || "notebook") === tab);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((p) => {
        const ap = p as any;
        return [p.name, ap.brand, ap.model, ap.subcategory, p.description]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(q));
      });
    }

    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [products, tab, search, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark">
              <Laptop className="h-5 w-5 text-brand-yellow" />
            </div>
            <span className="text-lg font-bold tracking-tight">ConectadoStore</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-1 sm:w-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, marca, modelo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="reserved">Reservado</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/catalogo`;
                navigator.clipboard.writeText(url);
                toast.success("Link do catálogo copiado!");
              }}
              className="active:scale-[0.97] transition-all"
            >
              <Link2 className="mr-1.5 h-4 w-4" />
              Copiar link
            </Button>
            <Button
              onClick={() => navigate("/products/new")}
              className="bg-brand-dark text-brand-yellow hover:bg-foreground active:scale-[0.98] transition-all"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {search || statusFilter !== "all" || tab !== "all"
                ? "Nenhum produto encontrado"
                : "Nenhum produto cadastrado"}
            </p>
            {!search && statusFilter === "all" && tab === "all" && (
              <Button onClick={() => navigate("/products/new")} variant="outline" className="mt-4">
                Cadastrar primeiro produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product, index) => {
              const ap = product as any;
              return (
                <div
                  key={product.id}
                  className="animate-fade-up group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div
                    className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.photos.length > 0 ? (
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground/40">
                        Sem foto
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <StatusBadge status={product.status} />
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>{getCategoryLabel(ap.category || "notebook")}</span>
                      {ap.subcategory && (
                        <>
                          <span>·</span>
                          <span>{getSubcategoryLabel(ap.category, ap.subcategory)}</span>
                        </>
                      )}
                    </div>
                    <h3
                      className="cursor-pointer truncate text-sm font-semibold text-foreground hover:text-brand-dark"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    {(ap.brand || ap.model) && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[ap.brand, ap.model].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Select
                        value={product.status}
                        onValueChange={(v) => handleQuickStatus(product.id, v)}
                      >
                        <SelectTrigger className="h-8 flex-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="reserved">Reservado</SelectItem>
                          <SelectItem value="sold">Vendido</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

export default Dashboard;
