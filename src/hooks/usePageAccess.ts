import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';

export interface AccessiblePage {
    page_id: string;
    page_name: string;
    page_route: string;
    description: string;
}

export const usePageAccess = () => {
    const { user } = useAuth();
    const { isAdmin } = useAdminCheck();
    const [accessiblePages, setAccessiblePages] = useState<AccessiblePage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccessiblePages = async () => {
            if (!user) {
                setAccessiblePages([]);
                setLoading(false);
                return;
            }

            if (isAdmin) {
                // Admins have access to everything, but we might want to know specific pages for UI purposes
                // effectively, we can return all pages or just rely on the isAdmin check.
                // For consistency, let's fetch all pages if admin, or just bypass checks.
                // But the checkAccess function will handle isAdmin.
                // Let's just fetch accessible pages for granularity if needed, 
                // but for now, we depend on the RPC.
            }

            try {
                const { data, error } = await supabase.rpc('get_user_accessible_pages', {
                    _user_id: user.id
                }) as any;

                if (error) {
                    console.error('Error fetching accessible pages:', error);
                    setAccessiblePages([]);
                } else {
                    setAccessiblePages(data || []);
                }
            } catch (err) {
                console.error('Unexpected error in usePageAccess:', err);
                setAccessiblePages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAccessiblePages();
    }, [user, isAdmin]);

    const checkAccess = (path: string): boolean => {
        if (loading) return false; // Or true? Better safe.
        if (isAdmin) return true;

        // Normalize path to remove trailing slashes or handle sub-routes if necessary
        // For now, exact match or check if the page route is contained.

        // Check if any accessible page route matches the start of the path
        // e.g. /bills matches /bills/create
        const hasAccess = accessiblePages.some(page =>
            path === page.page_route || path.startsWith(`${page.page_route}/`)
        );

        return hasAccess;
    };

    return { accessiblePages, loading, checkAccess, isAdmin };
};
