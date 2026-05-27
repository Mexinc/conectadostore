
-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subcategory text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Migrate existing categories: macbook -> apple/macbook, iphone -> apple/iphone, notebook stays
UPDATE public.products
  SET subcategory = CASE
    WHEN category = 'macbook' THEN 'macbook'
    WHEN category = 'iphone' THEN 'iphone'
    WHEN category = 'notebook' THEN 'seminovos'
    ELSE subcategory
  END,
  brand = CASE
    WHEN category IN ('macbook','iphone') THEN 'Apple'
    ELSE brand
  END,
  category = CASE
    WHEN category IN ('macbook','iphone') THEN 'apple'
    ELSE category
  END
WHERE category IN ('macbook','iphone','notebook') AND subcategory = '';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_views_count ON public.products(views_count DESC);

-- Function to safely increment view count (publicly callable, only affects available products)
CREATE OR REPLACE FUNCTION public.increment_product_views(_product_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE id = _product_id AND status = 'available';
$$;

REVOKE EXECUTE ON FUNCTION public.increment_product_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO anon, authenticated, service_role;
