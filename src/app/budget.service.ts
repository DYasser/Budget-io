import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Firestore, collection, collectionData, doc,
  addDoc, updateDoc, deleteDoc, query, orderBy
} from '@angular/fire/firestore';

export type BudgetFrequency = 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Quarterly' | 'Annually' | 'One-Time';

export interface ExpenseCategory {
  id: string; // Firestore uses string IDs
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

  constructor() {
    const categoriesQuery = query(this.categoriesCollection, orderBy('name'));
    this.categories$ = collectionData(categoriesQuery, { idField: 'id' }) as Observable<ExpenseCategory[]>;

  }

  async addCategory(name: string, budget: number, frequency: BudgetFrequency, dueDate: string, isDueEndOfMonth: boolean): Promise<void> {
    if (!name.trim() || budget === null || budget <= 0 || !dueDate) {
      throw new Error("Invalid data for adding category");
    }
    const newCategoryData: ExpenseCategoryData = {
      name: name.trim(),
      budget: budget,
      frequency: frequency,
      dueDate: dueDate,
      isDueEndOfMonth: isDueEndOfMonth
    };
    try {
        const docRef = await addDoc(this.categoriesCollection, newCategoryData);
        console.log("Category added with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding category: ", e);
        throw e; // Re-throw for component handling if needed
    }
  }

  async updateCategory(updatedCategory: ExpenseCategory): Promise<void> {
     if (!updatedCategory.id || !updatedCategory.dueDate) {
        throw new Error("Cannot update category without ID or due date");
     }
     const docRef = doc(this.firestore, 'expenseCategories', updatedCategory.id);
     const updateData: Partial<ExpenseCategoryData> = { // Use Partial to only send changed fields if needed
         name: updatedCategory.name,
         budget: updatedCategory.budget,
         frequency: updatedCategory.frequency,
         dueDate: updatedCategory.dueDate,
         isDueEndOfMonth: updatedCategory.isDueEndOfMonth
     };
     try {
         await updateDoc(docRef, updateData);
         console.log("Category updated with ID: ", updatedCategory.id);
     } catch (e) {
         console.error("Error updating category: ", e);
         throw e;
     }
  }

  async deleteCategory(id: string): Promise<void> { // ID is now string
    if (!id) {
        throw new Error("Cannot delete category without ID");
    }
    const docRef = doc(this.firestore, 'expenseCategories', id);
    try {
        await deleteDoc(docRef);
        console.log("Category deleted with ID: ", id);
    } catch (e) {
        console.error("Error deleting category: ", e);
        throw e;
    }
  }
}