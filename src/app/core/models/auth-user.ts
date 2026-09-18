
export type UserRole = 'admin' | 'user';


// =========================================================
// MODULE PERMISSIONS
// =========================================================

export type ModulePermission =
  | 'PATIENTS'
  | 'VISITOR_CHECK'
  | 'REPORTS'
  | 'USER_UPLOAD'
  | 'USER_MANAGEMENT'
  | 'SYSTEM_SETTINGS';


// =========================================================
// AUTH USER
// =========================================================

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

  /**
   * Modules this user is allowed to access.
   *
   * Admin users receive all modules from the backend.
   * Normal users receive only modules assigned to them.
   */
  permissions: ModulePermission[];

}


// =========================================================
// LOGIN RESPONSE
// =========================================================

export interface LoginResponse {

  access: string;

  refresh: string;

  user: AuthUser;

}


// =========================================================
// CHANGE PASSWORD RESPONSE
// =========================================================

export interface ChangePasswordResponse {

  message: string;

  must_change_password: boolean;

}