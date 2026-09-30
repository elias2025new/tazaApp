'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  RefreshCw, Store, ListOrdered, Utensils, CheckCircle2, XCircle, 
  Volume2, VolumeX, Clock, ShoppingBag, ChefHat, Bike, Search, 
  LogOut, DollarSign, Flame, AlertCircle, Eye, EyeOff, Check,
  Sparkles, ShieldCheck
} from 'lucide-react';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { formatPrice } from '@/lib/money';

type OrderItem = {
  name_snapshot: string;
  quantity: number;
  line_total_santim: number;
};

type Order = {
  id: string;
  status: string;
  fulfillment_type: string;
  total_santim: number;
  placed_at: string;
  customer_note: string | null;
  scheduled_for: string | null;
  order_items: OrderItem[];
};

type MenuItem = {
  id: string;
  name_en: string;
  description_en?: string | null;
  base_price_santim: number;
  is_available: boolean;
  image_path: string | null;
};

const DEFAULT_BADGE = { label: 'Pending Approval', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:          DEFAULT_BADGE,
  accepted:         { label: 'Accepted',         bg: 'bg-blue-50',  text: 'text-blue-800',  border: 'border-blue-200' },
  preparing:        { label: 'In Kitchen',       bg: 'bg-purple-50',text: 'text-purple-800',border: 'border-purple-200' },
  ready:            { label: 'Ready',            bg: 'bg-emerald-50',text: 'text-emerald-800',border: 'border-emerald-200' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-orange-50',text: 'text-orange-800',border: 'border-orange-200' },
  delivered:        { label: 'Completed',        bg: 'bg-stone-100',text: 'text-stone-700', border: 'border-stone-200' },
  rejected:         { label: 'Rejected',         bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200' },
  cancelled:        { label: 'Cancelled',        bg: 'bg-stone-100',text: 'text-stone-600', border: 'border-stone-200' },
};

function playSynth(type: string) {
  if (type === 'none' || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
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
      playNote(880, 'sine', now, 0.25, 0.2);
    } else if (type === 'message') {
      playNote(880, 'sine', now, 0.12, 0.25);
      playNote(1046.50, 'sine', now + 0.15, 0.35, 0.25);
    } else if (type === 'chime') {
      playNote(987.77, 'sine', now, 0.3, 0.25);
      playNote(783.99, 'sine', now + 0.3, 0.45, 0.25);
    } else if (type === 'coin') {
      playNote(987.77, 'square', now, 0.08, 0.1);
      playNote(1318.51, 'square', now + 0.08, 0.35, 0.1);
    }
  } catch {}
}

function formatRelativeTime(isoString: string) {
  try {
    const date = new Date(isoString);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatClockTime(isoString: string) {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function StaffDashboard() {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Order status filter tab
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed'>('all');

  // Menu search and filter
  const [menuSearch, setMenuSearch] = useState('');
  const [menuAvailabilityFilter, setMenuAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [priceSaveSuccess, setPriceSaveSuccess] = useState<string | null>(null);

  // Sound settings
  const [soundChoice, setSoundChoice] = useState<string>('message');
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(10);

  useEffect(() => {
    const savedSound = localStorage.getItem('taza_staff_sound');
    if (savedSound) setSoundChoice(savedSound);

    const savedSecret = localStorage.getItem('taza_staff_secret');
    if (savedSecret) {
      setSecret(savedSecret);
      setAuthed(true);
    }
  }, []);

  const handleSoundChange = (val: string) => {
    setSoundChoice(val);
    localStorage.setItem('taza_staff_sound', val);
    playSynth(val);
  };

  const prevOrderCountRef = useRef(0);

  const playDing = useCallback(() => {
    playSynth(soundChoice);
    let count = 1;
    const interval = setInterval(() => {
      playSynth(soundChoice);
      count++;
      if (count >= 3) clearInterval(interval);
    }, 1100);
  }, [soundChoice]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/orders', { headers: { 'x-staff-secret': secret } });
      if (res.status === 401) {
        setAuthed(false);
        localStorage.removeItem('taza_staff_secret');
        setAuthError('Session expired or unauthorized. Please re-enter staff secret.');
        return;
      }
      const d = await res.json();
      const newOrders: Order[] = d.orders ?? [];
      
      const currentPending = newOrders.filter((o: Order) => o.status === 'pending').length;
      if (currentPending > prevOrderCountRef.current) {
        playDing();
      }
      prevOrderCountRef.current = currentPending;

      setOrders(newOrders);
      setLastRefreshedAt(new Date());
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
  }, [secret, playDing]);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/menu', { headers: { 'x-staff-secret': secret } });
      const d = await res.json();
      setMenuItems(d.items ?? []);
    } catch {}
  }, [secret]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/store');
      const d = await res.json();
      if (typeof d.is_open === 'boolean') {
        setStoreOpen(d.is_open);
      }
    } catch {}
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchMenu(), fetchSettings()]);
    setLoading(false);
  }, [fetchOrders, fetchMenu, fetchSettings]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOrders(), fetchMenu(), fetchSettings()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (authed) {
      loadAll();
      const interval = setInterval(fetchOrders, refreshIntervalSec * 1000);
      return () => clearInterval(interval);
    }
  }, [authed, loadAll, fetchOrders, refreshIntervalSec]);

  async function transitionStatus(orderId: string, nextStatus: string) {
    setUpdating(orderId + nextStatus);
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_status: nextStatus, staff_secret: secret }),
      });
      await fetchOrders();
    } finally {
      setUpdating(null);
    }
  }

  async function toggleStore(isOpen: boolean) {
    setUpdating('store');
    try {
      await fetch('/api/staff/store-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: isOpen, staff_secret: secret }),
      });
      await fetchSettings();
    } finally {
      setUpdating(null);
    }
  }

  async function updateMenu(id: string, updates: Partial<MenuItem>) {
    setUpdating(id);
    try {
      await fetch(`/api/staff/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates, staff_secret: secret }),
      });
      await fetchMenu();
    } finally {
      setUpdating(null);
    }
  }

  const handlePriceSave = async (id: string) => {
    const rawVal = priceInputs[id];
    if (rawVal === undefined) return;
    const numeric = parseFloat(rawVal);
    if (isNaN(numeric) || numeric < 0) return;
    const santim = Math.round(numeric * 100);
    await updateMenu(id, { base_price_santim: santim });
    setPriceSaveSuccess(id);
    setTimeout(() => {
      setPriceSaveSuccess((curr) => (curr === id ? null : curr));
      setEditingPriceId(null);
    }, 1500);
  };

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
    } catch {
      alert('Failed to upload image');
    } finally {
      setUploadingImageId(null);
    }
  };

  // Login view
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#03301C] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#03301C]/20">
              <span className="text-2xl">🌿</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Taza Greens</h1>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mt-1">Staff Portal & Kitchen Display</p>
          </div>

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                Staff Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Enter staff secret..."
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && secret) {
                      localStorage.setItem('taza_staff_secret', secret);
                      setAuthed(true);
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#03301C] focus:bg-white focus:ring-2 focus:ring-[#03301C]/10 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              onClick={() => {
                if (secret) {
                  localStorage.setItem('taza_staff_secret', secret);
                  setAuthed(true);
                }
              }} 
              disabled={!secret}
              className="w-full bg-[#03301C] hover:bg-[#022013] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Log In to Dashboard</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-400">
              Authorized personnel only. Audio notifications will automatically sound on this device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter orders
  const activeOrders = orders.filter((o) => !['delivered', 'rejected', 'cancelled'].includes(o.status));
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const prepOrders = orders.filter((o) => ['accepted', 'preparing'].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const deliveryOrders = orders.filter((o) => o.status === 'out_for_delivery');
  const todayOrders = orders.filter((o) => o.placed_at.startsWith(new Date().toISOString().split('T')[0] as string));
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_santim, 0);

  // Filtered orders to display in the main queue
  const displayedOrders = (() => {
    switch (orderFilter) {
      case 'pending':          return pendingOrders;
      case 'preparing':        return prepOrders;
      case 'ready':            return readyOrders;
      case 'out_for_delivery': return deliveryOrders;
      case 'completed':        return completedOrders;
      case 'all':
      default:                 return activeOrders;
    }
  })();

  // Filter menu items
  const displayedMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name_en.toLowerCase().includes(menuSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (menuAvailabilityFilter === 'available') return item.is_available;
    if (menuAvailabilityFilter === 'unavailable') return !item.is_available;
    return true;
  });

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

      <div className="min-h-screen bg-[#FBF8F3] flex flex-col md:flex-row text-stone-900">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-72 lg:w-80 bg-white border-b md:border-b-0 md:border-r border-stone-200/80 md:min-h-screen flex flex-col shrink-0 sticky top-0 z-20 md:static">
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#03301C] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🌿
              </div>
              <div>
                <h1 className="text-base font-black text-stone-900 leading-tight">Taza Staff</h1>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Kitchen Portal
                </span>
              </div>
            </div>

            {/* Mobile Store Switch */}
            <div className="md:hidden flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${storeOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <button
                onClick={() => toggleStore(!storeOpen)}
                disabled={updating === 'store'}
                className="text-xs font-bold text-stone-700 border border-stone-200 rounded-lg px-2 py-1 bg-stone-50"
              >
                {storeOpen ? 'Open' : 'Closed'}
              </button>
            </div>
          </div>

          {/* Store Status Card (Desktop Sidebar) */}
          <div className="hidden md:block mx-4 my-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${storeOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-bold text-stone-800">
                  {storeOpen ? 'Store is Open' : 'Store is Closed'}
                </span>
              </div>
              <button
                onClick={() => toggleStore(!storeOpen)}
                disabled={updating === 'store'}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                  storeOpen
                    ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                    : 'text-white bg-[#03301C] hover:bg-[#022013]'
                }`}
              >
                {updating === 'store' ? '...' : (storeOpen ? 'Pause' : 'Open')}
              </button>
            </div>
            <p className="text-[10px] text-stone-500 mt-1 leading-normal">
              {storeOpen ? 'Accepting live orders now' : 'Customers must schedule orders'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 md:p-4 flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1.5 md:gap-2 flex-1 no-scrollbar items-center md:items-stretch">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-none md:w-full flex items-center justify-between px-3.5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-150 ${
                activeTab === 'orders'
                  ? 'bg-[#03301C] text-white shadow-md shadow-[#03301C]/15 ring-1 ring-[#03301C]'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ListOrdered className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                <span>Live Orders</span>
              </div>
              {activeOrders.length > 0 && (
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  activeTab === 'orders' 
                    ? 'bg-[#EBAA38] text-[#03301C]' 
                    : 'bg-[#03301C] text-white'
                }`}>
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-none md:w-full flex items-center justify-between px-3.5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-150 ${
                activeTab === 'menu'
                  ? 'bg-[#03301C] text-white shadow-md shadow-[#03301C]/15 ring-1 ring-[#03301C]'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                <span>Menu Items</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'menu' ? 'bg-white/20 text-white' : 'text-stone-500 bg-stone-100'
              }`}>
                {menuItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-none md:w-full flex items-center justify-between px-3.5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-150 ${
                activeTab === 'settings'
                  ? 'bg-[#03301C] text-white shadow-md shadow-[#03301C]/15 ring-1 ring-[#03301C]'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                <span>Store Settings</span>
              </div>
            </button>
          </nav>

          {/* Quick Sound Alert Preview (Desktop Sidebar) */}
          <div className="hidden md:block px-4 py-3 mx-4 mb-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[11px] font-bold text-amber-900">Audio Alert</span>
              </div>
              <button
                onClick={() => playSynth(soundChoice)}
                className="text-[10px] font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-300/70 px-2 py-0.5 rounded-md transition-colors"
                title="Test current notification chime"
              >
                Test Chime
              </button>
            </div>
            <p className="text-[10px] text-amber-700/80 mt-1 capitalize">
              Sound: {soundChoice === 'none' ? 'Muted' : soundChoice}
            </p>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 md:p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium hidden sm:inline">Connected</span>
            </div>
            <button 
              onClick={() => {
                setAuthed(false);
                localStorage.removeItem('taza_staff_secret');
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:max-h-screen md:overflow-y-auto">
          {/* TAB 1: LIVE ORDERS */}
          {activeTab === 'orders' && (
            <div className="max-w-6xl mx-auto space-y-5">
              {/* Header Title & Refresh Control */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/70">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Live Kitchen Stream</span>
                    {activeOrders.length > 0 && (
                      <span className="text-xs font-bold bg-[#EBAA38] text-[#03301C] px-2.5 py-0.5 rounded-full">
                        {activeOrders.length} active
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto-syncs every {refreshIntervalSec}s</span>
                    <span>·</span>
                    <span>Last updated: {formatClockTime(lastRefreshedAt.toISOString())}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => playSynth(soundChoice)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 shadow-sm text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition-all"
                    title="Test audio chime"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-stone-600" />
                    <span>Test Sound</span>
                  </button>

                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 shadow-sm text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#03301C]' : 'text-stone-600'}`} />
                    <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* KPI Metrics Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-stone-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active Queue</span>
                    <Flame className={`w-4 h-4 ${pendingOrders.length > 0 ? 'text-amber-500' : 'text-stone-400'}`} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-stone-900">{activeOrders.length}</span>
                    {pendingOrders.length > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md animate-pulse">
                        {pendingOrders.length} pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-stone-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">In Kitchen</span>
                    <ChefHat className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-900">{prepOrders.length}</span>
                    <span className="text-[10px] text-stone-400">cooking now</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-stone-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Orders</span>
                    <ShoppingBag className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-stone-900">{todayOrders.length}</span>
                    <span className="text-[10px] text-stone-400">{completedOrders.length} delivered</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                  <div className="flex items-center justify-between text-stone-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-900">{formatPrice(todayRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Status Filter Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all',              label: 'All Active',       count: activeOrders.length },
                  { id: 'pending',          label: 'Pending',          count: pendingOrders.length, highlight: pendingOrders.length > 0 },
                  { id: 'preparing',        label: 'In Kitchen',       count: prepOrders.length },
                  { id: 'ready',            label: 'Ready for Pickup', count: readyOrders.length },
                  { id: 'out_for_delivery', label: 'Out for Delivery', count: deliveryOrders.length },
                  { id: 'completed',        label: 'Completed Today',  count: completedOrders.length },
                ].map((tab) => {
                  const isCurrent = orderFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setOrderFilter(tab.id as typeof orderFilter)}
                      className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#03301C] text-white shadow-sm'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isCurrent 
                          ? 'bg-white/25 text-white' 
                          : tab.highlight 
                            ? 'bg-amber-500 text-white font-black' 
                            : 'bg-stone-100 text-stone-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Orders Stream Grid or Empty State */}
              {loading ? (
                <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center shadow-sm">
                  <RefreshCw className="w-8 h-8 text-[#03301C] animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-700">Loading live orders...</p>
                </div>
              ) : displayedOrders.length === 0 ? (
                /* Premium, reassuring empty state */
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 md:p-14 text-center max-w-xl mx-auto my-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-800 shadow-inner">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-stone-900 tracking-tight mb-2">
                    {orderFilter === 'all' ? 'All caught up!' : `No ${orderFilter.replace(/_/g, ' ')} orders`}
                  </h3>
                  <p className="text-stone-500 text-xs sm:text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                    {orderFilter === 'all' 
                      ? 'No active orders in the queue right now. New customer orders will ring here automatically in real time.'
                      : `There are currently no orders in this category.`}
                  </p>
                  
                  <div className="inline-flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      onClick={() => playSynth(soundChoice)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors"
                    >
                      <Volume2 className="w-4 h-4 text-stone-600" />
                      <span>Test Sound Chime</span>
                    </button>
                    <button
                      onClick={handleManualRefresh}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#03301C] hover:bg-[#022013] text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh Stream</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                  {displayedOrders.map((order) => {
                    const statusMeta = STATUS_BADGE[order.status] ?? DEFAULT_BADGE;
                    const isPending = order.status === 'pending';

                    return (
                      <div 
                        key={order.id} 
                        className={`bg-white rounded-2xl md:rounded-3xl shadow-sm border transition-all flex flex-col overflow-hidden ${
                          isPending 
                            ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-amber-100/50' 
                            : 'border-stone-200/90'
                        }`}
                      >
                        {/* Order Card Header */}
                        <div className="p-4 md:p-5 border-b border-stone-100 bg-stone-50/60 flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              {/* Order reference */}
                              <span className="font-mono text-xs font-black text-stone-900 bg-white px-2 py-0.5 rounded-lg border border-stone-200 shadow-2xs">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>

                              {/* Status badge */}
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border} ${isPending ? 'animate-pulse' : ''}`}>
                                {statusMeta.label}
                              </span>

                              {/* Fulfillment pill */}
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                order.fulfillment_type === 'pickup' 
                                  ? 'bg-amber-100/80 text-amber-800 border border-amber-200' 
                                  : 'bg-teal-50 text-teal-800 border border-teal-200'
                              }`}>
                                {order.fulfillment_type === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'}
                              </span>
                            </div>

                            {/* Scheduled warning */}
                            {order.scheduled_for && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg w-fit">
                                <Clock className="w-3.5 h-3.5 text-orange-600" />
                                <span>Scheduled: {new Date(order.scheduled_for).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                              <span>Placed {formatRelativeTime(order.placed_at)}</span>
                              <span>·</span>
                              <span>{formatClockTime(order.placed_at)}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base md:text-lg font-black text-stone-900 block">
                              {formatPrice(order.total_santim)}
                            </span>
                            <span className="text-[11px] text-stone-400 font-medium">
                              {order.order_items.reduce((s, i) => s + i.quantity, 0)} items
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="p-4 md:p-5 flex-1 space-y-3">
                          <ul className="divide-y divide-stone-100">
                            {order.order_items.map((item, i) => (
                              <li key={i} className="py-2 flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono font-bold text-stone-900 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md text-xs">
                                    {item.quantity}×
                                  </span>
                                  <span className="font-semibold text-stone-800">
                                    {item.name_snapshot}
                                  </span>
                                </div>
                                <span className="font-mono text-stone-500 font-medium text-xs">
                                  {formatPrice(item.line_total_santim)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {/* Customer note box */}
                          {order.customer_note && (
                            <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200 text-xs">
                              <p className="font-bold text-amber-900 mb-0.5 flex items-center gap-1.5">
                                <span>📝 Customer Note:</span>
                              </p>
                              <p className="text-amber-950 font-medium italic">
                                &ldquo;{order.customer_note}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Status Action Buttons */}
                        <div className="p-3 md:p-4 bg-stone-50/70 border-t border-stone-100 flex items-center gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => transitionStatus(order.id, 'accepted')}
                                disabled={updating === order.id + 'accepted'}
                                className="flex-1 bg-[#03301C] hover:bg-[#022013] text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                <span>{updating === order.id + 'accepted' ? 'Accepting...' : 'Accept Order'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to reject this order?')) {
                                    transitionStatus(order.id, 'rejected');
                                  }
                                }}
                                disabled={updating === order.id + 'rejected'}
                                className="px-4 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs sm:text-sm font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span>{updating === order.id + 'rejected' ? '...' : 'Reject'}</span>
                              </button>
                            </>
                          )}

                          {order.status === 'accepted' && (
                            <button
                              onClick={() => transitionStatus(order.id, 'preparing')}
                              disabled={updating === order.id + 'preparing'}
                              className="flex-1 bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <ChefHat className="w-4 h-4 text-purple-200" />
                              <span>{updating === order.id + 'preparing' ? 'Updating...' : 'Start Cooking / Prep'}</span>
                            </button>
                          )}

                          {order.status === 'preparing' && (
                            <button
                              onClick={() => transitionStatus(order.id, 'ready')}
                              disabled={updating === order.id + 'ready'}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                              <span>{updating === order.id + 'ready' ? 'Updating...' : 'Mark Food Ready'}</span>
                            </button>
                          )}

                          {order.status === 'ready' && (
                            <>
                              {order.fulfillment_type === 'delivery' ? (
                                <button
                                  onClick={() => transitionStatus(order.id, 'out_for_delivery')}
                                  disabled={updating === order.id + 'out_for_delivery'}
                                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  <Bike className="w-4 h-4 text-orange-200" />
                                  <span>{updating === order.id + 'out_for_delivery' ? 'Updating...' : 'Hand to Courier (Out for Delivery)'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => transitionStatus(order.id, 'delivered')}
                                  disabled={updating === order.id + 'delivered'}
                                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                  <span>{updating === order.id + 'delivered' ? 'Updating...' : 'Customer Picked Up'}</span>
                                </button>
                              )}
                            </>
                          )}

                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={() => transitionStatus(order.id, 'delivered')}
                              disabled={updating === order.id + 'delivered'}
                              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                              <span>{updating === order.id + 'delivered' ? 'Updating...' : 'Mark Delivered'}</span>
                            </button>
                          )}

                          {order.status === 'delivered' && (
                            <div className="w-full text-center py-1 text-xs font-bold text-stone-500 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Order Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MENU ITEMS */}
          {activeTab === 'menu' && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/70">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Menu Catalog</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Toggle dish availability in 1 click and adjust prices in real-time.
                  </p>
                </div>
                <span className="text-xs font-bold bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 self-start sm:self-auto">
                  {menuItems.length} Total Items
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes by name..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 outline-none focus:border-[#03301C] focus:ring-2 focus:ring-[#03301C]/10 transition-all shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
                  {(['all', 'available', 'unavailable'] as const).map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setMenuAvailabilityFilter(filterType)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        menuAvailabilityFilter === filterType
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {filterType === 'all' ? 'All' : filterType === 'available' ? 'Available' : 'Sold Out'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Table / Card View */}
              <div className="bg-white rounded-2xl md:rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-stone-100">
                  {displayedMenuItems.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 text-sm font-medium">
                      No menu items match your search.
                    </div>
                  ) : (
                    displayedMenuItems.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          !item.is_available ? 'bg-stone-50/60 opacity-80' : 'hover:bg-stone-50/40'
                        }`}
                      >
                        {/* Item Photo & Name */}
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 group">
                            {item.image_path ? (
                              <img src={item.image_path} alt={item.name_en} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-400">
                                🍳
                              </div>
                            )}

                            {uploadingImageId === item.id ? (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                                Uploading
                              </div>
                            ) : (
                              <label className="absolute inset-0 bg-black/40 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                Change
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

                          <div>
                            <h4 className="text-sm font-bold text-stone-900">{item.name_en}</h4>
                            <p className="text-xs text-stone-500 font-mono mt-0.5">
                              {formatPrice(item.base_price_santim)}
                            </p>
                          </div>
                        </div>

                        {/* Price Edit & Availability Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          {/* Price input */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-500">Price:</span>
                            <div className="relative">
                              <input
                                type="number"
                                defaultValue={Math.round(item.base_price_santim / 100)}
                                onChange={(e) => {
                                  setEditingPriceId(item.id);
                                  setPriceInputs((prev) => ({ ...prev, [item.id]: e.target.value }));
                                }}
                                onBlur={() => handlePriceSave(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handlePriceSave(item.id);
                                }}
                                className="w-20 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-900 outline-none focus:border-[#03301C] focus:bg-white text-right pr-6"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-bold">
                                ETB
                              </span>
                            </div>

                            {priceSaveSuccess === item.id && (
                              <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                            )}
                          </div>

                          {/* Availability Switch */}
                          <div className="flex items-center gap-2.5">
                            <span className={`text-xs font-bold hidden sm:inline ${item.is_available ? 'text-emerald-700' : 'text-stone-400'}`}>
                              {item.is_available ? 'Available' : 'Sold Out'}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateMenu(item.id, { is_available: !item.is_available })}
                              disabled={updating === item.id}
                              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                item.is_available ? 'bg-emerald-600' : 'bg-stone-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                  item.is_available ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STORE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="pb-2 border-b border-stone-200/70">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Store & Kitchen Settings</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure store operation hours, kitchen chime alerts, and dashboard refresh speeds.
                </p>
              </div>

              {/* Store Status Card */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#03301C]" />
                      <span>Online Store Status</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-lg leading-relaxed">
                      When closed, customer ordering switches to scheduling mode only. You can pause during rush hours or close at the end of the day.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStore(!storeOpen)}
                    disabled={updating === 'store'}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-sm ${
                      storeOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-[#03301C] hover:bg-[#022013]'
                    }`}
                  >
                    {updating === 'store' ? 'Updating...' : (storeOpen ? 'Close Store' : 'Open Store')}
                  </button>
                </div>

                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                  storeOpen 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : 'bg-red-50 text-red-900 border-red-200'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${storeOpen ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                  <span>Current Status: {storeOpen ? 'OPEN — Accepting immediate orders' : 'CLOSED — Accepting scheduled orders only'}</span>
                </div>
              </div>

              {/* Notification Audio Chime Card */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-amber-600" />
                    <span>Kitchen Audio Alerts</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-lg leading-relaxed">
                    Whenever a customer submits a new order, this device will play the selected alert chime 3 times so staff never miss an order.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select
                    value={soundChoice}
                    onChange={(e) => handleSoundChange(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:border-[#03301C] focus:bg-white cursor-pointer"
                  >
                    <option value="message">📱 iPhone Message (Tri-tone)</option>
                    <option value="chime">🚪 Store Doorbell Chime (Ding-Dong)</option>
                    <option value="coin">💰 Cash Register Coin (Cha-ching)</option>
                    <option value="beep">📻 Classic Kitchen Beep</option>
                    <option value="none">🔇 None (Muted)</option>
                  </select>

                  <button
                    onClick={() => playSynth(soundChoice)}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4 text-stone-600" />
                    <span>Play Test Alert</span>
                  </button>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 mb-0.5">
                    <span>💡 Browser Audio Tip:</span>
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Web browsers require at least one tap/click on this page before enabling audio output. If testing on a new tablet, click &ldquo;Play Test Alert&rdquo; once.
                  </p>
                </div>
              </div>

              {/* Auto Refresh Frequency Card */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-stone-600" />
                    <span>Order Stream Sync Speed</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-lg leading-relaxed">
                    How frequently this kitchen display checks the cloud server for incoming orders.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[5, 10, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setRefreshIntervalSec(sec)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        refreshIntervalSec === sec
                          ? 'bg-[#03301C] text-white shadow-sm'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      Every {sec} seconds
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Authentication Card */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Staff Session</h3>
                  <p className="text-xs text-stone-500 mt-0.5">You are currently securely authenticated.</p>
                </div>
                <button
                  onClick={() => {
                    setAuthed(false);
                    localStorage.removeItem('taza_staff_secret');
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
