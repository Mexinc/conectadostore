const SITE_URL = "https://conectadostore.lovable.app";

type ProductShare = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  photos: string[] | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const compact = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
};

const formatPrice = (value: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);

const htmlResponse = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });

Deno.serve(async (req) => {
  const requestUrl = new URL(req.url);
  const idFromPath = requestUrl.pathname.split("/").filter(Boolean).pop();
  const productId = requestUrl.searchParams.get("id") || idFromPath;
  const catalogUrl = productId ? `${SITE_URL}/catalogo/${encodeURIComponent(productId)}` : `${SITE_URL}/catalogo`;

  const fallback = () =>
    htmlResponse(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ConectadoStore</title>
  <meta name="description" content="Catálogo de notebooks, iPhones e equipamentos seminovos" />
  <meta property="og:title" content="ConectadoStore" />
  <meta property="og:description" content="Catálogo de notebooks, iPhones e equipamentos seminovos" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(catalogUrl)}" />
  <meta name="twitter:card" content="summary" />
  <script>location.replace(${JSON.stringify(catalogUrl)});</script>
</head>
<body><a href="${escapeHtml(catalogUrl)}">Abrir catálogo</a></body>
</html>`);

  if (!productId) return fallback();

  const backendUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!backendUrl || !anonKey) return fallback();

  const queryUrl = new URL("/rest/v1/products", backendUrl);
  queryUrl.searchParams.set("select", "id,name,description,price,photos");
  queryUrl.searchParams.set("id", `eq.${productId}`);
  queryUrl.searchParams.set("status", "eq.available");
  queryUrl.searchParams.set("limit", "1");

  const productsResponse = await fetch(queryUrl, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!productsResponse.ok) return fallback();

  const products = (await productsResponse.json()) as ProductShare[];
  const product = products[0];
  if (!product) return fallback();

  const title = compact(`${product.name} | ConectadoStore`, 70);
  const description = compact(
    `${formatPrice(product.price)}${product.description ? ` — ${product.description}` : ""}`,
    155,
  );
  const imageUrl = product.photos?.find((photo) => photo.startsWith("https://"));
  const safeCatalogUrl = escapeHtml(`${SITE_URL}/catalogo/${product.id}`);

  return htmlResponse(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${safeCatalogUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="product" />
  <meta property="og:url" content="${safeCatalogUrl}" />
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : ""}
  ${imageUrl ? `<meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : ""}
  <script>setTimeout(function(){ location.replace(${JSON.stringify(`${SITE_URL}/catalogo/${product.id}`)}); }, 250);</script>
</head>
<body><a href="${safeCatalogUrl}">Abrir produto</a></body>
</html>`);
});