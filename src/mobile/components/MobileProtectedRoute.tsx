import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { Loader2, Smartphone } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface MobileProtectedRouteProps {
  children: React.ReactNode;
}

// Map mobile routes to web routes in app_pages
export const mapMobileRouteToWebRoute = (path: string): string => {
  // Base routes mapping
  const routeMap: Record<string, string> = {
    '/transit': 'index:entries',
    '/customers': 'index:customers',
    '/items': 'index:items',
    '/receipts': 'index:amount-received',
    '/sales': 'index:outward-sales',
    '/direct-sales': 'index:direct-sales',
    '/sales-ledger': 'index:sales-ledger',
    '/customer-ledger': 'index:customer-ledger',
    '/reports': 'index:reports',
    
    // Purchase sub-routes mapping
    '/purchases/inward': 'index:purchase-inward-entries',
    '/purchases/empty-weight': 'index:purchase-empty-weight',
    '/purchases/direct': 'index:purchase-direct',
    '/purchases/from-transit': 'index:purchase-from-transit',
    '/purchases/list': 'index:purchase-list',
    '/purchases/bills': 'index:purchase-bills',
    '/purchases/supplier-ledger': 'index:purchase-supplier-ledger',

    // Shared routes map to themselves
    '/bills': '/bills',
    '/credit-note': '/credit-note',
    '/debit-note': '/debit-note',
    '/purchases': '/purchases',
    '/suppliers': '/suppliers',
    '/supplier-ledger': '/supplier-ledger',
    '/settings': '/company-settings', // Assuming settings maps to company settings
  };

  // Check if the path starts with any of the mapped routes
  for (const [mobileRoute, webRoute] of Object.entries(routeMap)) {
    if (path === mobileRoute || path.startsWith(`${mobileRoute}/`)) {
      return webRoute;
    }
  }

  // If no map found, return the path itself as fallback
  return path;
};

const MobileProtectedRoute: React.FC<MobileProtectedRouteProps> = ({ children }) => {
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
      if (location.pathname === '/' || location.pathname === '/auth') {
        return;
      }

      const webRoute = mapMobileRouteToWebRoute(location.pathname);
      const hasAccess = checkAccess(webRoute);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Double check render block
  if (!loading && !accessLoading && user && location.pathname !== '/' && location.pathname !== '/auth') {
    const webRoute = mapMobileRouteToWebRoute(location.pathname);
    if (!checkAccess(webRoute)) return null;
  }

  return <>{children}</>;
};

export default MobileProtectedRoute;