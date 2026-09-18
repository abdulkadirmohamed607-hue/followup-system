
import {
  Component,
  OnInit,
  computed,
  signal,
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
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
  SystemUserRole,
  ModulePermission,
  ModulePermissionItem
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
  // PLATFORM
  // =====================================================

  private readonly platformId =
    inject(PLATFORM_ID);


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

  selectedRole =
    signal<'All' | 'ADMIN' | 'USER'>('All');


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

  updatingStatusUserId =
    signal<number | null>(null);


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

  showUserModal =
    signal(false);

  showResetPasswordModal =
    signal(false);

  showPermissionsModal =
    signal(false);


  // =====================================================
  // EDIT MODE
  // =====================================================

  editingUserId =
    signal<number | null>(null);


  // =====================================================
  // RESET PASSWORD USER
  // =====================================================

  resetPasswordUser =
    signal<SystemUser | null>(null);


  // =====================================================
  // PERMISSIONS
  // =====================================================

  availableModules =
    signal<ModulePermissionItem[]>([]);


  selectedPermissionUser =
    signal<SystemUser | null>(null);


  selectedModules =
    signal<ModulePermission[]>([]);


  permissionsLoading =
    signal(false);


  permissionsSaving =
    signal(false);


  permissionsError =
    signal('');


  permissionsSuccess =
    signal('');


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
    private userManagementService:
      UserManagementService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    /*
     * Protected API calls must only happen
     * in the browser.
     */

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.loadUsers();

      this.loadModules();

    }

  }


  // =====================================================
  // LOAD USERS
  // =====================================================

  loadUsers(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;

    }


    this.loading.set(true);

    this.errorMessage.set('');


    this.userManagementService
      .getUsers()
      .subscribe({

        next: users => {

          this.users.set(
            users
          );

          this.loading.set(
            false
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.loading.set(
            false
          );


          console.error(
            'LOAD USERS ERROR:',
            error
          );


          if (
            error.status === 403
          ) {

            this.errorMessage.set(
              'You are not authorized to view system users.'
            );

            return;

          }


          if (
            error.status === 401
          ) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (
            error.status === 0
          ) {

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
  // LOAD AVAILABLE MODULES
  // =====================================================

  loadModules(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;

    }


    this.userManagementService
      .getModules()
      .subscribe({

        next: modules => {

          this.availableModules.set(
            modules
          );

          console.log(
            'AVAILABLE MODULES:',
            modules
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(
            'LOAD MODULES ERROR:',
            error
          );


          if (
            error.status === 401
          ) {

            this.permissionsError.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (
            error.status === 403
          ) {

            this.permissionsError.set(
              'Only administrators can manage system modules.'
            );

            return;

          }


          if (
            error.status === 0
          ) {

            this.permissionsError.set(
              'Unable to connect to Django server.'
            );

            return;

          }


          this.permissionsError.set(
            'Unable to load system modules.'
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


    return this.users().filter(
      user => {

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

          String(
            user.email ?? ''
          )
            .toLowerCase()
            .includes(search) ||

          String(
            user.phone ?? ''
          )
            .toLowerCase()
            .includes(search);


        const matchesRole =
          role === 'All' ||
          user.role === role;


        return (
          matchesSearch &&
          matchesRole
        );

      }
    );

  });


  // =====================================================
  // SUMMARY
  // =====================================================

  get totalUsers(): number {

    return this.users().length;

  }


  get activeUsers(): number {

    return this.users()
      .filter(
        user =>
          user.is_active
      )
      .length;

  }


  get adminUsers(): number {

    return this.users()
      .filter(
        user =>
          user.role === 'ADMIN'
      )
      .length;

  }


  get normalUsers(): number {

    return this.users()
      .filter(
        user =>
          user.role === 'USER'
      )
      .length;

  }


  // =====================================================
  // SEARCH
  // =====================================================

  onSearchChange(
    value: string
  ): void {

    this.searchTerm.set(
      value
    );

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

      this.selectedRole.set(
        value
      );

      return;

    }


    this.selectedRole.set(
      'All'
    );

  }


  // =====================================================
  // RESET FILTERS
  // =====================================================

  resetFilters(): void {

    this.searchTerm.set('');

    this.selectedRole.set(
      'All'
    );

  }


  // =====================================================
  // TOGGLE USER STATUS
  // =====================================================

  toggleUserStatus(
    user: SystemUser
  ): void {

    if (
      this.updatingStatusUserId() !== null
    ) {

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


    if (
      !window.confirm(
        confirmation
      )
    ) {

      return;

    }


    this.updatingStatusUserId.set(
      user.id
    );

    this.errorMessage.set('');

    this.successMessage.set('');


    this.userManagementService
      .updateUserStatus(
        user.id,
        newStatus
      )
      .subscribe({

        next: (
          updatedUser: SystemUser
        ) => {

          this.users.update(
            currentUsers =>
              currentUsers.map(
                currentUser =>
                  currentUser.id === user.id
                    ? {
                        ...currentUser,
                        is_active:
                          updatedUser.is_active ??
                          newStatus
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

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(
            'STATUS UPDATE ERROR:',
            error
          );


          this.updatingStatusUserId.set(
            null
          );


          if (
            error.status === 400
          ) {

            const detail =
              error.error?.detail;


            this.errorMessage.set(
              detail ||
              `Unable to ${action} user "${user.username}".`
            );

            return;

          }


          if (
            error.status === 401
          ) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (
            error.status === 403
          ) {

            this.errorMessage.set(
              'Only administrators can change user account status.'
            );

            return;

          }


          if (
            error.status === 404
          ) {

            this.errorMessage.set(
              'User account was not found.'
            );

            return;

          }


          if (
            error.status === 0
          ) {

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

    this.editingUserId.set(
      null
    );

    this.errorMessage.set('');

    this.successMessage.set('');


    this.showUserModal.set(
      true
    );

  }


  // =====================================================
  // OPEN EDIT USER
  // =====================================================

  openEditUser(
    user: SystemUser
  ): void {

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


    this.showUserModal.set(
      true
    );

  }


  // =====================================================
  // CLOSE USER MODAL
  // =====================================================

  closeUserModal(): void {

    if (
      this.saving()
    ) {

      return;

    }


    this.showUserModal.set(
      false
    );


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

    if (
      !this.username.trim()
    ) {

      this.errorMessage.set(
        'Username is required.'
      );

      return;

    }


    if (
      !this.firstName.trim()
    ) {

      this.errorMessage.set(
        'First name is required.'
      );

      return;

    }


    if (
      !this.lastName.trim()
    ) {

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

      if (
        !this.password
      ) {

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


            this.saving.set(
              false
            );


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

            this.saving.set(
              false
            );


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


    if (
      userId === null
    ) {

      return;

    }


    this.saving.set(
      true
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

        next: (
          updatedUser: SystemUser
        ) => {

          this.users.update(
            currentUsers =>
              currentUsers.map(
                currentUser => {

                  if (
                    currentUser.id !==
                    userId
                  ) {

                    return currentUser;

                  }


                  return {
                    ...currentUser,

                    username:
                      currentUser.username,

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
                      currentUser.updated_at,

                    permissions:
                      updatedUser.permissions ??
                      currentUser.permissions

                  };

                }
              )
          );


          this.saving.set(
            false
          );


          this.showUserModal.set(
            false
          );


          this.resetUserForm();


          this.successMessage.set(
            `User "${updatedUser.username ?? this.username}" updated successfully.`
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.saving.set(
            false
          );


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


    if (
      error.status === 400
    ) {

      const data =
        error.error;


      if (
        data?.username
      ) {

        this.errorMessage.set(
          this.extractErrorMessage(
            data.username,
            'Username is invalid.'
          )
        );

        return;

      }


      if (
        data?.password
      ) {

        this.errorMessage.set(
          this.extractErrorMessage(
            data.password,
            'Password is invalid.'
          )
        );

        return;

      }


      if (
        data?.email
      ) {

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


    if (
      error.status === 403
    ) {

      this.errorMessage.set(
        'Only administrators can manage users.'
      );

      return;

    }


    if (
      error.status === 401
    ) {

      this.errorMessage.set(
        'Your session has expired. Please login again.'
      );

      return;

    }


    if (
      error.status === 0
    ) {

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

    if (
      Array.isArray(value)
    ) {

      return String(
        value[0]
      );

    }


    if (
      typeof value === 'string'
    ) {

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
      !window.confirm(
        `Are you sure you want to delete user "${user.username}"?`
      )
    ) {

      return;

    }


    this.userManagementService
      .deleteUser(
        user.id
      )
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


          if (
            error.status === 400
          ) {

            this.errorMessage.set(
              'You cannot delete your own account.'
            );

            return;

          }


          if (
            error.status === 403
          ) {

            this.errorMessage.set(
              'Only administrators can delete users.'
            );

            return;

          }


          if (
            error.status === 401
          ) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (
            error.status === 0
          ) {

            this.errorMessage.set(
              'Unable to connect to Django server.'
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

    if (
      this.saving()
    ) {

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


    if (
      !user
    ) {

      return;

    }


    if (
      !this.resetPassword
    ) {

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


    this.saving.set(
      true
    );


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

          this.saving.set(
            false
          );


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

          this.saving.set(
            false
          );


          console.error(
            'RESET PASSWORD ERROR:',
            error
          );


          if (
            error.status === 400
          ) {

            const data =
              error.error;


            if (
              data?.new_password
            ) {

              this.errorMessage.set(
                this.extractErrorMessage(
                  data.new_password,
                  'Password is invalid.'
                )
              );

              return;

            }


            if (
              data?.confirm_password
            ) {

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


          if (
            error.status === 403
          ) {

            this.errorMessage.set(
              'Only administrators can reset passwords.'
            );

            return;

          }


          if (
            error.status === 401
          ) {

            this.errorMessage.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (
            error.status === 0
          ) {

            this.errorMessage.set(
              'Unable to connect to Django server.'
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
  // OPEN MANAGE PERMISSIONS
  // =====================================================

  openPermissions(
    user: SystemUser
  ): void {

    console.log(
      'OPEN PERMISSIONS:',
      user
    );


    this.selectedPermissionUser.set(
      user
    );


    this.selectedModules.set([]);

    this.permissionsError.set('');

    this.permissionsSuccess.set('');


    this.showPermissionsModal.set(
      true
    );


    // ===================================================
    // ADMINISTRATOR
    // ===================================================

    if (
      user.role === 'ADMIN'
    ) {

      this.selectedModules.set(
        this.availableModules()
          .map(
            module =>
              module.module
          )
      );

      return;

    }


    // ===================================================
    // NORMAL USER
    // ===================================================

    this.loadUserPermissions(
      user.id
    );

  }


  // =====================================================
  // LOAD USER PERMISSIONS
  // =====================================================

  loadUserPermissions(
    userId: number
  ): void {

    this.permissionsLoading.set(
      true
    );


    this.permissionsError.set('');

    this.permissionsSuccess.set('');


    this.userManagementService
      .getUserPermissions(
        userId
      )
      .subscribe({

        next: response => {

          console.log(
            'USER PERMISSIONS:',
            response
          );


          const permissions =
            response.permissions ?? [];


          this.selectedModules.set(
            permissions
          );


          this.users.update(
            currentUsers =>
              currentUsers.map(
                user =>
                  user.id === userId
                    ? {
                        ...user,
                        permissions
                      }
                    : user
              )
          );


          this.permissionsLoading.set(
            false
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.permissionsLoading.set(
            false
          );


          console.error(
            'LOAD USER PERMISSIONS ERROR:',
            error
          );


          if (
            error.status === 401
          ) {

            this.permissionsError.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (
            error.status === 403
          ) {

            this.permissionsError.set(
              'Only administrators can manage user permissions.'
            );

            return;

          }


          if (
            error.status === 404
          ) {

            this.permissionsError.set(
              'User account was not found.'
            );

            return;

          }


          if (
            error.status === 0
          ) {

            this.permissionsError.set(
              'Unable to connect to Django server.'
            );

            return;

          }


          this.permissionsError.set(
            'Unable to load user permissions.'
          );

        }

      });

  }


  // =====================================================
  // CHECK MODULE SELECTION
  // =====================================================

  isModuleSelected(
    module: ModulePermission
  ): boolean {

    return this.selectedModules()
      .includes(
        module
      );

  }


  // =====================================================
  // TOGGLE MODULE PERMISSION
  // =====================================================

  toggleModulePermission(
    module: ModulePermission
  ): void {

    const user =
      this.selectedPermissionUser();


    if (!user) {

      return;

    }


    /*
     * Administrator permissions are automatic.
     * They cannot be manually changed.
     */

    if (
      user.role === 'ADMIN'
    ) {

      return;

    }


    const current =
      this.selectedModules();


    if (
      current.includes(
        module
      )
    ) {

      this.selectedModules.set(
        current.filter(
          item =>
            item !== module
        )
      );

      return;

    }


    this.selectedModules.set([
      ...current,
      module
    ]);

  }


  // =====================================================
  // SELECT ALL MODULES
  // =====================================================

  selectAllModules(): void {

    const user =
      this.selectedPermissionUser();


    if (
      !user ||
      user.role === 'ADMIN'
    ) {

      return;

    }


    this.selectedModules.set(
      this.availableModules()
        .map(
          module =>
            module.module
        )
    );

  }


  // =====================================================
  // CLEAR ALL MODULES
  // =====================================================

  clearAllModules(): void {

    const user =
      this.selectedPermissionUser();


    if (
      !user ||
      user.role === 'ADMIN'
    ) {

      return;

    }


    this.selectedModules.set([]);

  }


  // =====================================================
  // SAVE USER PERMISSIONS
  // =====================================================

  savePermissions(): void {

    const user =
      this.selectedPermissionUser();


    if (!user) {

      return;

    }


    /*
     * Administrator permissions are automatic.
     */

    if (
      user.role === 'ADMIN'
    ) {

      this.permissionsSuccess.set(
        'Administrator already has access to all modules.'
      );

      return;

    }


    this.permissionsSaving.set(
      true
    );


    this.permissionsError.set('');

    this.permissionsSuccess.set('');


    const modules =
      this.selectedModules();


    console.log(
      'SAVE PERMISSIONS REQUEST:',
      {
        userId: user.id,
        username: user.username,
        modules
      }
    );


    this.userManagementService
      .updateUserPermissions(
        user.id,
        modules
      )
      .subscribe({

        next: response => {

          console.log(
            'SAVE PERMISSIONS SUCCESS:',
            response
          );


          const savedPermissions =
            response.permissions ?? [];


          this.selectedModules.set(
            savedPermissions
          );


          this.users.update(
            currentUsers =>
              currentUsers.map(
                currentUser =>
                  currentUser.id === user.id
                    ? {
                        ...currentUser,
                        permissions:
                          savedPermissions
                      }
                    : currentUser
              )
          );


          this.permissionsSaving.set(
            false
          );


          this.permissionsSuccess.set(
            'User permissions saved successfully.'
          );

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.permissionsSaving.set(
            false
          );


          console.error(
            'SAVE PERMISSIONS ERROR:',
            error
          );


          if (
            error.status === 400
          ) {

            const data =
              error.error;


            if (
              data?.modules
            ) {

              this.permissionsError.set(
                this.extractErrorMessage(
                  data.modules,
                  'Invalid module permissions.'
                )
              );

              return;

            }


            this.permissionsError.set(
              'Invalid module permissions.'
            );

            return;

          }


          if (
            error.status === 401
          ) {

            this.permissionsError.set(
              'Your session has expired. Please login again.'
            );

            return;

          }


          if (
            error.status === 403
          ) {

            this.permissionsError.set(
              'Only administrators can change user permissions.'
            );

            return;

          }


          if (
            error.status === 404
          ) {

            this.permissionsError.set(
              'User account was not found.'
            );

            return;

          }


          if (
            error.status === 0
          ) {

            this.permissionsError.set(
              'Unable to connect to Django server.'
            );

            return;

          }


          this.permissionsError.set(
            'Unable to save user permissions. Please try again.'
          );

        }

      });

  }


  // =====================================================
  // CLOSE PERMISSIONS MODAL
  // =====================================================

  closePermissions(): void {

    if (
      this.permissionsSaving()
    ) {

      return;

    }


    this.showPermissionsModal.set(
      false
    );


    this.selectedPermissionUser.set(
      null
    );


    this.selectedModules.set([]);

    this.permissionsError.set('');

    this.permissionsSuccess.set('');

  }


  // =====================================================
  // GET MODULE LABEL
  // =====================================================

  getModuleLabel(
    module: ModulePermission
  ): string {

    const found =
      this.availableModules()
        .find(
          item =>
            item.module === module
        );


    return found?.name ??
      this.formatModuleName(
        module
      );

  }


  // =====================================================
  // GET MODULE DESCRIPTION
  // =====================================================

  getModuleDescription(
    module: ModulePermission
  ): string {

    const found =
      this.availableModules()
        .find(
          item =>
            item.module === module
        );


    return found?.description ?? '';

  }


  // =====================================================
  // FORMAT MODULE NAME
  // =====================================================

  private formatModuleName(
    module: ModulePermission
  ): string {

    switch (module) {

      case 'PATIENTS':
        return 'Patients';

      case 'VISITOR_CHECK':
        return 'Visitor Check';

      case 'REPORTS':
        return 'Reports';

      case 'USER_UPLOAD':
        return 'User Upload';

      case 'USER_MANAGEMENT':
        return 'User Management';

      case 'SYSTEM_SETTINGS':
        return 'System Settings';

      default:
        return module;

    }

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
