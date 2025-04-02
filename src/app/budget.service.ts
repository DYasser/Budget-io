import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type BudgetFrequency = 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Quarterly' | 'Annually' | 'One-Time';

export interface ExpenseCategory {
  id: number;
  name: string;
  budget: number;
  frequency: BudgetFrequency;
  dueDate: string;
  isDueEndOfMonth?: boolean;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  private nextId = 1;
  private colorPalette: string[] = [
    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7CFFC4', '#FF7C7C', '#BDB2FF'
  ];

  private expenseCategories: ExpenseCategory[] = [];
  private categoriesSubject = new BehaviorSubject<ExpenseCategory[]>([]);
  categories$: Observable<ExpenseCategory[]> = this.categoriesSubject.asObservable();

  constructor() { this.loadInitialData(); }

  private getTodayDateStringForDefault(): string {
      const today = new Date();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      return `${today.getFullYear()}-${month}-${day}`;
  }

  private loadInitialData(): void {
    const todayStr = this.getTodayDateStringForDefault();
    this.expenseCategories = [
       { id: this.nextId++, name: 'Groceries', budget: 400, frequency: 'Weekly', dueDate: todayStr, isDueEndOfMonth: false },
       { id: this.nextId++, name: 'Rent/Mortgage', budget: 1500, frequency: 'Monthly', dueDate: `${todayStr.substring(0,8)}01`, isDueEndOfMonth: false },
       { id: this.nextId++, name: 'Gas/Transport', budget: 150, frequency: 'Monthly', dueDate: todayStr, isDueEndOfMonth: false },
       { id: this.nextId++, name: 'Netflix', budget: 15, frequency: 'Monthly', dueDate: `${todayStr.substring(0,8)}28`, isDueEndOfMonth: true },
       { id: this.nextId++, name: 'Car Insurance', budget: 1200, frequency: 'Annually', dueDate: '2025-10-15', isDueEndOfMonth: false },
       { id: this.nextId++, name: 'Vacation Fund', budget: 500, frequency: 'One-Time', dueDate: '2025-12-20', isDueEndOfMonth: false }
    ];
    this.assignColors();
    this.emitUpdate();
  }

  private assignColors(): void {
      this.expenseCategories = this.expenseCategories.map((cat, index) => ({
          ...cat,
          color: cat.color || this.colorPalette[index % this.colorPalette.length]
      }));
  }

  private emitUpdate(): void {
    this.categoriesSubject.next([...this.expenseCategories]);
  }

  getCategoriesSnapshot(): ExpenseCategory[] {
      return [...this.expenseCategories];
  }

  addCategory(name: string, budget: number, frequency: BudgetFrequency, dueDate: string, isDueEndOfMonth: boolean): void {
    if (!name.trim() || budget === null || budget <= 0 || !dueDate) {
      return;
    }
    const newCategory: ExpenseCategory = {
      id: this.nextId++,
      name: name.trim(),
      budget: budget,
      frequency: frequency,
      dueDate: dueDate,
      isDueEndOfMonth: isDueEndOfMonth,
      color: this.colorPalette[this.expenseCategories.length % this.colorPalette.length]
    };
    this.expenseCategories.push(newCategory);
    this.emitUpdate();
  }

  updateCategory(updatedCategory: ExpenseCategory): void {
     if (!updatedCategory.dueDate) {
         return;
     }
     const index = this.expenseCategories.findIndex(c => c.id === updatedCategory.id);
     if (index !== -1) {
        const originalColor = this.expenseCategories[index].color;
        this.expenseCategories[index] = {
            ...updatedCategory,
            color: updatedCategory.color || originalColor || this.colorPalette[index % this.colorPalette.length]
        };
        this.emitUpdate();
     }
  }

  deleteCategory(id: number): void {
    const initialLength = this.expenseCategories.length;
    this.expenseCategories = this.expenseCategories.filter(c => c.id !== id);
    if (this.expenseCategories.length < initialLength) {
        this.assignColors();
        this.emitUpdate();
    }
  }
}