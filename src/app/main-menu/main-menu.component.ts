// src/app/main-menu/main-menu.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Make sure Router is imported
import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router'; // Add if using the <a> routerLink approach

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule], // Add RouterLink here if using it in the template
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent {

  // Inject the Router service
  constructor(private router: Router) {}

  // Method called by the Login button click
  login(): void {
    // Navigate to the '/dashboard' route
    this.router.navigate(['/dashboard']);
    console.log('Navigating to dashboard...'); // Optional: for debugging
  }
}