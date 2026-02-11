import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

  const strengthChecks = [hasUpperCase, hasLowerCase, hasNumeric, hasSpecialChar];
  const passedChecks = strengthChecks.filter((check) => check).length;

  if (passedChecks < 3) {
    return {
      passwordStrength: {
        hasUpperCase,
        hasLowerCase,
        hasNumeric,
        hasSpecialChar,
        message:
          'Password must contain at least 3 of: uppercase, lowercase, number, special character',
      },
    };
  }

  return null;
}
