// fronted/src/pages/lender/LenderDashboard.jsx
import React, { useEffect, useState } from 'react';
import StatsCard from '../../components/StatsCard';
import { Search, BadgeCent, TrendingUp, DollarSign, ListFilter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LenderDashboard = () => {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({ totalInvested: 0, avgYield: 0, earnings: 0, projectsCount: 0 });

  useEffect(() => {
    // Load simulated investments from localStorage
    const savedInvestments = JSON.parse(localStorage.getItem('funded_investments') || '[]');
    setInvestments(savedInvestments);

    const totalInvested = savedInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const avgYield = savedInvestments.length > 0
      ? +(savedInvestments.reduce((sum, inv) => sum + Number(inv.interestRate), 0) / savedInvestments.length).toFixed(1)
      : 0;
    
    // Earnings: monthly interest simulation
    const earnings = savedInvestments.reduce((sum, inv) => {
      const monthlyInterest = (Number(inv.amount) * (Number(inv.interestRate) / 100)) / 12;
      return sum + monthlyInterest;
    }, 0);

    setStats({
      totalInvested,
      avgYield,
      earnings: +earnings.toFixed(2),
      projectsCount: savedInvestments.length
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      
      {/* Stats KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
      }}>
        <StatsCard
          title="Active Portfolio Value"
          value={`₹${stats.totalInvested.toLocaleString('en-IN')}`}
          icon={<BadgeCent size={20} />}
          color="secondary"
        />
        <StatsCard
          title="Average Yield (Rate)"
          value={stats.avgYield > 0 ? `${stats.avgYield}% p.a.` : '0.0%'}
          icon={<TrendingUp size={20} />}
          color="primary"
        />
        <StatsCard
          title="Est. Monthly Earnings"
          value={`₹${stats.earnings.toLocaleString('en-IN')}`}
          icon={<DollarSign size={20} />}
          color="success"
        />
        <StatsCard
          title="Funded Projects"
          value={stats.projectsCount}
          icon={<ListFilter size={20} />}
          color="info"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
      }}>
        
        {/* Active Investments Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 2 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Active Portfolio Investments</h3>
          
          <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {investments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                You have not funded any loans yet. Browse our active marketplace to begin.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Borrower Purpose</th>
                    <th>Rate</th>
                    <th>Amount Funded</th>
                    <th>Term</th>
                    <th>Monthly Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv, idx) => {
                    const monthlyYield = (Number(inv.amount) * (Number(inv.interestRate) / 100)) / 12;
                    return (
                      <tr key={`${inv._id}-${idx}`}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {inv._id.substring(0, 12)}
                        </td>
                        <td>{inv.purpose}</td>
                        <td style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{inv.interestRate}%</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                        <td>{inv.termMonths} Mos</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                          +₹{monthlyYield.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Explore Marketplace CTA */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%), var(--card-bg)',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2rem',
            flex: 1,
          }}
        >
          <Search size={40} style={{ color: 'var(--accent-secondary)' }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Explore Marketplace</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto', lineHeight: 1.5 }}>
              Browse newly listed, verified loan applications. Review financial summaries and fund requests to earn competitive yields.
            </p>
          </div>
          <button
            onClick={() => navigate('/lender/marketplace')}
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: '200px', background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-tertiary) 100%)' }}
          >
            <span>Browse Loans</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default LenderDashboard;
