import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BudgetService, ExpenseCategory, BudgetFrequency } from '../budget.service';

interface Transaction { id: number; date: string; categoryId: number; categoryName: string; amount: number; description: string; }
interface CategoryPercentage extends ExpenseCategory { percentage: number; color: string; }

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
  newCategoryFrequency: BudgetFrequency = 'Monthly';
  newCategoryDueDate: string = '';

  editingCategory: ExpenseCategory | null = null;

  transactions: Transaction[] = [];
  newTransactionAmount: number | null = null;
  newTransactionDate: string = '';
  newTransactionCategory: number | null = null;
  newTransactionDescription: string = '';
  private nextTransactionId = 1;

  categoryProportions: CategoryPercentage[] = [];
  budgetFrequencies: BudgetFrequency[] = ['Monthly', 'Weekly', 'Bi-Weekly', 'Quarterly', 'Annually', 'One-Time'];

  currentMonthName: string = '';

  private readonly colorPalette: string[] = [
    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7CFFC4', '#FF7C7C', '#BDB2FF'
  ];
  private readonly WEEKS_IN_MONTH = 52 / 12;
  private readonly BIWEEKS_IN_MONTH = 26 / 12;

  constructor(private budgetService: BudgetService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const now = new Date();
    this.currentMonthName = now.toLocaleString('default', { month: 'long' });

    this.categoriesSubscription = this.budgetService.categories$.subscribe(categories => {
      this.expenseCategories = categories;
      this.calculateCurrentMonthProportions();
      this.cdr.detectChanges();
    });
    this.newTransactionDate = this.getTodayDateString();
    this.newCategoryDueDate = this.getTodayDateString();
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


  calculateCurrentMonthProportions(): void {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const relevantCategoriesThisMonth = this.expenseCategories.filter(cat => {
          if (cat.frequency === 'Monthly' || cat.frequency === 'Weekly' || cat.frequency === 'Bi-Weekly') {
              return true;
          }
          if (cat.dueDate) {
              try {
                  const dueDate = new Date(cat.dueDate + 'T00:00:00');
                  return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
              } catch (e) {
                  return false;
              }
          }
          return false;
      });

      if (relevantCategoriesThisMonth.length === 0) {
          this.categoryProportions = [];
          this.cdr.detectChanges();
          return;
      }

      const totalBudgetThisMonth = relevantCategoriesThisMonth.reduce((sum, cat) => sum + cat.budget, 0);

      this.categoryProportions = relevantCategoriesThisMonth.map((cat, index) => ({
          ...cat,
          percentage: totalBudgetThisMonth > 0 ? (cat.budget / totalBudgetThisMonth) * 100 : 0,
          color: cat.color || this.colorPalette[index % this.colorPalette.length]
      }));

      console.log('Calculated This Month Proportions:', this.categoryProportions);
      this.cdr.detectChanges();
  }

  saveCategory(): void {
    if (!this.newCategoryName.trim() || this.newCategoryBudget === null || this.newCategoryBudget <= 0 || !this.newCategoryDueDate) {
      alert('Please enter a valid category name, a positive budget amount, and select a date.');
      return;
    }
    const dueDateValue = this.newCategoryDueDate;

    if (this.editingCategory) {
      const updatedData: ExpenseCategory = {
        ...this.editingCategory,
        name: this.newCategoryName.trim(),
        budget: this.newCategoryBudget,
        frequency: this.newCategoryFrequency,
        dueDate: dueDateValue
      };
      this.budgetService.updateCategory(updatedData);
    } else {
      this.budgetService.addCategory(
          this.newCategoryName.trim(),
          this.newCategoryBudget,
          this.newCategoryFrequency,
          dueDateValue
        );
    }
    this.resetForm();
   }

  editCategory(category: ExpenseCategory): void {
    this.editingCategory = category;
    this.newCategoryName = category.name;
    this.newCategoryBudget = category.budget;
    this.newCategoryFrequency = category.frequency;
    this.newCategoryDueDate = category.dueDate;

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
    this.newCategoryFrequency = 'Monthly';
    this.newCategoryDueDate = this.getTodayDateString();
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
}