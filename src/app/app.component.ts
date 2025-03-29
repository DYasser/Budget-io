// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
// Import CommonModule for *ngIf and Location for back navigation
import { CommonModule, Location } from '@angular/common';
// Import RouterOutlet, Router, NavigationEnd, Event for route detection
import { RouterOutlet, Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
// Import Subscription and filter operator from RxJS for handling subscription
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Import your other components used in the template
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
      CommonModule, // <--- Import CommonModule
      RouterOutlet,
      FooterComponent
      // HeaderComponent?
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // Adjust extension if needed
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'budget.io';
  showBackButton: boolean = false; // Flag to control button visibility
  private routerSubscription!: Subscription;

  constructor(
    private router: Router,
    private location: Location // <--- Inject Location service
  ) {}

  ngOnInit(): void {
    // Subscribe to router events
    this.routerSubscription = this.router.events.pipe(
      // Only react to NavigationEnd events (when navigation is complete)
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Check the final URL after redirects
      const currentUrl = event.urlAfterRedirects;
      // Show the back button if the URL is NOT '/dashboard' AND NOT the root '/'
      this.showBackButton = (currentUrl !== '/dashboard' && currentUrl !== '/');
      console.log('Current URL:', currentUrl, 'Show Back Button:', this.showBackButton); // For debugging
    });
  }

  ngOnDestroy(): void {
    // IMPORTANT: Unsubscribe to prevent memory leaks when component is destroyed
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // Method called by the button click
  goBack(): void {
    this.location.back(); // Use Location service to go back in browser history
  }
}