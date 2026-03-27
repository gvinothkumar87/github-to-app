import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanySetting } from '@/types/company';

export const useLocations = () => {
    const [locations, setLocations] = useState<CompanySetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const { data, error } = await supabase
                    .from('company_settings')
                    .select('*')
                    .eq('is_active', true)
                    .order('location_name');

                if (error) throw error;

                setLocations(data as CompanySetting[]);
            } catch (err: any) {
                console.error('Error fetching locations:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    return { locations, loading, error };
};
