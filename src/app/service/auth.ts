import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignupData {
  name: string;       // ✅ new
  email: string;
  password: string;
}


@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8090/api/auth/signup'; // Replace with your API URL

  constructor(private http: HttpClient) { }

  signup(data: SignupData): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

 
}
