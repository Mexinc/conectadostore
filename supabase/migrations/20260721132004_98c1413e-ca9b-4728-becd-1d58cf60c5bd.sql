CREATE OR REPLACE FUNCTION public.generate_warranty_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  year_prefix text := 'GAR-' || to_char(CURRENT_DATE, 'YYYY') || '-';
  next_num int;
BEGIN
  SELECT COALESCE(MAX((regexp_replace(warranty_number, '^GAR-\d{4}-', ''))::int), 0) + 1
    INTO next_num
    FROM public.warranties
   WHERE warranty_number LIKE year_prefix || '%'
     AND warranty_number ~ ('^' || year_prefix || '\d+$');
  RETURN year_prefix || lpad(next_num::text, 4, '0');
END;
$$;