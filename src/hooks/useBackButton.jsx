
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = (event) => {
      // If we're on the home page, prevent going back (which would exit the app)
      if (location.pathname === '/' || location.pathname === '/index') {
        event.preventDefault();
        // Stay on the current page
        window.history.pushState(null, '', location.pathname);
      }
    };

    // Push a state to handle back button
    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);

  const goBack = () => {
    // Custom back function that checks if we should go back or stay
    if (window.history.length > 1 && location.pathname !== '/' && location.pathname !== '/index') {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return { goBack };
};
