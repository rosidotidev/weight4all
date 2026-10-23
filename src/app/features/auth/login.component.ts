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
import { CENTER, faceColours, mouthPath } from '../../shared/mood-face.component';
import { StringKey } from '../../shared/strings';

/** The illustration's face: a gentle, sunny level, never a judgement. */
const FACE_LEVEL = 9;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGE_KEYS: Record<AuthErrorCode, StringKey> = {
  'invalid-credentials': 'authErrorInvalidCredentials',
  'invalid-email': 'authErrorInvalidEmail',
  network: 'authErrorNetwork',
  unknown: 'authErrorUnknown',
};

@Component({
  selector: 'w4a-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;

  protected readonly center = CENTER;
  protected readonly mouth = mouthPath(FACE_LEVEL);
  protected readonly face = faceColours(FACE_LEVEL);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  protected readonly pending = signal(false);
  protected readonly emailError = signal<AuthErrorCode | null>(null);
  protected readonly formError = signal<AuthErrorCode | null>(null);

  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');

  protected message(code: AuthErrorCode): string {
    return this.t()[MESSAGE_KEYS[code]] as string;
  }

  protected async submit(): Promise<void> {
    if (this.pending()) return;
    const { email, password } = this.form.getRawValue();
    const trimmed = email.trim();

    this.formError.set(null);
    if (!EMAIL_SHAPE.test(trimmed)) {
      this.emailError.set('invalid-email');
    } else if (password.length === 0) {
      // A blank password cannot match; same single message as wrong credentials.
      this.emailError.set('invalid-credentials');
    } else {
      this.emailError.set(null);
    }
    if (this.emailError()) {
      this.emailInput().nativeElement.focus();
      return;
    }

    this.pending.set(true);
    const result = await this.auth.login(trimmed, password);

    if (result.ok) {
      // Stay pending through navigation so a second submit cannot log in again.
      await this.router.navigateByUrl('/today');
      return;
    }
    this.pending.set(false);
    if (result.code === 'invalid-credentials' || result.code === 'invalid-email') {
      // One message under the email field, whichever part was wrong.
      this.emailError.set(result.code);
      this.emailInput().nativeElement.focus();
    } else {
      this.formError.set(result.code);
    }
  }
}
