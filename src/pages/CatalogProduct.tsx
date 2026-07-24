import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  MessageCircle,
  Share2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import CatalogLayout from "@/components/catalog/CatalogLayout";
import { buildProductShareUrl, buildWhatsappUrl, shortCode } from "@/lib/store-config";
import { getCategoryLabel, getSubcategoryLabel } from "@/lib/categories";
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
    setLoading(true);
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate("/catalogo");
          return;
        }
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
      <CatalogLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CatalogLayout>
    );
  }

  if (!product) return null;

  const p = product as any;
  const isAvailable = product.status === "available";
  const code = shortCode(product.id);

  const whatsappMsg = `Olá, tenho interesse no produto:
Produto: ${product.name}
Modelo: ${p.model || p.processor || "-"}
Preço: ${formatPrice(product.price)}
Código: ${code}`;

  const handleShare = async () => {
    const url = buildProductShareUrl(product.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.name, url });
        return;
      } catch {
        /* canceled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const isIphone = p.subcategory === "iphone" || p.category === "iphone";
  const specFields = (isIphone
    ? [
        { label: "Modelo", value: p.model || p.processor },
        { label: "Armazenamento", value: p.storage },
        { label: "Cor", value: p.color },
        { label: "Saúde da Bateria", value: p.battery_health },
        { label: "iOS", value: p.os },
        { label: "Rede", value: p.network },
        { label: "IMEI", value: p.imei },
        { label: "Acompanhamentos", value: p.accessories },
        { label: "Estado de Conservação", value: p.condition },
      ]
    : [
        { label: "Marca", value: p.brand },
        { label: "Modelo", value: p.model },
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
      ]
  ).filter((s) => s.value);

  return (
    <CatalogLayout>
      {/* Fullscreen gallery */}
      {fullscreen && product.photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background hover:bg-background/30"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={product.photos[galleryIndex]}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          {product.photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setGalleryIndex((i) => (i - 1 + product.photos.length) % product.photos.length)
                }
                className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background hover:bg-background/30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setGalleryIndex((i) => (i + 1) % product.photos.length)}
                className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background hover:bg-background/30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/catalogo" className="hover:text-foreground">Início</Link>
        {p.category && (
          <>
            <span>/</span>
            <Link to={`/catalogo/categoria/${p.category}`} className="hover:text-foreground">
              {getCategoryLabel(p.category)}
            </Link>
          </>
        )}
        {p.subcategory && (
          <>
            <span>/</span>
            <Link
              to={`/catalogo/categoria/${p.category}/${p.subcategory}`}
              className="hover:text-foreground"
            >
              {getSubcategoryLabel(p.category, p.subcategory)}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Gallery */}
        <div>
          {product.photos.length > 0 ? (
            <>
              <div
                className="relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-muted"
                onClick={() => setFullscreen(true)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={product.photos[galleryIndex]}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
              {product.photos.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {product.photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      className={`shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                        i === galleryIndex
                          ? "border-brand-yellow"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-xl bg-muted" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {isAvailable ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Disponível
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <XCircle className="h-3.5 w-3.5" /> Esgotado
                </span>
              )}
              {p.brand && (
                <span className="text-xs font-medium text-muted-foreground">{p.brand}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Código: {code}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              disabled={!isAvailable}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] transition-all"
            >
              <a
                href={isAvailable ? buildWhatsappUrl(whatsappMsg) : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Comprar pelo WhatsApp
              </a>
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar
            </Button>
          </div>

          {specFields.length > 0 && (
            <div className="rounded-xl bg-muted p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Especificações
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {specFields.map((s) => (
                  <div key={s.label} className="rounded-lg bg-card p-3">
                    <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {product.description}
              </p>
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

    </CatalogLayout>
  );
};

export default CatalogProduct;
