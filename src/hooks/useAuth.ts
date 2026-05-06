import { useState } from 'react';

const STORED_USERNAME = 'SchiffmanCalendar';
// SHA-256 hash of the password — never store the plaintext
const STORED_PASSWORD_HASH = '33cdd6cf88e9717a5e5d3415e26d3481ed0fe76a5a0f13dec2c20b95445de59c';
const STORAGE_KEY = 'schiffman_cal_auth';

async function sha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    const hash = await sha256(password);
    if (username.trim() === STORED_USERNAME && hash === STORED_PASSWORD_HASH) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
