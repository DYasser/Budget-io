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
    sessionStorage.removeItem('dashboardWelcomed');
    console.log('Welcome flag cleared, navigating to dashboard...');
    this.router.navigate(['/dashboard']);
  }
}