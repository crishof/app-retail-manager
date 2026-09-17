import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from "@angular/core";
import { ICategory } from "../../../model/category.model";
import { CategoryService } from "../../../services/category.service";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { CategoryEditComponent } from "../category-edit/category-edit.component";
import { ModalDialogService } from "../../../services/modal-dialog.service";


@Component({
  selector: "app-category-details",
  imports: [FormsModule, CategoryEditComponent],
  templateUrl: "./category-details.component.html",
  styleUrl: "./category-details.component.css",
})
export class CategoryDetailsComponent implements OnChanges, OnInit {
  loading = true;
  editingMode = false;
  successMessage = "";
  errorMessage = "";

  @Input() selectedCategory: ICategory | null = null;

  private readonly _categoryService = inject(CategoryService);
  private readonly _router = inject(Router);
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _confirmDialogService = inject(ModalDialogService);

  category: ICategory | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["selectedCategory"] && this.selectedCategory) {
      this.loadCategoryData();
    }
  }

  ngOnInit(): void {
    this._categoryService.categoryUpdated$.subscribe(() => {
      this.loadCategoryData();
    });
  }

  loadCategoryData(): void {
    if (this.selectedCategory?.id) {
      this.loading = true;
      this._categoryService
        .getCategoryById(this.selectedCategory.id)
        .subscribe({
          next: (data) => {
            this.category = data;
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
    }
  }

  startEditing(): void {
    this.editingMode = true;
  }

  cancelEditing(): void {
    this.editingMode = false;
  }

  goToList(): void {
    this._router.navigate(["/category"]);
  }

  getImageUrl(image: any): any {
    if (!image?.content) return "";
    return this._sanitizer.bypassSecurityTrustResourceUrl(
      "data:image/jpeg;base64," + image.content,
    );
  }

  saveChanges(updatedCategory: ICategory): void {
    this.editingMode = false;
    this.successMessage = "Category updated successfully";
    this.category = updatedCategory;
  }

  confirmDelete(id: string): void {
    this._confirmDialogService.openConfirmDialog().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteCategory(id);
      }
    });
  }

  deleteCategory(id: string): void {
    this._categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.successMessage = "Category deleted successfully";
        this.errorMessage = "";
        this.category = null;
      },
      error: (err) => {
        this.errorMessage = err.error || "Failed to delete category";
        this.successMessage = "";
      },
    });
  }
}
