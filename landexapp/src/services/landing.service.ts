import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Obtener todas las landings
  getAllLandings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/landings`);
  }

  // Obtener una landing por ID
  getLandingById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/landings/${id}`);
  }

  // Crear nueva landing
  createLanding(landing: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/landings`, landing);
  }

  // Actualizar landing
  updateLanding(id: number, landing: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/landings/${id}`, landing);
  }

  // Eliminar landing
  deleteLanding(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/landings/${id}`);
  }

  // Subir imagen
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData);
  }

  // Activar/Desactivar landing
  toggleLandingStatus(id: number, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/landings/${id}/status`, { is_active: isActive });
  }
}