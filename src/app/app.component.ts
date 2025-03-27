// src/app/app.component.ts (Example for Standalone)
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer/footer.component'; // Import FooterComponent

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
      RouterOutlet,
      FooterComponent // Add FooterComponent here
      // HeaderComponent maybe?
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // Check file extension
})
export class AppComponent {
  title = 'your-budget-app';
}