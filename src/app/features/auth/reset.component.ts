import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthErrorCode, AuthService } from '../../core/data/auth.service';
import { I18n } from '../../shared/i18n';
import { StringKey } from '../../shared/strings';

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
  selector: 'w4a-reset',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.scss',
})
export class ResetComponent {
  private readonly auth = inject(AuthService);
  protected readonly t = inject(I18n).t;

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
  });

  protected readonly pending = signal(false);
  protected readonly sent = signal(false);
  protected readonly emailError = signal<AuthErrorCode | null>(null);
  protected readonly formError = signal<AuthErrorCode | null>(null);

  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  protected message(code: AuthErrorCode): string {
    return this.t()[MESSAGE_KEYS[code]] as string;
  }

  protected async submit(): Promise<void> {
    if (this.pending() || this.sent()) return;
    const trimmed = this.form.getRawValue().email.trim();

    this.formError.set(null);
    if (!EMAIL_SHAPE.test(trimmed)) {
      this.emailError.set('invalid-email');
      this.emailInput()?.nativeElement.focus();
      return;
    }
    this.emailError.set(null);

    this.pending.set(true);
    const result = await this.auth.sendPasswordReset(trimmed);
    this.pending.set(false);

    if (result.ok) {
      this.sent.set(true);
      return;
    }
    if (result.code === 'invalid-email') {
      this.emailError.set(result.code);
      this.emailInput()?.nativeElement.focus();
    } else {
      this.formError.set(result.code);
    }
  }
}
