-- Menu categories table
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_am text,
  sort_order int not null default 0,
  is_active boolean default true,
  emoji text
);

alter table public.menu_categories enable row level security;
create policy "Public can view active categories" on public.menu_categories
  for select using (is_active = true);

-- Menu items table
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) not null,
  name_en text not null,
  name_am text,
  description_en text,
  base_price_santim integer not null,
  image_path text,
  dietary_tags text[] default '{}',
  is_available boolean default true,
  sort_order int default 0
);

alter table public.menu_items enable row level security;
create policy "Public can view available items" on public.menu_items
  for select using (is_available = true);

-- Indexes
create index menu_items_category_id_idx on public.menu_items(category_id);

-- =====================
-- SEED DATA
-- =====================

-- Categories
insert into public.menu_categories (id, name_en, emoji, sort_order) values
  ('11111111-0001-0000-0000-000000000000', 'Breakfast Specials', '🍳', 1),
  ('11111111-0002-0000-0000-000000000000', 'Sandwiches & Rolls', '🥪', 2),
  ('11111111-0003-0000-0000-000000000000', 'Traditional', '🍲', 3),
  ('11111111-0004-0000-0000-000000000000', 'Pizza', '🍕', 4),
  ('11111111-0005-0000-0000-000000000000', 'Salads', '🥗', 5),
  ('11111111-0006-0000-0000-000000000000', 'Cake', '🍰', 6),
  ('11111111-0007-0000-0000-000000000000', 'Hot Drinks', '☕', 7),
  ('11111111-0008-0000-0000-000000000000', 'Teas', '🍵', 8),
  ('11111111-0009-0000-0000-000000000000', 'Beverages', '🥤', 9),
  ('11111111-0010-0000-0000-000000000000', 'Extras', '➕', 10);

-- Breakfast Specials
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0001-0000-0000-000000000000', 'Omelet', 'Onions, Tomato, Green Pepper, Mushroom, Cheese', 29500, 1),
  ('11111111-0001-0000-0000-000000000000', 'Cheese Omelet', 'Onion, Tomato, Green Pepper, Mushroom, Cheese', 34500, 2),
  ('11111111-0001-0000-0000-000000000000', 'Egg With Meat', 'Fried Eggs, Minced Chicken/Beef, Onions, Tomato, Spice', 34500, 3),
  ('11111111-0001-0000-0000-000000000000', 'Croissant Egg Sandwich', 'Scrambled Eggs, Cheese, Tomato, Onion, Lettuce', 39500, 4),
  ('11111111-0001-0000-0000-000000000000', 'Cheketoua', 'Seasonal Fresh Mixed Fruit Juice, Oil', 38500, 5),
  ('11111111-0001-0000-0000-000000000000', 'Basken Ful', 'Beans, Tomato, Onions, Green Pepper, Cumin, Olive Oil and Cheese', 35000, 6),
  ('11111111-0001-0000-0000-000000000000', 'Fetiro', null, 28500, 7),
  ('11111111-0001-0000-0000-000000000000', 'Special Fetiro', null, 30000, 8),
  ('11111111-0001-0000-0000-000000000000', 'Ginch', 'Ethiopian Style Green Chili & Powder', 30000, 9),
  ('11111111-0001-0000-0000-000000000000', 'Avocado Toast', 'Grilled Sourdough, Avocado, Scrambled Egg, Sweet Corn and Mini Roasted Potato', 29000, 10),
  ('11111111-0001-0000-0000-000000000000', 'Buko Genfo', null, 39500, 11),
  ('11111111-0001-0000-0000-000000000000', 'Breakfast Combo', 'Ful, Cheketoua, Egg and Fruit', 41500, 12),
  ('11111111-0001-0000-0000-000000000000', 'Quanta Firfir', 'Tearing Mixed Biscuits, Honey, Flavored and Seasonal', 40000, 13),
  ('11111111-0001-0000-0000-000000000000', 'Tibs Firfir', 'Beef Tibs, Injera, Awaze, Egg and Sauce', 49500, 14);

-- Sandwiches & Rolls
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0002-0000-0000-000000000000', 'Steak Sandwich', 'Marinated Beef, Egg on the Bread, Mayo, Cheese, Onion, Tomato Lettuce, Served With Roasted Potato', 55000, 1),
  ('11111111-0002-0000-0000-000000000000', 'Chicken Sandwich', 'Marinated Chicken, Egg on the Bread, Mayo, Cheese, Onion, Tomato Lettuce, Served With Roasted Potato', 56500, 2),
  ('11111111-0002-0000-0000-000000000000', 'Tuna Sandwich', 'Tuna, Mayonnaise, Lemon, Onion, Tomato, Tabasco, Served With Roasted Potato', 51500, 3),
  ('11111111-0002-0000-0000-000000000000', 'Vegetable Sandwich', 'Seasonal Vegetables, Mayo, Eggs on the Bread, Served With Roasted Potato', 32500, 4);

-- Traditional
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0003-0000-0000-000000000000', 'Quanta Wet', 'Tearing Awlo Bread or KOLO Served with Ayib', 65000, 1),
  ('11111111-0003-0000-0000-000000000000', 'Chickena Tibs', null, 69500, 2),
  ('11111111-0003-0000-0000-000000000000', 'Beg Tibs', null, 69000, 3),
  ('11111111-0003-0000-0000-000000000000', 'Beg Wet', 'Special, Spicy Ayib', 60000, 4),
  ('11111111-0003-0000-0000-000000000000', 'Beg Alicho', null, 55000, 5),
  ('11111111-0003-0000-0000-000000000000', 'Shiro Wet', 'Served With Tomato, Onion', 49500, 6),
  ('11111111-0003-0000-0000-000000000000', 'Teltse Wet', null, 45000, 7),
  ('11111111-0003-0000-0000-000000000000', 'Combo', 'Your Choice Alicho, Beg and Shiro. Served with Fresh Injera/Ayib', 90000, 8),
  ('11111111-0003-0000-0000-000000000000', 'Fasting Combo', 'Mixer: Quanta, Shiro and Alicho', 55000, 9),
  ('11111111-0003-0000-0000-000000000000', 'Non Fasting', null, 85000, 10),
  ('11111111-0003-0000-0000-000000000000', 'Half Half Fasting', null, 65000, 11),
  ('11111111-0003-0000-0000-000000000000', 'Food for Healthy', 'Steamed Seasonal Mixed Vegetables', 45000, 12);

-- Pizza
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0004-0000-0000-000000000000', 'Vegetable Pizza', 'Bell Pepper, Onion, Herb, Sweetcorn, Mushroom', 42500, 1),
  ('11111111-0004-0000-0000-000000000000', 'Chicken Pizza', 'Bell Pepper, Onion, Chicken, Sausage, Herb, Olives', 53500, 2),
  ('11111111-0004-0000-0000-000000000000', 'Cheese Pizza', 'Bell Pepper, Cheese, Tomato Sauce, Served With Chips', 48500, 3),
  ('11111111-0004-0000-0000-000000000000', 'Tuna Pizza', 'Bell Pepper, Onion, Tuna, Served With Chips/Salad', 54000, 4);

-- Salads
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0005-0000-0000-000000000000', 'Steak Salad', 'Green Salad, Cucumber, Carrot, Tomato, Onion, Cheese & Cabbage, Paprika, House Dressing', 58000, 1),
  ('11111111-0005-0000-0000-000000000000', 'Chicken Salad', 'Chicken, Pasta, Green Salad, Cucumber, Carrot, Tomato, Onion, Cheese, Cabbage, Paprika, House Dressing', 57500, 2),
  ('11111111-0005-0000-0000-000000000000', 'Tuna Salad', 'Tuna, Green Salad, Cucumber, Carrot, Tomato, Onion, Cheese, Cabbage, Paprika, House Dressing', 58200, 3),
  ('11111111-0005-0000-0000-000000000000', 'Taza Special Salad', 'Apple, Tomato, Onion, Exotic Cabbage, Carrot, Pineapple, Cream, Cheese, Coconut, Paprika, House Dressing', 39500, 4);

-- Cake
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0006-0000-0000-000000000000', 'Chocolate Cake', null, 28500, 1),
  ('11111111-0006-0000-0000-000000000000', 'Moca Cake', null, 21500, 2),
  ('11111111-0006-0000-0000-000000000000', 'Tiramisu Cake', null, 24500, 3),
  ('11111111-0006-0000-0000-000000000000', 'Lemon Cake', null, 22000, 4),
  ('11111111-0006-0000-0000-000000000000', 'Muffin Cake', null, 9000, 5),
  ('11111111-0006-0000-0000-000000000000', 'English Cake', null, 11200, 6),
  ('11111111-0006-0000-0000-000000000000', 'Chocolate Croissant', null, 13500, 7),
  ('11111111-0006-0000-0000-000000000000', 'Croissant', null, 12000, 8),
  ('11111111-0006-0000-0000-000000000000', 'Cream Puffs', null, 17500, 9);

-- Hot Drinks
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0007-0000-0000-000000000000', 'Coffee', null, 7500, 1),
  ('11111111-0007-0000-0000-000000000000', 'Macchiato', null, 8000, 2),
  ('11111111-0007-0000-0000-000000000000', 'Double Macchiato', null, 16000, 3),
  ('11111111-0007-0000-0000-000000000000', 'Espresso', null, 7500, 4),
  ('11111111-0007-0000-0000-000000000000', 'Double Espresso', null, 13000, 5),
  ('11111111-0007-0000-0000-000000000000', 'Cafe Latte', null, 15000, 6),
  ('11111111-0007-0000-0000-000000000000', 'Hot Milk', null, 4800, 7),
  ('11111111-0007-0000-0000-000000000000', 'Freddo Macchiato', null, 15000, 8),
  ('11111111-0007-0000-0000-000000000000', 'Hot Chocolate', null, 18000, 9),
  ('11111111-0007-0000-0000-000000000000', 'Cappuccino', null, 18000, 10),
  ('11111111-0007-0000-0000-000000000000', 'Caramel Macchiato', null, 19500, 11),
  ('11111111-0007-0000-0000-000000000000', 'Caramel Latte', null, 19000, 12),
  ('11111111-0007-0000-0000-000000000000', 'Ice Latte', null, 17000, 13),
  ('11111111-0007-0000-0000-000000000000', 'Ice Caramel', null, 22900, 14),
  ('11111111-0007-0000-0000-000000000000', 'Ice Vanilla', null, 22900, 15),
  ('11111111-0007-0000-0000-000000000000', 'Ice Mocha', null, 26000, 16),
  ('11111111-0007-0000-0000-000000000000', 'Ice Tea', null, 9500, 17),
  ('11111111-0007-0000-0000-000000000000', 'Ice Americano', null, 11500, 18),
  ('11111111-0007-0000-0000-000000000000', 'Ice Fasting Latte', null, 18000, 19),
  ('11111111-0007-0000-0000-000000000000', 'Taza Special Coffee', null, 14000, 20),
  ('11111111-0007-0000-0000-000000000000', 'Siphon Coffee', null, 15000, 21),
  ('11111111-0007-0000-0000-000000000000', 'Frappuccino (Caramel)', null, 20000, 22),
  ('11111111-0007-0000-0000-000000000000', 'Moka Pot Coffee', null, 12500, 23),
  ('11111111-0007-0000-0000-000000000000', 'Café Mocha', null, 19000, 24),
  ('11111111-0007-0000-0000-000000000000', 'Long Island Ice Tea', null, 30000, 25);

-- Teas
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0008-0000-0000-000000000000', 'Ginger Tea', null, 7500, 1),
  ('11111111-0008-0000-0000-000000000000', 'Tea', null, 4800, 2),
  ('11111111-0008-0000-0000-000000000000', 'Taza Special Tea', null, 17500, 3),
  ('11111111-0008-0000-0000-000000000000', 'Lemon Grass Tea', null, 9500, 4),
  ('11111111-0008-0000-0000-000000000000', 'Rosemary Tea', null, 7500, 5),
  ('11111111-0008-0000-0000-000000000000', 'Hibiscus Tea', null, 9500, 6),
  ('11111111-0008-0000-0000-000000000000', 'Chemere Tea', null, 9500, 7),
  ('11111111-0008-0000-0000-000000000000', 'Cinnamon Tea', null, 9500, 8),
  ('11111111-0008-0000-0000-000000000000', 'Hangover Tea', null, 9500, 9),
  ('11111111-0008-0000-0000-000000000000', 'Caramel Tea', null, 9500, 10),
  ('11111111-0008-0000-0000-000000000000', 'Forest Fruit Tea', null, 9500, 11),
  ('11111111-0008-0000-0000-000000000000', 'Butterfly & Star Anise Tea', null, 9500, 12);

-- Beverages
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0009-0000-0000-000000000000', 'Water', null, 5000, 1),
  ('11111111-0009-0000-0000-000000000000', 'Ambo Water', null, 6500, 2),
  ('11111111-0009-0000-0000-000000000000', 'Beer', null, 16000, 3),
  ('11111111-0009-0000-0000-000000000000', 'Rift Valley Wine 750ml', null, 227500, 4),
  ('11111111-0009-0000-0000-000000000000', 'Gebeta Wine 750ml', null, 150000, 5);

-- Extras
insert into public.menu_items (category_id, name_en, description_en, base_price_santim, sort_order) values
  ('11111111-0010-0000-0000-000000000000', 'Extra Injera', null, 5000, 1),
  ('11111111-0010-0000-0000-000000000000', 'Honey', null, 4000, 2),
  ('11111111-0010-0000-0000-000000000000', 'Coffee Cup', null, 1500, 3),
  ('11111111-0010-0000-0000-000000000000', 'Juice Cup', null, 1500, 4),
  ('11111111-0010-0000-0000-000000000000', 'Takeaway Box', null, 4500, 5);
