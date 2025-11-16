import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  user,
  User
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$ = user(this.auth);

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(this.auth, provider);
      
      const user = result.user;
      console.log('Usuario logueado:', user);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

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
    }
    
    return errorMessage;
  }
}