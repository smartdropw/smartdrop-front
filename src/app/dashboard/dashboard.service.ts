import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Esta es la URL de tu Backend en Spring Boot
  private apiUrl = 'http://localhost:8080/api/v1/dashboard/summary';

  // Inyectamos el HttpClient para poder hacer peticiones
  constructor(private http: HttpClient) { }

  // Método para pedirle los datos al Backend
  getSummary(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }
}
