'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Store, ListOrdered, Utensils, CheckCircle, XCircle } from 'lucide-react';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { formatPrice } from '@/lib/money';

type Order = {
  id: string;
  status: string;
  fulfillment_type: string;
  total_santim: number;
  placed_at: string;
  customer_note: string | null;
  scheduled_for: string | null;
  order_items: { name_snapshot: string; quantity: number; line_total_santim: number }[];
};

type MenuItem = {
  id: string;
  name_en: string;
  base_price_santim: number;
  is_available: boolean;
  image_path: string | null;
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

function playSynth(type: string) {
  if (type === 'none' || typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (freq: number, oscType: OscillatorType, startTime: number, duration: number, vol: number = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    
    if (type === 'beep') {
      playNote(880, 'sine', now, 0.3); // Simple beep (A5)
    } else if (type === 'message') {
      // iPhone message style (Tri-tone / Note)
      playNote(880, 'sine', now, 0.15, 0.2);
      playNote(1046.50, 'sine', now + 0.2, 0.4, 0.2);
    } else if (type === 'chime') {
      // Store door chime (Ding-Dong)
      playNote(987.77, 'sine', now, 0.4, 0.2);
      playNote(783.99, 'sine', now + 0.4, 0.6, 0.2);
    } else if (type === 'coin') {
      // Cash register / Coin (Cha-ching!)
      playNote(987.77, 'square', now, 0.1, 0.05);
      playNote(1318.51, 'square', now + 0.1, 0.4, 0.05);
    }
  } catch (e) {}
}

export default function StaffDashboard() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Sound settings
  const [soundChoice, setSoundChoice] = useState<string>('message');

  useEffect(() => {
    // Load saved sound preference
    const saved = localStorage.getItem('taza_staff_sound');
    if (saved) setSoundChoice(saved);
  }, []);

  const handleSoundChange = (val: string) => {
    setSoundChoice(val);
    localStorage.setItem('taza_staff_sound', val);
    playSynth(val);
  };

  const prevOrderCountRef = useRef(0);

  // Audio for new orders
  const playDing = useCallback(() => {
    playSynth(soundChoice);
    let count = 1;
    const interval = setInterval(() => {
      playSynth(soundChoice);
      count++;
      if (count >= 3) clearInterval(interval);
    }, 1200);
  }, [soundChoice]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/orders', { headers: { 'x-staff-secret': secret } });
      const d = await res.json();
      const newOrders = d.orders ?? [];
      
      // Check for new pending orders
      const currentPending = newOrders.filter((o: Order) => o.status === 'pending').length;
      if (currentPending > prevOrderCountRef.current) {
        playDing(); // Ding!
      }
      prevOrderCountRef.current = currentPending;

      setOrders(newOrders);
    } catch {}
  }, [secret, playDing]);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      const d = await res.json();
      setMenuItems(d.items ?? []);
    } catch {}
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/store');
      const d = await res.json();
      setStoreOpen(d.is_open);
    } catch {}
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchMenu(), fetchSettings()]);
    setLoading(false);
  }, [fetchOrders, fetchMenu, fetchSettings]);

  useEffect(() => {
    if (authed) {
      loadAll();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [authed, loadAll, fetchOrders]);

  async function transitionStatus(orderId: string, nextStatus: string) {
    setUpdating(orderId + nextStatus);
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_status: nextStatus, staff_secret: secret }),
    });
    await fetchOrders();
    setUpdating(null);
  }

  async function toggleStore(isOpen: boolean) {
    setUpdating('store');
    await fetch('/api/staff/store-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: isOpen, staff_secret: secret }),
    });
    await fetchSettings();
    setUpdating(null);
  }

  async function updateMenu(id: string, updates: Partial<MenuItem>) {
    setUpdating(id);
    await fetch(`/api/staff/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates, staff_secret: secret }),
    });
    await fetchMenu();
    setUpdating(null);
  }

  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{ id: string; file: File } | null>(null);

  const handleImageUpload = async (id: string, blob: Blob) => {
    if (!secret) return;
    setUploadingImageId(id);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('staff_secret', secret);
      formData.append('file', new File([blob], 'menu-image.jpg', { type: 'image/jpeg' }));

      const res = await fetch('/api/staff/menu/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setMenuItems((prev) =>
          prev.map((m) => (m.id === id ? { ...m, image_path: data.url } : m))
        );
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setUploadingImageId(null);
    }
  };

  if (!authed) {
    return (
      <>
        {pendingCrop && (
          <ImageCropModal
            file={pendingCrop.file}
            onConfirm={(blob) => {
              handleImageUpload(pendingCrop.id, blob);
              setPendingCrop(null);
            }}
            onCancel={() => setPendingCrop(null)}
          />
        )}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
          <h1 className="text-xl font-bold text-[#103d2b] mb-1 text-center">🌿 Taza Staff</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">Enter staff secret</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#103d2b] mb-4"
          />
          <button onClick={() => setAuthed(true)} className="w-full bg-[#103d2b] text-white font-semibold py-3 rounded-xl">
            Login
          </button>
        </div>
      </div>
      </>
    );
  }

  const activeOrders = orders.filter((o) => !['delivered', 'rejected', 'cancelled'].includes(o.status));
  const todayOrders = orders.filter((o) => o.placed_at.startsWith(new Date().toISOString().split('T')[0] as string));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_santim, 0);

  return (
    <>
      {pendingCrop && (
        <ImageCropModal
          file={pendingCrop.file}
          onConfirm={(blob) => {
            handleImageUpload(pendingCrop.id, blob);
            setPendingCrop(null);
          }}
          onCancel={() => setPendingCrop(null)}
        />
      )}
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 md:min-h-screen flex flex-col">
        <div className="pt-24 pb-8 px-6 md:p-8 border-b border-gray-100">
          <h1 className="text-4xl font-black text-[#103d2b] tracking-tighter">🌿 Taza Staff</h1>
        </div>
        <nav className="p-6 space-y-4 flex-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-2xl font-bold transition-all duration-200 ${
              activeTab === 'orders' ? 'bg-[#103d2b] text-white shadow-lg scale-[1.02]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <ListOrdered className="w-8 h-8" /> Live Orders
            {activeOrders.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-base px-3 py-1 rounded-full font-black">{activeOrders.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-2xl font-bold transition-all duration-200 ${
              activeTab === 'menu' ? 'bg-[#103d2b] text-white shadow-lg scale-[1.02]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Utensils className="w-8 h-8" /> Menu Items
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-2xl font-bold transition-all duration-200 ${
              activeTab === 'settings' ? 'bg-[#103d2b] text-white shadow-lg scale-[1.02]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Store className="w-8 h-8" /> Store Settings
          </button>
        </nav>
        <div className="p-8 border-t border-gray-100 text-lg font-medium text-gray-400 flex items-center justify-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> Logged in securely
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 max-h-screen overflow-y-auto">
        {activeTab === 'orders' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Live Orders</h2>
              <div className="flex gap-4">
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-400">Today&apos;s Orders</p>
                  <p className="font-bold text-gray-800">{todayOrders.length}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-400">Today&apos;s Revenue</p>
                  <p className="font-bold text-[#103d2b]">{formatPrice(todayRevenue)}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {activeOrders.map((order) => {
                  const actions = NEXT_STATUS[order.status] ?? [];
                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
                              {order.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            {order.scheduled_for && (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                                🕒 Scheduled: {new Date(order.scheduled_for).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-800">
                            {order.fulfillment_type === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'} · {formatPrice(order.total_santim)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Placed: {new Date(order.placed_at).toLocaleTimeString()}</p>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>

                      <div className="p-5 flex-1">
                        <ul className="space-y-2">
                          {order.order_items.map((item, i) => (
                            <li key={i} className="flex justify-between text-sm">
                              <span className="text-gray-700 font-medium">{item.quantity}x {item.name_snapshot}</span>
                              <span className="text-gray-400">{formatPrice(item.line_total_santim)}</span>
                            </li>
                          ))}
                        </ul>
                        {order.customer_note && (
                          <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
                            <p className="text-xs font-semibold text-amber-800 mb-1">Customer Note:</p>
                            <p className="text-sm text-amber-900">{order.customer_note}</p>
                          </div>
                        )}
                      </div>

                      {actions.length > 0 && (
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                          {actions.map((action) => (
                            <button
                              key={action.next}
                              onClick={() => transitionStatus(order.id, action.next)}
                              disabled={updating === order.id + action.next}
                              className={`flex-1 ${action.color} text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-transform active:scale-[0.98]`}
                            >
                              {updating === order.id + action.next ? '...' : action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {activeOrders.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-4xl mb-4">🎉</p>
                <p className="text-gray-500 font-medium">All caught up! No active orders.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Item Name</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Image URL</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Price (Birr)</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Available</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-4 text-sm font-semibold text-gray-800">{item.name_en}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {item.image_path ? (
                            <img src={item.image_path} alt="" className="w-8 h-8 rounded object-cover border flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border flex-shrink-0 flex items-center justify-center text-[10px] text-gray-400">None</div>
                          )}
                          
                          {uploadingImageId === item.id ? (
                            <span className="text-xs text-gray-400 ml-2">Uploading...</span>
                          ) : (
                            <label className="cursor-pointer bg-gray-50 border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 active:scale-95 transition-all">
                              {item.image_path ? 'Replace' : 'Upload'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setPendingCrop({ id: item.id, file });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          defaultValue={Math.round(item.base_price_santim / 100)}
                          onBlur={(e) => {
                            const newPrice = Number(e.target.value) * 100;
                            if (newPrice !== item.base_price_santim) {
                              updateMenu(item.id, { base_price_santim: newPrice });
                            }
                          }}
                          className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => updateMenu(item.id, { is_available: !item.is_available })}
                          disabled={updating === item.id}
                          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none"
                          style={{ backgroundColor: item.is_available ? '#103d2b' : '#e5e7eb' }}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        {updating === item.id && <span className="text-xs text-gray-400">Saving...</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Store Settings</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Store Status</h3>
                <p className="text-sm text-gray-500 mt-1">
                  When closed, customers can still browse the menu but must schedule orders for a later time.
                </p>
              </div>
              <button
                onClick={() => toggleStore(!storeOpen)}
                disabled={updating === 'store'}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-50 ${
                  storeOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#103d2b] hover:bg-[#0c2f21]'
                }`}
              >
                {storeOpen ? 'Close Store' : 'Open Store'}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Notification Sound</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the alert sound for new incoming orders on this device.
                </p>
              </div>
              <select
                value={soundChoice}
                onChange={(e) => handleSoundChange(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#103d2b] cursor-pointer"
              >
                <option value="message">📱 Message (iPhone-style)</option>
                <option value="chime">🚪 Store Chime</option>
                <option value="coin">💰 Coin Drop (Cha-ching)</option>
                <option value="beep">📻 Classic Beep</option>
                <option value="none">🔇 None (Muted)</option>
              </select>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
