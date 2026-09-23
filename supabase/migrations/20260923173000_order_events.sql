-- Order events (audit trail + tracker)
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) not null,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_profile_id uuid references public.profiles(id),
  note text,
  created_at timestamptz default now()
);

alter table public.order_events enable row level security;
create policy "Users can view own order events" on public.order_events
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_events.order_id
      and orders.profile_id = auth.uid()
    )
  );

create index order_events_order_id_idx on public.order_events(order_id);

-- Enable Realtime on orders table so the tracker updates live
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_events;
