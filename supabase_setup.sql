-- Run this SQL in your Supabase SQL Editor to create the orders table

create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  pump_id text not null,
  fuel_type text not null,
  amount_liters numeric not null,
  total_price numeric not null,
  status text not null default 'pending',
  customer_name text not null,
  customer_phone text not null,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table orders enable row level security;

-- Create policy to allow users to insert their own orders
create policy "Users can insert their own orders"
on orders for insert
with check (true); -- In a real app, you'd check auth.uid()

-- Create policy to allow users to view their own orders
create policy "Users can view their own orders"
on orders for select
using (true); -- In a real app, you'd filter by auth.uid()
