create or replace function decrement_product_stock(p_product_id uuid, p_quantity int)
returns void
language plpgsql
as $$
begin
  update products
  set stock_quantity = stock_quantity - p_quantity
  where id = p_product_id
  and stock_quantity >= p_quantity;
end;
$$;
