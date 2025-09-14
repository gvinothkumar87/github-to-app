import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    console.log('useAdminCheck: Current user:', user);
    console.log('useAdminCheck: User email:', user?.email);
    console.log('useAdminCheck: Admin email:', 'gvinothkumar87@gmail.com');
    
    if (user) {
      const isAdminUser = user.email === 'gvinothkumar87@gmail.com';
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