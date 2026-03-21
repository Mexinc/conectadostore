import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import StatusBadge from "@/components/StatusBadge";

type Product = Tables<"products">;

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const ProductCard = ({ product, onEdit, onDelete, onClick }: ProductCardProps) => {
  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* Image */}
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
        <div className="absolute top-2 left-2">
          <StatusBadge status={product.status} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold tabular-nums text-foreground">
            {formatPrice(product.price)}
          </span>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
