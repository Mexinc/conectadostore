import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import { Plus, Search, LogOut, Laptop, Link2, Filter } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const TABS = [
  { value: "notebook", label: "Notebooks" },
  { value: "macbook", label: "Macbooks" },
  { value: "iphone", label: "iPhones" },
];

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("notebook");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar produtos");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    if (product.photos.length > 0) {
      const paths = product.photos.map((url) => {
        const parts = url.split("/product-photos/");
        return parts[parts.length - 1];
      });
      await supabase.storage.from("product-photos").remove(paths);
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir produto");
    } else {
      toast.success("Produto excluído");
      fetchProducts();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filtered = products
    .filter((p) => ((p as any).category || "notebook") === tab)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => statusFilter === "all" || p.status === statusFilter);

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

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="w-full sm:w-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-1 sm:flex-none">
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
                placeholder="Buscar produto..."
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
              Copiar link do catálogo
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado nesta categoria"}
            </p>
            {!search && (
              <Button
                onClick={() => navigate("/products/new")}
                variant="outline"
                className="mt-4"
              >
                Cadastrar primeiro produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ProductCard
                  product={product}
                  onEdit={() => navigate(`/products/${product.id}/edit`)}
                  onDelete={() => handleDelete(product.id)}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
