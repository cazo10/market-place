
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser, getUserData } from '@/lib/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any existing authentication state on app start
    const clearPreviousSession = () => {
      setUser(null);
      setUserData(null);
      localStorage.removeItem('marketplace_cart');
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? firebaseUser.uid : 'No user');
      
      if (firebaseUser) {
        // Only proceed if this is the current authenticated user
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === firebaseUser.uid) {
          setUser(firebaseUser);
          try {
            console.log('Fetching user data for:', firebaseUser.uid);
            const userDetails = await getUserData(firebaseUser.uid);
            console.log('User details fetched:', userDetails);
            setUserData(userDetails);
          } catch (error) {
            console.error('Error fetching user data:', error);
            // If we can't fetch user data, logout to prevent inconsistent state
            await logoutUser();
            clearPreviousSession();
          }
        }
      } else {
        console.log('No user authenticated, clearing session');
        clearPreviousSession();
        // Dispatch storage event to notify cart hook
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'marketplace_cart',
          newValue: null
        }));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      console.log('Logging out user');
      setLoading(true);
      await logoutUser();
      setUser(null);
      setUserData(null);
      // Clear cart on logout
      localStorage.removeItem('marketplace_cart');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'marketplace_cart',
        newValue: null
      }));
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      logout,
      isVendor: userData?.role === 'vendor',
      isAdmin: userData?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
