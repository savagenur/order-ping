import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminOnlyRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'superadmin')[];
}

export default function AdminOnlyRoute({ children, allowedRoles = ['admin', 'superadmin'] }: AdminOnlyRouteProps) {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'superadmin' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user has appropriate role
        const idTokenResult = await user.getIdTokenResult();
        const role = (idTokenResult.claims.role as 'admin' | 'superadmin') || null;
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
