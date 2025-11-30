import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  User,
  VirtualSpace,
  Post,
  ArchivedSession,
  LoginCredentials,
  RegisterData,
  AuthResponse
} from '../types';

/**
 * API Service class for all backend communication
 */
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Don't redirect if this is a login/register request (let the component handle it)
          const url = error.config?.url;
          const isAuthEndpoint = url?.includes('/auth/login') || url?.includes('/auth/register');
          
          if (!isAuthEndpoint) {
            // For other 401 errors, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authentication APIs
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    const response = await this.api.put('/auth/profile', updates);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/auth/change-password', { oldPassword, newPassword });
  }

  /**
   * Virtual Space APIs
   */
  async createSpace(data: {
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
  }): Promise<{ space: VirtualSpace }> {
    const response = await this.api.post('/spaces', data);
    return response.data;
  }

  async getSpaceByCode(code: string): Promise<{ space: VirtualSpace }> {
    const response = await this.api.get(`/spaces/code/${code}`);
    return response.data;
  }

  async joinSpace(code: string): Promise<{ space: VirtualSpace }> {
    const response = await this.api.post(`/spaces/join/${code}`);
    return response.data;
  }

  async joinSpaceAnonymous(
    code: string,
    data: { nickname: string; email: string }
  ): Promise<{ participantId: string; sessionToken: string; space: VirtualSpace }> {
    const response = await this.api.post(`/spaces/join-anonymous/${code}`, data);
    return response.data;
  }

  async getTutorSpaces(status?: string): Promise<{ spaces: VirtualSpace[] }> {
    const response = await this.api.get('/spaces/tutor', { params: { status } });
    return response.data;
  }

  async getStudentSpaces(): Promise<{ spaces: VirtualSpace[] }> {
    const response = await this.api.get('/spaces/student');
    return response.data;
  }

  async getSpaceById(id: string): Promise<{ space: VirtualSpace }> {
    const response = await this.api.get(`/spaces/${id}`);
    return response.data;
  }

  async getParticipants(spaceId: string): Promise<{ participants: User[] }> {
    const response = await this.api.get(`/spaces/${spaceId}/participants`);
    return response.data;
  }

  /**
   * Post APIs
   */
  async createPost(data: FormData): Promise<{ post: Post }> {
    const response = await this.api.post('/posts', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getPostsBySpace(
    spaceId: string,
    sortBy?: 'difficulty' | 'time'
  ): Promise<{ posts: Post[] }> {
    const response = await this.api.get(`/posts/space/${spaceId}`, {
      params: { sortBy }
    });
    return response.data;
  }

  async getStudentPosts(): Promise<{ posts: Post[] }> {
    const response = await this.api.get('/posts/student');
    return response.data;
  }

  async answerPost(postId: string, response: string): Promise<{ post: Post }> {
    const res = await this.api.put(`/posts/${postId}/answer`, { response });
    return res.data;
  }

  async getUnansweredPosts(spaceId: string): Promise<{ posts: Post[] }> {
    const response = await this.api.get(`/posts/space/${spaceId}/unanswered`);
    return response.data;
  }

  async getKnowledgeSummary(spaceId: string): Promise<{ summary: string }> {
    const response = await this.api.get(`/posts/space/${spaceId}/knowledge-summary`);
    return response.data;
  }

  async getPostStatistics(spaceId: string): Promise<{ statistics: any }> {
    const response = await this.api.get(`/posts/space/${spaceId}/statistics`);
    return response.data;
  }

  /**
   * Archive APIs
   */
  async getArchivedSpaces(): Promise<{ archivedSpaces: ArchivedSession[] }> {
    const response = await this.api.get('/archives');
    return response.data;
  }

  async getArchivedSpaceDetails(sessionId: string): Promise<any> {
    const response = await this.api.get(`/archives/${sessionId}`);
    return response.data;
  }

  async manualArchive(spaceId: string): Promise<void> {
    await this.api.post(`/archives/manual/${spaceId}`);
  }

  /**
   * Admin User Management APIs
   */
  async getAllUsers(): Promise<{ users: User[] }> {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  async getUserById(userId: string): Promise<{ user: User }> {
    const response = await this.api.get(`/admin/users/${userId}`);
    return response.data;
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<{ user: User; message: string }> {
    const response = await this.api.post('/admin/users', userData);
    return response.data;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<{ user: User; message: string }> {
    const response = await this.api.put(`/admin/users/${userId}`, updates);
    return response.data;
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.api.put(`/admin/users/${userId}/reset-password`, { newPassword });
    return response.data;
  }

  async getUserStatistics(): Promise<{
    statistics: {
      total: number;
      tutors: number;
      admins: number;
      recentUsers: User[];
    };
  }> {
    const response = await this.api.get('/admin/users/statistics');
    return response.data;
  }
}

export default new ApiService();
