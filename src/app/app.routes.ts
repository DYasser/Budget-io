// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { DashboardComponent } from './dashboard/dashboard.component'; // Import DashboardComponent

export const routes: Routes = [
  {
    path: '', // Root path still shows the main menu
    component: MainMenuComponent,
    title: 'Login - budget.io' // Updated title maybe?
  },
  {
    path: 'dashboard', // Define the path for the dashboard
    component: DashboardComponent, // Point to the DashboardComponent
    title: 'Dashboard - budget.io' // Set a title for the dashboard page
  },
  // You might have other routes here later, like the footer links
  // { path: 'privacy', component: PrivacyPolicyComponent },
  // { path: 'terms', component: TermsComponent },
  // { path: 'contact', component: ContactComponent },

  // Optional: Wildcard route for 404 pages
  // { path: '**', component: PageNotFoundComponent }
];