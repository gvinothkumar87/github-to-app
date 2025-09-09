import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    console.log('useAdminCheck: Current user:', user);
    console.log('useAdminCheck: User ID:', user?.id);
    console.log('useAdminCheck: Admin UUID:', '6fad72cb-61e3-4507-9ade-11d1c3a6ffa4');
    
    if (user) {
      const isAdminUser = user.id === '6fad72cb-61e3-4507-9ade-11d1c3a6ffa4';
      console.log('useAdminCheck: Is admin?', isAdminUser);
      setIsAdmin(isAdminUser);
    } else {
      console.log('useAdminCheck: No user, setting isAdmin to false');
      setIsAdmin(false);
    }
  }, [user]);
  
  console.log('useAdminCheck: Returning isAdmin:', isAdmin);
  return isAdmin;
};