import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage: string = '';
  loading: boolean = false;

  async loginWithGoogle(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = error as string;
    } finally {
      this.loading = false;
    }
  }
}