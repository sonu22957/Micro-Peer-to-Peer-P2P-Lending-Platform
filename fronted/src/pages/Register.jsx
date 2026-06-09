// fronted/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export const Register = () => {
  const location = useLocation();
  const defaultRole = location.state?.role || 'borrower';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setLocalError('Please complete all registration fields.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must contain at least 6 characters.');
      return;
    }

    setLocalError('');
    setIsSubmitting(true);

    try {
      await register(name, email, password, role);
      // Redirect based on selected role
      if (role === 'lender') {
        navigate('/lender', { replace: true });
      } else if (role === 'staff') {
        navigate('/staff/review', { replace: true });
      } else {
        navigate('/borrower', { replace: true });
      }
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Try a different email address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Join GravityLoan to start borrowing or investing.
        </p>
      </div>

      {localError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{localError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <div style={{ position: 'relative' }}>
            <User
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Role Type */}
        <div className="form-group">
          <label htmlFor="role">Account Type / Portal</label>
          <div style={{ position: 'relative' }}>
            <ShieldCheck
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', appearance: 'none', cursor: 'pointer' }}
              disabled={isSubmitting}
              required
            >
              <option value="borrower">Borrower (Standard User)</option>
              <option value="lender">Investor (P2P Lender)</option>
              <option value="staff">Staff Auditor / Manager</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSubmitting}>
          {isSubmitting ? 'Registering Account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
          Sign in instead
        </Link>
      </div>
    </div>
  );
};

export default Register;
