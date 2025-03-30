import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ExpenseCategory {
  id: number;
  name: string;
  budget: number;
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

  constructor() {
    this.loadInitialData();
   }

  private loadInitialData(): void {
    // Replace with loading from storage or API later
    this.expenseCategories = [
      { id: this.nextId++, name: 'Groceries', budget: 400 },
      { id: this.nextId++, name: 'Rent/Mortgage', budget: 1500 },
      { id: this.nextId++, name: 'Gas/Transport', budget: 150 },
      { id: this.nextId++, name: 'Entertainment', budget: 100 },
      { id: this.nextId++, name: 'Utilities', budget: 200 }
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

  addCategory(name: string, budget: number): void {
    if (!name.trim() || budget === null || budget <= 0) {
      console.error("Invalid data for adding category");
      return;
    }
    const newCategory: ExpenseCategory = {
      id: this.nextId++,
      name: name.trim(),
      budget: budget,
      color: this.colorPalette[this.expenseCategories.length % this.colorPalette.length]
    };
    this.expenseCategories.push(newCategory);
    this.emitUpdate();
  }

  updateCategory(updatedCategory: ExpenseCategory): void {
     const index = this.expenseCategories.findIndex(c => c.id === updatedCategory.id);
     if (index !== -1) {
        // Ensure color is preserved if it existed
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
        this.assignColors(); // Reassign colors in case order matters visually
        this.emitUpdate();
    }
  }
}