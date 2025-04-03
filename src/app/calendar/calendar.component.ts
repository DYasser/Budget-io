import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CalendarModule, CalendarView, CalendarEvent, DateAdapter } from 'angular-calendar';
import { Subscription } from 'rxjs';
import {
  addMonths, subMonths, lastDayOfMonth, parseISO, addWeeks, addYears, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isWithinInterval, addDays, getMonth, getYear, format, startOfDay, endOfDay
} from 'date-fns';
import { getMonthView } from 'calendar-utils';
import { BudgetService, ExpenseCategory, BudgetFrequency } from '../budget.service';

interface EventColor { primary: string; secondary: string; }

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [ CommonModule, CalendarModule, CurrencyPipe ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit, OnDestroy {

  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  events: CalendarEvent<{ category: ExpenseCategory }>[] = [];
  receiptEventsThisMonth: CalendarEvent<{ category: ExpenseCategory }>[] = [];
  allCategories: ExpenseCategory[] = [];
  private categoriesSubscription!: Subscription;

  receiptTotalAmount: number = 0; // Renamed from currentMonthTotalBudget

  private readonly colorPalette: string[] = [
    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7CFFC4', '#FF7C7C', '#BDB2FF'
  ];

  constructor(
    private budgetService: BudgetService,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter
  ) {}

  ngOnInit(): void {
    this.categoriesSubscription = this.budgetService.categories$.subscribe(categories => {
      this.allCategories = categories;
      this.refreshCalendarData();
    });
  }

  ngOnDestroy(): void {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  private getViewPeriod(): { viewStart: Date, viewEnd: Date } {
     if (this.view === CalendarView.Month) {
        const view = getMonthView(this.dateAdapter, { events: [], viewDate: this.viewDate, weekStartsOn: 0 });
        return { viewStart: view.period.start, viewEnd: view.period.end };
     } else if (this.view === CalendarView.Week) {
        const viewStart = startOfWeek(this.viewDate); const viewEnd = endOfWeek(this.viewDate);
        return { viewStart, viewEnd };
     } else {
        return { viewStart: startOfDay(this.viewDate), viewEnd: endOfDay(this.viewDate) };
     }
  }

  private refreshCalendarData(): void {
    if (!this.allCategories) {
        this.events = []; this.receiptEventsThisMonth = []; this.receiptTotalAmount = 0; this.cdr.markForCheck(); return;
    };

    const viewPeriod = this.getViewPeriod();
    const periodInterval = { start: viewPeriod.viewStart, end: viewPeriod.viewEnd };
    const generatedEvents: CalendarEvent<{ category: ExpenseCategory }>[] = [];
    const currentViewMonth = this.viewDate.getMonth();
    const currentViewYear = this.viewDate.getFullYear();

    this.allCategories.forEach((category, catIndex) => {
       if (!category.dueDate) return;
        try {
            let startDate = parseISO(category.dueDate);
            if (isNaN(startDate.getTime())) { throw new Error('Invalid start date'); }

            const title = `${category.name}: $${category.budget.toFixed(0)}`;
            const color = category.color || this.colorPalette[catIndex % this.colorPalette.length];
            const eventColor = { primary: color, secondary: this.adjustColorOpacity(color, 0.6) };
            let baseOccurrence = startDate;
            if (category.frequency === 'Monthly' && category.isDueEndOfMonth) { baseOccurrence = lastDayOfMonth(startDate); }
            let iterations = 0; const maxIterations = 1000; let nextOccurrence = baseOccurrence;

            while (nextOccurrence <= periodInterval.end && iterations < maxIterations) {
                iterations++;
                let eventDateForCalendar = nextOccurrence;
                if (category.frequency === 'Monthly' && category.isDueEndOfMonth) { eventDateForCalendar = lastDayOfMonth(nextOccurrence); }

                if (eventDateForCalendar >= periodInterval.start && eventDateForCalendar >= startDate && eventDateForCalendar <= periodInterval.end) {
                      generatedEvents.push({
                        id: `${category.id}_${format(eventDateForCalendar, 'yyyyMMdd')}`, start: eventDateForCalendar, title: title,
                        color: eventColor, allDay: true, meta: { category }
                      });
                }
                if (eventDateForCalendar > periodInterval.end && !(category.frequency === 'Monthly' && category.isDueEndOfMonth)) { break; }
                switch (category.frequency) {
                    case 'One-Time': iterations = maxIterations; break;
                    case 'Weekly': nextOccurrence = addWeeks(baseOccurrence, iterations); break;
                    case 'Bi-Weekly': nextOccurrence = addWeeks(baseOccurrence, iterations * 2); break;
                    case 'Monthly':
                        let nextMonthDate = addMonths(startDate, iterations);
                        if (category.isDueEndOfMonth) { nextOccurrence = lastDayOfMonth(nextMonthDate); }
                        else {
                           const targetDay = startDate.getDate(); const daysInNextMonth = lastDayOfMonth(nextMonthDate).getDate();
                           nextOccurrence = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), Math.min(targetDay, daysInNextMonth));
                        } break;
                    case 'Quarterly': nextOccurrence = addMonths(startDate, iterations * 3); break;
                    case 'Annually': nextOccurrence = addYears(startDate, iterations); break;
                }
                if(iterations === maxIterations) { console.warn("Max iterations reached for category", category.name); }
            }
        } catch (e) { console.error(`Error processing category "${category.name}" with date "${category.dueDate}":`, e); }
    });

    generatedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    this.events = generatedEvents;

    this.receiptEventsThisMonth = this.events.filter(event => {
        try {
            return event.start.getMonth() === currentViewMonth && event.start.getFullYear() === currentViewYear;
        } catch { return false; }
    });

    this.receiptTotalAmount = this.receiptEventsThisMonth.reduce((sum, event) => sum + (event.meta?.category?.budget || 0), 0);

    this.cdr.markForCheck();
  }


  private adjustColorOpacity(color: string, opacity: number): string {
      if (color.startsWith('#') && color.length === 7) {
          const r = parseInt(color.slice(1, 3), 16); const g = parseInt(color.slice(3, 5), 16); const b = parseInt(color.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } return 'rgba(100, 100, 100, 0.3)';
  }

  setView(view: CalendarView): void { this.view = view; this.refreshCalendarData(); }
  goToPreviousMonth(): void { this.viewDate = subMonths(this.viewDate, 1); this.refreshCalendarData(); }
  goToNextMonth(): void { this.viewDate = addMonths(this.viewDate, 1); this.refreshCalendarData(); }
  goToToday(): void {
    const today = new Date();
    if (this.viewDate.getMonth() === today.getMonth() && this.viewDate.getFullYear() === today.getFullYear()) { this.refreshCalendarData(); return; };
    this.viewDate = today; this.refreshCalendarData();
  }
}