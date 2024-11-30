import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import DashboardContainer from '../components/dashboard/DashboardContainer';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">Please log in to view the dashboard</div>
        <button 
          onClick={() => navigate('/login')} 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Log In
        </button>
      </div>
    );
  }

  return <DashboardContainer />;
};

export default Dashboard;