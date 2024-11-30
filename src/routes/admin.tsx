import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getAdminStats } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext'

const AdminDashboard: React.FC = () => {
  const { user } = useAuth()
  const [adminStats, setAdminStats] = useState(null)
  const [error, setError] = useState<string | null>(null)

  // Check if current user is admin
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const stats = await getAdminStats()
        setAdminStats(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      }
    }

    if (isAdmin) {
      fetchAdminStats()
    }
  }, [isAdmin])

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {adminStats && (
        <div>
          <h2>User Statistics</h2>
          {/* Render your admin stats here */}
          <pre>{JSON.stringify(adminStats, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
