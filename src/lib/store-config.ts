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

/** Código curto legível derivado do uuid (últimos 6 chars maiúsculos). */
export const shortCode = (id: string) => id.replace(/-/g, "").slice(-6).toUpperCase();
