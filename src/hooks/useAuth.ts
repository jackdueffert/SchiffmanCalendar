import { useState } from 'react';
import { getToken, setToken, clearToken, isTokenExpired } from '../lib/apiClient';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
      clearToken();
      return false;
    }
    return true;
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) return false;

      const { token } = await res.json();
      setToken(token);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    clearToken();
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
