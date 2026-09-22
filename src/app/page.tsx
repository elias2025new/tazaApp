/**
 * src/app/page.tsx — Temporary landing page.
 * Phase 0 placeholder only. Will be replaced in Phase 1 with the app shell
 * that checks Telegram identity and routes to the customer menu.
 */
export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        padding: '2rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ fontSize: 36 }}>🌿</span>
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          margin: 0,
        }}
      >
        Taza Greens
      </h1>
      <p
        style={{
          color: 'var(--color-text-muted)',
          margin: 0,
          fontSize: '1rem',
        }}
      >
        Fresh Starts Here.
      </p>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          marginTop: '1rem',
          maxWidth: 280,
        }}
      >
        Setting up. Open this app via the Telegram bot once setup is complete.
      </p>
    </main>
  );
}
