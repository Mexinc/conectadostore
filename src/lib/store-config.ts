/**
 * Configurações da loja.
 *
 * 👉 Atualize o número de WhatsApp abaixo para o número da loja
 * (formato internacional, somente dígitos, ex: 5511999999999).
 */
export const STORE_CONFIG = {
  name: "ConectadoStore",
  whatsappPhone: "5511999999999", // TODO: trocar pelo número real da loja
};

/** Gera URL wa.me com mensagem pré-preenchida. */
export const buildWhatsappUrl = (message: string) =>
  `https://wa.me/${STORE_CONFIG.whatsappPhone}?text=${encodeURIComponent(message)}`;

/** URL pública do catálogo do produto. */
export const buildProductCatalogUrl = (productId: string) =>
  `https://conectadostore.lovable.app/catalogo/${encodeURIComponent(productId)}`;

/** URL de compartilhamento com pré-visualização dinâmica da primeira foto do produto. */
export const buildProductShareUrl = (productId: string) => {
  const backendUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!backendUrl) return buildProductCatalogUrl(productId);
  return `${backendUrl}/functions/v1/product-share?id=${encodeURIComponent(productId)}`;
};

/** Código curto legível derivado do uuid (últimos 6 chars maiúsculos). */
export const shortCode = (id: string) => id.replace(/-/g, "").slice(-6).toUpperCase();
