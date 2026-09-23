'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { formatPrice } from '@/lib/money';

type Order = {
  id: string;
  status: string;
  fulfillment_type: string;
  total_santim: number;
  placed_at: string;
  customer_note: string | null;
  order_items: { name_snapshot: string; quantity: number; line_total_santim: number }[];
};

const NEXT_STATUS: Record<string, { label: string; next: string; color: string }[]> = {
  pending:          [{ label: '✅ Accept',      next: 'accepted',         color: 'bg-green-500' },
                     { label: '❌ Reject',      next: 'rejected',         color: 'bg-red-500' }],
  accepted:         [{ label: '👨‍🍳 Start Prep', next: 'preparing',        color: 'bg-purple-500' }],
  preparing:        [{ label: '🎉 Mark Ready',  next: 'ready',            color: 'bg-blue-500' }],
  ready:            [{ label: '🛵 Out for Delivery', next: 'out_for_delivery', color: 'bg-orange-500' },
                     { label: '✅ Picked Up',   next: 'delivered',        color: 'bg-green-500' }],
  out_for_delivery: [{ label: '🏠 Delivered',   next: 'delivered',        color: 'bg-green-600' }],
};

const STATUS_BADGE: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-700',
  accepted:         'bg-blue-100 text-blue-700',
  preparing:        'bg-purple-100 text-purple-700',
  ready:            'bg-green-100 text-green-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-gray-100 text-gray-500',
  rejected:         'bg-red-100 text-red-500',
};

export default function StaffPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/staff/orders', {
      headers: { 'x-staff-secret': secret },
    });
    const d = await res.json();
    setOrders(d.orders ?? []);
    setLoading(false);
  }, [secret]);

  useEffect(() => {
    if (authed) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 15000);
      return () => clearInterval(interval);
    }
  }, [authed, fetchOrders]);

  async function transition(orderId: string, nextStatus: string) {
    setUpdating(orderId + nextStatus);
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_status: nextStatus, staff_secret: secret }),
    });
    await fetchOrders();
    setUpdating(null);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
          <h1 className="text-lg font-bold text-gray-800 mb-1">🔑 Staff Panel</h1>
          <p className="text-sm text-gray-400 mb-4">Enter your staff secret to continue</p>
          <input
            type="password"
            placeholder="Staff secret..."
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#103d2b] mb-3"
          />
          <button
            onClick={() => setAuthed(true)}
            className="w-full bg-[#103d2b] text-white font-semibold py-3 rounded-xl"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !['delivered', 'rejected', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter((o) => ['delivered', 'rejected', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-[#103d2b] text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">🌿 Staff Panel</h1>
          <p className="text-xs text-white/60">{activeOrders.length} active orders</p>
        </div>
        <button onClick={fetchOrders} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#103d2b] border-t-transparent" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-sm font-medium">No active orders right now!</p>
          </div>
        ) : null}

        {activeOrders.map((order) => {
          const actions = NEXT_STATUS[order.status] ?? [];
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="p-4 border-b border-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[order.status]}`}>
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(order.placed_at).toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  {order.fulfillment_type === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'} · {formatPrice(order.total_santim)}
                </p>
              </div>

              {/* Items */}
              <div className="px-4 py-3 space-y-1">
                {order.order_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name_snapshot} × {item.quantity}</span>
                    <span className="text-gray-800 font-medium">{formatPrice(item.line_total_santim)}</span>
                  </div>
                ))}
                {order.customer_note && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mt-2">
                    📝 {order.customer_note}
                  </p>
                )}
              </div>

              {/* Actions */}
              {actions.length > 0 && (
                <div className="px-4 pb-4 flex gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.next}
                      onClick={() => transition(order.id, action.next)}
                      disabled={updating === order.id + action.next}
                      className={`flex-1 ${action.color} text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50`}
                    >
                      {updating === order.id + action.next ? '...' : action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <div>
            <details>
              <summary className="flex items-center gap-2 text-sm text-gray-400 font-medium py-2 cursor-pointer list-none">
                <ChevronDown className="w-4 h-4" />
                Past orders ({pastOrders.length})
              </summary>
              <div className="mt-2 space-y-2">
                {pastOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status]}`}>
                        {order.status}
                      </span>
                      <p className="text-xs text-gray-400 font-mono mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-700">{formatPrice(order.total_santim)}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
