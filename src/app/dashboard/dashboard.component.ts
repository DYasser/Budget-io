import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
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
  private boundResizeHandler: any;

  totalBudget: number = 0;
  chartDateRangeTitle: string = '';

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
      legend: { display: false },
      tooltip: { enabled: true },
      datalabels: { display: false }
    }
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private budgetService: BudgetService
  ) {}

  ngOnInit(): void {
    this.setChartDateTitle();
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

    if (window.visualViewport) {
      this.boundResizeHandler = this.handleViewportResize.bind(this);
      window.visualViewport.addEventListener('resize', this.boundResizeHandler);
    } else {
      console.warn('visualViewport API not supported.');
    }
  }

  ngOnDestroy(): void {
    if (this.timerHandle) { clearTimeout(this.timerHandle); }
    clearTimeout(this.resizeTimeout);
    if (this.categoriesSubscription) {
        this.categoriesSubscription.unsubscribe();
    }
    if (this.boundResizeHandler && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this.boundResizeHandler);
    }
  }

  private getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return 'st';
      case 2:  return 'nd';
      case 3:  return 'rd';
      default: return 'th';
    }
  }

  setChartDateTitle(): void {
      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long' });
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth();
      const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

      const firstSuffix = this.getOrdinalSuffix(1);
      const lastSuffix = this.getOrdinalSuffix(lastDayOfMonth);

      this.chartDateRangeTitle = `${currentMonthName} 1<sup>${firstSuffix}</sup> - ${lastDayOfMonth}<sup>${lastSuffix}</sup>`;
  }

  getLegendColor(index: number): string {
    const dataset = this.doughnutChartDatasets[0];
    const bgColors = dataset?.backgroundColor;
    if (Array.isArray(bgColors) && index >= 0 && index < bgColors.length) {
      return bgColors[index] ?? '#cccccc';
    }
    return '#cccccc';
  }

  updateDashboardChart(categories: ExpenseCategory[]): void {
     const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const relevantCategoriesThisMonth = categories.filter(cat => {
        if (cat.frequency === 'Monthly' || cat.frequency === 'Weekly' || cat.frequency === 'Bi-Weekly') { return true; }
        if (cat.dueDate) {
            try {
                const dueDate = new Date(cat.dueDate + 'T00:00:00');
                return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
            } catch (e) { return false; }
        }
        return false;
    });

    this.totalBudget = relevantCategoriesThisMonth.reduce((sum, cat) => sum + cat.budget, 0);

    if (!relevantCategoriesThisMonth || relevantCategoriesThisMonth.length === 0) {
      this.doughnutChartLabels = [];
      if (this.doughnutChartDatasets[0]) {
          this.doughnutChartDatasets[0].data = [];
          this.doughnutChartDatasets[0].backgroundColor = [];
          this.doughnutChartDatasets[0].hoverBackgroundColor = [];
      }
    } else {
      this.doughnutChartLabels = relevantCategoriesThisMonth.map(c => c.name);
      if (this.doughnutChartDatasets[0]) {
          this.doughnutChartDatasets[0].data = relevantCategoriesThisMonth.map(c => c.budget);
          const colors = relevantCategoriesThisMonth.map(c => c.color || '#cccccc');
          this.doughnutChartDatasets[0].backgroundColor = colors;
          this.doughnutChartDatasets[0].hoverBackgroundColor = colors;
      }
    }

    if (this.chart) { this.chart.update(); }
    this.cdr.detectChanges();
  }

  handleViewportResize(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.resize();
        this.cdr.detectChanges();
      }
    }, 75);
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

  attemptChartResize(): void {
    if (!this.chart?.chart) { return; }
    try {
        this.chart.chart.resize();
        this.chart.chart.update('none');
        this.cdr.detectChanges();
    } catch (error) {
        console.error('[RESIZE] Error during chart resize/update:', error);
    }
  }

  goTo(page: string): void {
    const targetRoute = `/${page}`;
    this.router.navigate([targetRoute]);
  }
}