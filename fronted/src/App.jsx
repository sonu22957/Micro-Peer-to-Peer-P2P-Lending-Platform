// fronted/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Public Landing
import Home from './pages/Home';

// Shared Pages
import Profile from './pages/Profile';

// Borrower Pages
import BorrowerDashboard from './pages/borrower/BorrowerDashboard';
import CreateLoan from './pages/borrower/CreateLoan';
import MyLoans from './pages/borrower/MyLoans';
import RepaymentHistory from './pages/borrower/RepaymentHistory';

// Lender Pages
import LenderDashboard from './pages/lender/LenderDashboard';
import LoanMarketplace from './pages/lender/LoanMarketplace';
import InvestmentHistory from './pages/lender/InvestmentHistory';
import FundLoan from './pages/lender/FundLoan';

// Common Pages
import LoanDetails from './pages/common/LoanDetails';

// Guards
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<Home />} />

      {/* Auth Routes (redirect away if logged in) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Shared */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/loans/:id" element={<LoanDetails />} />

        {/* Borrower */}
        <Route path="/borrower" element={
          <ProtectedRoute allowedRoles={['borrower']}>
            <BorrowerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/borrower/apply" element={
          <ProtectedRoute allowedRoles={['borrower']}>
            <CreateLoan />
          </ProtectedRoute>
        } />
        <Route path="/borrower/loans" element={
          <ProtectedRoute allowedRoles={['borrower']}>
            <MyLoans />
          </ProtectedRoute>
        } />
        <Route path="/borrower/repayments" element={
          <ProtectedRoute allowedRoles={['borrower']}>
            <RepaymentHistory />
          </ProtectedRoute>
        } />

        {/* Lender */}
        <Route path="/lender" element={
          <ProtectedRoute allowedRoles={['lender']}>
            <LenderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/lender/marketplace" element={
          <ProtectedRoute allowedRoles={['lender']}>
            <LoanMarketplace />
          </ProtectedRoute>
        } />
        <Route path="/lender/investments" element={
          <ProtectedRoute allowedRoles={['lender']}>
            <InvestmentHistory />
          </ProtectedRoute>
        } />
        <Route path="/lender/fund/:id" element={
          <ProtectedRoute allowedRoles={['lender']}>
            <FundLoan />
          </ProtectedRoute>
        } />

        {/* Staff/Admin */}
        <Route path="/staff/review" element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <LoanMarketplace staffMode />
          </ProtectedRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
