// fronted/src/layouts/DashboardLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const getPageTitle = (pathname) => {
  if (pathname.includes('/borrower')) {
    if (pathname.includes('/apply')) return 'New Loan Application';
    if (pathname.includes('/loans')) return 'My Active Loans';
    if (pathname.includes('/repayments')) return 'Repayment History';
    return 'Borrower Dashboard';
  }
  if (pathname.includes('/lender')) {
    if (pathname.includes('/marketplace')) return 'Loan Marketplace';
    if (pathname.includes('/investments')) return 'My Portfolio';
    if (pathname.includes('/fund')) return 'Fund This Loan';
    return 'Investor Dashboard';
  }
  if (pathname.includes('/staff')) return 'Staff Review Queue';
  if (pathname.includes('/profile')) return 'Account Settings';
  if (pathname.includes('/loans/')) return 'Loan Details';
  return 'Dashboard';
};

export const DashboardLayout = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar title={title} />
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
