import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  title = 'lendexapp';
  isAuthenticated = false;
  userName = '';
  userPhoto = '';

  ngOnInit() {
    this.checkAuth();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAuth();
      });
  }

  checkAuth() {
    this.isAuthenticated = this.authService.isAuthenticated();

    if (this.isAuthenticated) {
      const userData = this.authService.getUserData();
      if (userData) {
        this.userName = userData.name || 'Usuario';
        this.userPhoto = userData.picture
          ? `${userData.picture}?sz=200`
          : '';
          console.log("Foto:", this.userPhoto);
      }
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.isAuthenticated = false;
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}