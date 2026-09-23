import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('id, name_en, emoji, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  const { data: items, error: itemError } = await supabase
    .from('menu_items')
    .select('id, category_id, name_en, description_en, base_price_santim, image_path, is_available')
    .eq('is_available', true)
    .order('sort_order');

  if (catError || itemError) {
    console.error('Menu fetch error:', catError || itemError);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }

  return NextResponse.json({ categories, items });
}
