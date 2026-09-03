import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SystemUserRole = 'ADMIN' | 'USER';

export interface SystemUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: SystemUserRole;
  must_change_password: boolean;
  is_active: boolean;
  date_joined?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: SystemUserRole;
  password: string;
}

export interface UpdateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: SystemUserRole;
  is_active: boolean;
}

export interface ResetPasswordRequest {
  new_password: string;
  confirm_password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {

  private readonly API_URL =
    'http://127.0.0.1:8000/api/auth/users';

  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET ALL USERS
  // =====================================================

  getUsers(): Observable<SystemUser[]> {

    return this.http.get<SystemUser[]>(
      `${this.API_URL}/`
    );

  }


  // =====================================================
  // GET SINGLE USER
  // =====================================================

  getUser(
    id: number
  ): Observable<SystemUser> {

    return this.http.get<SystemUser>(
      `${this.API_URL}/${id}/`
    );

  }


  // =====================================================
  // CREATE USER
  // =====================================================

  createUser(
    data: CreateUserRequest
  ): Observable<SystemUser> {

    return this.http.post<SystemUser>(
      `${this.API_URL}/`,
      data
    );

  }


  // =====================================================
  // UPDATE USER
  // =====================================================

  updateUser(
    id: number,
    data: UpdateUserRequest
  ): Observable<SystemUser> {

    return this.http.patch<SystemUser>(
      `${this.API_URL}/${id}/`,
      data
    );

  }


  // =====================================================
  // DELETE USER
  // =====================================================

  deleteUser(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.API_URL}/${id}/`
    );

  }


  // =====================================================
  // RESET PASSWORD
  // =====================================================

  resetPassword(
    id: number,
    data: ResetPasswordRequest
  ): Observable<any> {

    return this.http.post(
      `${this.API_URL}/${id}/reset-password/`,
      data
    );

  }

}