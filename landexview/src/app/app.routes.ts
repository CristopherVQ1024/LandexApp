import { Routes } from '@angular/router';
import { LandingPreviewComponent } from './landing-preview/landing-preview.component';
import { NotfoundComponent } from './notfound/notfound.component';


export const routes: Routes = [
  { path: 'preview/:id', component: LandingPreviewComponent },
  { path: '**', component: NotfoundComponent }
];
