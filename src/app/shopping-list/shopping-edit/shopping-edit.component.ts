import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Ingredient } from 'src/app/shared/ingredient.model';
import { ShoppingListService } from '../shopping-list.service';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shopping-edit',
  templateUrl: './shopping-edit.component.html',
  styleUrls: ['./shopping-edit.component.css'],
})
export class ShoppingEditComponent implements OnInit, OnDestroy {
  @ViewChild('f') shoppingEditForm: NgForm;
  startedEditingSubscription: Subscription;
  editMode = false;
  editItemIndex: number;
  editItem: Ingredient;

  constructor(private shoppingListService: ShoppingListService) {}

  ngOnInit() {
    this.startedEditingSubscription =
      this.shoppingListService.startedEditing.subscribe((index: number) => {
        this.editMode = true;
        this.editItemIndex = index;
        this.editItem = this.shoppingListService.getIngredient(index);
        this.shoppingEditForm.setValue({
          name: this.editItem.name,
          amount: this.editItem.amount,
        });
      });
  }

  onSubmit(form: NgForm) {
    const formValue = form.value;
    const newIngredient = new Ingredient(formValue.name, formValue.amount);

    if (this.editMode) {
      this.shoppingListService.updateIngredient(
        this.editItemIndex,
        newIngredient
      );
    } else {
      this.shoppingListService.addIngredient(newIngredient);
    }

    this.onClear();
  }

  onClear() {
    this.editMode = false;
    this.shoppingEditForm.reset();
  }

  onDelete() {
    this.shoppingListService.deleteIngredient(this.editItemIndex);
    this.onClear();
  }

  ngOnDestroy() {
    this.startedEditingSubscription.unsubscribe();
  }
}
