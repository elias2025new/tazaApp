'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Trash2, MapPin, MessageSquare, CheckCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, calcOrderTotals } from '@/lib/money';

const SAFE_TOP = 'var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, env(safe-area-inset-top, 0px)))';

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
  useEffect(() => {
    fetch('/api/store')
      .then((r) => r.json())
      .then((d) => setStoreOpen(d.is_open))
      .catch(() => {}); // default to true if error
  }, []);

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
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{
          backgroundColor: '#FBF8F3',
          paddingTop: `calc(72px + ${SAFE_TOP})`,
          paddingBottom: '96px',
        }}
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5 border border-green-200 shadow-xs">
          <CheckCircle className="w-10 h-10 text-[#03301C]" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#03301C] mb-2">Order Placed! 🎉</h1>
        <p className="text-[#3B3D41] text-sm max-w-xs mb-2">
          Your order has been received and our team will start preparing it shortly.
        </p>
        <p className="text-xs text-[#6B6B6C] mb-8">You&apos;ll receive an update on Telegram when it&apos;s ready.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-[#03301C] text-[#FBF8F3] font-semibold text-sm px-8 py-3.5 rounded-full shadow-md shadow-[#03301C]/20 active:scale-95 transition-all"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-[calc(100dvh-5rem)] flex flex-col justify-between"
        style={{
          backgroundColor: '#FBF8F3',
          paddingTop: `calc(84px + ${SAFE_TOP})`,
          paddingBottom: '24px',
        }}
      >
        {/* Top Header */}
        <div className="px-5 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E8E2D5] shadow-xs active:scale-95 transition-all text-[#111111]"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-lg font-bold text-[#03301C]">Your Cart</h1>
          <div className="w-10" />
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center my-auto">
          {/* Elegant Icon Badge */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-[#03301C]/[0.05] border border-[#03301C]/[0.08] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white border border-[#E8E2D5] shadow-xs flex items-center justify-center text-[#03301C]">
                <ShoppingBag className="w-8 h-8 text-[#03301C]" strokeWidth={1.75} />
              </div>
            </div>
            <div
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-xs"
              style={{ backgroundColor: '#c4e32e', border: '2px solid #FBF8F3' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#03301C]" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="font-serif text-2xl font-bold text-[#03301C] mb-2 tracking-tight">
            Your cart is empty
          </h2>

          {/* Subtext */}
          <p className="text-sm text-[#3B3D41] max-w-[260px] leading-relaxed mb-7 font-normal">
            Add some delicious items from our menu to get started!
          </p>

          {/* Action CTA */}
          <button
            onClick={() => router.push('/')}
            className="w-full max-w-[220px] bg-[#03301C] hover:bg-[#022013] active:scale-[0.98] text-[#FBF8F3] font-semibold text-sm py-3.5 px-6 rounded-full shadow-md shadow-[#03301C]/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Browse Menu</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Footer Brand Reassurance Note */}
        <div className="px-6 flex items-center justify-center gap-5 text-[11.5px] text-[#6B6B6C]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EBAA38]" />
            Freshly prepared
          </span>
          <span className="text-[#E8E2D5]">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#03301C]" />
            Bole Rwanda, Addis
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface-raised">
      {/* Header */}
      <div
        className="sticky top-0 z-40 bg-surface border-b border-border flex items-center gap-3 px-4 pb-4"
        style={{ paddingTop: `calc(84px + ${SAFE_TOP})` }}
      >
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </button>
        <h1 className="font-bold text-text-muted text-lg">Your Order</h1>
      </div>

      <div className="px-4 py-4 space-y-4 pb-40">
        {/* Cart Items */}
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          {items.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-muted">{item.name_en}</p>
                  <p className="text-xs text-text-muted">{formatPrice(item.base_price_santim)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-text-muted font-bold text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-text-muted min-w-[16px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => addItem({ id: item.id, name_en: item.name_en, base_price_santim: item.base_price_santim })}
                      className="w-6 h-6 flex items-center justify-center text-primary font-bold text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-bold text-primary min-w-[70px] text-right">
                    {formatPrice(item.base_price_santim * item.quantity)}
                  </p>
                  <button onClick={() => updateQuantity(item.id, 0)} className="text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {idx < items.length - 1 && <div className="h-px bg-surface-raised mx-4" />}
            </div>
          ))}
        </div>

        {/* Fulfillment Toggle */}
        <div className="bg-surface rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-bold text-text-muted mb-3">How would you like your order?</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFulfillment('delivery')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                fulfillment === 'delivery' ? 'bg-primary text-white shadow' : 'bg-gray-100 text-text-muted'
              }`}
            >
              🛵 Delivery
            </button>
            <button
              onClick={() => setFulfillment('pickup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                fulfillment === 'pickup' ? 'bg-primary text-white shadow' : 'bg-gray-100 text-text-muted'
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
                className="flex-1 bg-surface border border-orange-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-text-muted"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-32 bg-surface border border-orange-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 text-text-muted"
              />
            </div>
          </div>
        )}

        {/* Address / Landmark */}
        {fulfillment === 'delivery' && (
          <div className="bg-surface rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Delivery Landmark <span className="text-red-400 text-xs">*required</span>
            </h2>
            <textarea
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Bole Rwanda, near Total petrol station, blue gate"
              rows={2}
              className="w-full bg-surface-raised rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#103d2b]/20 resize-none"
            />
          </div>
        )}

        {/* Notes */}
        <div className="bg-surface rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-text-muted" />
            Notes <span className="text-text-muted font-normal">(optional)</span>
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests? Allergies? Gate code?"
            rows={2}
            className="w-full bg-surface-raised rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#103d2b]/20 resize-none"
          />
        </div>

        {/* Order Summary */}
        <div className="bg-surface rounded-2xl shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-bold text-text-muted mb-3">Order Summary</h2>
          <div className="flex justify-between text-sm text-text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-text-muted">
            <span>Transaction fee</span>
            <span>{formatPrice(transactionFee)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Delivery</span>
            <span>Free 🎉</span>
          </div>
          <div className="h-px bg-gray-100 my-1" />
          <div className="flex justify-between text-base font-bold text-text-muted">
            <span>Total</span>
            <span className="text-primary">{formatPrice(grandTotal)}</span>
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
          className="w-full bg-primary disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg text-base active:scale-[0.98] transition-all"
        >
          {placing ? 'Placing Order...' : `Place Order · ${formatPrice(grandTotal)}`}
        </button>
      </div>
    </div>
  );
}
