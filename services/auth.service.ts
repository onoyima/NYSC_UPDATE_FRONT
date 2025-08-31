import axiosInstance from '@/utils/axios';
import { LoginCredentials, Student, AdminUser } from '@/types/auth.types';

export interface AuthResponse {
  token: string;
  userType: 'student' | 'admin';
  user: Student | AdminUser;
  message: string;
}

export interface ProfileResponse {
  userType: 'student' | 'admin';
  student?: Student;
  admin?: AdminUser;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      '/api/nysc/login',
      credentials
    );
    return response.data;
  }

  async verifyToken(skipAuthRedirect = false): Promise<ProfileResponse> {
    const config = skipAuthRedirect ? { headers: {}, _skipAuthRedirect: true } : undefined;
    const response = await axiosInstance.get<ProfileResponse>('/api/nysc/auth/verify', config);
    return response.data;
  }

  async getProfile(): Promise<{ user: Student | AdminUser; userType: 'student' | 'admin' }> {
    const profileData = await this.verifyToken();
    const user = profileData.userType === 'student' ? profileData.student! : profileData.admin!;
    return {
      user,
      userType: profileData.userType
    };
  }

  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/api/nysc/logout');
    } catch (error) {
      // Handle logout error silently
    } finally {
      localStorage.removeItem('nysc_token');
      localStorage.removeItem('nysc_user');
      localStorage.removeItem('nysc_user_type');
    }
  }

  storeAuthData(token: string, user: Student | AdminUser, userType: 'student' | 'admin'): void {
    localStorage.setItem('nysc_token', token);
    localStorage.setItem('nysc_user', JSON.stringify(user));
    localStorage.setItem('nysc_user_type', userType);
  }

  getStoredAuthData(): {
    token: string | null;
    user: Student | AdminUser | null;
    userType: 'student' | 'admin' | null;
  } {
    const token = localStorage.getItem('nysc_token');
    const userStr = localStorage.getItem('nysc_user');
    const userType = localStorage.getItem('nysc_user_type') as
      | 'student'
      | 'admin'
      | null;

    let user: Student | AdminUser | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (error) {
        // Invalid user data
        this.logout();
      }
    }

    return { token, user, userType };
  }
}

const authService = new AuthService();
export { authService };
export default authService;
