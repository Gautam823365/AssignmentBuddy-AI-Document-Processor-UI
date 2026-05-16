import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


import { LoginService } from '../service/loginService';
import { DashboardService, UploadResponse } from '../service/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  userName = 'User';
  userId!: string;

  stats = { totalFiles: 0, pdfs: 0 };

  selectedFiles: File[] = [];
  uploadedFiles: any[] = [];
  filteredFiles: any[] = [];

  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  uploadComplete = false;         // ← NEW: tracks "Upload Done!" state
  activeTab: 'all' | 'pdf' = 'all';
  

  selectedFile: any = null;
  currentQuestion = '';
  currentAnswer = '';
  qaHistory: { question: string; answer: string; fileId: any }[] = [];
  isProcessing = false;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.loginService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = this.loginService.getUserName()!;
    this.userId = this.loginService.getUserId()!;
console.log('👤 Logged in userId:', this.userId);
    this.loadUploadedFiles();
  }

  trackById(index: number, file: any) {
    return file.id;
  }

  // ─── Filtering ───────────────────────────────────────────────────────────────
 

  // ─── Load files ──────────────────────────────────────────────────────────────
  loadUploadedFiles(): void {
    console.log('📡 Calling /api/files/all');
    this.dashboardService.viewAllFiles(this.userId).subscribe({
      next: (files: any[]) => {
        this.uploadedFiles = files.map(f => ({
          id: f.id,
          name: f.fileName,
          size: f.fileSize || 0,
          type: 'pdf',                                   // PDF only
          uploadDate: f.uploadedAt ? new Date(f.uploadedAt) : new Date(),
          status: 'success'
        }));

        this.updateStats();
        this.updateFilteredFiles();
        this.cdr.detectChanges();
        console.log(this.uploadedFiles);
      },
      error: err => console.error('Failed to load files ❌', err)
    });
  }
 private updateFilteredFiles(): void {
    if (this.activeTab === 'all') {
      this.filteredFiles = [...this.uploadedFiles];
    } else {
      this.filteredFiles = this.uploadedFiles.filter(f => f.type === this.activeTab);
    }
  }

  setActiveTab(tab: 'all' | 'pdf'): void {
    this.activeTab = tab;
    this.updateFilteredFiles();
  this.cdr.detectChanges(); 
    
  }
  // ─── File select ─────────────────────────────────────────────────────────────
  onFileSelect(event: any): void {
    this.addFiles(Array.from(event.target.files));
    this.uploadComplete = false;
  }

  addFiles(files: File[]): void {
    // Accept PDFs only
    const pdfs = (files as File[]).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    this.selectedFiles.push(...pdfs);
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    if (this.selectedFiles.length === 0) this.uploadComplete = false;
  }

  // ─── Drag & Drop ─────────────────────────────────────────────────────────────
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    this.uploadComplete = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  // ─── Upload ──────────────────────────────────────────────────────────────────
 uploadFiles(): void {
  if (this.selectedFiles.length === 0 || this.isUploading) return;

  this.isUploading    = true;
  this.uploadProgress = 0;
  this.uploadComplete = false;

  const totalFiles = this.selectedFiles.length;
  let completedFiles = 0;

  this.selectedFiles.forEach((file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', this.userId);

    this.dashboardService.uploadFile(formData).subscribe({
      next: (event: any) => {

        // Byte-level progress — cap at 95% until server confirms
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);
          this.uploadProgress = Math.min(percent, 95);
          this.cdr.detectChanges();
        }

        // HttpEventType.Response = server confirmed upload done
        if (event.type === HttpEventType.Response) {
          completedFiles++;

          if (completedFiles === totalFiles) {
            this.uploadProgress = 100;          // snap to 100%
            this.cdr.detectChanges();

            setTimeout(() => {
              this.isUploading    = false;
              this.uploadComplete = true;
              this.selectedFiles  = [];
              this.loadUploadedFiles();           // auto-reload list
              this.cdr.detectChanges();
            }, 800);                             // user sees 100% for 800ms
          }
        }
      },
      error: (err) => {
        console.error('Upload failed ❌', err);
        this.isUploading    = false;
        this.uploadProgress = 0;
        this.cdr.detectChanges();
      }
    });
  });
}


  // ─── File utils ──────────────────────────────────────────────────────────────
  getFileType(type: string): 'pdf' {
    return 'pdf';
  }

  getFileIcon(type: string): string {
    return '📄';
  }

  formatFileSize(size: number): string {
    if (size === 0) return '—';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / 1024 / 1024).toFixed(2) + ' MB';
  }

  // ─── File actions ────────────────────────────────────────────────────────────
  deleteFile(file: any): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f !== file);
    if (this.selectedFile?.id === file.id) this.selectedFile = null;
    this.updateStats();
    this.updateFilteredFiles();
  }

  private updateStats(): void {
    this.stats.totalFiles = this.uploadedFiles.length;
    this.stats.pdfs = this.uploadedFiles.filter(f => f.type === 'pdf').length;
  }

  // ─── Q&A ─────────────────────────────────────────────────────────────────────
  selectFile(file: any): void {
    this.selectedFile = file;
    this.currentQuestion = '';
    this.currentAnswer = '';
    // Restore history for this file only
  }

  get currentFileHistory() {
    return this.qaHistory.filter(h => h.fileId === this.selectedFile?.id);
  }

askQuestion(): void {
  if (this.isProcessing) return;
  if (!this.currentQuestion?.trim() || !this.selectedFile) return;

  const question = this.currentQuestion;
  const fileId = this.selectedFile.id;

  this.currentQuestion = '';
  this.currentAnswer = '';
  this.isProcessing = true;
  this.cdr.detectChanges();             // show spinner immediately

  this.dashboardService.askQuestion(fileId, question).subscribe({
    next: (response: any) => {
      this.currentAnswer = response?.answer ?? 'No answer received.';
      this.qaHistory.unshift({ question, answer: this.currentAnswer, fileId });
      this.isProcessing = false;
      this.cdr.detectChanges();         // ✅ update UI with answer
    },
    error: (err: any) => {
      console.error('❌ error:', err);
      this.currentAnswer = 'Failed to fetch answer. Please try again.';
      this.isProcessing = false;
      this.cdr.detectChanges();         // ✅ update UI on error too
    }
  });
}
  clearQA(): void {
    this.currentQuestion = '';
    this.currentAnswer = '';
  }

  useFromHistory(item: { question: string; answer: string }): void {
    this.currentQuestion = item.question;
    this.currentAnswer = item.answer;
  }

  copyAnswer(): void {
    if (this.currentAnswer) {
      navigator.clipboard.writeText(this.currentAnswer);
    }
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}