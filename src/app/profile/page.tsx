'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  Package,
  MessageCircle,
  MapPin,
  Clock,
  Edit2,
  Check,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';

const FOREST = '#03301C';
const CREAM = '#FBF8F3';
const AMBER = '#EBAA38';
const INK = '#111111';
const SECONDARY = '#3B3D41';
const MUTED = '#6B6B6C';
const BORDER = '#E8E2D5';

const SAFE_TOP =
  'var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, env(safe-area-inset-top, 0px)))';
const SAFE_BOTTOM =
  'var(--tg-content-safe-area-inset-bottom, var(--tg-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))';

function triggerHaptic(style: 'light' | 'medium' = 'light') {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  } catch {}
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Phone states
  const [sharingPhone, setSharingPhone] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Cafe info expandable
  const [showCafeDetails, setShowCafeDetails] = useState(false);

  useEffect(() => {
    // 1. Sync Telegram WebApp header color to deep forest while on profile
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      if (typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor(FOREST);
      }
      if (typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor(CREAM);
      }
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }

    // 2. Fetch our DB profile
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setDbProfile(d.profile);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Reset Telegram header to cream when leaving Profile
    return () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (typeof tg.setHeaderColor === 'function') {
          tg.setHeaderColor(CREAM);
        }
      }
    };
  }, []);

  const requestPhone = () => {
    triggerHaptic('light');
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setSharingPhone(true);
      setPhoneError(null);
      const tg = window.Telegram.WebApp as any;
      tg.requestContact((shared: boolean, data?: any) => {
        setSharingPhone(false);
        if (shared) {
          const contactPhone =
            data?.responseUnsafe?.contact?.phone_number ||
            data?.contact?.phone_number;

          if (contactPhone) {
            fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: contactPhone }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.profile) setDbProfile(d.profile);
              })
              .catch(() => {});
          } else {
            // Re-fetch in case bot saved it in the chat
            fetch('/api/profile')
              .then((r) => r.json())
              .then((d) => {
                if (d.profile) setDbProfile(d.profile);
              })
              .catch(() => {});
          }
        }
      });
    } else {
      setShowManualInput(true);
    }
  };

  const handleSaveManualPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    const cleaned = manualPhone.trim();
    if (!cleaned || cleaned.length < 8) {
      setPhoneError('Please enter a valid phone number (e.g. 0911234567)');
      return;
    }

    setSavingPhone(true);
    setPhoneError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save phone number');
      }
      if (data.profile) {
        setDbProfile(data.profile);
      }
      setShowManualInput(false);
      setManualPhone('');
    } catch (err: any) {
      setPhoneError(err.message || 'Error saving phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const openSupportChat = () => {
    triggerHaptic('light');
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      if (typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink('https://t.me/tazagreensbot');
        return;
      }
    }
    window.open('https://t.me/tazagreensbot', '_blank');
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: CREAM }}
      >
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#03301C] border-t-transparent" />
      </div>
    );
  }

  const displayName = user
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : dbProfile?.full_name || 'Guest User';

  const displayUsername = user?.username || dbProfile?.username;
  const phoneNumber = dbProfile?.phone_number || dbProfile?.phone;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: CREAM,
        paddingBottom: `calc(88px + ${SAFE_BOTTOM})`,
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1) HERO HEADER (Deep Forest Green Banner)
      ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          backgroundColor: FOREST,
          paddingTop: `calc(76px + ${SAFE_TOP})`,
          paddingBottom: '38px',
          paddingLeft: '20px',
          paddingRight: '20px',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
          boxShadow: '0 4px 20px rgba(3, 48, 28, 0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative background watermarks */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            backgroundColor: 'rgba(251, 248, 243, 0.03)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            right: '40px',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            backgroundColor: 'rgba(235, 170, 56, 0.05)',
            pointerEvents: 'none',
          }}
        />

        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar with amber border */}
          <div
            style={{
              width: '68px',
              height: '68px',
              minWidth: '68px',
              borderRadius: '50%',
              backgroundColor: 'rgba(251, 248, 243, 0.12)',
              border: `2px solid ${AMBER}`,
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {user?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photo_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User style={{ width: '32px', height: '32px', color: CREAM }} />
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px',
                fontWeight: 700,
                color: CREAM,
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
              className="truncate"
            >
              {displayName}
            </h2>

            {displayUsername && (
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: AMBER,
                  fontWeight: 600,
                  margin: '3px 0 0 0',
                }}
                className="truncate"
              >
                @{displayUsername}
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: CREAM,
                  backgroundColor: 'rgba(251, 248, 243, 0.14)',
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(251, 248, 243, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles style={{ width: '10px', height: '10px', color: AMBER }} />
                Taza Greens Customer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2) MAIN CONTENT (Overlapping Cards)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 -mt-4 relative z-20 flex-1 flex flex-col space-y-3.5">
        {/* ── Contact Phone Card ── */}
        {!phoneNumber ? (
          <div
            style={{
              backgroundColor: '#FFFDF9',
              borderRadius: '18px',
              border: '1px solid #F3DFC6',
              boxShadow: '0 3px 12px rgba(235, 170, 56, 0.12)',
              padding: '16px',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF2DF',
                  border: '1px solid #FFE0B2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Phone style={{ width: '19px', height: '19px' }} />
              </div>

              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#854D0E',
                    margin: 0,
                  }}
                >
                  Add Phone Number
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: '#9A6B2F',
                    marginTop: '3px',
                    marginBottom: '12px',
                    lineHeight: 1.35,
                  }}
                >
                  Sharing your phone number helps our delivery team contact you easily when your order is on its way.
                </p>

                {showManualInput ? (
                  <form onSubmit={handleSaveManualPhone} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        placeholder="e.g. 0911234567 or +251 9..."
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          height: '38px',
                          borderRadius: '10px',
                          border: '1.5px solid #F59E0B',
                          backgroundColor: '#FFFFFF',
                          padding: '0 12px',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '13px',
                          color: INK,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={savingPhone}
                        style={{
                          height: '38px',
                          padding: '0 14px',
                          borderRadius: '10px',
                          backgroundColor: '#EA580C',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualInput(false);
                          setPhoneError(null);
                        }}
                        style={{
                          height: '38px',
                          width: '38px',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#FFFFFF',
                          color: MUTED,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {phoneError && (
                      <p style={{ color: '#DC2626', fontSize: '11px', margin: 0 }}>
                        {phoneError}
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={requestPhone}
                      disabled={sharingPhone}
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'transform 0.1s ease',
                      }}
                      onPointerDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.97)';
                      }}
                      onPointerUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {sharingPhone ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Waiting...</span>
                        </>
                      ) : (
                        <>
                          <Phone style={{ width: '13px', height: '13px' }} />
                          <span>Share Contact</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#9A6B2F',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #EAD4B8',
                        cursor: 'pointer',
                      }}
                    >
                      Enter manually
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Phone already saved */
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'between',
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(3, 48, 28, 0.06)',
                  border: '1px solid rgba(3, 48, 28, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: FOREST,
                  flexShrink: 0,
                }}
              >
                <PhoneCall style={{ width: '18px', height: '18px' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: MUTED,
                      fontWeight: 500,
                    }}
                  >
                    Delivery Phone
                  </span>
                  <span
                    style={{
                      backgroundColor: 'rgba(3, 48, 28, 0.1)',
                      color: FOREST,
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <CheckCircle2 style={{ width: '10px', height: '10px' }} />
                    Saved
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: INK,
                    margin: '2px 0 0 0',
                  }}
                  className="truncate"
                >
                  {phoneNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setManualPhone(phoneNumber || '');
                  setShowManualInput(true);
                  setDbProfile((prev: any) => ({ ...prev, phone_number: null, phone: null }));
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${BORDER}`,
                  backgroundColor: '#FFFFFF',
                  color: SECONDARY,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Edit2 style={{ width: '11px', height: '11px' }} />
                <span>Edit</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Main Actions Card ── */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: `1px solid ${BORDER}`,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          }}
        >
          {/* 1. Order History */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              router.push('/orders');
            }}
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(3, 48, 28, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: FOREST,
                  flexShrink: 0,
                }}
              >
                <Package style={{ width: '20px', height: '20px' }} strokeWidth={2} />
              </div>
              <div className="text-left">
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: INK,
                    margin: 0,
                  }}
                >
                  Order History
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: MUTED,
                    marginTop: '2px',
                    marginBottom: 0,
                  }}
                >
                  View your past and active orders
                </p>
              </div>
            </div>
            <ChevronRight style={{ width: '18px', height: '18px', color: MUTED }} />
          </button>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#F0ECE1', margin: '0 16px' }} />

          {/* 2. Customer Support */}
          <button
            type="button"
            onClick={openSupportChat}
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(235, 170, 56, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B45309',
                  flexShrink: 0,
                }}
              >
                <MessageCircle style={{ width: '20px', height: '20px' }} strokeWidth={2} />
              </div>
              <div className="text-left">
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: INK,
                    margin: 0,
                  }}
                >
                  Need Help?
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: MUTED,
                    marginTop: '2px',
                    marginBottom: 0,
                  }}
                >
                  Chat with our team on Telegram
                </p>
              </div>
            </div>
            <ChevronRight style={{ width: '18px', height: '18px', color: MUTED }} />
          </button>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#F0ECE1', margin: '0 16px' }} />

          {/* 3. Visit Taza Greens Café */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowCafeDetails(!showCafeDetails);
            }}
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(3, 48, 28, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: FOREST,
                  flexShrink: 0,
                }}
              >
                <MapPin style={{ width: '20px', height: '20px' }} strokeWidth={2} />
              </div>
              <div className="text-left">
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: INK,
                    margin: 0,
                  }}
                >
                  About Taza Greens
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: MUTED,
                    marginTop: '2px',
                    marginBottom: 0,
                  }}
                >
                  Bole Rwanda, Addis Ababa
                </p>
              </div>
            </div>
            <ChevronRight
              style={{
                width: '18px',
                height: '18px',
                color: MUTED,
                transform: showCafeDetails ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Expandable Café Details */}
          {showCafeDetails && (
            <div
              style={{
                backgroundColor: CREAM,
                borderTop: '1px solid #F0ECE1',
                padding: '16px',
              }}
            >
              <div className="space-y-2.5 text-xs text-[#3B3D41]">
                <div className="flex items-start gap-2.5">
                  <MapPin style={{ width: '15px', height: '15px', color: FOREST, flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="font-bold text-[#111111]">Location:</span> Bole Rwanda, Addis Ababa, Ethiopia
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock style={{ width: '15px', height: '15px', color: FOREST, flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="font-bold text-[#111111]">Hours:</span> Daily from 7:30 AM to 9:00 PM
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Sparkles style={{ width: '15px', height: '15px', color: AMBER, flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="font-bold text-[#111111]">Specialties:</span> Ethiopian breakfast, generous brunch plates, and fresh ceremony-style coffee.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── App Version & Footer ── */}
        <div className="text-center pt-6 pb-4 mt-auto">
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '13px',
              fontWeight: 700,
              color: FOREST,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            taza greens
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: MUTED,
              marginTop: '2px',
              marginBottom: 0,
            }}
          >
            Version 1.0.0 • Addis Ababa
          </p>
        </div>
      </div>
    </div>
  );
}
