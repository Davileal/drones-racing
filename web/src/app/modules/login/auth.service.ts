import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_BASE}/auth`;

  signIn(username: string, password: string) {
    return this.http
      .post<{ access_token: string }>(`${this.apiUrl}/signIn`, { username, password })
      .pipe(tap((response) => localStorage.setItem('auth_token', response.access_token)));
  }
}
