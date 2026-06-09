// fronted/src/components/Loader.jsx
import React from 'react';
import { Coins } from 'lucide-react';

export const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '1.25rem', padding: '3rem',
    }}>
      {/* Animated Logo Spinner */}
      <div style={{ position: 'relative', width: '56px', height: '56px' }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(79,142,247,0.15)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 0.9s linear infinite',
        }} />
        {/* Inner icon */}
        <div style={{
          position: 'absolute', inset: '8px', borderRadius: '50%',
          background: 'rgba(79,142,247,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Coins size={18} color="var(--accent-primary)" />
        </div>
      </div>

      {/* Message */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{message}</p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'var(--bg-primary)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', width: '100%',
    }}>
      {content}
    </div>
  );
};

export default Loader;
