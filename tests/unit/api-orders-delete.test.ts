import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
const mockSelect = vi.fn();
const mockDelete = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    delete: mockDelete,
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
    get: vi.fn(() => ({ value: 'valid-mock-token' })),
  })),
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn(async () => ({
    payload: { sub: 'profile-user-123' },
  })),
}));

import { DELETE } from '@/app/api/orders/[id]/route';

describe('DELETE /api/orders/[id] Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 if order does not exist', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    });

    const req = new Request('http://localhost/api/orders/ord-999', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ord-999' }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe('Order not found');
  });

  it('returns 403 if order belongs to another profile', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'ord-123', profile_id: 'other-profile-456' },
          error: null,
        }),
      }),
    });

    const req = new Request('http://localhost/api/orders/ord-123', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ord-123' }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Unauthorized to delete this order');
  });

  it('deletes order_events, order_items, and order successfully when authorized', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'ord-123', profile_id: 'profile-user-123' },
          error: null,
        }),
      }),
    });

    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({
      eq: deleteEqMock,
    });

    const req = new Request('http://localhost/api/orders/ord-123', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ord-123' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.deleted_id).toBe('ord-123');

    // Verify deletion occurred on tables
    expect(mockSupabase.from).toHaveBeenCalledWith('order_events');
    expect(mockSupabase.from).toHaveBeenCalledWith('order_items');
    expect(mockSupabase.from).toHaveBeenCalledWith('orders');
  });
});
