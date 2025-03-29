// src/app/main-menu/main-menu.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent {
  constructor(private router: Router) {}

  login(): void {
    // Clear the 'dashboardWelcomed' flag from session storage first
    sessionStorage.removeItem('dashboardWelcomed');
    console.log('Welcome flag cleared, navigating to dashboard...');

    // Now navigate
    this.router.navigate(['/dashboard']);
  }
}