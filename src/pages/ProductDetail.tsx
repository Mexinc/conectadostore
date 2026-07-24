import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Copy, ChevronLeft, ChevronRight, X, Loader2, Download, ShieldCheck, Link2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { buildProductShareUrl } from "@/lib/store-config";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Produto não encontrado");
          navigate("/");
          return;
        }
        setProduct(data);
        setLoading(false);
      });
  }, [id, navigate]);

  const generateText = (platform: "whatsapp" | "olx" | "mercadolivre") => {
    if (!product) return;

    const base = `📱 ${product.name}\n\n${product.description}\n\n💰 ${formatPrice(product.price)}`;

    let text = "";
    switch (platform) {
      case "whatsapp":
        text = `${base}\n\n✅ Produto disponível!\n📩 Chame para mais informações.`;
        break;
      case "olx":
        text = `${product.name}\n\n${product.description}\n\nValor: ${formatPrice(product.price)}\n\nEntre em contato para mais detalhes.`;
        break;
      case "mercadolivre":
        text = `${product.name}\n\n${product.description}\n\nCondição: Seminovo\nValor: ${formatPrice(product.price)}\n\nEnvie uma mensagem para tirar dúvidas!`;
        break;
    }

    navigator.clipboard.writeText(text);
    toast.success(`Texto copiado para ${platform === "whatsapp" ? "WhatsApp" : platform === "olx" ? "OLX" : "Mercado Livre"}!`);
  };

  const [downloading, setDownloading] = useState(false);

  const downloadAllPhotos = async () => {
    if (!product || product.photos.length === 0) return;
    setDownloading(true);

    try {
      for (let i = 0; i < product.photos.length; i++) {
        const url = product.photos[i];
        const response = await fetch(url);
        const blob = await response.blob();
        const ext = url.split(".").pop()?.split("?")[0] || "jpg";
        const filename = `${product.name.replace(/[^a-zA-Z0-9]/g, "_")}_foto_${i + 1}.${ext}`;

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        // Small delay between downloads to avoid browser blocking
        if (i < product.photos.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      toast.success(`${product.photos.length} foto(s) baixada(s)!`);
    } catch {
      toast.error("Erro ao baixar fotos");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Fullscreen gallery */}
      {fullscreen && product.photos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95">
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
                onClick={() =>
                  setGalleryIndex((i) => (i + 1) % product.photos.length)
                }
                className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-background hover:bg-background/30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-lg font-bold">{product.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 animate-fade-up">
        {/* Gallery */}
        {product.photos.length > 0 && (
          <div className="mb-6">
            <div
              className="relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-muted"
              onClick={() => setFullscreen(true)}
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
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
              <StatusBadge status={product.status} />
            </div>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Descrição
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {product.description || "Sem descrição."}
            </p>
          </div>

          {/* Copy buttons */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Copiar texto para anúncio
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateText("whatsapp")}
                className="active:scale-[0.97] transition-all"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateText("olx")}
                className="active:scale-[0.97] transition-all"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                OLX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateText("mercadolivre")}
                className="active:scale-[0.97] transition-all"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Mercado Livre
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAllPhotos}
                disabled={downloading || product.photos.length === 0}
                className="active:scale-[0.97] transition-all"
              >
                {downloading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Baixar todas as fotos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(buildProductShareUrl(product.id));
                  toast.success("Link do produto copiado!");
                }}
                className="active:scale-[0.97] transition-all"
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                Copiar link do produto
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/products/${product.id}/edit`)}
            >
              Editar
            </Button>
            <Button
              className="flex-1 active:scale-[0.97]"
              onClick={() => navigate(`/products/${product.id}/warranty`)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Gerar Garantia
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
