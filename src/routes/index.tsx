import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './dashboard'
import AdminDashboard from './admin'
import PrivateRoute from '../components/PrivateRoute'
import Layout from '../components/Layout'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
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
      </Route>
    </Routes>
  )
}

export default AppRoutes
