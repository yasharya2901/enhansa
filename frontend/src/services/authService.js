import api from './api';

export const authService = {
  // Login with Google
  loginWithGoogle: async (token) => {
    try {
      const response = await api.post('/auth/google', { token });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    // For development, create a mock user if none exists
    if (!localStorage.getItem('token')) {
      // Add mock authentication data
      const mockUser = {
        id: '123456',
        displayName: 'Daniel Reader',
        email: 'daniel@example.com',
        photoURL: 'https://ui-avatars.com/api/?name=Daniel+Reader&background=random',
      };
      
      localStorage.setItem('token', 'mock_token_12345');
      localStorage.setItem('user', JSON.stringify(mockUser));
      return true;
    }
    return !!localStorage.getItem('token');
  }
};

export default authService;
