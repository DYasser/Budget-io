import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { parseISO, lastDayOfMonth, addMonths, addWeeks, addYears, format } from 'date-fns'; // Import necessary date-fns

export type BudgetFrequency = 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Quarterly' | 'Annually' | 'One-Time';

export interface ExpenseCategory {
  id: string;
  name: string;
  budget: number;
  frequency: BudgetFrequency;
  dueDate: string;
  isDueEndOfMonth?: boolean;
  color?: string;
}

interface ExpenseCategoryData {
  name: string;
  budget: number;
  frequency: BudgetFrequency;
  dueDate: string;
  isDueEndOfMonth?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  private firestore: Firestore = inject(Firestore);
  private categoriesCollection = collection(this.firestore, 'expenseCategories');
  categories$: Observable<ExpenseCategory[]>;

  private readonly colorPalette: string[] = [
    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7CFFC4', '#FF7C7C', '#BDB2FF'
  ];

  constructor() {
    const categoriesQuery = query(this.categoriesCollection, orderBy('name'));
    this.categories$ = collectionData(categoriesQuery, { idField: 'id' }) as Observable<ExpenseCategory[]>;
  }

  calculateTotalOccurrencesBudgetForMonth(categories: ExpenseCategory[], targetDate: Date): number {
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      let totalBudgetInMonth = 0;

      categories.forEach(cat => {
          if (!cat.dueDate) return;

          try {
              let startDate = parseISO(cat.dueDate);
              if (isNaN(startDate.getTime())) { throw new Error('Invalid start date'); }

              let baseOccurrence = startDate;
              if (cat.frequency === 'Monthly' && cat.isDueEndOfMonth) {
                  baseOccurrence = lastDayOfMonth(startDate);
              }

              let iterations = 0;
              const maxIterations = 500; // Limit iterations for safety/performance
              let nextOccurrence = baseOccurrence;

              while (iterations < maxIterations) {
                    iterations++; // Increment early for calculating next date based on initial

                    let occurrenceDate = nextOccurrence;
                    if (cat.frequency === 'Monthly' && cat.isDueEndOfMonth) {
                        occurrenceDate = lastDayOfMonth(nextOccurrence);
                    }

                    const occMonth = occurrenceDate.getMonth();
                    const occYear = occurrenceDate.getFullYear();

                    // Stop if we've gone past the target month/year for most frequencies
                    // (Need to handle weekly/bi-weekly carefully if they cross month boundaries)
                    if (occYear > targetYear || (occYear === targetYear && occMonth > targetMonth)) {
                         if (cat.frequency !== 'Weekly' && cat.frequency !== 'Bi-Weekly') {
                           break; // Stop for M, Q, A, OT if we are past the target month
                         }
                         // For W/BW, only break if significantly past (e.g., > 1 month past) to catch end-of-month overlaps
                         if (occYear > targetYear && (occMonth > 0 || targetMonth < 11)) break; // Past target year
                         if (occYear === targetYear && occMonth > targetMonth + 1 ) break; // >1 month past
                    }

                     // Check if the occurrence IS IN the target month/year
                    if (occMonth === targetMonth && occYear === targetYear && occurrenceDate >= startDate) {
                        totalBudgetInMonth += cat.budget;
                    }

                    // Calculate the absolute next occurrence date based on start date + iterations
                    switch (cat.frequency) {
                        case 'One-Time': iterations = maxIterations; break; // Stop after first check
                        case 'Weekly': nextOccurrence = addWeeks(baseOccurrence, iterations); break;
                        case 'Bi-Weekly': nextOccurrence = addWeeks(baseOccurrence, iterations * 2); break;
                        case 'Monthly':
                            let nextMonthDate = addMonths(startDate, iterations);
                            if (cat.isDueEndOfMonth) { nextOccurrence = lastDayOfMonth(nextMonthDate); }
                            else {
                               const targetDay = startDate.getDate(); const daysInNextMonth = lastDayOfMonth(nextMonthDate).getDate();
                               nextOccurrence = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), Math.min(targetDay, daysInNextMonth));
                            } break;
                        case 'Quarterly': nextOccurrence = addMonths(startDate, iterations * 3); break;
                        case 'Annually': nextOccurrence = addYears(startDate, iterations); break;
                    }

                    if(iterations === maxIterations) { console.warn("Max iterations reached calculating total for category", cat.name); }
              } // End While
          } catch (e) { console.error(`Error calculating total for category "${cat.name}":`, e); }
      }); // End forEach
      return totalBudgetInMonth;
  }


  async addCategory(name: string, budget: number, frequency: BudgetFrequency, dueDate: string, isDueEndOfMonth: boolean): Promise<void> {
    if (!name.trim() || budget === null || budget <= 0 || !dueDate) { throw new Error("Invalid data for adding category"); }
    const newCategoryData: ExpenseCategoryData = { name: name.trim(), budget: budget, frequency: frequency, dueDate: dueDate, isDueEndOfMonth: isDueEndOfMonth };
    try { await addDoc(this.categoriesCollection, newCategoryData); }
    catch (e) { console.error("Error adding category: ", e); throw e; }
  }


  async updateCategory(updatedCategory: ExpenseCategory): Promise<void> {
     if (!updatedCategory.id || !updatedCategory.dueDate) { throw new Error("Cannot update category without ID or due date"); }
     const docRef = doc(this.firestore, 'expenseCategories', updatedCategory.id);
     const updateData: Partial<ExpenseCategoryData> = {
         name: updatedCategory.name, budget: updatedCategory.budget, frequency: updatedCategory.frequency,
         dueDate: updatedCategory.dueDate, isDueEndOfMonth: updatedCategory.isDueEndOfMonth };
     try { await updateDoc(docRef, updateData); }
     catch (e) { console.error("Error updating category: ", e); throw e; }
  }


  async deleteCategory(id: string): Promise<void> {
    if (!id) { throw new Error("Cannot delete category without ID"); }
    const docRef = doc(this.firestore, 'expenseCategories', id);
    try { await deleteDoc(docRef); }
    catch (e) { console.error("Error deleting category: ", e); throw e; }
  }


  getColorByIndex(index: number): string {
      return this.colorPalette[index % this.colorPalette.length];
  }
}