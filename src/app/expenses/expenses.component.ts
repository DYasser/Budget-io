import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../budget.service';
import { Subscription } from 'rxjs';

interface ExpenseCategory {
  id: number;
  name: string;
  budget: number;
  color?: string;
}

interface Transaction {
  id: number;
  date: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  description: string;
}
interface CategoryPercentage extends ExpenseCategory {
  percentage: number;
  color: string;
}


@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, OnDestroy {

  @ViewChild('inputColumn') inputColumnRef!: ElementRef<HTMLDivElement>;
  @ViewChild('categoryNameInput') categoryNameInputRef!: ElementRef<HTMLInputElement>;


  expenseCategories: ExpenseCategory[] = [];
  private categoriesSubscription!: Subscription;


  newCategoryName: string = '';
  newCategoryBudget: number | null = null;
  editingCategory: ExpenseCategory | null = null;


  transactions: Transaction[] = [];
  newTransactionAmount: number | null = null;
  newTransactionDate: string = '';
  newTransactionCategory: number | null = null;
  newTransactionDescription: string = '';
  private nextTransactionId = 1;


  categoriesWithPercentages: CategoryPercentage[] = [];


  constructor(private budgetService: BudgetService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.categoriesSubscription = this.budgetService.categories$.subscribe(categories => {
      this.expenseCategories = categories;
      this.calculatePercentages();
      this.cdr.detectChanges();
    });
    this.newTransactionDate = this.getTodayDateString();
  }

  ngOnDestroy(): void {
      if (this.categoriesSubscription) {
          this.categoriesSubscription.unsubscribe();
      }
  }


  getTodayDateString(): string {
      const today = new Date();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      return `${today.getFullYear()}-${month}-${day}`;
  }


  loadMockData(): void { }


  calculatePercentages(): void {
      const totalBudget = this.expenseCategories.reduce((sum, cat) => sum + cat.budget, 0);
      this.categoriesWithPercentages = this.expenseCategories.map((cat) => ({
          ...cat,
          percentage: totalBudget > 0 ? (cat.budget / totalBudget) * 100 : 0,
          color: cat.color || '#cccccc'
      }));
      console.log('Calculated Percentages:', this.categoriesWithPercentages);
  }

  saveCategory(): void {
    if (!this.newCategoryName.trim() || this.newCategoryBudget === null || this.newCategoryBudget <= 0) {
      alert('Please enter a valid category name and a positive budget amount.');
      return;
    }

    if (this.editingCategory) {
      const updatedData = {
        ...this.editingCategory,
        name: this.newCategoryName.trim(),
        budget: this.newCategoryBudget
      };
      this.budgetService.updateCategory(updatedData);
    } else {
      this.budgetService.addCategory(this.newCategoryName.trim(), this.newCategoryBudget);
    }
    this.resetForm();

  }


  addTransaction(): void {
    if (this.newTransactionAmount === null || this.newTransactionAmount <= 0 ||
        !this.newTransactionDate || this.newTransactionCategory === null) {
          alert('Please fill in Amount, Date, and Category for the transaction.');
          return;
    }
    const selectedCategory = this.expenseCategories.find(c => c.id === this.newTransactionCategory);
    if (!selectedCategory) {
      alert('Selected category not found.');
      return;
    }
    const newTransaction: Transaction = {
      id: this.nextTransactionId++,
      amount: this.newTransactionAmount,
      date: this.newTransactionDate,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      description: this.newTransactionDescription.trim()
    };
    this.transactions.push(newTransaction);
    console.log('Added Transaction:', newTransaction);

    this.newTransactionAmount = null;
    this.newTransactionCategory = null;
    this.newTransactionDescription = '';
    this.newTransactionDate = this.getTodayDateString();

  }

  editCategory(category: ExpenseCategory): void {
    this.editingCategory = category;
    this.newCategoryName = category.name;
    this.newCategoryBudget = category.budget;
    setTimeout(() => {
      if (this.categoryNameInputRef) {
          this.categoryNameInputRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.categoryNameInputRef.nativeElement.focus();
      }
    }, 0);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingCategory = null;
    this.newCategoryName = '';
    this.newCategoryBudget = null;
  }

  deleteCategory(categoryId: number): void {
    const categoryToDelete = this.expenseCategories.find(c => c.id === categoryId);
    if (categoryToDelete && confirm(`Are you sure you want to delete "${categoryToDelete.name}"?`)) {
       this.budgetService.deleteCategory(categoryId);
       if (this.editingCategory?.id === categoryId) {
           this.resetForm();
       }
    } else {
        console.log('Deletion cancelled or category not found.');
    }
  }
}