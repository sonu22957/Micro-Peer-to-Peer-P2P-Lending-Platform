// fronted/src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut, ArrowLeftRight, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ title }) => {
  const { user, logout, simulatedRole, updateSimulatedRole } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', message: 'Welcome to your GravityLoan Dashboard.', time: 'Just now', read: false },
    { id: 2, type: 'success', message: 'Your profile has been verified.', time: '5m ago', read: false },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRoleToggle = () => {
    if (simulatedRole === 'borrower') {
      updateSimulatedRole('lender');
      navigate('/lender');
    } else if (simulatedRole === 'lender') {
      updateSimulatedRole('borrower');
      navigate('/borrower');
    }
    setShowProfileMenu(false);
  };

  const notifTypeColor = { info: 'var(--info)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)' };

  return (
    <header style={{
      height: 'var(--navbar-height)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 2rem',
      borderBottom: '1px solid var(--card-border)',
      backgroundColor: 'rgba(6, 8, 16, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-width)',
      right: 0,
      zIndex: 90,
    }}>
      {/* Left: Page Title */}
      <div>
        <h2 style={{
          fontSize: '1.15rem', fontWeight: 700,
          color: 'var(--text-primary)', letterSpacing: '-0.01em',
        }}>
          {title || 'Dashboard'}
        </h2>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

        {/* Role Switcher (only for regular users) */}
        {user?.role === 'user' && (
          <button
            onClick={handleRoleToggle}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.9rem', fontSize: '0.82rem',
              borderRadius: 'var(--radius-full)', gap: '0.4rem',
            }}
            title="Switch portal mode"
          >
            <ArrowLeftRight size={13} />
            <span className="desktop-only">
              Switch to {simulatedRole === 'borrower' ? 'Lender' : 'Borrower'}
            </span>
          </button>
        )}

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            style={{
              position: 'relative', background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.5rem', borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                backgroundColor: 'var(--danger)', color: '#fff',
                width: '16px', height: '16px', borderRadius: '50%',
                fontSize: '0.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-primary)',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowNotifications(false)} />
              <div className="glass-card fade-in" style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '320px', padding: 0, zIndex: 99,
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{
                      background: 'none', border: 'none', color: 'var(--accent-primary)',
                      fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                    }}>Mark all read</button>
                  )}
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      All caught up! No notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} style={{
                        padding: '0.9rem 1.25rem',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: n.read ? 'transparent' : 'rgba(79,142,247,0.03)',
                        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                      }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                          marginTop: '5px',
                          backgroundColor: n.read ? 'var(--text-disabled)' : notifTypeColor[n.type],
                        }} />
                        <div>
                          <p style={{ fontSize: '0.83rem', color: n.read ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.5 }}>
                            {n.message}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              cursor: 'pointer', padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--card-border)',
              background: showProfileMenu ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { if (!showProfileMenu) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0,
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }} className="desktop-only">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)', transition: 'transform var(--transition-fast)', transform: showProfileMenu ? 'rotate(180deg)' : 'none' }} className="desktop-only" />
          </button>

          {showProfileMenu && (
            <div className="glass-card fade-in" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '220px', padding: '0.5rem',
              zIndex: 99, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
            }}>
              {/* User name header */}
              <div style={{ padding: '0.6rem 0.75rem 0.75rem', borderBottom: '1px solid var(--card-border)', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{user?.email}</div>
              </div>

              {[
                { icon: User, label: 'Profile Settings', action: () => { navigate('/profile'); setShowProfileMenu(false); } },
                ...(user?.role === 'user' ? [{ icon: ArrowLeftRight, label: `Switch to ${simulatedRole === 'borrower' ? 'Lender' : 'Borrower'}`, action: handleRoleToggle }] : []),
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  width: '100%', padding: '0.65rem 0.75rem',
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  textAlign: 'left', cursor: 'pointer', fontSize: '0.87rem',
                  borderRadius: 'var(--radius-sm)', transition: 'all var(--transition-fast)',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Icon size={15} /> <span>{label}</span>
                </button>
              ))}

              <div className="divider" style={{ margin: '0.4rem 0' }} />

              <button onClick={() => { logout(); navigate('/'); }} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: '0.65rem 0.75rem',
                background: 'none', border: 'none', color: 'var(--danger)',
                textAlign: 'left', cursor: 'pointer', fontSize: '0.87rem',
                borderRadius: 'var(--radius-sm)', transition: 'all var(--transition-fast)',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <LogOut size={15} /> <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
