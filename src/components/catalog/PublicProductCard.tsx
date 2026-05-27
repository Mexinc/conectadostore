import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PublicProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const p = product as any;
  const isAvailable = product.status === "available";

  const specs = [p.brand, p.model || p.processor, p.ram, p.storage].filter(Boolean).join(" • ");

  return (
    <div
      onClick={() => navigate(`/catalogo/${product.id}`)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
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
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground/40">
            Sem foto
          </div>
        )}
        {!isAvailable && (
          <div className="absolute top-2 left-2 rounded-full bg-foreground/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
            Esgotado
          </div>
        )}
        {p.is_featured && isAvailable && (
          <div className="absolute top-2 right-2 rounded-full bg-brand-yellow px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
            Destaque
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-foreground">{product.name}</h3>
        {specs && <p className="mt-1 truncate text-xs text-muted-foreground">{specs}</p>}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-base font-bold tabular-nums text-foreground">
            {formatPrice(product.price)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-xs transition-all active:scale-[0.97]"
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
};

export default PublicProductCard;
