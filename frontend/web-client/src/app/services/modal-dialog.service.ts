import { Injectable, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable } from "rxjs";
import { ConfirmDialogComponent } from "../utils/confirm-dialog/confirm-dialog.component";
import { CategoryEditComponent } from "../pages/category/category-edit/category-edit.component";

@Injectable({
  providedIn: "root",
})
export class ModalDialogService {
  readonly dialog = inject(MatDialog);


  openConfirmDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "300px",
    });
    return dialogRef.afterClosed();
  }

  openCategoryEditDialog(): Observable<any> {
    const dialogRef = this.dialog.open(CategoryEditComponent, {
      width: "500px",
    });
    return dialogRef.afterClosed();
  }
}
