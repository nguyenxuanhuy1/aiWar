export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'USER' | string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  token: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
