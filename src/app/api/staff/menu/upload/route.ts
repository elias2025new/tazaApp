import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const staff_secret = formData.get('staff_secret') as string;
    const file = formData.get('file') as File;

    if (staff_secret !== serverEnv.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!id || !file) {
      return NextResponse.json({ error: 'Item ID and file required' }, { status: 400 });
    }

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${id}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // Update database
    const { error: dbError } = await supabase
      .from('menu-items')
      .update({ image_path: imageUrl })
      .eq('id', id);
      
    // Note: the table is actually 'menu_items' with an underscore! Let me fix that:
    const { error: dbErrorReal } = await supabase
      .from('menu_items')
      .update({ image_path: imageUrl } as any)
      .eq('id', id);

    if (dbErrorReal) {
      console.error('DB error:', dbErrorReal);
      return NextResponse.json({ error: 'Failed to link image to menu item' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: imageUrl });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
