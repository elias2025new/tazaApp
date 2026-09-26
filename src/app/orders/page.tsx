'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/money';

type Order = {
  id: string;
  status: string;
  fulfillment_type: string;
  total_santim: number;
  placed_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700' },
  accepted:         { label: 'Accepted',          color: 'bg-blue-100 text-blue-700' },
  preparing:        { label: 'Preparing',         color: 'bg-purple-100 text-purple-700' },
  ready:            { label: 'Ready!',             color: 'bg-green-100 text-green-700' },
  out_for_delivery: { label: 'On the way',         color: 'bg-orange-100 text-orange-700' },
  delivered:        { label: 'Delivered',          color: 'bg-gray-100 text-gray-600' },
  rejected:         { label: 'Rejected',           color: 'bg-red-100 text-red-600' },
  cancelled:        { label: 'Cancelled',          color: 'bg-gray-100 text-gray-500' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#103d2b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-8">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 pt-24 pb-4">
        <h1 className="text-xl font-bold text-gray-800">My Orders</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <p className="text-gray-400 text-sm mt-1">Your order history will appear here</p>
            <Link href="/" className="mt-6 bg-[#103d2b] text-white px-6 py-2.5 rounded-full text-sm font-semibold">
              Browse Menu
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' };
            const isActive = !['delivered', 'rejected', 'cancelled'].includes(order.status);
            // Pass basic data in URL so the track page renders immediately without waiting for the API
            const params = new URLSearchParams({
              status: order.status,
              fulfillment_type: order.fulfillment_type,
              total_santim: String(order.total_santim),
              placed_at: order.placed_at,
            });

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}?${params.toString()}`}
                className="block bg-white rounded-2xl shadow-sm p-4 active:scale-[0.98] active:bg-gray-50 transition-all duration-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {order.fulfillment_type === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'} · {formatPrice(order.total_santim)}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(order.placed_at).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
