import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import PrivateRoute  from './components/auth/PrivateRoute'
import Layout        from './components/layout/Layout'

import Login         from './pages/Login'
import Register      from './pages/Register'
import Dashboard     from './pages/Dashboard'
import Invoices      from './pages/Invoices'
import InvoiceForm   from './pages/InvoiceForm'
import Clients       from './pages/Clients'
import Payments      from './pages/Payments'
import Settings      from './pages/Settings'

export default function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/"                  element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"         element={<Dashboard />}   />
            <Route path="/invoices"          element={<Invoices />}    />
            <Route path="/invoices/new"      element={<InvoiceForm />} />
            <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="/clients"           element={<Clients />}     />
            <Route path="/payments"          element={<Payments />}    />
            <Route path="/settings"          element={<Settings />}    />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'inherit',
          },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
    </>
  )
}