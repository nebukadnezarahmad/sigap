'use client';

import { useEffect } from 'react';

// Batas galat global: render html+body sendiri tanpa gaya/tema global.
export default function GalatGlobal({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f5f5f7',
          color: '#1d1d1f',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 380 }}>
          <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>
            Aplikasi belum bisa dimuat
          </h1>
          <p style={{ fontSize: 14, margin: '0 0 20px', opacity: 0.7 }}>
            Data belum dapat dimuat. Periksa koneksi lalu coba lagi.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 44,
              padding: '10px 24px',
              borderRadius: 999,
              border: 'none',
              backgroundColor: '#0066cc',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
