import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  
  private apiUrl = 'http://localhost:8090/api/auth/login';
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Login API
  login(data: LoginData): Observable<LoginResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<LoginResponse>(this.apiUrl, data, { headers }).pipe(
      tap(res => {
        // ✅ Store JWT and user data
        this.setItem('accessToken', res.accessToken);
        this.setItem('userName', res.name);
        this.setItem('userId', res.id);
        this.setItem('email', res.email);
        this.setItem('role',res.role);

        this.isLoggedInSubject.next(true);
      })
    );
  }

  // Logout
  logout(): void {
    this.removeItem('accessToken');
    this.removeItem('userName');
    this.removeItem('userId');
    this.removeItem('email');
    this.removeItem('role');
    this.isLoggedInSubject.next(false);
  }

  // Getters
  getToken(): string | null {
    return this.getItem('accessToken');
  }

  getUserName(): string | null {
    return this.getItem('userName');
  }

  getUserId(): string | null {
    return this.getItem('userId');
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }
  getRole(): string | null {
  return this.getItem('role');
}


  // ✅ Safe localStorage helpers
  private hasToken(): boolean {
    return !!this.getItem('accessToken');
  }

  private getItem(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser) localStorage.setItem(key, value);
  }

  private removeItem(key: string): void {
    if (this.isBrowser) localStorage.removeItem(key);
  }
}
