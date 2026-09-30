'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock, Trash2, Loader2 } from 'lucide-react';
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
  delivered:        { label: 'Delivered',          color: 'bg-gray-100 text-text-muted' },
  rejected:         { label: 'Rejected',           color: 'bg-red-100 text-red-600' },
  cancelled:        { label: 'Cancelled',          color: 'bg-gray-100 text-text-muted' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete order.');
      }

      // Haptic feedback in Telegram if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setOrderToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete order.';
      setDeleteError(message);
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#103d2b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface-raised pb-8">
      <div className="sticky top-0 z-40 bg-surface border-b border-border px-4 pt-24 pb-4">
        <h1 className="text-xl font-bold text-text-muted">My Orders</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-text-muted mb-4" />
            <p className="text-text-muted font-medium">No orders yet</p>
            <p className="text-text-muted text-sm mt-1">Your order history will appear here</p>
            <Link href="/" className="mt-6 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold">
              Browse Menu
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-text-muted' };
            const isActive = !['delivered', 'rejected', 'cancelled'].includes(order.status);
            // Pass basic data in URL so the track page renders immediately without waiting for the API
            const params = new URLSearchParams({
              status: order.status,
              fulfillment_type: order.fulfillment_type,
              total_santim: String(order.total_santim),
              placed_at: order.placed_at,
            });

            return (
              <div
                key={order.id}
                className="bg-surface rounded-2xl shadow-sm p-4 active:bg-surface-raised transition-all duration-100 flex items-center justify-between gap-3 border border-border/50"
              >
                <Link
                  href={`/orders/${order.id}?${params.toString()}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-text-muted truncate">
                    {order.fulfillment_type === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'} · {formatPrice(order.total_santim)}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(order.placed_at).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </Link>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteError(null);
                      setOrderToDelete(order);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-red-500/80 hover:text-red-600 hover:bg-red-50 active:bg-red-100 active:scale-90 transition-all"
                    aria-label={`Delete order ${order.id.slice(0, 8)}`}
                    title="Delete order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/orders/${order.id}?${params.toString()}`}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text transition-colors"
                    aria-label="View order details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal: Ask for Yes or No before deleting */}
      {orderToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border p-5 space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 id="delete-dialog-title" className="text-base font-bold text-text-muted">
                Delete Order History?
              </h2>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                Are you sure you want to delete order <span className="font-semibold text-text">#{orderToDelete.id.slice(0, 8).toUpperCase()}</span> from your history?
              </p>
              <p className="text-xs text-text-muted/70 mt-1">
                {orderToDelete.fulfillment_type === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'} · {formatPrice(orderToDelete.total_santim)}
              </p>
              <p className="text-xs text-red-500 font-medium mt-2">
                This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium text-center border border-red-100">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  if (!isDeleting) {
                    setOrderToDelete(null);
                    setDeleteError(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                No, Keep
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteOrder}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-75 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
