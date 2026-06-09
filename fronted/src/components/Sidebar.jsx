// fronted/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Coins, FilePlus2, Receipt,
  User, LogOut, ShieldCheck, Search,
  TrendingUp, Menu, X, ChevronRight
} from 'lucide-react';

const menus = {
  borrower: [
    { path: '/borrower', name: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/borrower/apply', name: 'Apply for Loan', icon: FilePlus2 },
    { path: '/borrower/loans', name: 'My Loans', icon: Coins },
    { path: '/borrower/repayments', name: 'Repayment History', icon: Receipt },
  ],
  lender: [
    { path: '/lender', name: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/lender/marketplace', name: 'Marketplace', icon: Search },
    { path: '/lender/investments', name: 'My Portfolio', icon: TrendingUp },
  ],
  staff: [
    { path: '/staff/review', name: 'Review Queue', icon: ShieldCheck, end: true },
  ],
  admin: [
    { path: '/staff/review', name: 'Review Queue', icon: ShieldCheck, end: true },
  ],
};

const RolePill = ({ role }) => {
  const config = {
    borrower: { label: 'Borrower Portal', color: 'var(--accent-primary)', bg: 'var(--accent-primary-glow)' },
    lender:   { label: 'Investor Hub',    color: 'var(--accent-secondary)', bg: 'var(--accent-secondary-glow)' },
    staff:    { label: 'Staff Panel',     color: 'var(--info)',  bg: 'var(--info-bg)' },
    admin:    { label: 'Admin Panel',     color: 'var(--warning)', bg: 'var(--warning-bg)' },
  };
  const c = config[role] || config.borrower;
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.1em', color: c.color, backgroundColor: c.bg,
      padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)',
    }}>
      {c.label}
    </span>
  );
};

export const Sidebar = () => {
  const { user, simulatedRole, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const activeMenu = menus[simulatedRole] || [];

  const sidebarContent = (
    <>
      {/* Brand */}
      <div style={{
        height: 'var(--navbar-height)', display: 'flex', alignItems: 'center',
        gap: '0.75rem', padding: '0 1.5rem',
        borderBottom: '1px solid var(--card-border)',
        background: 'linear-gradient(135deg, rgba(79,142,247,0.05) 0%, transparent 100%)',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(79,142,247,0.35)',
          flexShrink: 0,
        }}>
          <Coins size={18} color="#fff" />
        </div>
        <div>
          <div style={{
            fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            GravityLoan
          </div>
          <RolePill role={simulatedRole} />
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
        {activeMenu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(79,142,247,0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(79,142,247,0.2)' : 'transparent'}`,
                fontWeight: isActive ? 600 : 500, fontSize: '0.9rem',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none', position: 'relative',
              })}
              className="nav-link-item"
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? 'var(--accent-primary)' : 'inherit', display: 'flex' }}>
                    <Icon size={17} />
                  </span>
                  <span>{item.name}</span>
                  {isActive && (
                    <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--accent-primary)', opacity: 0.6 }} />
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        <div className="divider" style={{ margin: '0.75rem 0' }} />

        {/* Profile */}
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
            color: isActive ? '#fff' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'rgba(155,110,243,0.1)' : 'transparent',
            border: `1px solid ${isActive ? 'rgba(155,110,243,0.2)' : 'transparent'}`,
            fontWeight: isActive ? 600 : 500, fontSize: '0.9rem',
            transition: 'all var(--transition-fast)', textDecoration: 'none',
          })}
        >
          {({ isActive }) => (
            <>
              <span style={{ color: isActive ? 'var(--accent-secondary)' : 'inherit', display: 'flex' }}>
                <User size={17} />
              </span>
              <span>My Profile</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* User Footer */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--card-border)' }}>
        {/* User Info */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', marginBottom: '0.5rem',
            background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--card-border)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            }}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            width: '100%', padding: '0.7rem 1rem',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.background = 'var(--danger-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)', backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--card-border)',
        height: '100vh', position: 'fixed', left: 0, top: 0,
        display: 'flex', flexDirection: 'column', zIndex: 100,
      }}
        className="desktop-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: 'none', position: 'fixed', top: '1rem', left: '1rem',
          zIndex: 200, background: 'var(--bg-tertiary)', border: '1px solid var(--card-border)',
          color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)',
          padding: '0.5rem', cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 150, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Mobile sidebar */}
      {mobileOpen && (
        <aside style={{
          width: 'var(--sidebar-width)', backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--card-border)',
          height: '100vh', position: 'fixed', left: 0, top: 0,
          display: 'flex', flexDirection: 'column', zIndex: 160,
          animation: 'slideInLeft 0.25s ease forwards',
        }}>
          {sidebarContent}
        </aside>
      )}
    </>
  );
};

export default Sidebar;
