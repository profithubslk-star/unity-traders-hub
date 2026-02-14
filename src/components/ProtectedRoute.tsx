import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireVIP?: boolean;
}

export function ProtectedRoute({ children, requireVIP = false }: ProtectedRouteProps) {
  const { user, subscription, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (requireVIP && subscription?.plan_type === 'demo') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">VIP Access Required</h2>
          <p className="text-gray-400">Please upgrade your subscription to access this feature.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
