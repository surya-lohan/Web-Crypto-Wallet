import apiService from './api';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

class AuthService {
  /**
   * Login user with email/username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse['data']>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store token and user data
      apiService.setAuthToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return {
        success: response.success,
        message: response.message || 'Login successful',
        data: response.data
      };
    }
    
    throw new Error(response.message || 'Login failed');
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse['data']>('/auth/register', userData);
    
    if (response.success && response.data) {
      // Store token and user data
      apiService.setAuthToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return {
        success: response.success,
        message: response.message || 'Registration successful',
        data: response.data
      };
    }
    
    throw new Error(response.message || 'Registration failed');
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Even if the server request fails, we should clear local storage
      console.warn('Logout request failed, but clearing local storage:', error);
    } finally {
      // Always clear local storage
      apiService.removeAuthToken();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<{ user: User }>('/auth/me');
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    throw new Error(response.message || 'Failed to fetch user profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await apiService.put<{ user: User }>('/auth/profile', profileData);
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    throw new Error(response.message || 'Failed to update profile');
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(): Promise<string> {
    const response = await apiService.post<{ token: string; expiresIn: string }>('/auth/refresh');
    
    if (response.success && response.data) {
      apiService.setAuthToken(response.data.token);
      return response.data.token;
    }
    
    throw new Error(response.message || 'Failed to refresh token');
  }

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiService.isAuthenticated() && this.getStoredUser() !== null;
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return apiService.getAuthToken();
  }

  /**
   * Initialize auth state (called on app startup)
   */
  async initializeAuth(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      // Validate token with server and get fresh user data
      return await this.getCurrentUser();
    } catch (error) {
      // If validation fails, clear auth state
      this.logout();
      return null;
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;