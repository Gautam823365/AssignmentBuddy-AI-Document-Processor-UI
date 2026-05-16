import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UploadResponse {
  id: number;
  fileName: string;
  fileType: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {

  private baseUrl = 'http://localhost:8090';

  private uploadUrl = `${this.baseUrl}/api/pdf/upload`;
  private chatUrl = `${this.baseUrl}/api/ai/ask`;

  constructor(private http: HttpClient) {}

  // ✅ Upload File
 uploadFile(formData: FormData): Observable<any> {
  return this.http.post(
    `${this.baseUrl}/api/pdf/upload`,
    formData,
    {
      reportProgress: true,   // ← REQUIRED: enables progress events
      observe: 'events'       // ← REQUIRED: gives you HttpEventType
    }
  );
}

  // ✅ Get files for logged-in user only
  viewAllFiles(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/pdf/all/${userId}`);  // ✅ fixed
  }

  // ✅ Ask question
  askQuestion(fileId: string, question: string): Observable<any> {
    const body = {
      id: fileId,
      question: question
    };
    return this.http.post(this.chatUrl, body);
  }
}