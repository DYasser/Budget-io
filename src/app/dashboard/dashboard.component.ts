import { Component, OnInit, OnDestroy, ViewChild, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs'; // Keep if used elsewhere, not needed for this version

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('fade', [
      transition('void => *', [ style({ opacity: 0 }), animate('500ms ease-in', style({ opacity: 1 })) ]),
      transition('* => void', [ animate('500ms ease-out', style({ opacity: 0 })) ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  showWelcome = true;
  showChart = false;
  private timerHandle: any = null;
  private resizeTimeout: any;

  public doughnutChartLabels: string[] = [ 'Housing', 'Food', 'Transport', 'Savings', 'Other' ];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [ 200, 100, 50, 75, 75 ],
        label: 'Budget Allocation',
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#E0E0E0'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#E0E0E0'],
        hoverBorderColor: '#fff',
        borderWidth: 1,
        hoverOffset: 4
      }
    ]
  };
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '85%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: { display: false }
    }
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    const alreadyWelcomed = sessionStorage.getItem('dashboardWelcomed');
    if (alreadyWelcomed === 'true') {
      this.showWelcome = false;
      setTimeout(() => {
         this.showChart = true;
         this.cdr.detectChanges();
         this.attemptChartResize();
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
    if (this.timerHandle) { clearTimeout(this.timerHandle); }
    clearTimeout(this.resizeTimeout);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event?: Event): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.attemptChartResize();
    }, 100);
  }

  attemptChartResize(): void {
    if (!this.chart) {
        // console.error('[ATTEMPT RESIZE] FAILED: ViewChild chart directive is not available.');
        return;
    }
    if (!this.chart.chart) {
        // console.error('[ATTEMPT RESIZE] FAILED: Chart.js instance (this.chart.chart) is not available.');
        return;
    }

    try {
        this.chart.chart.resize();
        this.chart.chart.update('none');
        this.cdr.detectChanges();

    } catch (error) {
        console.error('[ATTEMPT RESIZE] Error during chart resize/update:', error);
    }
  }

  onWelcomeFadeDone(event: AnimationEvent): void {
    if (event.toState === 'void' && !this.showChart) {
      setTimeout(() => {
         this.showChart = true;
         this.cdr.detectChanges();
         this.attemptChartResize();
         sessionStorage.setItem('dashboardWelcomed', 'true');
      }, 0);
    }
  }

  getLegendColor(index: number): string {
    const dataset = this.doughnutChartData.datasets[0];
    const bgColors = dataset?.backgroundColor;
    if (Array.isArray(bgColors) && index >= 0 && index < bgColors.length) {
      return bgColors[index] ?? 'grey';
    }
    return 'grey';
  }

  goTo(page: string): void {
    const targetRoute = `/${page}`;
    console.log(`Navigating to ${targetRoute}`);
    this.router.navigate([targetRoute]);
  }
}