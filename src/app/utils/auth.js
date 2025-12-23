// Client-side authentication utilities

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setAuthData = (token, user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const checkAuth = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Try to make a simple authenticated request to verify token
    const response = await fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = getUser();
      return { isAuthenticated: true, user };
    } else {
      clearAuthData();
      return false;
    }
  } catch (error) {
    clearAuthData();
    return false;
  }
};

export const requireAuth = async (router, requiredRole) => {
  const authResult = await checkAuth();

  if (!authResult) {
    router.push('/login');
    return false;
  }

  if (requiredRole && authResult.user.role !== requiredRole) {
    router.push('/login');
    return false;
  }

  return authResult;
};