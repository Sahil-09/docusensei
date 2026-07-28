'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '20px',
          background: '#f9fafb',
          color: '#111827'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Something went wrong</h1>
          <p style={{ color: '#4b5563', fontSize: '14px' }}>A global error occurred. Please refresh or try again later.</p>
        </div>
      </body>
    </html>
  );
}
