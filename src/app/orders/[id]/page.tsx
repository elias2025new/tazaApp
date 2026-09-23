'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/money';

type OrderDetail = {
  id: string;
  status: string;
  fulfillment_type: string;
  subtotal_santim: number;
  delivery_fee_santim: number;
  total_santim: number;
  customer_note: string | null;
  placed_at: string;
  order_items: {
    id: string;
    name_snapshot: string;
    quantity: number;
    line_total_santim: number;
  }[];
};

type Step = {
  key: string;
  label: string;
  emoji: string;
  deliveryOnly?: boolean;
};

const DELIVERY_STEPS: Step[] = [
  { key: 'pending',          label: 'Order Received',    emoji: '📋' },
  { key: 'accepted',         label: 'Accepted',          emoji: '✅' },
  { key: 'preparing',        label: 'Preparing',         emoji: '👨‍🍳' },
  { key: 'ready',            label: 'Ready',             emoji: '🎉' },
  { key: 'out_for_delivery', label: 'On the Way',        emoji: '🛵', deliveryOnly: true },
  { key: 'delivered',        label: 'Delivered',         emoji: '🏠' },
];

const PICKUP_STEPS: Step[] = [
  { key: 'pending',   label: 'Order Received', emoji: '📋' },
  { key: 'accepted',  label: 'Accepted',       emoji: '✅' },
  { key: 'preparing', label: 'Preparing',      emoji: '👨‍🍳' },
  { key: 'ready',     label: 'Ready for Pickup', emoji: '🎉' },
  { key: 'delivered', label: 'Picked Up',      emoji: '🏠' },
];

const STATUS_ORDER = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export default function OrderTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) setOrder(d.order);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#103d2b] animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center">
        <p className="text-gray-400 text-sm">Order not found.</p>
        <button onClick={() => router.push('/orders')} className="mt-4 text-[#103d2b] font-semibold text-sm">
          Back to Orders
        </button>
      </div>
    );
  }

  const steps = order.fulfillment_type === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isRejected = order.status === 'rejected' || order.status === 'cancelled';
  const isCompleted = order.status === 'delivered';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center gap-3 px-4 py-4">
        <button onClick={() => router.push('/orders')} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="font-bold text-gray-800">Track Order</h1>
          <p className="text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        {!isRejected && !isCompleted && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stepper */}
        {!isRejected ? (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="space-y-0">
              {steps.map((step, idx) => {
                const stepStatusIdx = STATUS_ORDER.indexOf(step.key);
                const isDone = stepStatusIdx < currentIdx || isCompleted;
                const isActive = step.key === order.status;
                const isPending = stepStatusIdx > currentIdx && !isCompleted;

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Left: icon + line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all ${
                        isDone ? 'bg-[#103d2b]' :
                        isActive ? 'bg-[#103d2b] ring-4 ring-[#103d2b]/20' :
                        'bg-gray-100'
                      }`}>
                        {isDone ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : isActive ? (
                          <span>{step.emoji}</span>
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 transition-all ${isDone ? 'bg-[#103d2b]' : 'bg-gray-100'}`} />
                      )}
                    </div>

                    {/* Right: label */}
                    <div className="pt-1.5 pb-8">
                      <p className={`text-sm font-semibold ${
                        isDone ? 'text-gray-500' :
                        isActive ? 'text-[#103d2b]' :
                        isPending ? 'text-gray-300' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {isActive && !isCompleted && (
                        <p className="text-xs text-[#103d2b]/60 mt-0.5 animate-pulse">In progress...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isCompleted && (
              <div className="mt-2 bg-green-50 rounded-xl p-3 text-center">
                <p className="text-green-700 font-semibold text-sm">Enjoy your meal! 🌿</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 rounded-2xl p-5 text-center">
            <p className="text-2xl mb-2">❌</p>
            <p className="font-semibold text-red-700">Order {order.status}</p>
            <p className="text-red-500 text-sm mt-1">Please contact us if you need help.</p>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Order Details</h2>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name_snapshot} × {item.quantity}</span>
                <span className="font-medium text-gray-800">{formatPrice(item.line_total_santim)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal_santim)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Transaction fee</span>
              <span>{formatPrice(order.total_santim - order.subtotal_santim - order.delivery_fee_santim)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Delivery</span>
              <span>Free 🎉</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t border-gray-50">
              <span>Total</span>
              <span className="text-[#103d2b]">{formatPrice(order.total_santim)}</span>
            </div>
          </div>
        </div>

        {order.customer_note && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">YOUR NOTE</p>
            <p className="text-sm text-gray-600">{order.customer_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
