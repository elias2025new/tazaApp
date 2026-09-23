import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from '@/lib/env';
import { jwtVerify } from 'jose';
import type { Database } from '@/lib/supabase/types';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('taza-auth')?.value;
  if (!token) return NextResponse.json({ profile: null });

  try {
    const secret = new TextEncoder().encode(serverEnv.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const profileId = payload.sub;

    if (!profileId) return NextResponse.json({ profile: null });

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, telegram_id, phone_number, full_name')
      .eq('id', profileId)
      .single();

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}
