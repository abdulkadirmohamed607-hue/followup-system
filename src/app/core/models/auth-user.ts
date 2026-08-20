export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}