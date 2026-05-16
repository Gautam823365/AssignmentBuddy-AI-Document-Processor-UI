import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { SignupComponent } from './auth/signup/signup';
import { DashboardComponent } from './dashboard/dashboard';
import { AuthGuard } from './service/auth.gaurd';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent ,canActivate: [AuthGuard] }
  
];

// export const routes: Routes = [
//   { path: '', redirectTo: '/dashboard', pathMatch: 'full' }, // 👈 change
//   { path: 'login', component: LoginComponent },
//   { path: 'signup', component: SignupComponent },
//   { path: 'dashboard', component: DashboardComponent },
//   { path: '**', redirectTo: '/dashboard' } // optional safety
// ];