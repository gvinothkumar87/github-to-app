import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { checkAccess, loading: accessLoading, isAdmin } = usePageAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (!loading && !accessLoading && user) {
      // Allow access to home and auth pages by default or handle them specifically
      // Also allow page-access only for admins (although checkAccess usually handles logic, 
      // let's be strict for the admin page).
      if (location.pathname === '/' || location.pathname === '/auth') {
        return;
      }

      // Admin page is special restricted
      if (location.pathname === '/page-access' && !isAdmin) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view the Page Access Control page.",
        });
        navigate('/');
        return;
      }

      // Start check for other pages
      const hasAccess = checkAccess(location.pathname);

      if (!hasAccess) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this page.",
        });
        navigate('/');
      }
    }
  }, [user, loading, navigate, location, checkAccess, accessLoading, isAdmin, toast]);

  if (loading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Double check render block
  if (!loading && !accessLoading && user && location.pathname !== '/' && location.pathname !== '/auth') {
    if (location.pathname === '/page-access' && !isAdmin) return null;
    if (!checkAccess(location.pathname)) return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;