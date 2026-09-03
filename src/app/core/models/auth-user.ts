export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  must_change_password: boolean;
  is_active: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface ChangePasswordResponse {
  message: string;
  must_change_password: boolean;
}