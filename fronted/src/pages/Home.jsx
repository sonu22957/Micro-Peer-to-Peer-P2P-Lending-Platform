// fronted/src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Coins, ShieldCheck, TrendingUp,
  Landmark, BadgeCent, Zap, Lock, ChevronDown, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Stat = ({ value, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
      background: 'linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    }}>{value}</div>
    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontWeight: 500 }}>{label}</div>
  </div>
);

const Feature = ({ icon: Icon, color, title, desc }) => (
  <div style={{
    display: 'flex', gap: '1rem', alignItems: 'flex-start',
    padding: '1.25rem', borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)',
    transition: 'all var(--transition-normal)',
  }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(79,142,247,0.04)'; e.currentTarget.style.borderColor = 'rgba(79,142,247,0.15)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--card-border)'; }}
  >
    <div style={{
      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
      background: `${color}15`, border: `1px solid ${color}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color,
    }}>
      <Icon size={20} />
    </div>
    <div>
      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>{title}</h4>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  </div>
);

const PortalCard = ({ title, subtitle, desc, icon: Icon, iconColor, iconBg, btnLabel, btnStyle, onClick }) => (
  <div className="glass-card hoverable" style={{
    padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem',
    border: `1px solid ${iconBg}40`,
  }}
    onClick={onClick}
  >
    <div style={{
      width: '56px', height: '56px', borderRadius: '16px',
      background: iconBg, border: `1px solid ${iconColor}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor,
      boxShadow: `0 8px 20px -4px ${iconColor}30`,
    }}>
      <Icon size={26} />
    </div>
    <div>
      <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>{title}</h3>
      <p style={{ fontSize: '0.8rem', color: iconColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>{subtitle}</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
    </div>
    <button
      className="btn"
      style={{ width: '100%', marginTop: 'auto', ...btnStyle }}
    >
      <span>{btnLabel}</span>
      <ArrowRight size={16} />
    </button>
  </div>
);

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, simulatedRole } = useAuth();

  const handlePortal = (role) => {
    if (isAuthenticated) {
      navigate(simulatedRole === 'borrower' ? '/borrower' : simulatedRole === 'lender' ? '/lender' : '/staff/review');
    } else {
      navigate('/register', { state: { role } });
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      color: 'var(--text-primary)',
      overflowX: 'hidden',
    }}>
      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 max(2rem, calc((100vw - 1200px) / 2))',
        height: '68px',
        borderBottom: '1px solid var(--card-border)',
        background: 'rgba(6,8,16,0.85)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,142,247,0.35)',
          }}>
            <Coins size={18} color="#fff" />
          </div>
          <span style={{
            fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>GravityLoan</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <button
              onClick={() => navigate(simulatedRole === 'borrower' ? '/borrower' : simulatedRole === 'lender' ? '/lender' : '/staff/review')}
              className="btn btn-primary"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              Go to Dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '7rem 1.5rem 5rem',
        background: `
          radial-gradient(ellipse 70% 50% at 50% -10%, rgba(79,142,247,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 10% 80%, rgba(155,110,243,0.07) 0%, transparent 60%)
        `,
      }}>
        {/* Badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--accent-primary)', fontWeight: 700,
          background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)',
          padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)',
          marginBottom: '2rem',
        }}>
          <Star size={12} fill="currentColor" />
          Next-Gen Peer-to-Peer Lending
        </span>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem',
          fontFamily: 'var(--font-heading)', maxWidth: '850px',
          background: 'linear-gradient(135deg, #fff 40%, rgba(140,160,200,0.7) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Borrow Smart.<br />Invest Smarter.
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          color: 'var(--text-secondary)', lineHeight: 1.7,
          maxWidth: '600px', marginBottom: '3rem',
        }}>
          Whether you need low-interest capital for personal goals, or want to earn competitive returns — GravityLoan connects borrowers and investors seamlessly and securely.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '5rem' }}>
          <button
            onClick={() => handlePortal('borrower')}
            className="btn btn-primary"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-md)', gap: '0.6rem' }}
          >
            Apply for a Loan <ArrowRight size={18} />
          </button>
          <button
            onClick={() => handlePortal('lender')}
            className="btn btn-secondary"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-md)', gap: '0.6rem' }}
          >
            <TrendingUp size={18} /> Start Investing
          </button>
        </div>

        {/* Stats Bar */}
        <div className="glass-card" style={{
          display: 'flex', gap: '3rem', padding: '1.5rem 3rem',
          flexWrap: 'wrap', justifyContent: 'center',
          maxWidth: '700px', width: '100%',
        }}>
          <Stat value="₹12Cr+" label="Total Disbursed" />
          <div style={{ width: '1px', background: 'var(--card-border)', alignSelf: 'stretch' }} />
          <Stat value="10,000+" label="Active Users" />
          <div style={{ width: '1px', background: 'var(--card-border)', alignSelf: 'stretch' }} />
          <Stat value="18% p.a." label="Max Returns" />
          <div style={{ width: '1px', background: 'var(--card-border)', alignSelf: 'stretch' }} />
          <Stat value="99.2%" label="On-Time Payments" />
        </div>
      </section>

      {/* ═══ PORTALS ═══ */}
      <section style={{
        padding: '5rem max(1.5rem, calc((100vw - 1100px) / 2))',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>
            Choose Your Path
          </p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, #fff 40%, rgba(140,160,200,0.7) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            One platform. Two powerful portals.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem', width: '100%', maxWidth: '1100px',
        }}>
          <PortalCard
            title="Borrow Capital"
            subtitle="Borrower Portal"
            desc="Apply for personal or business loans at competitive rates. Get instant EMI schedules, transparent tracking, and fast disbursals after staff verification."
            icon={Landmark}
            iconColor="var(--accent-primary)"
            iconBg="rgba(79,142,247,0.1)"
            btnLabel="Apply as Borrower"
            btnStyle={{ background: 'linear-gradient(135deg, var(--accent-primary), #6b6ef5)', color: '#fff', boxShadow: '0 4px 16px rgba(79,142,247,0.25)' }}
            onClick={() => handlePortal('borrower')}
          />
          <PortalCard
            title="Invest & Earn"
            subtitle="Investor Hub"
            desc="Browse verified loan listings on our open marketplace. Fund applications, earn recurring monthly interest, and build a diversified high-yield lending portfolio."
            icon={BadgeCent}
            iconColor="var(--accent-secondary)"
            iconBg="rgba(155,110,243,0.1)"
            btnLabel="Become an Investor"
            btnStyle={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-tertiary))', color: '#fff', boxShadow: '0 4px 16px rgba(155,110,243,0.25)' }}
            onClick={() => handlePortal('lender')}
          />
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{
        padding: '4rem max(1.5rem, calc((100vw - 1100px) / 2))',
        borderTop: '1px solid var(--card-border)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '0.75rem' }}>
            Built for trust & transparency
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Every feature is designed to protect both borrowers and investors.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem', maxWidth: '1100px', margin: '0 auto',
        }}>
          <Feature icon={ShieldCheck}  color="var(--success)"           title="Verified Borrowers"        desc="All loan applications are manually reviewed and approved by our audit staff before disbursement." />
          <Feature icon={Zap}          color="var(--accent-primary)"    title="Instant EMI Scheduling"    desc="Automatic amortization plans are calculated at application time — zero hidden fees, zero surprises." />
          <Feature icon={Lock}         color="var(--accent-secondary)"  title="Secure Payments"           desc="Stripe-powered payment processing with bank transfers and cash reconciliation support." />
          <Feature icon={TrendingUp}   color="var(--warning)"           title="Real-Time Portfolio"       desc="Live dashboard tracking for lenders with per-loan yield calculations and portfolio analytics." />
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        borderTop: '1px solid var(--card-border)',
        padding: '2rem max(1.5rem, calc((100vw - 1100px) / 2))',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Coins size={16} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}>GravityLoan</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          © 2025 GravityLoan · Secure P2P Lending Platform
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Privacy', 'Terms', 'Support'].map((link) => (
            <a key={link} href="#" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', transition: 'color var(--transition-fast)' }}
              onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; }}
            >{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Home;
