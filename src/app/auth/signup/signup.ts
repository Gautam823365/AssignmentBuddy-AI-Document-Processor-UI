import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, SignupData } from '../../service/auth';
@Component({
  selector: 'app-signup',
    imports: [CommonModule, ReactiveFormsModule, RouterModule], 
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  isSubmitting: boolean = false;

  //isSubmitting: boolean;
 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth:Auth
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
  }
 passwordValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.value;
    if (!password) return null;

    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[#?!@$%^&*-]/.test(password);

    const valid = hasNumber && hasUpper && hasLower && hasSpecial;
    return valid ? null : { 'passwordStrength': true };
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
  getErrorMessage(controlName: string): string {
    const control = this.signupForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;

    switch (controlName) {
      case 'firstName':
      case 'lastName':
        if (errors['required']) return `${controlName === 'firstName' ? 'First' : 'Last'} name is required`;
        if (errors['minlength']) return `${controlName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
        break;
      case 'email':
        if (errors['required']) return 'Email is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;
      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters';
        if (errors['passwordStrength']) return 'Password must contain uppercase, lowercase, number, and special character';
        break;
      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        if (this.signupForm.errors?.['passwordMismatch']) return 'Passwords do not match';
        break;
      case 'agreeToTerms':
        if (errors['required']) return 'You must agree to the terms and conditions';
        break;
    }
    return '';
  }

  onSignup(): void {
    if (this.signupForm.valid) {
    //this.isSubmitting = true;

    const formValues = this.signupForm.value;

    const signupData: SignupData = {
      name: formValues.fullName,
      email: formValues.email,
      password: formValues.password,

    };

    this.auth.signup(signupData).subscribe({
      next: (response) => {
        alert('Account created successfully!');

        this.signupForm.reset();
        this.isSubmitting = false;
          this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Signup failed', error);
        alert('Signup failed. Please try again.');
        this.isSubmitting = false;
      }
    });

  } else {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }

}
}