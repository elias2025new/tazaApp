import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrdersPage from '@/app/orders/page';

const mockOrders = [
  {
    id: 'ord-12345678-aaaa-bbbb-cccc-dddddddddddd',
    status: 'delivered',
    fulfillment_type: 'pickup',
    total_santim: 25000,
    placed_at: '2026-09-28T10:00:00.000Z',
  },
  {
    id: 'ord-87654321-eeee-ffff-0000-111111111111',
    status: 'pending',
    fulfillment_type: 'delivery',
    total_santim: 38000,
    placed_at: '2026-09-29T14:30:00.000Z',
  },
];

describe('OrdersPage Delete Button and Confirmation Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr === '/api/orders' && (!init || init.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orders: [...mockOrders] }),
        } as Response);
      }
      if (urlStr.startsWith('/api/orders/') && init?.method === 'DELETE') {
        const id = urlStr.replace('/api/orders/', '');
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, deleted_id: id }),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled fetch: ${urlStr}`));
    });
  });

  it('renders order list and delete buttons for each order', async () => {
    render(<OrdersPage />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
    });

    // Check delete buttons are present
    const deleteButtons = screen.getAllByTitle('Delete order');
    expect(deleteButtons).toHaveLength(2);
  });

  it('opens confirmation modal asking for Yes or No when delete button is clicked', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByTitle('Delete order')).toHaveLength(2);
    });

    const firstDeleteBtn = screen.getAllByTitle('Delete order')[0]!;
    fireEvent.click(firstDeleteBtn);

    // Modal should be displayed asking for Yes or No
    expect(screen.getByText('Delete Order History?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete order/i)).toBeInTheDocument();
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
  });

  it('cancels deletion when "No, Keep" is clicked', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByTitle('Delete order')).toHaveLength(2);
    });

    const firstDeleteBtn = screen.getAllByTitle('Delete order')[0]!;
    fireEvent.click(firstDeleteBtn);

    const noButton = screen.getByText('No, Keep');
    fireEvent.click(noButton);

    // Modal should disappear and both orders remain
    await waitFor(() => {
      expect(screen.queryByText('Delete Order History?')).not.toBeInTheDocument();
    });
    expect(screen.getAllByTitle('Delete order')).toHaveLength(2);
  });

  it('deletes the order from history when "Yes, Delete" is clicked', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByTitle('Delete order')).toHaveLength(2);
    });

    const firstDeleteBtn = screen.getAllByTitle('Delete order')[0]!;
    fireEvent.click(firstDeleteBtn);

    const yesButton = screen.getByText('Yes, Delete');
    fireEvent.click(yesButton);

    // Verify DELETE fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders/ord-12345678-aaaa-bbbb-cccc-dddddddddddd',
        { method: 'DELETE' }
      );
    });

    // Modal closes and order is removed from the list (only 1 remaining)
    await waitFor(() => {
      expect(screen.queryByText('Delete Order History?')).not.toBeInTheDocument();
      expect(screen.getAllByTitle('Delete order')).toHaveLength(1);
    });
  });

  it('shows empty state when all orders are deleted', async () => {
    // Only 1 order initially
    global.fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr === '/api/orders' && (!init || init.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orders: [mockOrders[0]] }),
        } as Response);
      }
      if (urlStr.startsWith('/api/orders/') && init?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, deleted_id: mockOrders[0]!.id }),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled fetch: ${urlStr}`));
    });

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByTitle('Delete order')).toHaveLength(1);
    });

    fireEvent.click(screen.getByTitle('Delete order'));
    fireEvent.click(screen.getByText('Yes, Delete'));

    // Should transition to empty state
    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
      expect(screen.getByText('Your order history will appear here')).toBeInTheDocument();
      expect(screen.getByText('Browse Menu')).toBeInTheDocument();
    });
  });
});
