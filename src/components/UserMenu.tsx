import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User } from 'lucide-react';

export default function UserMenu() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <User className="h-5 w-5 text-gray-600 flex-shrink-0" />
        <span className="text-sm text-gray-600 truncate max-w-[120px] hidden lg:inline">
          {user.email}
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center text-gray-600 hover:text-gray-900"
        title="Sign Out"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}
