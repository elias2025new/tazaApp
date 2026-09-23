'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, MapPin, MessageSquare, CheckCircle } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, calcOrderTotals } from '@/lib/money';

type FulfillmentType = 'delivery' | 'pickup';

export default function CartPage() {
  const router = useRouter();
  const { items, addItem, removeItem, updateQuantity, clearCart, total } = useCartStore();

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('delivery');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Store status & Scheduling
  const [storeOpen, setStoreOpen] = useState(true);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Fetch store status on mount
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      fetch('/api/store')
        .then((r) => r.json())
        .then((d) => setStoreOpen(d.is_open))
        .catch(() => {}); // default to true if error
    }, []);
  });

  const subtotal = total();
  const { transactionFee, deliveryFee, total: grandTotal } = calcOrderTotals(subtotal);

  async function placeOrder() {
    if (fulfillment === 'delivery' && !landmark.trim()) {
      setError('Please enter your delivery landmark.');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!storeOpen && (!scheduleDate || !scheduleTime)) {
      setError('The store is currently closed. Please select a date and time for your scheduled order.');
      return;
    }

    setPlacing(true);
    setError(null);

    // Combine date and time for scheduled_for
    let scheduledFor = null;
    if (!storeOpen && scheduleDate && scheduleTime) {
      scheduledFor = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          fulfillment_type: fulfillment,
          landmark: landmark.trim() || null,
          notes: notes.trim() || null,
          scheduled_for: scheduledFor,
          idempotency_key: crypto.randomUUID(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to place order. Please try again.');
        setPlacing(false);
        return;
      }

      clearCart();
      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setPlacing(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-500 text-sm mb-2">
          Your order has been received and our team will start preparing it shortly.
        </p>
        <p className="text-xs text-gray-400 mb-8">You&apos;ll receive an update on Telegram when it&apos;s ready.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-[#103d2b] text-white font-semibold px-8 py-3 rounded-full shadow-md"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-400 mb-6">Add some items from the menu to get started!</p>
        <button
          onClick={() => router.push('/')}
          className="bg-[#103d2b] text-white font-semibold px-8 py-3 rounded-full"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center gap-3 px-4 pt-24 pb-4">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="font-bold text-gray-800 text-lg">Your Order</h1>
      </div>

      <div className="px-4 py-4 space-y-4 pb-40">
        {/* Cart Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {items.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.name_en}</p>
                  <p className="text-xs text-gray-400">{formatPrice(item.base_price_santim)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-gray-800 min-w-[16px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => addItem({ id: item.id, name_en: item.name_en, base_price_santim: item.base_price_santim })}
                      className="w-6 h-6 flex items-center justify-center text-[#103d2b] font-bold text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#103d2b] min-w-[70px] text-right">
                    {formatPrice(item.base_price_santim * item.quantity)}
                  </p>
                  <button onClick={() => updateQuantity(item.id, 0)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {idx < items.length - 1 && <div className="h-px bg-gray-50 mx-4" />}
            </div>
          ))}
        </div>

        {/* Fulfillment Toggle */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">How would you like your order?</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFulfillment('delivery')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                fulfillment === 'delivery' ? 'bg-[#103d2b] text-white shadow' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🛵 Delivery
            </button>
            <button
              onClick={() => setFulfillment('pickup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                fulfillment === 'pickup' ? 'bg-[#103d2b] text-white shadow' : 'bg-gray-100 text-gray-600'
              }`}
            >
              🏃 Pickup
            </button>
          </div>
        </div>

        {/* Scheduled Order (If Store Closed) */}
        {!storeOpen && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <h2 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
              🌙 We are currently closed
            </h2>
            <p className="text-xs text-orange-700 mb-4">
              You can still place an order by scheduling it for later. When would you like it ready?
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]} // restrict to today or future
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-gray-700"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-32 bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-gray-700"
              />
            </div>
          </div>
        )}

        {/* Address / Landmark */}
        {fulfillment === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#103d2b]" />
              Delivery Landmark <span className="text-red-400 text-xs">*required</span>
            </h2>
            <textarea
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Bole Rwanda, near Total petrol station, blue gate"
              rows={2}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#103d2b]/20 resize-none"
            />
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests? Allergies? Gate code?"
            rows={2}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#103d2b]/20 resize-none"
          />
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Order Summary</h2>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Transaction fee</span>
            <span>{formatPrice(transactionFee)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Delivery</span>
            <span>Free 🎉</span>
          </div>
          <div className="h-px bg-gray-100 my-1" />
          <div className="flex justify-between text-base font-bold text-gray-800">
            <span>Total</span>
            <span className="text-[#103d2b]">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Sticky Place Order Button */}
      <div className="fixed bottom-16 left-0 right-0 mx-auto max-w-md px-4 pb-3 bg-gradient-to-t from-gray-50 pt-4">
        <button
          onClick={placeOrder}
          disabled={placing}
          className="w-full bg-[#103d2b] disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg text-base active:scale-[0.98] transition-all"
        >
          {placing ? 'Placing Order...' : `Place Order · ${formatPrice(grandTotal)}`}
        </button>
      </div>
    </div>
  );
}
