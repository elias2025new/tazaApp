import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { validateInitData } from '@/lib/telegram/validate-init-data';
import { serverEnv, publicEnv } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function POST(req: Request) {
  try {
    const { initDataRaw } = await req.json();

    if (!initDataRaw || typeof initDataRaw !== 'string') {
      return NextResponse.json({ error: 'Missing initDataRaw' }, { status: 400 });
    }

    // 1. Validate cryptographic integrity from Telegram
    const result = validateInitData(initDataRaw, serverEnv.TELEGRAM_BOT_TOKEN);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const { user } = result.data;

    // 2. Upsert user in Supabase bypassing RLS with the Service Role Key
    const supabaseAdmin = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Upsert the profile
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          telegram_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          language_code: user.language_code || 'en',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_id', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (error || !profile) {
      console.error('Profile upsert error:', error);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // 3. Sign a custom JWT that Supabase understands (must use SUPABASE_JWT_SECRET)
    const secret = new TextEncoder().encode(serverEnv.SUPABASE_JWT_SECRET);
    const alg = 'HS256';

    const jwt = await new SignJWT({
      sub: profile.id, // Supabase auth.uid() function returns this value!
      aud: 'authenticated',
      role: 'authenticated',
      telegram_id: user.id, // Custom claim
    })
      .setProtectedHeader({ alg, typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // 4. Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'taza-auth',
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS,
    });

    return NextResponse.json({ ok: true, profile_id: profile.id });
  } catch (error) {
    console.error('Auth endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
