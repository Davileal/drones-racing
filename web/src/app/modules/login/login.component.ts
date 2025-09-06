import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  loading = false;
  showPassword = false;
  loginForm: FormGroup;
  errorMessage: string | null = null;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      remember: [false],
    });
  }

  ngOnInit(): void {
    if (localStorage.getItem('auth_token')) {
      this.router.navigate(['/drones']);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid || this.loading) {
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    const { username, password } = this.loginForm.value;

    this.authService.signIn(username, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/drones']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Invalid username or password.';
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
