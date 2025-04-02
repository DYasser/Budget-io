import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Keep CommonModule for pipe/directives
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
  imports: [ CommonModule, CalendarModule ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit, OnDestroy {

  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  allCategories: ExpenseCategory[] = [];
  private categoriesSubscription!: Subscription;

  constructor(
    private budgetService: BudgetService,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter // Keep DateAdapter injected
  ) {}

  ngOnInit(): void {
    this.categoriesSubscription = this.budgetService.categories$.subscribe(categories => {
      this.allCategories = categories;
      this.refreshCalendarEvents();
    });
  }

  ngOnDestroy(): void {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  private getViewPeriod(): { viewStart: Date, viewEnd: Date } {
     if (this.view === CalendarView.Month) {
        const view = getMonthView(this.dateAdapter, {
           events: [],
           viewDate: this.viewDate,
           weekStartsOn: 0 // Explicitly set week start to Sunday (0)
        });
        return { viewStart: view.period.start, viewEnd: view.period.end };
     } else if (this.view === CalendarView.Week) {
        const viewStart = startOfWeek(this.viewDate); // Remove options object
        const viewEnd = endOfWeek(this.viewDate); // Remove options object
        return { viewStart, viewEnd };
     } else {
        return { viewStart: startOfDay(this.viewDate), viewEnd: endOfDay(this.viewDate) };
     }
  }

  private refreshCalendarEvents(): void {
    if (!this.allCategories) return;

    const viewPeriod = this.getViewPeriod();
    const periodInterval = { start: viewPeriod.viewStart, end: viewPeriod.viewEnd };
    const generatedEvents: CalendarEvent[] = [];
    const colorPalette = ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    this.allCategories.forEach((category, catIndex) => {
        if (!category.dueDate) return;
        try {
            let startDate = parseISO(category.dueDate);
            if (isNaN(startDate.getTime())) { throw new Error('Invalid start date'); }

            const title = `${category.name}: $${category.budget.toFixed(0)}`;
            const color = category.color || colorPalette[catIndex % colorPalette.length];
            const eventColor = { primary: color, secondary: this.adjustColorOpacity(color, 0.6) };

            let baseOccurrence = startDate;
            if (category.frequency === 'Monthly' && category.isDueEndOfMonth) { baseOccurrence = lastDayOfMonth(startDate); }

            let iterations = 0; const maxIterations = 1000; let nextOccurrence = baseOccurrence;

            while (nextOccurrence <= periodInterval.end && iterations < maxIterations) {
                iterations++;
                let occurrenceDate = nextOccurrence;
                if (category.frequency === 'Monthly' && category.isDueEndOfMonth) { occurrenceDate = lastDayOfMonth(nextOccurrence); }

                if (occurrenceDate >= periodInterval.start && occurrenceDate >= startDate && occurrenceDate <= periodInterval.end) {
                      generatedEvents.push({
                        id: `${category.id}_${format(occurrenceDate, 'yyyyMMdd')}`, start: occurrenceDate, title: title,
                        color: eventColor, allDay: true, meta: { category }
                      });
                }

                if (occurrenceDate > periodInterval.end && !(category.frequency === 'Monthly' && category.isDueEndOfMonth)) { break; }

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

    this.events = generatedEvents;
    this.cdr.markForCheck();
  }

  private adjustColorOpacity(color: string, opacity: number): string {
      if (color.startsWith('#') && color.length === 7) {
          const r = parseInt(color.slice(1, 3), 16); const g = parseInt(color.slice(3, 5), 16); const b = parseInt(color.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } return 'rgba(100, 100, 100, 0.3)';
  }

  setView(view: CalendarView): void { this.view = view; this.refreshCalendarEvents(); }
  goToPreviousMonth(): void { this.viewDate = subMonths(this.viewDate, 1); this.refreshCalendarEvents(); }
  goToNextMonth(): void { this.viewDate = addMonths(this.viewDate, 1); this.refreshCalendarEvents(); }
  goToToday(): void {
    if (this.viewDate.getMonth() === new Date().getMonth() && this.viewDate.getFullYear() === new Date().getFullYear()) return;
    this.viewDate = new Date(); this.refreshCalendarEvents();
  }
}