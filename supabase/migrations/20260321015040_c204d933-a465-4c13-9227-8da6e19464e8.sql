
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  photos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view products
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT TO authenticated USING (true);

-- All authenticated users can insert products
CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT TO authenticated WITH CHECK (true);

-- All authenticated users can update products
CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE TO authenticated USING (true);

-- All authenticated users can delete products
CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE TO authenticated USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-photos', 'product-photos', true);

-- Storage policies
CREATE POLICY "Product photos are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'product-photos');

CREATE POLICY "Authenticated users can upload product photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Authenticated users can update product photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-photos');

CREATE POLICY "Authenticated users can delete product photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-photos');
