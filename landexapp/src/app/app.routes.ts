import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from '../guards/auth.guard';
import { LandingFormComponent } from './landing-form/landing-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'landing/new',
    component: LandingFormComponent
  },
  {
    path: 'landing/edit/:id',
    component: LandingFormComponent
  },
  { path: '**', redirectTo: '/login' }
];