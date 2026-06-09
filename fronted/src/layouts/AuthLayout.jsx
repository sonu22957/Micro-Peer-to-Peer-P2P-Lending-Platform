// fronted/src/layouts/AuthLayout.jsx
import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coins, Shield, TrendingUp, Users } from 'lucide-react';

const Feature = ({ icon: Icon, title, desc, color }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color,
    }}>
      <Icon size={18} />
    </div>
    <div>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem' }}>{title}</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
    </div>
  </div>
);

export const AuthLayout = () => {
  const { isAuthenticated, simulatedRole, loading } = useAuth();

  if (!loading && isAuthenticated) {
    const path = simulatedRole === 'lender' ? '/lender'
      : (simulatedRole === 'staff' || simulatedRole === 'admin') ? '/staff/review'
      : '/borrower';
    return <Navigate to={path} replace />;
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      display: 'flex', overflow: 'hidden',
    }}>
      {/* LEFT PANEL — Branding & Info */}
      <div style={{
        width: '45%', minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(155,110,243,0.08) 100%), var(--bg-secondary)',
        borderRight: '1px solid var(--card-border)',
        display: 'flex', flexDirection: 'column',
        padding: '3rem',
        position: 'relative', overflow: 'hidden',
      }}
        className="desktop-only"
        style={{ width: '45%', minHeight: '100vh', background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(155,110,243,0.08) 100%), var(--bg-secondary)', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', padding: '3rem', position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
          top: '-100px', left: '-100px', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,110,243,0.1) 0%, transparent 70%)',
          bottom: '-80px', right: '-80px', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3.5rem', zIndex: 1 }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(79,142,247,0.35)',
          }}>
            <Coins size={22} color="#fff" />
          </div>
          <span style={{
            fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            GravityLoan
          </span>
        </Link>

        {/* Heading */}
        <div style={{ zIndex: 1, marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff 40%, rgba(140,160,200,0.8) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            The smarter way to borrow & invest
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Peer-to-peer lending powered by verified borrowers, secure payments, and transparent returns.
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 1 }}>
          <Feature icon={Shield}    color="var(--accent-primary)"   title="Verified Identities"   desc="Every borrower is manually reviewed by our audit staff before approval." />
          <Feature icon={TrendingUp} color="var(--success)"          title="Competitive Returns"   desc="Earn up to 18% annual interest by funding verified loan applications." />
          <Feature icon={Users}      color="var(--accent-secondary)" title="10,000+ Active Users"  desc="A growing community of borrowers and investors across India." />
        </div>

        {/* Footer note */}
        <p style={{ marginTop: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', zIndex: 1, paddingTop: '2rem' }}>
          © 2025 GravityLoan. All transactions are secured and encrypted.
        </p>
      </div>

      {/* RIGHT PANEL — Auth Form */}
      <div style={{
        flex: 1, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}>
        {/* Mobile logo */}
        <Link to="/" style={{ display: 'none', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }} className="mobile-logo">
          <Coins size={24} color="var(--accent-primary)" />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>GravityLoan</span>
        </Link>

        <div className="glass-card fade-in" style={{
          width: '100%', maxWidth: '440px',
          padding: '2.5rem 2rem',
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)',
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
