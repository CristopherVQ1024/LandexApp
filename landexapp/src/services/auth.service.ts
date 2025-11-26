import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { 
  Auth, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  user,
  User
} from '@angular/fire/auth';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

interface AuthResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    google_id: string;
    name: string;
    email: string;
    picture: string;
    role: string;
    status: string;
  };
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private http: HttpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';
  
  user$ = user(this.auth);

  // Iniciar sesión con Google
  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      
      // Enviar datos al backend
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/google`, {
          google_id: user.uid,
          name: user.displayName,
          email: user.email,
          picture: user.photoURL
        })
      );

      // Guardar token en localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }

      console.log('✅ Login exitoso:', response.message);
      
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      localStorage.clear();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Obtener datos del usuario desde localStorage
  getUserData(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verificar token con el backend
  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/auth/verify`, { headers })
      );

      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Manejar errores de Firebase
  private handleError(error: any): string {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Inicio de sesión cancelado';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup bloqueado por el navegador';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Solicitud cancelada';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Ya existe una cuenta con este email';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión';
          break;
        default:
          errorMessage = error.message;
      }
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    }
    
    return errorMessage;
  }
}