'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'jobseeker' | 'employer';
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // Check auth status
  const checkAuth = async () => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch fresh user data from server
        try {
          const response = await api.get<User>('/auth/me');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
          console.error('Failed to fetch fresh user data:', err);
          logout(); // optional: log out if token invalid
        }
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      redirectByRole(user.role);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  // Register
  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/register', userData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      redirectByRole(user.role);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  // Logout
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setUser(null);
    router.push('/login');
  };

  // Update user locally
  const updateUser = (userData: User) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Redirect helper
  const redirectByRole = (role: User['role']) => {
    if (role === 'jobseeker') router.push('/jobseeker/dashboard');
    else if (role === 'employer') router.push('/employer/dashboard');
    else router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
