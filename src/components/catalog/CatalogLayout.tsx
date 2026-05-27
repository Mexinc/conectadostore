import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Search, Menu, Laptop } from "lucide-react";
import CategoryMenu from "./CategoryMenu";

interface CatalogLayoutProps {
  children: React.ReactNode;
  initialSearch?: string;
}

const CatalogLayout = ({ children, initialSearch = "" }: CatalogLayoutProps) => {
  const [search, setSearch] = useState(initialSearch);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => setSearch(initialSearch), [initialSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (q) navigate(`/catalogo/buscar?q=${encodeURIComponent(q)}`);
    else navigate("/catalogo");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          {/* Mobile menu */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto p-0">
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark">
                    <Laptop className="h-4 w-4 text-brand-yellow" />
                  </div>
                  ConectadoStore
                </SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <CategoryMenu onNavigate={() => setDrawerOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/catalogo" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark">
              <Laptop className="h-5 w-5 text-brand-yellow" />
            </div>
            <span className="hidden text-lg font-bold tracking-tight sm:inline">ConectadoStore</span>
          </Link>

          <form onSubmit={handleSearch} className="relative ml-2 flex-1 max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca, modelo, categoria…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-20"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-brand-dark text-brand-yellow hover:bg-foreground"
            >
              Buscar
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-card p-3">
            <CategoryMenu />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};

export default CatalogLayout;
