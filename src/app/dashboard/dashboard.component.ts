// src/app/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations'; // Import animation functions
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('fade', [
      // Fade in
      transition('void => *', [ // Or ':enter'
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ]),
      // Fade out
      transition('* => void', [ // Or ':leave'
        animate('500ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {

  // State management
  showWelcome = true;
  showChart = false;
  private timerHandle: any = null; // To hold the setTimeout reference
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // Chart Configuration
  public doughnutChartLabels: string[] = [ 'Housing', 'Food', 'Transport', 'Savings', 'Other' ];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [ 200, 100, 50, 75, 75 ], // Example data ($500 total breakdown)
        label: 'Budget Allocation',
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#E0E0E0'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#E0E0E0'],
        hoverBorderColor: '#fff',
        borderWidth: 1, // Add border width
        hoverOffset: 4 // Add hover offset for interaction
      }
    ]
  };
  public doughnutChartType: 'doughnut' = 'doughnut';
  private resizeTimeout: any; // For debouncing resize
  // In dashboard.component.ts
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true, // Usually true, ensures proportions are kept
    cutout: '85%', // Or your preferred value
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      },
      // Add configuration for datalabels plugin here:
      datalabels: {
        formatter: (value, ctx) => {
          // Display the category label
          return ctx.chart.data.labels?.[ctx.dataIndex] ?? '';
        },
        color: '#fff', // Example: White text
        // anchor: 'center', // Try 'center' to place inside
        // align: 'center',
        font: {
          weight: 'bold'
        },
        display: false 
        // Add more options for positioning, background, borders etc.
        // See chartjs-plugin-datalabels documentation for possibilities
      }
    }
  };

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  @HostListener('window:resize', ['$event'])
    onWindowResize(event?: Event): void {
      // Debounce resize event
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        // Check if the directive instance AND its underlying chart instance exist
        if (this.chart?.chart) {
          console.log('Window resize/zoom detected - Resizing Chart.js instance');
          // Call resize() on the actual Chart.js instance
          this.chart.chart.resize(); // << CORRECTED LINE
          // this.chart.chart.update(); // Calling update() after resize() is usually redundant
          // this.cdr.detectChanges();
        } else {
          console.log('Chart instance not available for resize yet.'); // Added for debugging
        }
      }, 150); // Debounce time
    }

  ngOnInit(): void {
    const alreadyWelcomed = sessionStorage.getItem('dashboardWelcomed');
    if (alreadyWelcomed === 'true') {
      this.showWelcome = false;
      // Defer showing chart slightly to ensure template is ready
      setTimeout(() => {
          this.showChart = true;
          this.cdr.detectChanges(); // Detect changes after timeout
          this.onWindowResize(); // Trigger initial resize check
      }, 0);
    } else {
      this.showWelcome = true;
      this.showChart = false;
      this.timerHandle = setTimeout(() => {
        if (this.showWelcome) { this.showWelcome = false; }
      }, 3000);
    }
  }
  
  ngOnDestroy(): void {
    // Clear the timer if the component is destroyed before 3 seconds
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
    }
  }

  onWelcomeFadeDone(event: AnimationEvent): void {
    if (event.toState === 'void' && !this.showChart) {
      // Defer showing chart slightly
      setTimeout(() => {
         this.showChart = true;
         this.cdr.detectChanges(); // Detect changes after timeout
         this.onWindowResize(); // Trigger initial resize check
         sessionStorage.setItem('dashboardWelcomed', 'true');
      }, 0);
    }
  }
  
  // Inside the DashboardComponent class
  getLegendColor(index: number): string {
    // Safely access the dataset and background color array
    const dataset = this.doughnutChartData.datasets[0];
    const bgColors = dataset?.backgroundColor; // Use optional chaining

    // Check if backgroundColor is actually an array and the index is valid
    if (Array.isArray(bgColors) && index >= 0 && index < bgColors.length) {
      // If valid, return the color (provide a fallback if the color itself could be undefined)
      return bgColors[index] ?? 'grey';
    }

    // Return a default/fallback color if something is wrong
    return 'grey';
  }

  goTo(page: string): void {
    const targetRoute = `/${page}`; // Construct the route path (e.g., '/expenses')
    console.log(`Navigating to ${targetRoute}`);
    this.router.navigate([targetRoute]); // Use the router to navigate
  }
}