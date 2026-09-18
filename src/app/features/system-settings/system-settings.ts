import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  SystemSettingsService,
  SessionSetting
} from '../../core/services/system-settings.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.css'
})
export class SystemSettings implements OnInit {

  private readonly systemSettingsService =
    inject(SystemSettingsService);

  private readonly cdr =
    inject(ChangeDetectorRef);

  sessionSettings: SessionSetting[] = [];

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  editingId: number | null = null;

  editStartTime = '';
  editEndTime = '';
  editIsActive = true;

  ngOnInit(): void {
    this.loadSessionSettings();
  }

  loadSessionSettings(): void {

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Immediately update the view to show loading state.
    this.cdr.detectChanges();

    console.log(
      'Loading System Settings...'
    );

    this.systemSettingsService
      .getSessionSettings()
      .subscribe({

        next: (settings) => {

          console.log(
            'SYSTEM SETTINGS RESPONSE:',
            settings
          );

          if (!Array.isArray(settings)) {

            console.error(
              'Invalid System Settings response:',
              settings
            );

            this.sessionSettings = [];

            this.errorMessage =
              'Invalid System Settings data received from the server.';

            this.loading = false;

            this.cdr.detectChanges();

            return;
          }

          this.sessionSettings =
            [...settings].sort(
              (a, b) =>
                this.sessionOrder(a.session) -
                this.sessionOrder(b.session)
            );

          console.log(
            'SYSTEM SETTINGS STORED:',
            this.sessionSettings
          );

          console.log(
            'SYSTEM SETTINGS COUNT:',
            this.sessionSettings.length
          );

          /*
           * IMPORTANT:
           *
           * The API response is correct and the array
           * contains 3 records. We explicitly trigger
           * Angular change detection here so that:
           *
           * loading = false
           *
           * and
           *
           * sessionSettings = [...]
           *
           * are immediately reflected in the HTML.
           */
          this.loading = false;

          if (
            this.sessionSettings.length === 0
          ) {

            this.errorMessage =
              'No session settings were found in the database.';

          }

          this.cdr.detectChanges();

          console.log(
            'SYSTEM SETTINGS VIEW UPDATED'
          );

        },

        error: (error: Error) => {

          console.error(
            'SYSTEM SETTINGS LOAD ERROR:',
            error
          );

          this.sessionSettings = [];

          this.errorMessage =
            error?.message ||
            'Failed to load System Settings.';

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }

  startEdit(
    setting: SessionSetting
  ): void {

    this.editingId =
      setting.id;

    this.editStartTime =
      this.normalizeTime(
        setting.start_time
      );

    this.editEndTime =
      this.normalizeTime(
        setting.end_time
      );

    this.editIsActive =
      setting.is_active;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

  }

  cancelEdit(): void {

    this.editingId = null;

    this.editStartTime = '';

    this.editEndTime = '';

    this.editIsActive = true;

    this.errorMessage = '';

    this.cdr.detectChanges();

  }

  saveEdit(
    setting: SessionSetting
  ): void {

    if (!this.editStartTime) {

      this.errorMessage =
        'Please select a start time.';

      this.cdr.detectChanges();

      return;

    }

    if (!this.editEndTime) {

      this.errorMessage =
        'Please select an end time.';

      this.cdr.detectChanges();

      return;

    }

    if (
      this.editStartTime ===
      this.editEndTime
    ) {

      this.errorMessage =
        'Start time and end time cannot be the same.';

      this.cdr.detectChanges();

      return;

    }

    this.saving = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

    console.log(
      'Updating session setting:',
      setting.id,
      {
        start_time:
          this.editStartTime,

        end_time:
          this.editEndTime,

        is_active:
          this.editIsActive
      }
    );

    this.systemSettingsService
      .updateSessionSetting(
        setting.id,
        {
          start_time:
            this.editStartTime,

          end_time:
            this.editEndTime,

          is_active:
            this.editIsActive
        }
      )
      .subscribe({

        next: (updatedSetting) => {

          console.log(
            'SESSION SETTING UPDATED:',
            updatedSetting
          );

          this.sessionSettings =
            this.sessionSettings.map(
              item =>
                item.id ===
                updatedSetting.id

                  ? updatedSetting

                  : item
            );

          this.saving = false;

          this.editingId = null;

          this.editStartTime = '';

          this.editEndTime = '';

          this.editIsActive = true;

          this.successMessage =
            `${updatedSetting.session_name} settings updated successfully.`;

          this.cdr.detectChanges();

          setTimeout(() => {

            this.successMessage = '';

            this.cdr.detectChanges();

          }, 4000);

        },

        error: (error: Error) => {

          console.error(
            'SESSION SETTING UPDATE ERROR:',
            error
          );

          this.errorMessage =
            error?.message ||
            'Failed to update session setting.';

          this.saving = false;

          this.cdr.detectChanges();

        }

      });

  }

  isEditing(
    setting: SessionSetting
  ): boolean {

    return (
      this.editingId ===
      setting.id
    );

  }

  getSessionName(
    setting: SessionSetting
  ): string {

    if (
      setting.session_name
    ) {

      return setting.session_name;

    }

    switch (
      setting.session
    ) {

      case 'MORNING':
        return 'Morning';

      case 'DAY':
        return 'Day';

      case 'EVENING':
        return 'Evening';

      default:
        return setting.session;

    }

  }

  formatTime(
    value: string
  ): string {

    if (!value) {
      return '--:--';
    }

    return value.substring(
      0,
      5
    );

  }

  private normalizeTime(
    value: string
  ): string {

    if (!value) {
      return '';
    }

    return value.substring(
      0,
      5
    );

  }

  private sessionOrder(
    session: string
  ): number {

    switch (
      session
    ) {

      case 'MORNING':
        return 1;

      case 'DAY':
        return 2;

      case 'EVENING':
        return 3;

      default:
        return 99;

    }

  }

  retry(): void {

    this.loadSessionSettings();

  }

}