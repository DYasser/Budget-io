import { Component, OnInit, OnDestroy, ViewChild, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BudgetService, ExpenseCategory } from '../budget.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ CommonModule, BaseChartDirective, CurrencyPipe ],
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
  private categoriesSubscription!: Subscription;

  totalBudget: number = 0;

  public doughnutChartLabels: string[] = [];
  public doughnutChartDatasets: ChartConfiguration<'doughnut'>['data']['datasets'] = [
    { data: [], label: 'Budget Allocation', backgroundColor: [], hoverBackgroundColor: [], hoverBorderColor: '#fff', borderWidth: 1, hoverOffset: 4 }
  ];
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '85%',
    plugins: {
      legend: {
        display: false // <<< DISABLE default legend again
      },
      tooltip: {
        enabled: false // Keep tooltips enabled
      },
      datalabels: {
        display: false
      }
    }
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private budgetService: BudgetService
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

    this.categoriesSubscription = this.budgetService.categories$.subscribe(categories => {
        this.updateDashboardChart(categories);
    });
  }

  ngOnDestroy(): void {
    if (this.timerHandle) { clearTimeout(this.timerHandle); }
    clearTimeout(this.resizeTimeout);
    if (this.categoriesSubscription) {
        this.categoriesSubscription.unsubscribe();
    }
  }

  getLegendColor(index: number): string {
    const dataset = this.doughnutChartDatasets[0];
    const bgColors = dataset?.backgroundColor;
    if (Array.isArray(bgColors) && index >= 0 && index < bgColors.length) {
      return bgColors[index] ?? '#cccccc'; // Use default grey if color undefined
    }
    return '#cccccc'; // Default grey if no colors/dataset
  }

  updateDashboardChart(categories: ExpenseCategory[]): void {
    console.log('[UPDATE CHART] Dashboard received category update:', categories);
    this.totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);

    if (!categories || categories.length === 0) {
      this.doughnutChartLabels = [];
      this.doughnutChartDatasets[0].data = [];
      this.doughnutChartDatasets[0].backgroundColor = [];
      this.doughnutChartDatasets[0].hoverBackgroundColor = [];
    } else {
      this.doughnutChartLabels = categories.map(c => c.name);
      this.doughnutChartDatasets[0].data = categories.map(c => c.budget);
      const colors = categories.map(c => c.color || '#cccccc');
      this.doughnutChartDatasets[0].backgroundColor = colors;
      this.doughnutChartDatasets[0].hoverBackgroundColor = colors;
    }

    if (this.chart) {
      console.log('[UPDATE CHART] Chart directive exists, calling update().');
      this.chart.update();
    } else {
        console.log('[UPDATE CHART] Chart directive not ready for update yet.');
    }
    this.cdr.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event?: Event): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.attemptChartResize();
    }, 100);
  }

  attemptChartResize(): void {
    console.log('[RESIZE] Starting resize attempt...');
    if (!this.chart) {
        console.error('[RESIZE] FAILED: ViewChild chart directive is not available.');
        return;
    }
    if (!this.chart.chart) {
        console.error('[RESIZE] FAILED: Chart.js instance (this.chart.chart) is not available.');
        return;
    }

    try {
        console.log('[RESIZE] Chart instance OK. Calling resize()...');
        this.chart.chart.resize();
        console.log('[RESIZE] ...resize() called.');

        console.log('[RESIZE] Calling update("none")...');
        this.chart.chart.update('none');
        console.log('[RESIZE] ...update("none") called.');

        console.log('[RESIZE] Calling detectChanges()...');
        this.cdr.detectChanges();
        console.log('[RESIZE] ...detectChanges() called. Resize attempt finished.');

    } catch (error) {
        console.error('[RESIZE] Error during chart resize/update:', error);
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

  goTo(page: string): void {
    const targetRoute = `/${page}`;
    console.log(`Navigating to ${targetRoute}`);
    this.router.navigate([targetRoute]);
  }
}