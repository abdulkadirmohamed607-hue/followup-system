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
  // STATUS UPDATE
  // =====================================================

  updatingStatusUserId = signal<number | null>(null);


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
  // TOGGLE USER STATUS
  // =====================================================

  toggleUserStatus(
    user: SystemUser
  ): void {

    console.log(
      'TOGGLE STATUS CLICKED:',
      user
    );

    if (
      this.updatingStatusUserId() !== null
    ) {

      console.log(
        'STATUS UPDATE ALREADY IN PROGRESS'
      );

      return;

    }

    const newStatus =
      !user.is_active;

    const action =
      newStatus
        ? 'activate'
        : 'deactivate';

    const confirmation =
      newStatus
        ? `Are you sure you want to activate "${user.username}"?`
        : `Are you sure you want to deactivate "${user.username}"?`;

    const confirmed =
      window.confirm(
        confirmation
      );

    if (!confirmed) {

      console.log(
        'STATUS CHANGE CANCELLED'
      );

      return;

    }

    console.log(
      'STATUS CHANGE CONFIRMED:',
      {
        userId: user.id,
        username: user.username,
        oldStatus: user.is_active,
        newStatus
      }
    );

    this.updatingStatusUserId.set(
      user.id
    );

    this.errorMessage.set('');

    this.successMessage.set('');


    // ===================================================
    // SEND STATUS UPDATE TO DJANGO
    // ===================================================

    this.userManagementService
      .updateUserStatus(
        user.id,
        newStatus
      )
      .subscribe({

        // =================================================
        // SUCCESS
        // =================================================

        next: (
          updatedUser: SystemUser
        ) => {

          console.log(
            'STATUS UPDATE SUCCESS:',
            updatedUser
          );

          // Update frontend immediately
          this.users.update(
            currentUsers =>
              currentUsers.map(
                currentUser =>
                  currentUser.id === user.id
                    ? {
                        ...currentUser,
                        is_active: newStatus
                      }
                    : currentUser
              )
          );

          this.updatingStatusUserId.set(
            null
          );

          this.successMessage.set(
            newStatus
              ? `User "${user.username}" activated successfully.`
              : `User "${user.username}" deactivated successfully.`
          );

          console.log(
            `User "${user.username}" status changed to:`,
            newStatus
          );

        },


        // =================================================
        // ERROR
        // =================================================

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(
            'STATUS UPDATE ERROR:',
            error
          );

          console.error(
            'STATUS:',
            error.status
          );

          console.error(
            'ERROR BODY:',
            error.error
          );

          this.updatingStatusUserId.set(
            null
          );


          if (error.status === 400) {

            const detail =
              error.error?.detail;

            this.errorMessage.set(
              detail ||
              `Unable to ${action} user "${user.username}".`
            );

            return;

          }


          if (error.status === 401) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (error.status === 403) {

            this.errorMessage.set(
              'Only administrators can change user account status.'
            );

            return;

          }


          if (error.status === 404) {

            this.errorMessage.set(
              'User account was not found.'
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
            `Unable to ${action} user. Please try again.`
          );

        }

      });

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

    console.log(
      'OPEN EDIT USER:',
      user
    );

    this.editingUserId.set(
      user.id
    );

    this.username =
      user.username;

    this.firstName =
      user.first_name;

    this.lastName =
      user.last_name;

    this.email =
      user.email;

    this.phone =
      user.phone;

    this.role =
      user.role;

    this.isActive =
      user.is_active;

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


    // ===================================================
    // REQUIRED FIELDS
    // ===================================================

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


    // ===================================================
    // CREATE USER
    // ===================================================

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

            console.log(
              'CREATE USER SUCCESS:',
              user
            );

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

            this.showUserModal.set(
              false
            );

            this.resetUserForm();

          },


          error: (
            error: HttpErrorResponse
          ) => {

            this.saving.set(false);

            this.handleSaveError(
              error
            );

          }

        });

      return;

    }


    // ===================================================
    // UPDATE USER
    // ===================================================

    const userId =
      this.editingUserId();


    if (userId === null) {

      return;

    }


    this.saving.set(true);


    console.log(
      'UPDATE USER REQUEST:',
      {
        userId,
        data: {
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
      }
    );


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

        // =================================================
        // UPDATE SUCCESS
        // =================================================

        next: (
          updatedUser: SystemUser
        ) => {

          console.log(
            'UPDATE USER SUCCESS:',
            updatedUser
          );


          // =================================================
          // IMPORTANT:
          // Update the existing frontend object using
          // the ID we sent to Django.
          // =================================================

          this.users.update(
            currentUsers =>
              currentUsers.map(
                currentUser => {

                  if (
                    currentUser.id !== userId
                  ) {

                    return currentUser;

                  }


                  return {
                    ...currentUser,

                    // Keep username from existing object
                    username:
                      currentUser.username,

                    // Update edited fields
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
                      this.isActive,

                    // Preserve backend/system fields
                    must_change_password:
                      updatedUser.must_change_password ??
                      currentUser.must_change_password,

                    date_joined:
                      updatedUser.date_joined ??
                      currentUser.date_joined,

                    created_at:
                      updatedUser.created_at ??
                      currentUser.created_at,

                    updated_at:
                      updatedUser.updated_at ??
                      currentUser.updated_at

                  };

                }
              )
          );


          // =================================================
          // STOP SAVING
          // =================================================

          this.saving.set(false);


          // =================================================
          // CLOSE MODAL
          // =================================================

          this.showUserModal.set(
            false
          );


          // =================================================
          // RESET FORM
          // =================================================

          this.resetUserForm();


          // =================================================
          // SUCCESS MESSAGE
          // =================================================

          this.successMessage.set(
            `User "${updatedUser.username ?? this.username}" updated successfully.`
          );


          console.log(
            'FRONTEND USER LIST UPDATED:',
            this.users()
          );

        },


        // =================================================
        // UPDATE ERROR
        // =================================================

        error: (
          error: HttpErrorResponse
        ) => {

          this.saving.set(false);

          console.error(
            'UPDATE USER ERROR:',
            error
          );

          this.handleSaveError(
            error
          );

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


          if (error.status === 401) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
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

    this.resetPasswordUser.set(
      user
    );

    this.resetPassword = '';

    this.resetConfirmPassword = '';

    this.errorMessage.set('');

    this.successMessage.set('');

    this.showResetPasswordModal.set(
      true
    );

  }


  // =====================================================
  // CLOSE RESET PASSWORD
  // =====================================================

  closeResetPassword(): void {

    if (this.saving()) {

      return;

    }


    this.showResetPasswordModal.set(
      false
    );

    this.resetPasswordUser.set(
      null
    );

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

          this.showResetPasswordModal.set(
            false
          );

          this.resetPasswordUser.set(
            null
          );

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


          if (error.status === 401) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
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

    this.editingUserId.set(
      null
    );

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