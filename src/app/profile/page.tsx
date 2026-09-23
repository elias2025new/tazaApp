'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, LogOut, ChevronRight, Package } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharingPhone, setSharingPhone] = useState(false);

  useEffect(() => {
    // 1. Get Telegram User info
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }

    // 2. Fetch our DB profile (to check if we already have their phone number)
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setDbProfile(d.profile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const requestPhone = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setSharingPhone(true);
      const tg = window.Telegram.WebApp as any;
      tg.requestContact((shared: boolean, data?: any) => {
        setSharingPhone(false);
        // The callback isn't always reliable across clients, 
        // but if we get the data, we save it immediately.
        // (Usually Telegram sends the contact to the Bot chat, but requestContact in Mini App returns it too if allowed)
        if (shared) {
          // Trigger a re-fetch since the bot backend might process it, or we handle it here if returned
          fetch('/api/profile').then(r => r.json()).then(d => {
             if (d.profile) setDbProfile(d.profile);
          });
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#103d2b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#103d2b] text-white px-4 py-8 pb-12">
        <h1 className="text-xl font-bold mb-6">Profile</h1>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {user ? `${user.first_name} ${user.last_name || ''}` : 'Guest User'}
            </h2>
            {dbProfile?.phone_number ? (
              <p className="text-white/80 text-sm mt-0.5">{dbProfile.phone_number}</p>
            ) : user?.username ? (
              <p className="text-white/80 text-sm mt-0.5">@{user.username}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm p-2 mb-4">
          {!dbProfile?.phone_number && user && (
            <div className="p-4 bg-orange-50 rounded-xl mb-2 border border-orange-100 flex items-start gap-3">
              <Phone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-orange-900">Add Phone Number</h3>
                <p className="text-xs text-orange-700 mt-1 mb-3 leading-snug">
                  Sharing your phone number helps our delivery team contact you easily.
                </p>
                <button
                  onClick={requestPhone}
                  disabled={sharingPhone}
                  className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-transform"
                >
                  {sharingPhone ? 'Waiting...' : 'Share Contact'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/orders')}
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800">Order History</p>
                <p className="text-xs text-gray-500 mt-0.5">View your past and active orders</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">Taza Greens v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
