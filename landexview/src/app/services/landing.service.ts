import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private apiUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) { }

  getLandingById(id: number): Observable<any> {
    console.log('Haciendo request a:', `${this.apiUrl}/landings/${id}`); 
    return this.http.get<any>(`${this.apiUrl}/landings/${id}`);
  }
}