import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './dashboard'
import AdminDashboard from './admin'
import PrivateRoute from '../components/PrivateRoute'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
      {/* Add other routes as needed */}
    </Routes>
  )
}

export default AppRoutes
