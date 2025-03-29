// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { DashboardComponent } from './dashboard/dashboard.component'; // Import DashboardComponent
import { ExpensesComponent } from './expenses/expenses.component';
import { CalendarComponent } from './calendar/calendar.component';
import { SettingsComponent } from './settings/settings.component';

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
  {
    path: 'expenses', // <-- Define the path for expenses
    component: ExpensesComponent, // <-- Point to the ExpensesComponent
    title: 'Expenses - budget.io' // <-- Set browser tab title
  },
  {
    path: 'calendar', // <-- Define the path for calendar
    component: CalendarComponent, // <-- Point to the CalendarComponent
    title: 'Calendar - budget.io' // <-- Set browser tab title
  },
  {
    path: 'settings', // <-- Define the path for settings
    component: SettingsComponent, // <-- Point to the SettingsComponent
    title: 'Settings - budget.io' // <-- Set browser tab title
  },
  // You might have other routes here later, like the footer links
  // { path: 'privacy', component: PrivacyPolicyComponent },
  // { path: 'terms', component: TermsComponent },
  // { path: 'contact', component: ContactComponent },

  // Optional: Wildcard route for 404 pages
  // { path: '**', component: PageNotFoundComponent }
];