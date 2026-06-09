// fronted/src/components/NotificationPanel.jsx
import React from 'react';
import { Bell, Check, Info, AlertTriangle, MessageSquare } from 'lucide-react';

export const NotificationPanel = ({ isOpen, onClose, notifications = [], onMarkRead }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 998,
        }}
        onClick={onClose}
      />

      {/* Dropdown Card */}
      <div
        className="glass-card fade-in"
        style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          width: '360px',
          maxHeight: '450px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          padding: 0,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 0 10px rgba(59,130,246,0.1)',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Notifications</span>
          {notifications.length > 0 && (
            <button
              onClick={onMarkRead}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Bell size={24} style={{ opacity: 0.3 }} />
              <span>You are all caught up!</span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Icon based on type */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor:
                      n.type === 'success'
                        ? 'var(--success-bg)'
                        : n.type === 'warning'
                        ? 'var(--warning-bg)'
                        : n.type === 'danger'
                        ? 'var(--danger-bg)'
                        : 'var(--info-bg)',
                    color:
                      n.type === 'success'
                        ? 'var(--success)'
                        : n.type === 'warning'
                        ? 'var(--warning)'
                        : n.type === 'danger'
                        ? 'var(--danger)'
                        : 'var(--info)',
                  }}
                >
                  {n.type === 'success' && <Check size={16} />}
                  {n.type === 'warning' && <AlertTriangle size={16} />}
                  {n.type === 'danger' && <AlertTriangle size={16} />}
                  {n.type === 'info' && <Info size={16} />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.3 }}>
                    {n.message}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {n.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
