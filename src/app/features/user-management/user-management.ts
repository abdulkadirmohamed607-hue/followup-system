import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  UserManagementService,
  SystemUser,
  SystemUserRole
} from '../../core/services/user-management.service';


@Component({
  selector: 'app-user-management',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './user-management.html',

  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {

  // =====================================================
  // USERS
  // =====================================================

  users = signal<SystemUser[]>([]);


  // =====================================================
  // SEARCH
  // =====================================================

  searchTerm = signal('');


  // =====================================================
  // ROLE FILTER
  // =====================================================

  selectedRole = signal<'All' | 'ADMIN' | 'USER'>('All');


  // =====================================================
  // LOADING
  // =====================================================

  loading = signal(false);


  // =====================================================
  // SAVING
  // =====================================================

  saving = signal(false);


  // =====================================================
  // ERROR
  // =====================================================

  errorMessage = signal('');


  // =====================================================
  // SUCCESS
  // =====================================================

  successMessage = signal('');


  // =====================================================
  // MODALS
  // =====================================================

  showUserModal = signal(false);

  showResetPasswordModal = signal(false);


  // =====================================================
  // EDIT MODE
  // =====================================================

  editingUserId = signal<number | null>(null);


  // =====================================================
  // RESET PASSWORD USER
  // =====================================================

  resetPasswordUser = signal<SystemUser | null>(null);


  // =====================================================
  // USER FORM
  // =====================================================

  username = '';

  firstName = '';

  lastName = '';

  email = '';

  phone = '';

  role: SystemUserRole = 'USER';

  password = '';

  confirmPassword = '';

  isActive = true;


  // =====================================================
  // RESET PASSWORD FORM
  // =====================================================

  resetPassword = '';

  resetConfirmPassword = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private userManagementService: UserManagementService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadUsers();

  }


  // =====================================================
  // LOAD USERS
  // =====================================================

  loadUsers(): void {

    this.loading.set(true);

    this.errorMessage.set('');

    this.userManagementService
      .getUsers()
      .subscribe({

        next: users => {

          this.users.set(users);

          this.loading.set(false);

        },

        error: (error: HttpErrorResponse) => {

          this.loading.set(false);

          console.error(
            'LOAD USERS ERROR:',
            error
          );

          if (error.status === 403) {

            this.errorMessage.set(
              'You are not authorized to view system users.'
            );

            return;

          }

          if (error.status === 401) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
            );

            return;

          }

          if (error.status === 0) {

            this.errorMessage.set(
              'Unable to connect to Django server.'
            );

            return;

          }

          this.errorMessage.set(
            'Unable to load system users.'
          );

        }

      });

  }


  // =====================================================
  // FILTERED USERS
  // =====================================================

  filteredUsers = computed(() => {

    const search =
      this.searchTerm()
        .trim()
        .toLowerCase();

    const role =
      this.selectedRole();

    return this.users().filter(user => {

      const fullName =
        [
          user.first_name,
          user.last_name
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();


      const matchesSearch =
        !search ||

        user.username
          .toLowerCase()
          .includes(search) ||

        fullName
          .includes(search) ||

        String(user.email ?? '')
          .toLowerCase()
          .includes(search) ||

        String(user.phone ?? '')
          .toLowerCase()
          .includes(search);


      const matchesRole =
        role === 'All' ||
        user.role === role;


      return (
        matchesSearch &&
        matchesRole
      );

    });

  });


  // =====================================================
  // SUMMARY
  // =====================================================

  get totalUsers(): number {

    return this.users().length;

  }


  get activeUsers(): number {

    return this.users()
      .filter(user => user.is_active)
      .length;

  }


  get adminUsers(): number {

    return this.users()
      .filter(user => user.role === 'ADMIN')
      .length;

  }


  get normalUsers(): number {

    return this.users()
      .filter(user => user.role === 'USER')
      .length;

  }


  // =====================================================
  // SEARCH
  // =====================================================

  onSearchChange(
    value: string
  ): void {

    this.searchTerm.set(value);

  }


  // =====================================================
  // ROLE FILTER
  // =====================================================

  onRoleChange(
    value: string
  ): void {

    if (
      value === 'ADMIN' ||
      value === 'USER'
    ) {

      this.selectedRole.set(value);

      return;

    }

    this.selectedRole.set('All');

  }


  // =====================================================
  // RESET FILTERS
  // =====================================================

  resetFilters(): void {

    this.searchTerm.set('');

    this.selectedRole.set('All');

  }


  // =====================================================
  // OPEN ADD USER
  // =====================================================

  openAddUser(): void {

    this.resetUserForm();

    this.editingUserId.set(null);

    this.showUserModal.set(true);

  }


  // =====================================================
  // OPEN EDIT USER
  // =====================================================

  openEditUser(
    user: SystemUser
  ): void {

    this.editingUserId.set(user.id);

    this.username = user.username;

    this.firstName = user.first_name;

    this.lastName = user.last_name;

    this.email = user.email;

    this.phone = user.phone;

    this.role = user.role;

    this.isActive = user.is_active;

    this.password = '';

    this.confirmPassword = '';

    this.errorMessage.set('');

    this.successMessage.set('');

    this.showUserModal.set(true);

  }


  // =====================================================
  // CLOSE USER MODAL
  // =====================================================

  closeUserModal(): void {

    if (this.saving()) {

      return;

    }

    this.showUserModal.set(false);

    this.resetUserForm();

  }


  // =====================================================
  // SAVE USER
  // =====================================================

  saveUser(): void {

    this.errorMessage.set('');

    this.successMessage.set('');


    // -----------------------------------------------
    // REQUIRED FIELDS
    // -----------------------------------------------

    if (!this.username.trim()) {

      this.errorMessage.set(
        'Username is required.'
      );

      return;

    }


    if (!this.firstName.trim()) {

      this.errorMessage.set(
        'First name is required.'
      );

      return;

    }


    if (!this.lastName.trim()) {

      this.errorMessage.set(
        'Last name is required.'
      );

      return;

    }


    // -----------------------------------------------
    // CREATE USER
    // -----------------------------------------------

    if (
      this.editingUserId() === null
    ) {

      if (!this.password) {

        this.errorMessage.set(
          'Password is required.'
        );

        return;

      }


      if (
        this.password !==
        this.confirmPassword
      ) {

        this.errorMessage.set(
          'Password and confirmation password do not match.'
        );

        return;

      }


      this.saving.set(true);


      this.userManagementService
        .createUser({

          username:
            this.username.trim(),

          first_name:
            this.firstName.trim(),

          last_name:
            this.lastName.trim(),

          email:
            this.email.trim(),

          phone:
            this.phone.trim(),

          role:
            this.role,

          password:
            this.password

        })
        .subscribe({

          next: user => {

            this.users.update(
              current => [
                user,
                ...current
              ]
            );

            this.saving.set(false);

            this.successMessage.set(
              'User created successfully.'
            );

            this.showUserModal.set(false);

            this.resetUserForm();

          },

          error: (
            error: HttpErrorResponse
          ) => {

            this.saving.set(false);

            this.handleSaveError(error);

          }

        });

      return;

    }


    // -----------------------------------------------
    // UPDATE USER
    // -----------------------------------------------

    const userId =
      this.editingUserId();

    if (userId === null) {

      return;

    }


    this.saving.set(true);


    this.userManagementService
      .updateUser(

        userId,

        {

          first_name:
            this.firstName.trim(),

          last_name:
            this.lastName.trim(),

          email:
            this.email.trim(),

          phone:
            this.phone.trim(),

          role:
            this.role,

          is_active:
            this.isActive

        }

      )
      .subscribe({

        next: updatedUser => {

          this.users.update(
            current =>
              current.map(user =>
                user.id === updatedUser.id
                  ? updatedUser
                  : user
              )
          );

          this.saving.set(false);

          this.successMessage.set(
            'User updated successfully.'
          );

          this.showUserModal.set(false);

          this.resetUserForm();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.saving.set(false);

          this.handleSaveError(error);

        }

      });

  }


  // =====================================================
  // SAVE ERROR
  // =====================================================

  private handleSaveError(
    error: HttpErrorResponse
  ): void {

    console.error(
      'USER SAVE ERROR:',
      error
    );


    if (error.status === 400) {

      const data =
        error.error;


      if (data?.username) {

        this.errorMessage.set(
          this.extractErrorMessage(
            data.username,
            'Username is invalid.'
          )
        );

        return;

      }


      if (data?.password) {

        this.errorMessage.set(
          this.extractErrorMessage(
            data.password,
            'Password is invalid.'
          )
        );

        return;

      }


      if (data?.email) {

        this.errorMessage.set(
          this.extractErrorMessage(
            data.email,
            'Email is invalid.'
          )
        );

        return;

      }


      this.errorMessage.set(
        'Invalid user information. Please check the form.'
      );

      return;

    }


    if (error.status === 403) {

      this.errorMessage.set(
        'Only administrators can manage users.'
      );

      return;

    }


    if (error.status === 401) {

      this.errorMessage.set(
        'Your session has expired. Please login again.'
      );

      return;

    }


    if (error.status === 0) {

      this.errorMessage.set(
        'Unable to connect to Django server.'
      );

      return;

    }


    this.errorMessage.set(
      'Unable to save user. Please try again.'
    );

  }


  // =====================================================
  // EXTRACT ERROR
  // =====================================================

  private extractErrorMessage(
    value: any,
    fallback: string
  ): string {

    if (Array.isArray(value)) {

      return String(value[0]);

    }

    if (typeof value === 'string') {

      return value;

    }

    return fallback;

  }


  // =====================================================
  // DELETE USER
  // =====================================================

  deleteUser(
    user: SystemUser
  ): void {

    if (
      !confirm(
        `Are you sure you want to delete user "${user.username}"?`
      )
    ) {

      return;

    }


    this.userManagementService
      .deleteUser(user.id)
      .subscribe({

        next: () => {

          this.users.update(
            current =>
              current.filter(
                item =>
                  item.id !== user.id
              )
          );

          this.successMessage.set(
            'User deleted successfully.'
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(
            'DELETE USER ERROR:',
            error
          );


          if (error.status === 400) {

            this.errorMessage.set(
              'You cannot delete your own account.'
            );

            return;

          }


          if (error.status === 403) {

            this.errorMessage.set(
              'Only administrators can delete users.'
            );

            return;

          }


          this.errorMessage.set(
            'Unable to delete user.'
          );

        }

      });

  }


  // =====================================================
  // OPEN RESET PASSWORD
  // =====================================================

  openResetPassword(
    user: SystemUser
  ): void {

    this.resetPasswordUser.set(user);

    this.resetPassword = '';

    this.resetConfirmPassword = '';

    this.errorMessage.set('');

    this.successMessage.set('');

    this.showResetPasswordModal.set(true);

  }


  // =====================================================
  // CLOSE RESET PASSWORD
  // =====================================================

  closeResetPassword(): void {

    if (this.saving()) {

      return;

    }

    this.showResetPasswordModal.set(false);

    this.resetPasswordUser.set(null);

    this.resetPassword = '';

    this.resetConfirmPassword = '';

  }


  // =====================================================
  // SAVE RESET PASSWORD
  // =====================================================

  saveResetPassword(): void {

    this.errorMessage.set('');

    const user =
      this.resetPasswordUser();


    if (!user) {

      return;

    }


    if (!this.resetPassword) {

      this.errorMessage.set(
        'New password is required.'
      );

      return;

    }


    if (
      this.resetPassword !==
      this.resetConfirmPassword
    ) {

      this.errorMessage.set(
        'Password and confirmation password do not match.'
      );

      return;

    }


    this.saving.set(true);


    this.userManagementService
      .resetPassword(

        user.id,

        {

          new_password:
            this.resetPassword,

          confirm_password:
            this.resetConfirmPassword

        }

      )
      .subscribe({

        next: () => {

          this.saving.set(false);

          this.showResetPasswordModal.set(false);

          this.resetPasswordUser.set(null);

          this.resetPassword = '';

          this.resetConfirmPassword = '';

          this.successMessage.set(
            'Password reset successfully. The user must change the password after login.'
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.saving.set(false);

          console.error(
            'RESET PASSWORD ERROR:',
            error
          );


          if (error.status === 400) {

            const data =
              error.error;


            if (data?.new_password) {

              this.errorMessage.set(
                this.extractErrorMessage(
                  data.new_password,
                  'Password is invalid.'
                )
              );

              return;

            }


            if (data?.confirm_password) {

              this.errorMessage.set(
                this.extractErrorMessage(
                  data.confirm_password,
                  'Passwords do not match.'
                )
              );

              return;

            }


            this.errorMessage.set(
              'Unable to reset password.'
            );

            return;

          }


          if (error.status === 403) {

            this.errorMessage.set(
              'Only administrators can reset passwords.'
            );

            return;

          }


          this.errorMessage.set(
            'Unable to reset password.'
          );

        }

      });

  }


  // =====================================================
  // RESET USER FORM
  // =====================================================

  private resetUserForm(): void {

    this.username = '';

    this.firstName = '';

    this.lastName = '';

    this.email = '';

    this.phone = '';

    this.role = 'USER';

    this.password = '';

    this.confirmPassword = '';

    this.isActive = true;

    this.editingUserId.set(null);

  }


  // =====================================================
  // ROLE LABEL
  // =====================================================

  getRoleLabel(
    role: SystemUserRole
  ): string {

    return role === 'ADMIN'
      ? 'Admin'
      : 'User';

  }

}