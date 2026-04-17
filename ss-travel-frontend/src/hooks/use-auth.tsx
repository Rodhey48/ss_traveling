import { useEffect, useMemo, useState } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const authState = useMemo(
    () => ({ isAuthenticated, loading }),
    [isAuthenticated, loading]
  );

  return authState;
}
