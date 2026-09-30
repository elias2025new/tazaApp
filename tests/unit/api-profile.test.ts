import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockUpdate = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
  })),
};

vi.mock('@/lib/env', () => ({
  serverEnv: {
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    SUPABASE_JWT_SECRET: 'mock-supabase-jwt-secret-value-32-chars-minimum',
  },
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((key: string) => {
      if (key === 'taza-auth') return { value: 'valid-mock-token' };
      return undefined;
    }),
  })),
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn(async () => ({
    payload: { sub: 'profile-user-123' },
  })),
}));

import { GET, PATCH } from '@/app/api/profile/route';

describe('/api/profile Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns formatted profile with full_name and phone_number', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'profile-user-123',
              telegram_id: 123456789,
              first_name: 'Elias',
              last_name: 'Habib',
              username: 'gamets',
              phone_number: '+251911223344',
              phone: '+251911223344',
            },
            error: null,
          }),
        }),
      });

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.profile).toBeDefined();
      expect(json.profile.full_name).toBe('Elias Habib');
      expect(json.profile.phone_number).toBe('+251911223344');
    });

    it('returns profile: null if user not found in database', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });

      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.profile).toBeNull();
    });
  });

  describe('PATCH', () => {
    it('updates phone number and returns updated profile', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'profile-user-123',
                telegram_id: 123456789,
                first_name: 'Elias',
                last_name: 'Habib',
                username: 'gamets',
                phone_number: '0912345678',
                phone: '0912345678',
              },
              error: null,
            }),
          }),
        }),
      });

      const req = new Request('http://localhost/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '0912345678' }),
      });

      const res = await PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(json.profile.phone_number).toBe('0912345678');
      expect(json.profile.full_name).toBe('Elias Habib');
    });

    it('rejects invalid or empty phone number', async () => {
      const req = new Request('http://localhost/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '' }),
      });

      const res = await PATCH(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid phone number');
    });
  });
});
