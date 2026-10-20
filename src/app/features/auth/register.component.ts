import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthErrorCode, AuthService } from '../../core/data/auth.service';
import { I18n } from '../../shared/i18n';
import { StringKey } from '../../shared/strings';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGE_KEYS: Record<AuthErrorCode, StringKey> = {
  'invalid-credentials': 'authErrorInvalidCredentials',
  'email-in-use': 'authErrorEmailInUse',
  'weak-password': 'authErrorWeakPassword',
  'invalid-email': 'authErrorInvalidEmail',
  network: 'authErrorNetwork',
  unknown: 'authErrorUnknown',
};

@Component({
  selector: 'w4a-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  protected readonly pending = signal(false);
  protected readonly emailError = signal<AuthErrorCode | null>(null);
  protected readonly passwordError = signal<AuthErrorCode | null>(null);
  protected readonly formError = signal<AuthErrorCode | null>(null);

  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');
  private readonly passwordInput = viewChild.required<ElementRef<HTMLInputElement>>('passwordInput');

  protected message(code: AuthErrorCode): string {
    return this.t()[MESSAGE_KEYS[code]] as string;
  }

  protected async submit(): Promise<void> {
    if (this.pending()) return;
    const { email, password } = this.form.getRawValue();
    const trimmed = email.trim();

    this.formError.set(null);
    this.emailError.set(EMAIL_SHAPE.test(trimmed) ? null : 'invalid-email');
    this.passwordError.set(password.length >= MIN_PASSWORD_LENGTH ? null : 'weak-password');
    if (this.focusFirstInvalid()) return;

    this.pending.set(true);
    const result = await this.auth.register(trimmed, password);

    if (result.ok) {
      // Stay pending through navigation so a second submit cannot register again.
      await this.router.navigateByUrl('/today');
      return;
    }
    this.pending.set(false);
    switch (result.code) {
      case 'email-in-use':
      case 'invalid-email':
        this.emailError.set(result.code);
        break;
      case 'weak-password':
        this.passwordError.set(result.code);
        break;
      default:
        this.formError.set(result.code);
    }
    this.focusFirstInvalid();
  }

  /** Moves focus to the first field with an error; returns whether there was one. */
  private focusFirstInvalid(): boolean {
    if (this.emailError()) this.emailInput().nativeElement.focus();
    else if (this.passwordError()) this.passwordInput().nativeElement.focus();
    else return false;
    return true;
  }
}
