
-- Create warranties table
CREATE TABLE public.warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_number text NOT NULL UNIQUE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_cpf text NOT NULL,
  client_phone text NOT NULL,
  client_address text NOT NULL,
  seller_name text NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  warranty_days integer NOT NULL DEFAULT 90,
  valid_until date NOT NULL,
  equipment_name text NOT NULL,
  processor text NOT NULL DEFAULT '',
  ram text NOT NULL DEFAULT '',
  storage text NOT NULL DEFAULT '',
  os text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view warranties" ON public.warranties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert warranties" ON public.warranties
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update warranties" ON public.warranties
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete warranties" ON public.warranties
  FOR DELETE TO authenticated USING (true);

-- Sequence helper function for warranty numbers
CREATE OR REPLACE FUNCTION public.generate_warranty_number()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'GAR-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad((COALESCE(
    (SELECT COUNT(*) FROM public.warranties WHERE warranty_number LIKE 'GAR-' || to_char(CURRENT_DATE, 'YYYY') || '-%'), 0
  ) + 1)::text, 4, '0')
$$;
