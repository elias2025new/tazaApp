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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, telegram_id, phone, phone_number, first_name, last_name, username')
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ profile: null });
    }

    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Guest User';
    const phoneNumber = profile.phone_number || profile.phone || null;

    return NextResponse.json({
      profile: {
        ...profile,
        full_name: fullName,
        phone_number: phoneNumber,
      },
    });
  } catch {
    return NextResponse.json({ profile: null });
  }
}

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('taza-auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const secret = new TextEncoder().encode(serverEnv.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const profileId = payload.sub;

    if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const phone = body.phone || body.phone_number;

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const cleanedPhone = phone.trim();

    const supabase = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        phone: cleanedPhone,
        phone_number: cleanedPhone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select('id, telegram_id, phone, phone_number, first_name, last_name, username')
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
    }

    const fullName = [updated.first_name, updated.last_name].filter(Boolean).join(' ') || updated.username || 'Guest User';
    const phoneNumber = updated.phone_number || updated.phone || null;

    return NextResponse.json({
      ok: true,
      profile: {
        ...updated,
        full_name: fullName,
        phone_number: phoneNumber,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

