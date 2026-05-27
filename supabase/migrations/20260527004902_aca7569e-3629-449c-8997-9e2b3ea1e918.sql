
-- 1. Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Seed existing admins (users who already have products)
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'admin'::public.app_role
FROM public.products
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'admin'::public.app_role
FROM public.warranties
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Tighten products policies (admin-only for write/manage; public read of available stays)
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Tighten warranties policies (admin-only)
DROP POLICY IF EXISTS "Authenticated users can view warranties" ON public.warranties;
DROP POLICY IF EXISTS "Authenticated users can insert warranties" ON public.warranties;
DROP POLICY IF EXISTS "Authenticated users can update warranties" ON public.warranties;
DROP POLICY IF EXISTS "Authenticated users can delete warranties" ON public.warranties;

CREATE POLICY "Admins can view warranties"
ON public.warranties FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert warranties"
ON public.warranties FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update warranties"
ON public.warranties FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete warranties"
ON public.warranties FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Storage: restrict listing and writes; public URL still works for direct access
DROP POLICY IF EXISTS "Product photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product photos" ON storage.objects;

CREATE POLICY "Admins can list product photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload product photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-photos' AND public.has_role(auth.uid(), 'admin'));

-- 6. Lock down warranty number generator
REVOKE EXECUTE ON FUNCTION public.generate_warranty_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_warranty_number() TO authenticated, service_role;
