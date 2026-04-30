// Authentication utility functions

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
}

/**
 * Check if user is currently authenticated and session is not expired
 * @returns boolean indicating if user is logged in
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  if (!token || !userData) return false;

  // Check for JWT expiration
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const exp = decodedPayload.exp;
    
    if (exp && Date.now() >= exp * 1000) {
      // Token is expired
      console.warn('Session expired');
      return false;
    }
  } catch (error) {
    console.error('Error validating token expiration:', error);
    return false;
  }
  
  return true;
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
    
    const user = JSON.parse(userData) as User;
    // Normalize role to uppercase
    if (user.role) {
      user.role = user.role.toUpperCase() as 'CUSTOMER' | 'ADMIN';
    }
    return user;
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

/**
 * Logout user by invalidating token on backend and clearing local storage
 */
export const logoutUser = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  const token = localStorage.getItem('token');
  
  // ALWAYS clear local auth regardless of backend success
  const cleanup = () => {
    clearAuth();
    // Use window.location instead of router to force a clean state
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  if (token) {
    try {
      // Use the new /signout endpoint
      await fetch('http://localhost:8080/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error during backend logout (continuing with local logout):', error);
    }
  }
  
  cleanup();
};
