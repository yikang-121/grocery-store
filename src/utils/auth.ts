// Authentication utility functions

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
}

/**
 * Check if user is currently authenticated
 * @returns boolean indicating if user is logged in
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  return !!(token && userData);
};

/**
 * Get current authenticated user data
 * @returns User object or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    return JSON.parse(userData) as User;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get authentication token
 * @returns token string or null if not authenticated
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('token');
};

/**
 * Clear authentication data
 */
export const clearAuth = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Check if user needs to login for checkout
 * @returns boolean indicating if login is required
 */
export const requiresLogin = (): boolean => {
  return !isAuthenticated();
};
