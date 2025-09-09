import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (user) {
      // Check if the current user is the admin user (gvinothkumar87)
      setIsAdmin(user.id === '6fad72cb-61e3-4507-9ade-11d1c3a6ffa4');
    } else {
      setIsAdmin(false);
    }
  }, [user]);
  
  return isAdmin;
};