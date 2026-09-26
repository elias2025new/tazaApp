update public.menu_items
set image_path = '/menu-images/' || lower(replace(replace(replace(name_en, ' ', '_'), '&', 'and'), '-', '_')) || '.png';
