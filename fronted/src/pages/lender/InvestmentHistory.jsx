// fronted/src/pages/lender/InvestmentHistory.jsx
import React, { useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { BadgeCent, Calendar, ArrowUpRight } from 'lucide-react';

export const InvestmentHistory = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read local simulated investments
    const saved = JSON.parse(localStorage.getItem('funded_investments') || '[]');
    setInvestments(saved);
    setLoading(false);
  }, []);

  if (loading) return <Loader message="Opening portfolio reports..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BadgeCent size={20} style={{ color: 'var(--accent-secondary)' }} />
          Portfolio Funding Ledger
        </h3>

        <div className="table-container">
          {investments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No portfolio records available. Go to the Marketplace to fund your first project.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Date Funded</th>
                  <th>Investment ID</th>
                  <th>Borrower</th>
                  <th>Purpose</th>
                  <th>Amount Invested</th>
                  <th>Rate</th>
                  <th>Term</th>
                  <th>Monthly Returns</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv, idx) => {
                  const monthlyReturns = (Number(inv.amount) * (Number(inv.interestRate) / 100)) / 12;
                  return (
                    <tr key={`${inv._id}-${idx}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{new Date(inv.fundedAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {inv._id.substring(0, 12)}
                      </td>
                      <td>{inv.borrowerName}</td>
                      <td>{inv.purpose}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{inv.interestRate}%</td>
                      <td>{inv.termMonths} Months</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontWeight: 700 }}>
                          <ArrowUpRight size={14} />
                          <span>+₹{monthlyReturns.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentHistory;
