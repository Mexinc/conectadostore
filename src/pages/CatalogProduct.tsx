import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Loader2, Laptop } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const CatalogProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("status", "available")
      .single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/catalogo"); return; }
        setProduct(data);
        setLoading(false);
      });
  }, [id, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || !product) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setGalleryIndex((i) => (i + 1) % product.photos.length);
      else setGalleryIndex((i) => (i - 1 + product.photos.length) % product.photos.length);
    }
    setTouchStart(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) return null;

  const p = product as any;
  const specFields = [
    { label: "Processador", value: p.processor },
    { label: "Memória RAM", value: p.ram },
    { label: "Armazenamento", value: p.storage },
    { label: "Tela", value: p.screen },
    { label: "Placa de Vídeo", value: p.gpu },
    { label: "Bateria", value: p.battery },
    { label: "Sistema Operacional", value: p.os },
    { label: "Conectividade", value: p.connectivity },
    { label: "Peso", value: p.weight },
    { label: "Cor", value: p.color },
    { label: "Estado de Conservação", value: p.condition },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-background">
      {/* Fullscreen gallery */}
      {fullscreen && product.photos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background hover:bg-background/30">
            <X className="h-5 w-5" />
          </button>
          <img src={product.photos[galleryIndex]} alt={product.name} className="max-h-[90vh] max-w-[90vw] object-contain" />
          {product.photos.length > 1 && (
            <>
              <button onClick={() => setGalleryIndex((i) => (i - 1 + product.photos.length) % product.photos.length)} className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background hover:bg-background/30">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setGalleryIndex((i) => (i + 1) % product.photos.length)} className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background hover:bg-background/30">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-4 flex gap-1.5">
            {product.photos.map((_, i) => (
              <button key={i} onClick={() => setGalleryIndex(i)} className={`h-2 w-2 rounded-full transition-all ${i === galleryIndex ? "bg-brand-yellow w-4" : "bg-background/40"}`} />
            ))}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/catalogo")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark">
              <Laptop className="h-4 w-4 text-brand-yellow" />
            </div>
            <span className="text-sm font-bold tracking-tight">ConectadoStore</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 animate-fade-up">
        {/* Gallery */}
        {product.photos.length > 0 && (
          <div className="mb-6">
            <div className="relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-muted" onClick={() => setFullscreen(true)} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <img src={product.photos[galleryIndex]} alt={product.name} className="h-full w-full object-contain" />
              {product.photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {product.photos.map((_, i) => (
                    <span key={i} className={`h-2 rounded-full transition-all ${i === galleryIndex ? "bg-brand-yellow w-4" : "bg-foreground/30 w-2"}`} />
                  ))}
                </div>
              )}
            </div>
            {product.photos.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {product.photos.map((url, i) => (
                  <button key={i} onClick={() => setGalleryIndex(i)} className={`shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${i === galleryIndex ? "border-brand-yellow" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <span className="mt-2 inline-block text-2xl font-bold tabular-nums text-foreground">{formatPrice(product.price)}</span>
          </div>

          {/* Specs */}
          {specFields.length > 0 && (
            <div className="rounded-xl bg-muted p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Especificações</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {specFields.map((s) => (
                  <div key={s.label} className="rounded-lg bg-card p-3">
                    <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Descrição</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{product.description}</p>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate("/catalogo")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao catálogo
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CatalogProduct;
