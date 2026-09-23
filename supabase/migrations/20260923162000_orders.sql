-- Order status enum
create type public.order_status as enum (
  'pending', 'accepted', 'preparing', 'ready',
  'out_for_delivery', 'delivered', 'rejected', 'cancelled'
);

-- Fulfillment type enum
create type public.fulfillment_type as enum ('delivery', 'pickup');

-- Orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  status public.order_status not null default 'pending',
  fulfillment_type public.fulfillment_type not null default 'delivery',
  address_id uuid,
  subtotal_santim integer not null,
  delivery_fee_santim integer not null default 0,
  total_santim integer not null,
  currency text default 'ETB',
  customer_note text,
  rejection_reason text,
  idempotency_key uuid unique not null,
  placed_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders
  for select using (profile_id = auth.uid());

-- Order items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) not null,
  menu_item_id uuid references public.menu_items(id),
  name_snapshot text not null,
  unit_price_santim integer not null,
  quantity int not null,
  options_snapshot jsonb default '{}',
  line_total_santim integer not null
);

alter table public.order_items enable row level security;
create policy "Users can view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.profile_id = auth.uid()
    )
  );

-- Indexes
create index orders_profile_id_idx on public.orders(profile_id);
create index orders_status_idx on public.orders(status);
create index order_items_order_id_idx on public.order_items(order_id);
