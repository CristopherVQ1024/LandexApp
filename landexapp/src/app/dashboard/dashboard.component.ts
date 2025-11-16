import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  userName: string = '';
  userEmail: string = '';
  userPhoto: string = '';

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.displayName || 'Usuario';
      this.userEmail = user.email || '';
      this.userPhoto = user.photoURL || '';
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}